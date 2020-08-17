use wasm_bindgen::prelude::*;
use web_sys::console;

use arrayvec::ArrayVec;
use rand::prelude::*;

use std::vec::Vec;
use std::option::Option;
use std::time::{Duration, SystemTime};

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
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct Coord (i8, i8);

#[wasm_bindgen]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub struct Move (Coord, Coord, Coord);

#[wasm_bindgen]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
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
#[derive(Debug, Clone)]
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
                let crd = Coord(x, y);
                graph.at_mut(crd, NodePos::N).edges.push((crd, NodePos::E));
                graph.at_mut(crd, NodePos::N).edges.push((crd, NodePos::W));

                graph.at_mut(crd, NodePos::E).edges.push((crd, NodePos::N));
                graph.at_mut(crd, NodePos::E).edges.push((crd, NodePos::S));

                graph.at_mut(crd, NodePos::S).edges.push((crd, NodePos::E));
                graph.at_mut(crd, NodePos::S).edges.push((crd, NodePos::W));

                graph.at_mut(crd, NodePos::W).edges.push((crd, NodePos::N));
                graph.at_mut(crd, NodePos::W).edges.push((crd, NodePos::S));

                if x != 0 {
                    graph.at_mut(Coord(x,y), NodePos::W).edges
                        .push((Coord(x-1,y), NodePos::E));
                }
                if x != x_max {
                    graph.at_mut(Coord(x,y), NodePos::E).edges
                        .push((Coord(x+1,y), NodePos::W));
                }
                if y != 0 {
                    graph.at_mut(Coord(x,y), NodePos::N).edges
                        .push((Coord(x,y-1), NodePos::S));
                }
                if y != y_max {
                    graph.at_mut(Coord(x,y), NodePos::S).edges
                        .push((Coord(x,y+1), NodePos::N));
                }
            }
        }
        graph
    }

    pub fn apply_move(&mut self, next_move: Move) {
        // remove edges from self
        let Move(stone1, stone2, stone3) = next_move;

        // first root
//         console_log!("graph.apply_move({:?}, {:?}) ...", stone1, stone2);
        let dx = stone2.0 - stone1.0;
        let dy = stone2.1 - stone1.1;
        match (dx, dy) {
            (1, 1) => {
                self.remove_edge(stone1, NodePos::N, stone1, NodePos::W);
                self.remove_edge(stone1, NodePos::S, stone1, NodePos::E);
            }
            (1, -1) => {
                let pos = Coord(stone1.0, stone1.1 - 1);
                if 0 <= pos.1 {
                    self.remove_edge(pos, NodePos::N, pos, NodePos::E);
                    self.remove_edge(pos, NodePos::S, pos, NodePos::W);
                }
            }
            (-1, 1) => {
                let pos = Coord(stone1.0 - 1, stone1.1);
                if 0 <= pos.0 {
                    self.remove_edge(pos, NodePos::N, pos, NodePos::E);
                    self.remove_edge(pos, NodePos::S, pos, NodePos::W);
                }
            }
            (-1, -1) => {
                self.remove_edge(stone2, NodePos::N, stone2, NodePos::W);
                self.remove_edge(stone2, NodePos::S, stone2, NodePos::E);
            }
            _ => {
//                 console_log!("invalid 1st root from {:?} to {:?}, dir ({}, {})", stone1, stone2, dx, dy);
                assert!(false);
            }
        }
//         console_log!("done.");
//         console_log!("graph.apply_move({:?}, {:?}) ... ", stone2, stone3);
        // second root
        let dx = stone3.0 - stone2.0;
        let dy = stone3.1 - stone2.1;

        let upper = self.ngrids as i8;
        match (dx, dy) {
            (1, 0) => {
                if stone2.0 < upper && 1 <= stone2.1 && stone2.1 < upper {
                    self.remove_edge(Coord(stone2.0, stone2.1-1), NodePos::S,
                                           stone2,                NodePos::N);
                }
            }
            (-1, 0) => {
                if stone3.0 < upper && 1 <= stone3.1 && stone3.1 < upper {
                    self.remove_edge(Coord(stone3.0, stone3.1-1), NodePos::S,
                                           stone3,                NodePos::N);
                }
            }
            (0, 1) => {
                if 1 <= stone2.0 && stone2.0 < upper && stone2.1 < upper {
                    self.remove_edge(Coord(stone2.0-1, stone2.1), NodePos::E,
                                           stone2,                NodePos::W);
                }
            }
            (0, -1) => {
                if 1 <= stone3.0 && stone3.0 < upper && stone3.1 < upper {
                    self.remove_edge(Coord(stone3.0-1, stone3.1), NodePos::E,
                                           stone3,                NodePos::W);
                }
            }
            _ => {
//                 console_log!("invalid 2nd root from {:?} to {:?}, dir ({}, {})", stone2, stone3, dx, dy);
                assert!(false);
            }
        }
//         console_log!("done.");
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

            let crd = Coord(x as i8, y as i8);
            if 4 <= self.find_connected_component(region, crd, pos) {
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
//         console_log!("removing edges between ({:?}, {:?}) and ({:?}, {:?})", crd1, pos1, crd2, pos2);
//         console_log!("({:?}, {:?}) contains {:?}", crd1, pos1, self.at(crd1, pos1).edges);
//         console_log!("({:?}, {:?}) contains {:?}", crd2, pos2, self.at(crd2, pos2).edges);

        assert!(self.at(crd1, pos1).edges.contains(&(crd2, pos2)));
        assert!(self.at(crd2, pos2).edges.contains(&(crd1, pos1)));

        self.at_mut(crd1, pos1).edges.retain(|x| *x != (crd2, pos2));
        self.at_mut(crd2, pos2).edges.retain(|x| *x != (crd1, pos1));

//         console_log!("removed.");
//         console_log!("({:?}, {:?}) contains {:?}", crd1, pos1, self.at(crd1, pos1).edges);
//         console_log!("({:?}, {:?}) contains {:?}", crd2, pos2, self.at(crd2, pos2).edges);
    }

    fn at(&self, coord: Coord, pos: NodePos) -> &Node {
        let idx = ((coord.0 as usize) * (self.ngrids as usize) +
                   (coord.1 as usize)) * 4 + match pos {
            NodePos::N => 0,
            NodePos::E => 1,
            NodePos::S => 2,
            NodePos::W => 3,
        };

        &self.nodes[idx]
    }
    fn at_mut(&mut self, coord: Coord, pos: NodePos) -> &mut Node {
        let idx = ((coord.0 as usize) * (self.ngrids as usize) +
                   (coord.1 as usize)) * 4 + match pos {
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
    pub fn new() -> Self {
        Grid{color: None, roots: ArrayVec::new()}
    }
    // Note that it checks the direction of the roots but not the color.
    pub fn is_legal_root(&self, dir: Dir) -> bool {
        self.roots.iter()
            .find(|d| i8::abs(dir.0 - d.0) + i8::abs(dir.1 - d.1) <= 1)
            .is_none()
    }
}


#[wasm_bindgen]
#[derive(Debug, Clone)]
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
                    if !grid.is_legal_root(*dir1) {
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
                    if !self.grids[idx2].is_legal_root(Dir(-dir1.0, -dir1.1)) {
                        continue;
                    }
                    // possible next roots
                    {
                        let dir2 = Dir(dir1.0, 0);
                        // check root collision at the second stone
                        if !self.grids[idx2].is_legal_root(dir2) {
                            continue;
                        }
                        // check stone/root collision at the third stone
                        let x3 = x2 + dir2.0;
                        let y3 = y2 + dir2.1;

                        if !(x3 < 0 || y3 < 0 || self.width as i8 <= x3 || self.width as i8 <= y3) {
                            let idx3 = x3 as usize * self.width as usize + y3 as usize;
                            if (self.grids[idx3].color == None || self.grids[idx3].color == Some(turn)) &&
                                self.grids[idx3].is_legal_root(Dir(-dir2.0, -dir2.1)) {
                                moves.push(Move(Coord(x1, y1), Coord(x2, y2), Coord(x3, y3)));
                            }
                        }
                    }
                    {
                        let dir2 = Dir(0, dir1.1);
                        // check root collision at the second stone
                        if !self.grids[idx2].is_legal_root(dir2) {
                            continue;
                        }
                        // check stone/root collision at the third stone
                        let x3 = x2 + dir2.0;
                        let y3 = y2 + dir2.1;

                        if !(x3 < 0 || y3 < 0 || self.width as i8 <= x3 || self.width as i8 <= y3) {
                            let idx3 = x3 as usize * self.width as usize + y3 as usize;
                            if (self.grids[idx3].color == None || self.grids[idx3].color == Some(turn)) &&
                                self.grids[idx3].is_legal_root(Dir(-dir2.0, -dir2.1)) {
                                moves.push(Move(Coord(x1, y1), Coord(x2, y2), Coord(x3, y3)));
                            }
                        }
                    }
                }
            }
        }
        moves
    }

    pub fn can_move(&self, turn: Color) -> bool {
        !self.possible_moves(turn).is_empty()
    }

    pub fn is_gameover(&self) -> bool {
        self.possible_moves(Color::Red ).is_empty() &&
        self.possible_moves(Color::Blue).is_empty()
    }

    pub fn is_valid_move(&self, next_move: Move, turn: Color) -> bool {
        self.possible_moves(turn).contains(&next_move)
    }

    pub fn apply_move(&mut self, next_move: Move, turn: Color) {
        assert!(self.is_valid_move(next_move, turn));
        // apply next_move to the board

        let Move(stone1, stone2, stone3) = next_move;

        let idx1 = stone1.0 as usize * self.width as usize + stone1.1 as usize;
        let idx2 = stone2.0 as usize * self.width as usize + stone2.1 as usize;
        let idx3 = stone3.0 as usize * self.width as usize + stone3.1 as usize;

        self.grids[idx2].color = Some(turn);
        self.grids[idx3].color = Some(turn);

        self.grids[idx1].roots.push(Dir(stone2.0 - stone1.0, stone2.1 - stone1.1));
        self.grids[idx2].roots.push(Dir(stone1.0 - stone2.0, stone1.1 - stone2.1));

        self.grids[idx2].roots.push(Dir(stone3.0 - stone2.0, stone3.1 - stone2.1));
        self.grids[idx3].roots.push(Dir(stone2.0 - stone3.0, stone2.1 - stone3.1));

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
        let mut stones = String::new();
        let mut roots  = String::new();
        for x in 0..self.width as i8 {
            for y in 0..self.width as i8 {
                let idx = (x as usize) * (self.width as usize) + (y as usize);
                if let Some(color) = self.grids[idx].color {
                    let color_idx = if color == Color::Red {0} else {1};

                    // add stone
                    let stone = format!("{{\"x\":{},\"y\":{},\"color\":{}}},", x, y, color_idx);
                    stones += &stone;

                    // add roots
                    for dir in self.grids[idx].roots.iter() {
                        let root = format!("{{ \"x1\":{},\"y1\":{},\"x2\":{},\"y2\":{},\"color\":{} }},",
                                           x, y, x + dir.0, y + dir.1, color_idx);
                        roots += &root;
                    }
                }
            }
        }
        if !stones.is_empty() {
            stones.pop(); // remove trailing comma
        }
        if !roots.is_empty() {
            roots.pop(); // remove trailing comma
        }
        format!("{{\"stones\":[{}],\"roots\":[{}]}}", stones, roots).to_string()
    }
}

#[wasm_bindgen]
pub struct RandomPlayer {
    pub color: Color,
    rng: rand::rngs::StdRng,
}

#[wasm_bindgen]
impl RandomPlayer {
    pub fn new(color: Color, seed: u64) -> Self {
        RandomPlayer{color, rng: rand::rngs::StdRng::seed_from_u64(seed)}
    }
    pub fn play(&mut self, mut board: Board) -> Board {
        let mut moves = board.possible_moves(self.color);
        moves.shuffle(&mut self.rng);
        if let Some(next_move) = moves.pop() {
//             console_log!("applying move {:?}", next_move);
            board.apply_move(next_move, self.color);
//             console_log!("applied.");
        }
        board
    }
}

// ----------------------------------------------------------------------------
// workaround for SystemTime::now in WASM
// #![allow(dead_code, unused_imports)]

use wasm_bindgen::prelude::*;
use std::convert::{TryInto};
use std::ops::{Add, Sub, AddAssign, SubAssign};

pub use std::time::*;

#[cfg(not(target_arch = "wasm32"))] #[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)] pub struct Instant(std::time::Instant);
#[cfg(not(target_arch = "wasm32"))] impl Instant {
    pub fn now() -> Self { Self(std::time::Instant::now()) }
    pub fn duration_since(&self, earlier: Instant) -> Duration { self.0.duration_since(earlier.0) }
    pub fn elapsed(&self) -> Duration { self.0.elapsed() }
    pub fn checked_add(&self, duration: Duration) -> Option<Self> { self.0.checked_add(duration).map(|i| Self(i)) }
    pub fn checked_sub(&self, duration: Duration) -> Option<Self> { self.0.checked_sub(duration).map(|i| Self(i)) }
}

#[cfg(target_arch = "wasm32")] #[wasm_bindgen] extern "C" { #[wasm_bindgen(js_namespace = Date, js_name = now)] fn date_now() -> f64; }
#[cfg(target_arch = "wasm32")] #[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)] pub struct Instant(u64);
#[cfg(target_arch = "wasm32")] impl Instant {
    pub fn now() -> Self { Self(date_now() as u64) }
    pub fn duration_since(&self, earlier: Instant) -> Duration { Duration::from_millis(self.0 - earlier.0) }
    pub fn elapsed(&self) -> Duration { Self::now().duration_since(*self) }
    pub fn checked_add(&self, duration: Duration) -> Option<Self> {
        match duration.as_millis().try_into() {
            Ok(duration) => self.0.checked_add(duration).map(|i| Self(i)),
            Err(_) => None,
        }
    }
    pub fn checked_sub(&self, duration: Duration) -> Option<Self> {
        match duration.as_millis().try_into() {
            Ok(duration) => self.0.checked_sub(duration).map(|i| Self(i)),
            Err(_) => None,
        }
    }
}

impl Add<Duration> for Instant { type Output = Instant; fn add(self, other: Duration) -> Instant { self.checked_add(other).unwrap() } }
impl Sub<Duration> for Instant { type Output = Instant; fn sub(self, other: Duration) -> Instant { self.checked_sub(other).unwrap() } }
impl Sub<Instant>  for Instant { type Output = Duration; fn sub(self, other: Instant) -> Duration { self.duration_since(other) } }
impl AddAssign<Duration> for Instant { fn add_assign(&mut self, other: Duration) { *self = *self + other; } }
impl SubAssign<Duration> for Instant { fn sub_assign(&mut self, other: Duration) { *self = *self - other; } }

// ----------------------------------------------------------------------------

#[wasm_bindgen]
pub struct NaiveMonteCarlo {
    pub color: Color,
    rng: rand::rngs::StdRng,
    time_limit: Duration,
}

#[wasm_bindgen]
impl NaiveMonteCarlo {
    pub fn new(color: Color, seed: u64, timelimit: u64) -> Self {
        NaiveMonteCarlo{
            color,
            rng: rand::rngs::StdRng::seed_from_u64(seed),
            time_limit: Duration::new(timelimit, 0)
        }
    }

    // if it wins, return true
    fn playout(&mut self, mut board: Board) -> bool {
        // it starts from the opponent's turn because our first move is already
        // applied to this board.

        let opponent_color = opponent_of(self.color);
        while !board.is_gameover() {
            {
                let mut moves_opp = board.possible_moves(opponent_color);
                moves_opp.shuffle(&mut self.rng);
                if let Some(next_move) = moves_opp.pop() {
                    board.apply_move(next_move, opponent_color)
                }
            }
            {
                let mut moves_slf = board.possible_moves(self.color);
                moves_slf.shuffle(&mut self.rng);
                if let Some(next_move) = moves_slf.pop() {
                    board.apply_move(next_move, self.color);
                }
            }
        }
        board.score(opponent_of(self.color)) < board.score(self.color)
    }

    pub fn play(&mut self, board: Board) -> Board {
//         let stop = SystemTime::now() + self.time_limit;

        let mut candidates = Vec::<(_, _, u32)>::new();
        for possible_move in board.possible_moves(self.color).iter() {
            let mut cand_board = board.clone();
            cand_board.apply_move(*possible_move, self.color);
            candidates.push((*possible_move, cand_board, 0));
        }

        if candidates.is_empty() {
            return board
        }

        console_log!("{} possible moves are there", candidates.len());

        let stop = Instant::now() + self.time_limit;
        let mut samples: usize = 0;
//         while SystemTime::now() < stop {
        while Instant::now() < stop {
            for candidate in candidates.iter_mut() {
                if self.playout(candidate.1.clone()) {
                    candidate.2 += 1;
                }
            }
            samples += 1;
        }
        console_log!("{} samples simulated for each {} moves. in total: {}",
                     samples, candidates.len(), samples * candidates.len());
        // I think we don't need clone() here, we can just move it out
        candidates.iter().max_by_key(|x| x.2).unwrap().1.clone()
    }
}
