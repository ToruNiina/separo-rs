use wasm_bindgen::prelude::*;

use arrayvec::ArrayVec;
use rand::prelude::*;
use serde::Serialize;
use serde_repr::Serialize_repr;

use std::vec::Vec;
use std::option::Option;
use std::time::Duration;

use std::rc::{Rc, Weak};
use std::cell::{RefCell, RefMut};

mod instant;
use crate::instant::Instant;

// When the `wee_alloc` feature is enabled, this uses `wee_alloc` as the global
// allocator.
//
// If you don't want to use `wee_alloc`, you can safely delete this.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

// XXX: Here we assume that the board is always square.

macro_rules! console_log {
    ($($arg:tt)*) => {
        web_sys::console::log_1(&format!( $($arg)* ).into())
    }
}

// Grid position. left-top: (0,0), right-bottom: (N,N).
// We will never use 256x256 board. The max size would be 19x19. u8 is enough.
#[wasm_bindgen]
#[derive(Debug, PartialEq, Eq, Clone, Copy, Serialize)]
pub struct Coord {
    x: i8,
    y: i8,
}

impl Coord {
    fn new(x: i8, y: i8) -> Self {
        Self { x, y }
    }
}

#[wasm_bindgen]
#[derive(Debug, PartialEq, Eq, Clone, Copy, Serialize)]
pub struct Move (Coord, Coord, Coord);

#[wasm_bindgen]
#[derive(Debug, PartialEq, Eq, Clone, Copy, Serialize_repr)]
#[repr(u8)]
pub enum Color {
    Red  = 0,
    Blue = 1,
}

fn opponent_of(color: Color) -> Color {
    match color {
        Color::Red => Color::Blue,
        _          => Color::Red
    }
}

// To count number of separated regions, we will consider the following graph.
// Each root cuts the edges that intersect with the root. The number of
// connected components in the resulting graph.
//     The "ineffectual" region is a connected component that has less than 4
// nodes in the following representation.
//                                |
//           stone                |
// +----------(+)----------+      |
// |     o     |`.   o     |      |
// |   .' '.   |  `.  '.   |      |
// | o'     'o---o  `.  'o--- ... |
// |  '.   .'  |  '.  `.   |      |
// |    'o'    |    'o  `. |      |
// +-----|-----+-----|----(+)     |
// |     o     |     o    stone   |
// |   .' '.   |   .' '.   |      |
// | o'     'o---o'     'o--- ... |
// |  '.   .'  |  '.   .'  |      |
// |    'o'    |    'o'    |      |
// +-----|-----+-----|-----+      |
//      ...         ...           |
//                                |
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
enum NodePos {N, E, S, W}

#[derive(Debug, PartialEq, Eq, Clone)]
struct Node {
    region: Option<u16>, // Region ID. u8::MAX < 19x19x4 < u16::MAX
    edges: ArrayVec<[(Coord, NodePos);3]>,
}
impl Node {
    pub fn new() -> Self {
        Node{region: None, edges: ArrayVec::new()}
    }
}
#[derive(Debug, Clone, PartialEq, Eq)]
struct Graph {
    ngrids: u8,     // width of the board (# of lines) - 1
    nodes:  Vec<Node>,
}
impl Graph {
    pub fn new(width: usize) -> Self {
        assert!(3 < width); // board with only 3 lines? crazy.
        assert!(width < 20);

        let ngrids = width - 1;
        let nodes = vec![Node::new(); ngrids * ngrids * 4];
        let mut graph = Graph{ngrids: ngrids as u8, nodes};

        let x_max = ngrids as i8 - 1;
        let y_max = ngrids as i8 - 1;

        // construct the whole graph
        for x in 0..ngrids as i8 {
            for y in 0..ngrids as i8 {
                let crd = Coord::new(x, y);
                graph.at_mut(crd, NodePos::N).edges.push((crd, NodePos::E));
                graph.at_mut(crd, NodePos::N).edges.push((crd, NodePos::W));

                graph.at_mut(crd, NodePos::E).edges.push((crd, NodePos::N));
                graph.at_mut(crd, NodePos::E).edges.push((crd, NodePos::S));

                graph.at_mut(crd, NodePos::S).edges.push((crd, NodePos::E));
                graph.at_mut(crd, NodePos::S).edges.push((crd, NodePos::W));

                graph.at_mut(crd, NodePos::W).edges.push((crd, NodePos::N));
                graph.at_mut(crd, NodePos::W).edges.push((crd, NodePos::S));

                if x != 0 {
                    graph.at_mut(Coord::new(x,y), NodePos::W).edges
                        .push((Coord::new(x-1,y), NodePos::E));
                }
                if x != x_max {
                    graph.at_mut(Coord::new(x,y), NodePos::E).edges
                        .push((Coord::new(x+1,y), NodePos::W));
                }
                if y != 0 {
                    graph.at_mut(Coord::new(x,y), NodePos::N).edges
                        .push((Coord::new(x,y-1), NodePos::S));
                }
                if y != y_max {
                    graph.at_mut(Coord::new(x,y), NodePos::S).edges
                        .push((Coord::new(x,y+1), NodePos::N));
                }
            }
        }
        graph
    }

    pub fn apply_move(&mut self, next_move: Move) {
        // remove edges from self
        let Move(stone1, stone2, stone3) = next_move;

        // first root
        let dx = stone2.x - stone1.x;
        let dy = stone2.y - stone1.y;
        match (dx, dy) {
            (1, 1) => {
                self.remove_edge(stone1, NodePos::N, stone1, NodePos::W);
                self.remove_edge(stone1, NodePos::S, stone1, NodePos::E);
            }
            (1, -1) => {
                let pos = Coord::new(stone1.x, stone1.y - 1);
                if 0 <= pos.y {
                    self.remove_edge(pos, NodePos::N, pos, NodePos::E);
                    self.remove_edge(pos, NodePos::S, pos, NodePos::W);
                }
            }
            (-1, 1) => {
                let pos = Coord::new(stone1.x - 1, stone1.y);
                if 0 <= pos.x {
                    self.remove_edge(pos, NodePos::N, pos, NodePos::E);
                    self.remove_edge(pos, NodePos::S, pos, NodePos::W);
                }
            }
            (-1, -1) => {
                self.remove_edge(stone2, NodePos::N, stone2, NodePos::W);
                self.remove_edge(stone2, NodePos::S, stone2, NodePos::E);
            }
            _ => {
                assert!(false);
            }
        }
        // second root
        let dx = stone3.x - stone2.x;
        let dy = stone3.y - stone2.y;

        let upper = self.ngrids as i8;
        match (dx, dy) {
            (1, 0) => {
                if stone2.x < upper && 1 <= stone2.y && stone2.y < upper {
                    self.remove_edge(Coord::new(stone2.x, stone2.y-1), NodePos::S,
                                                stone2,                NodePos::N);
                }
            }
            (-1, 0) => {
                if stone3.x < upper && 1 <= stone3.y && stone3.y < upper {
                    self.remove_edge(Coord::new(stone3.x, stone3.y-1), NodePos::S,
                                                stone3,                NodePos::N);
                }
            }
            (0, 1) => {
                if 1 <= stone2.x && stone2.x < upper && stone2.y < upper {
                    self.remove_edge(Coord::new(stone2.x-1, stone2.y), NodePos::E,
                                                stone2,                NodePos::W);
                }
            }
            (0, -1) => {
                if 1 <= stone3.x && stone3.x < upper && stone3.y < upper {
                    self.remove_edge(Coord::new(stone3.x-1, stone3.y), NodePos::E,
                                                stone3,                NodePos::W);
                }
            }
            _ => {
                assert!(false);
            }
        }
    }

    // 19x19 < u16::MAX.
    pub fn score(&mut self) -> u16 {
        for node in self.nodes.iter_mut() {
            node.region = None;
        }

        let mut score: u16 = 0;
        let mut region:u16 = 0;
        while let Some(idx) = self.nodes.iter().position(|n| n.region == None) {
            let pos = match idx % 4 {
                0 => NodePos::N,
                1 => NodePos::E,
                2 => NodePos::S,
                _ => NodePos::W, // 3
            };
            let x = idx / 4 / self.ngrids as usize;
            let y = idx / 4 % self.ngrids as usize;
            assert!(x <= i8::MAX as usize);
            assert!(y <= i8::MAX as usize);

            let crd = Coord::new(x as i8, y as i8);
            if 4 < self.find_connected_component(region, crd, pos) {
                score += 1;
            }
            region += 1;
        }
        score
    }

    fn find_connected_component(&mut self, region: u16, crd: Coord, pos: NodePos) -> u16 {
        let mut num: u16 = 0;
        let mut queue = Vec::new();
        queue.push((crd, pos));

        while let Some((crd, pos)) = queue.pop() {
            num += 1;
            self.at_mut(crd, pos).region = Some(region);
            for (n_crd, n_pos) in self.at(crd, pos).edges.iter() {
                if self.at(*n_crd, *n_pos).region == None {
                    queue.push((*n_crd, *n_pos));
                }
            }
        }
        num
    }

    fn remove_edge(&mut self, crd1: Coord, pos1: NodePos,
                              crd2: Coord, pos2: NodePos) {
        assert!(self.at(crd1, pos1).edges.contains(&(crd2, pos2)));
        assert!(self.at(crd2, pos2).edges.contains(&(crd1, pos1)));

        self.at_mut(crd1, pos1).edges.retain(|x| *x != (crd2, pos2));
        self.at_mut(crd2, pos2).edges.retain(|x| *x != (crd1, pos1));
    }

    fn at(&self, coord: Coord, pos: NodePos) -> &Node {
        let idx = ((coord.x as usize) * (self.ngrids as usize) +
                   (coord.y as usize)) * 4 + match pos {
            NodePos::N => 0,
            NodePos::E => 1,
            NodePos::S => 2,
            NodePos::W => 3,
        };

        &self.nodes[idx]
    }
    fn at_mut(&mut self, coord: Coord, pos: NodePos) -> &mut Node {
        let idx = ((coord.x as usize) * (self.ngrids as usize) +
                   (coord.y as usize)) * 4 + match pos {
            NodePos::N => 0,
            NodePos::E => 1,
            NodePos::S => 2,
            NodePos::W => 3,
        };
        &mut self.nodes[idx]
    }
}

// root direction. Note that the y axis is upside down (left-top is the origin)
//
// (-1,-1)    (0,-1)   (1,-1)
//        o-----+-----+
//        |`.   |   .'|
//        |  `. | .'  |
// (-1,0) +----`o'----o (1,0)
//        |   .'|`.   |
//        | .'  |  `. |
//        +'----+----`+
// (-1, 1)    (0,1)    (1,1)
//
// There are only 8 patterns shown above. i8 is already too much.
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct Dir (i8, i8);

// the roots cannot form 45 degrees. So the minimum angle is 90 degree.
// 360/90 = 4, so we would have up to 4 edges per a grid.
#[derive(Debug, PartialEq, Eq, Clone)]
pub struct Grid {
    color: Option<Color>,
    roots: ArrayVec<[Dir; 4]>,
}

impl Grid {
    fn new() -> Self {
        Grid{color: None, roots: ArrayVec::new()}
    }
    // Note that it checks the direction of the roots but not the color.
    fn is_valid_root(&self, dir: Dir) -> bool {
        self.roots.iter()
            .find(|d| i8::abs(dir.0 - d.0) + i8::abs(dir.1 - d.1) <= 1)
            .is_none()
    }
}


#[wasm_bindgen]
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Board {
    width: u8,        // normally, 9 (9x9 board) upto 19x19
    grids: Vec<Grid>, // 9x9 grids there (if width == 9)
    red:   Graph,     // to calculate score
    blue:  Graph,     // to calculate score
}

#[wasm_bindgen]
impl Board {
    pub fn new(width: usize) -> Board {
        let mut board = Board{
            width: width as u8,
            grids: vec![Grid::new(); width*width],
            red:   Graph::new(width),
            blue:  Graph::new(width)
        };

        let lower = 0;
        let upper = width - 1;
        board.grids[lower * width + lower].color = Some(Color::Red);
        board.grids[lower * width + upper].color = Some(Color::Blue);
        board.grids[upper * width + lower].color = Some(Color::Blue);
        board.grids[upper * width + upper].color = Some(Color::Red);

        board
    }

    fn possible_moves(&self, turn: Color) -> Vec<Move> {
        let mut moves = Vec::new();
        for (idx1, grid) in self.grids.iter().enumerate() {
            if grid.color == Some(turn) { // the same color

                // coordinate of the first stone
                let x1 = (idx1 / self.width as usize) as i8;
                let y1 = (idx1 % self.width as usize) as i8;

                for dir1 in [Dir(1,1), Dir(-1,1), Dir(-1,-1), Dir(1,-1)].iter() {

                    // check root collision at the first stone
                    // skip roots that forms 45 degree
                    if !grid.is_valid_root(*dir1) {
                        continue;
                    }

                    // check middle stone collision
                    let x2 = x1 + dir1.0;
                    let y2 = y1 + dir1.1;

                    if x2 < 0 || y2 < 0 || self.width as i8 <= x2 || self.width as i8 <= y2 {
                        continue;
                    }

                    let idx2 = x2 as usize * self.width as usize + y2 as usize;
                    if self.grids[idx2].color.is_some() {
                        continue;
                    }
                    // check root collision at the second stone
                    // Note that the direction from the second stone is opposite
                    // in sign.
                    if !self.grids[idx2].is_valid_root(Dir(-dir1.0, -dir1.1)) {
                        continue;
                    }
                    // possible next roots
                    {
                        let dir2 = Dir(dir1.0, 0);
                        // check root collision at the second stone
                        if !self.grids[idx2].is_valid_root(dir2) {
                            continue;
                        }
                        // check stone/root collision at the third stone
                        let x3 = x2 + dir2.0;
                        let y3 = y2 + dir2.1;

                        if !(x3 < 0 || y3 < 0 || self.width as i8 <= x3 || self.width as i8 <= y3) {
                            let idx3 = x3 as usize * self.width as usize + y3 as usize;
                            if (self.grids[idx3].color == None || self.grids[idx3].color == Some(turn)) &&
                                self.grids[idx3].is_valid_root(Dir(-dir2.0, -dir2.1)) {
                                moves.push(Move(Coord::new(x1, y1), Coord::new(x2, y2), Coord::new(x3, y3)));
                            }
                        }
                    }
                    {
                        let dir2 = Dir(0, dir1.1);
                        // check root collision at the second stone
                        if !self.grids[idx2].is_valid_root(dir2) {
                            continue;
                        }
                        // check stone/root collision at the third stone
                        let x3 = x2 + dir2.0;
                        let y3 = y2 + dir2.1;

                        if !(x3 < 0 || y3 < 0 || self.width as i8 <= x3 || self.width as i8 <= y3) {
                            let idx3 = x3 as usize * self.width as usize + y3 as usize;
                            if (self.grids[idx3].color == None || self.grids[idx3].color == Some(turn)) &&
                                self.grids[idx3].is_valid_root(Dir(-dir2.0, -dir2.1)) {
                                moves.push(Move(Coord::new(x1, y1), Coord::new(x2, y2), Coord::new(x3, y3)));
                            }
                        }
                    }
                }
            }
        }
        moves
    }

    pub fn apply_move_if_possible(&mut self,
        x1: i32, y1: i32, x2: i32, y2: i32, x3: i32, y3: i32, color: Color
        ) -> bool {
        let next_move = Move(Coord::new(x1 as i8, y1 as i8),
                             Coord::new(x2 as i8, y2 as i8),
                             Coord::new(x3 as i8, y3 as i8));
        if self.is_valid_move(next_move, color) {
            self.apply_move(next_move, color);
            true
        } else {
            false
        }
    }

    pub fn can_move(&self, turn: Color) -> bool {
        !self.possible_moves(turn).is_empty()
    }

    pub fn is_gameover(&self) -> bool {
        self.possible_moves(Color::Red ).is_empty() &&
        self.possible_moves(Color::Blue).is_empty()
    }

    fn is_valid_move(&self, next_move: Move, turn: Color) -> bool {
        self.possible_moves(turn).contains(&next_move)
    }

    fn apply_move(&mut self, next_move: Move, turn: Color) {
        debug_assert!(self.is_valid_move(next_move, turn));
        // apply next_move to the board

        let Move(stone1, stone2, stone3) = next_move;

        let idx1 = stone1.x as usize * self.width as usize + stone1.y as usize;
        let idx2 = stone2.x as usize * self.width as usize + stone2.y as usize;
        let idx3 = stone3.x as usize * self.width as usize + stone3.y as usize;

        self.grids[idx2].color = Some(turn);
        self.grids[idx3].color = Some(turn);

        self.grids[idx1].roots.push(Dir(stone2.x - stone1.x, stone2.y - stone1.y));
        self.grids[idx2].roots.push(Dir(stone1.x - stone2.x, stone1.y - stone2.y));

        self.grids[idx2].roots.push(Dir(stone3.x - stone2.x, stone3.y - stone2.y));
        self.grids[idx3].roots.push(Dir(stone2.x - stone3.x, stone2.y - stone3.y));

        // apply next_move to internal graph
        match turn {
            Color::Red  => {self.red .apply_move(next_move)}
            Color::Blue => {self.blue.apply_move(next_move)}
        }
    }

    pub fn score(&mut self, color: Color) -> u16 {
        match color {
            Color::Red  => {self.red .score()}
            Color::Blue => {self.blue.score()}
        }
    }

    pub fn to_json(&self) -> String {
        #[derive(Serialize)]
        struct Stone {
            x: i8,
            y: i8,
            color: i8,
        }

        #[derive(Serialize)]
        struct Root {
            x1: i8,
            y1: i8,
            x2: i8,
            y2: i8,
            color: i8,
        }

        #[derive(Serialize)]
        struct BoardJson {
            stones: Vec<Stone>,
            roots: Vec<Root>,
        }

        let mut stones = Vec::new();
        let mut roots  = Vec::new();
        for x in 0..self.width as i8 {
            for y in 0..self.width as i8 {
                let idx = (x as usize) * (self.width as usize) + (y as usize);
                if let Some(color) = self.grids[idx].color {
                    let color = color as i8;
                    stones.push(Stone { x, y, color });

                    for dir in self.grids[idx].roots.iter() {
                        roots.push(Root {
                            x1: x,
                            y1: y,
                            x2: x + dir.0,
                            y2: y + dir.1,
                            color,
                        });
                    }
                }
            }
        }

        serde_json::to_string(&BoardJson { stones, roots }).unwrap()
    }
    pub fn possible_moves_as_json(&self) -> String {
        #[derive(Serialize)]
        struct PossibleMove {
            stones: Move,
            color: Color,
        }

        let mut moves = Vec::new();
        for stones in self.possible_moves(Color::Red) {
            moves.push(PossibleMove {
                stones: stones,
                color: Color::Red,
            });
        }
        for stones in self.possible_moves(Color::Blue) {
            moves.push(PossibleMove {
                stones: stones,
                color: Color::Blue,
            });
        }

        serde_json::to_string(&moves).unwrap()
    }

    fn playout<R:Rng>(&mut self, init_turn: Color, rng: &mut R) -> Option<Color> {
        let next_turn = opponent_of(init_turn);
        while !self.is_gameover() {
            {
                let moves = self.possible_moves(init_turn);
                if !moves.is_empty() {
                    self.apply_move(moves[rng.gen_range(0, moves.len())], init_turn);
                }
            }
            {
                let moves = self.possible_moves(next_turn);
                if !moves.is_empty() {
                    self.apply_move(moves[rng.gen_range(0, moves.len())], next_turn);
                }
            }
        }
        let red_score  = self.score(Color::Red);
        let blue_score = self.score(Color::Blue);
        if blue_score < red_score {
            Some(Color::Red)
        } else if red_score < blue_score {
            Some(Color::Blue)
        } else {
            None
        }
    }
}

fn convert_seed(seed0: u32, seed1: u32) -> u64 {
    (seed0 as u64) + ((seed1 as u64) << 32)
}

#[wasm_bindgen]
pub struct RandomPlayer {
    pub color: Color,
    rng: rand::rngs::StdRng,
}

#[wasm_bindgen]
impl RandomPlayer {
    pub fn new(color: Color, seed0: u32, seed1: u32) -> Self {
        let seed = convert_seed(seed0, seed1);
        RandomPlayer{color, rng: rand::rngs::StdRng::seed_from_u64(seed)}
    }
    pub fn play(&mut self, mut board: Board) -> Board {
        let moves = board.possible_moves(self.color);
        if !moves.is_empty() {
            board.apply_move(moves[self.rng.gen_range(0, moves.len())], self.color);
        }
        board
    }
}

#[wasm_bindgen]
pub struct NaiveMonteCarlo {
    pub color: Color,
    rng: rand::rngs::StdRng,
    time_limit: Duration,
}

#[wasm_bindgen]
impl NaiveMonteCarlo {
    pub fn new(color: Color, seed0: u32, seed1: u32, timelimit: u32) -> Self {
        let seed = convert_seed(seed0, seed1);
        NaiveMonteCarlo{
            color,
            rng: rand::rngs::StdRng::seed_from_u64(seed),
            time_limit: Duration::from_secs(timelimit as u64),
        }
    }

    pub fn play(&mut self, board: Board) -> Board {

        let mut candidates = Vec::<(_, _, u32)>::new();
        for possible_move in board.possible_moves(self.color).iter() {
            let mut cand_board = board.clone();
            cand_board.apply_move(*possible_move, self.color);
            candidates.push((*possible_move, cand_board, 0));
        }

        if candidates.is_empty() {
            return board
        }

//         console_log!("{} possible moves are there", candidates.len());
        let stop = Instant::now() + self.time_limit;
        let mut samples: usize = 0;
        while Instant::now() < stop {
            for candidate in candidates.iter_mut() {
                let mut tmp = candidate.1.clone();
                if tmp.playout(self.color, &mut self.rng) == Some(self.color) {
                    candidate.2 += 1;
                }
            }
            samples += 1;
        }
//         console_log!("{} samples simulated for each {} moves. in total: {}",
//                      samples, candidates.len(), samples * candidates.len());
//         console_log!("win_rates = {:?}", candidates.iter()
//             .map(|x| x.2 as f64 / samples as f64).collect::<Vec<_>>());

        candidates.sort_by_key(|x| x.2);
        console_log!("{:?}, estimated win rate = {}.", self.color,
                     candidates.last().unwrap().2 as f64 / samples as f64);
        candidates.pop().unwrap().1
    }
}

#[wasm_bindgen]
pub struct UCTMonteCarlo {
    pub color:        Color,
    rng:              rand::rngs::StdRng,
    time_limit:       Duration,
    ucb1_coeff:       f64,
    expand_threshold: u32,
    root:             Rc<RefCell<UCTNode>>,
}

#[derive(Debug, Clone)]
struct UCTNode {
    win:      u32,
    lose:     u32,
    samples:  u32,
    children: Vec<Rc<RefCell<UCTNode>>>,
    parent:   Weak<RefCell<UCTNode>>,
    color:    Color,
    board:    Board,
}

impl UCTNode {
    fn new(color: Color, board: Board) -> Self {
        UCTNode{win: 0, lose: 0, samples: 0, children: Vec::new(), parent: Weak::new(), color, board}
    }

    fn win_rate(&self) -> f64 {
        if self.samples == 0 { // avoid NaN
            0.5 // no information, half-half.
        } else {
            self.win as f64 / self.samples as f64
        }
    }
    fn lose_rate(&self) -> f64 {
        if self.samples == 0 { // avoid NaN
            0.5 // no information, half-half.
        } else {
            self.lose as f64 / self.samples as f64
        }
    }

    fn ucb1(&self, coef: f64, logn: f64) -> f64 {
        if self.samples == 0 {
            f64::INFINITY
        } else {
            self.win_rate() + coef * f64::sqrt(logn / self.samples as f64)
        }
    }
}

fn expand_node(node_ptr: &Rc<RefCell<UCTNode>>) {
    let mut node: RefMut<UCTNode> = node_ptr.borrow_mut();
    let possible_moves = node.board.possible_moves(node.color);
    for possible_move in possible_moves.iter() {
        let mut possible_board: Board = node.board.clone();
        possible_board.apply_move(*possible_move, node.color);

        // child node represents opponent's turn
        let child = Rc::new(RefCell::new(
                UCTNode::new(opponent_of(node.color), possible_board)));

        child.borrow_mut().parent = Rc::downgrade(node_ptr);
        node.children.push(child);
    }

    // handle passed turn
    if node.children.is_empty() {
        // if passed, the same board is passed to opponent
        let child = Rc::new(RefCell::new(
                UCTNode::new(opponent_of(node.color), node.board.clone())));
        child.borrow_mut().parent = Rc::downgrade(node_ptr);
        node.children.push(child);
    }
    assert!(0 < node.children.len());
}

// fn count_node_and_depth(root: Rc<RefCell<UCTNode>>, depth: usize) -> (usize, usize) {
//     if root.borrow().children.is_empty() {
//         return (1, depth);
//     }
//     root.borrow().children.iter()
//         .map(|node| count_node_and_depth(Rc::clone(node), depth+1))
//         .fold((1, depth), |(n1, d1), (n2, d2)| (n1+n2, usize::max(d1,d2)))
// }

#[wasm_bindgen]
impl UCTMonteCarlo {
    pub fn new(color: Color, seed0: u32, seed1: u32, timelimit: u32, ucb1_coeff: f64, expand_threshold: u32, board_width: usize) -> Self {
        let seed = convert_seed(seed0, seed1);
        let root = if color == Color::Red {
            // we need to init root with a board before starting...
            // play() function re-use the previous estimation.
            let ancester = Rc::new(RefCell::new(
                    UCTNode::new(Color::Blue, Board::new(board_width))));
            let root = Rc::new(RefCell::new(
                    UCTNode::new(Color::Red,  Board::new(board_width))));
            ancester.borrow_mut().children.push(root);
            ancester
        } else {
            let root = Rc::new(RefCell::new(
                    UCTNode::new(Color::Red, Board::new(board_width))));
            expand_node(&root);
            root
        };
        UCTMonteCarlo{
            color,
            rng: rand::rngs::StdRng::seed_from_u64(seed),
            time_limit: Duration::from_secs(timelimit as u64),
            ucb1_coeff,
            expand_threshold,
            root,
        }
    }

    pub fn play(&mut self, board: Board) -> Board {
        if !board.can_move(self.color) {
            return board;
        }

        // find the current state from the children of root node
        // (means: find opponent's move)
        let tmp = Rc::clone(self.root.borrow().children.iter()
            .find(|x| x.borrow().board.grids == board.grids).unwrap());
        self.root = tmp;
        self.root.borrow_mut().parent = Weak::new(); // discard ancesters
        assert_eq!(self.root.borrow().color, self.color);

        // search and expand the tree
        let stop = Instant::now() + self.time_limit;
        while Instant::now() < stop {
            let mut node = Rc::clone(&self.root);
            let mut depth = 0;
            let logn = f64::ln(node.borrow().samples as f64);
            while !node.borrow().children.is_empty() {
                let tmp = Rc::clone(node.borrow_mut().children.iter()
                    .max_by(|a, b|    a.borrow().ucb1(self.ucb1_coeff, logn)
                        .partial_cmp(&b.borrow().ucb1(self.ucb1_coeff, logn))
                        .unwrap_or(std::cmp::Ordering::Less))
                    .unwrap());
                node = tmp;
                depth += 1;
            }
            let wins = node.borrow().board.clone()
                .playout(node.borrow().color, &mut self.rng);

            if wins == Some(opponent_of(node.borrow().color)) {
                node.borrow_mut().win += 1;
            } else if wins == Some(node.borrow().color) {
                // to distinguish draw and lose, it counts both wins and loses
                node.borrow_mut().lose += 1;
            }
            node.borrow_mut().samples += 1;

            // do this after `samples += 1`
            if self.expand_threshold <= node.borrow().samples {
                if !node.borrow().board.is_gameover() {
                    expand_node(&node);
                }
            }

            while let Some(parent) = Rc::clone(&node).borrow().parent.upgrade() {
                depth -= 1;
                parent.borrow_mut().samples += 1;
                if wins == Some(opponent_of(parent.borrow().color)) {
                    parent.borrow_mut().win += 1;
                } else if wins == Some(parent.borrow().color) {
                    parent.borrow_mut().lose += 1;
                }
                node = parent;
            }
            assert_eq!(depth, 0);
        }

        // performance log
//         {
//             console_log!("{} samples used to estimate win/lose rate",
//                          self.root.borrow().samples);
//             let (n, d) = count_node_and_depth(Rc::clone(&self.root), 1);
//             console_log!("{} nodes with depth {} is used", n, d);
//         }

        // choose the next root by chosing the node with max win rate
        let tmp = Rc::clone(self.root.borrow_mut().children.iter()
            .max_by(|a, b|    (a.borrow().win_rate() - a.borrow().lose_rate())
                .partial_cmp(&(b.borrow().win_rate() - b.borrow().lose_rate()))
                .unwrap_or(std::cmp::Ordering::Less))
            .unwrap());
        self.root = tmp;
        self.root.borrow_mut().parent = Weak::new(); // discard ancesters
        console_log!("{:?}, estimated win rate = {}, lose rate = {}.", self.color,
                     self.root.borrow().win_rate(), self.root.borrow().lose_rate());

        if self.root.borrow().children.is_empty() &&
          !self.root.borrow().board.is_gameover() {
            console_log!("root.children is empty. Too short time limit?");
        }
        assert!(!self.root.borrow().children.is_empty() ||
                 self.root.borrow().board.is_gameover());
        // return the board in the root node
        self.root.borrow().board.clone()
    }
}

struct ToVecRefWriter {
    inner: Rc<RefCell<Vec<u8>>>,
}
impl std::io::Write for ToVecRefWriter {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        self.inner.borrow_mut().write(buf)
    }
    fn flush(&mut self) -> std::io::Result<()> {
        self.inner.borrow_mut().flush()
    }
}

#[wasm_bindgen]
pub struct GameGifEncoder {
    png_buffer: Vec<u8>,
    gif_buffer: Rc<RefCell<Vec<u8>>>,
    gif_encoder: Option<gif::Encoder<ToVecRefWriter>>,
}
use gif::SetParameter;

#[wasm_bindgen]
impl GameGifEncoder {
    pub fn new() -> Self {
        GameGifEncoder{
            png_buffer: Vec::new(),
            gif_buffer: Rc::new(RefCell::new(Vec::new())),
            gif_encoder: None,
        }
    }
    pub fn add_frame(&mut self, img: String) {
        let content: Vec<u8> = base64::decode(
            img.trim_start_matches("data:image/png;base64,")).unwrap();
        let decoder = png::Decoder::new(&content[..]);
        let (info, mut reader) = decoder.read_info().unwrap();
        self.png_buffer.resize(info.buffer_size(), 0);
        reader.next_frame(&mut self.png_buffer).unwrap();

        if self.gif_encoder.is_none() {
            self.gif_encoder = Some(gif::Encoder::new(
                ToVecRefWriter{inner: Rc::clone(&self.gif_buffer)},
                info.width as u16,
                info.height as u16,
                &[]).unwrap());
            self.gif_encoder.as_mut().unwrap().set(gif::Repeat::Infinite).unwrap();
        }
        let mut frame = gif::Frame::from_rgba_speed(
            info.width as u16, info.height as u16, &mut self.png_buffer, 20);
        frame.delay = 100;

        self.gif_encoder.as_mut().unwrap().write_frame(&frame).unwrap();
    }

    pub fn dump(&self) -> String {
        base64::encode(&*self.gif_buffer.borrow())
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{json, Value};

    #[test]
    fn possible_moves() {
        let board = Board::new(9);
        let possibles = board.possible_moves(Color::Red);
        assert_eq!(possibles.len(), 4);
        assert!(possibles.contains(&Move(Coord::new(0, 0), Coord::new(1, 1), Coord::new(1, 2))));
        assert!(possibles.contains(&Move(Coord::new(0, 0), Coord::new(1, 1), Coord::new(2, 1))));
        assert!(possibles.contains(&Move(Coord::new(8, 8), Coord::new(7, 7), Coord::new(7, 6))));
        assert!(possibles.contains(&Move(Coord::new(8, 8), Coord::new(7, 7), Coord::new(6, 7))));
    }

    #[test]
    fn possible_moves_as_json() {
        let board = Board::new(9);

        let red_moves = board.possible_moves(Color::Red);
        let blue_moves = board.possible_moves(Color::Blue);

        let moves_from_json: Value = serde_json::from_str(&board.possible_moves_as_json()).unwrap();

        for (i, Move(s1, s2, s3)) in red_moves.iter().enumerate() {
            let stone1 = &moves_from_json[i]["stones"][0];
            let stone2 = &moves_from_json[i]["stones"][1];
            let stone3 = &moves_from_json[i]["stones"][2];
            let color = &moves_from_json[i]["color"];

            assert_eq!(stone1["x"].as_i64().unwrap(), s1.x as i64);
            assert_eq!(stone1["y"].as_i64().unwrap(), s1.y as i64);
            assert_eq!(stone2["x"].as_i64().unwrap(), s2.x as i64);
            assert_eq!(stone2["y"].as_i64().unwrap(), s2.y as i64);
            assert_eq!(stone3["x"].as_i64().unwrap(), s3.x as i64);
            assert_eq!(stone3["y"].as_i64().unwrap(), s3.y as i64);
            assert_eq!(color.as_i64().unwrap(), Color::Red as i64);
        }

        for (i, Move(s1, s2, s3)) in blue_moves.iter().enumerate() {
            let i = i + red_moves.len();
            let stone1 = &moves_from_json[i]["stones"][0];
            let stone2 = &moves_from_json[i]["stones"][1];
            let stone3 = &moves_from_json[i]["stones"][2];
            let color = &moves_from_json[i]["color"];

            assert_eq!(stone1["x"].as_i64().unwrap(), s1.x as i64);
            assert_eq!(stone1["y"].as_i64().unwrap(), s1.y as i64);
            assert_eq!(stone2["x"].as_i64().unwrap(), s2.x as i64);
            assert_eq!(stone2["y"].as_i64().unwrap(), s2.y as i64);
            assert_eq!(stone3["x"].as_i64().unwrap(), s3.x as i64);
            assert_eq!(stone3["y"].as_i64().unwrap(), s3.y as i64);
            assert_eq!(color.as_i64().unwrap(), Color::Blue as i64);
        }
    }

    #[test]
    fn to_json() {
        let mut board = Board::new(9);

        board.apply_move(Move(Coord::new(0, 0), Coord::new(1, 1), Coord::new(1, 2)), Color::Red);
        board.apply_move(Move(Coord::new(0, 8), Coord::new(1, 7), Coord::new(1, 6)), Color::Blue);

        let board_from_json: Value = serde_json::from_str(&board.to_json()).unwrap();
        let stones = &board_from_json["stones"].as_array().unwrap();
        let roots = &board_from_json["roots"].as_array().unwrap();

        assert_eq!(stones.len(), 8);
        let correct_stones = vec![
            json!({"x": 0, "y": 0, "color": Color::Red}),
            json!({"x": 1, "y": 1, "color": Color::Red}),
            json!({"x": 1, "y": 2, "color": Color::Red}),
            json!({"x": 8, "y": 8, "color": Color::Red}),
            json!({"x": 0, "y": 8, "color": Color::Blue}),
            json!({"x": 1, "y": 7, "color": Color::Blue}),
            json!({"x": 1, "y": 6, "color": Color::Blue}),
            json!({"x": 8, "y": 0, "color": Color::Blue}),
        ];
        for correct in correct_stones {
            assert!(stones.contains(&correct));
        }

        assert_eq!(roots.len(), 4*2);
        let correct_roots = vec![
            json!({"x1": 0, "y1": 0, "x2": 1, "y2": 1, "color": Color::Red}),
            json!({"x1": 1, "y1": 1, "x2": 0, "y2": 0, "color": Color::Red}),
            json!({"x1": 1, "y1": 1, "x2": 1, "y2": 2, "color": Color::Red}),
            json!({"x1": 1, "y1": 2, "x2": 1, "y2": 1, "color": Color::Red}),
            json!({"x1": 0, "y1": 8, "x2": 1, "y2": 7, "color": Color::Blue}),
            json!({"x1": 1, "y1": 7, "x2": 0, "y2": 8, "color": Color::Blue}),
            json!({"x1": 1, "y1": 7, "x2": 1, "y2": 6, "color": Color::Blue}),
            json!({"x1": 1, "y1": 6, "x2": 1, "y2": 7, "color": Color::Blue}),
        ];
        for correct in correct_roots {
            assert!(roots.contains(&correct));
        }
    }
}
