const canvas_header = 100;
const canvas_width  = 540;
const canvas_height = 640;
const board_size   =    9;
const board_margin =  30;
const board_width  = 480;
const grid_width   = board_width / (board_size - 1);
const stone_radius =  grid_width * 0.3;
const stone_stroke =   2;
const root_stroke  =   5;
const time_limit   =   1;

const board_color = "rgb(255,255,255)";
const grid_color  = "rgb(0,0,0)";

const red_color  = 0;
const blue_color = 1;
const fill_colors   = ['rgba(255,128,128,0.95)', 'rgba(128,128,255,0.95)'];
const stroke_colors = ['rgb(255,0,0)', 'rgb(0,0,255)'];

const guide_checkbox = document.getElementById("guide");
var draw_guide = guide_checkbox.checked;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function mouseevent_to_xy(e) {
    const x = Math.floor((e.offsetX + grid_width / 2 - board_margin)                 / grid_width);
    const y = Math.floor((e.offsetY + grid_width / 2 - board_margin - canvas_header) / grid_width);
    return {x:x, y:y};
}
function xy_to_pixel(xy) {
    const pix_x = xy.x * grid_width + board_margin;
    const pix_y = xy.y * grid_width + board_margin + canvas_header;
    return {x:pix_x, y:pix_y};
}

let is_running = false;

async function run(module) {
    if(is_running) {return;}
    is_running = true;

    let separo = module.Board.new(board_size);
    let canvas = document.getElementById("separo-board");

    canvas.width  = canvas_width;
    canvas.height = canvas_height;

    var context = canvas.getContext('2d');

    const player_setting_R = document.getElementById("red player" );
    const player_setting_B = document.getElementById("blue player");
    const player_R = player_setting_R.options[player_setting_R.selectedIndex].value;
    const player_B = player_setting_B.options[player_setting_B.selectedIndex].value;

    console.log("player red  = ", player_R);
    console.log("player blue = ", player_B);

    drawBoard(context, separo, player_R, player_B, "Select players and Click \"Start\"");
    guide_checkbox.addEventListener('input', function(e) {
        draw_guide = guide_checkbox.checked;
        drawBoard(context, separo, player_R, player_B, draw_guide ? "guide turned on" : "guide turned off");
    });

    if(player_R == "NotSelected" || player_B == "NotSelected") {
        is_running = false;
        return;
    }

    let playerR;
    let playerB;

    let gen_seed = function() {
        return Math.floor(Math.random() * 4294967296)
    }

    // to check human's move (There should be more sophisticated way...)
    var is_humans_turn = false;
    var humans_move    = [null, null, null];
    var turn_color     = "Red";
    canvas.addEventListener('mousemove', function(e) {
        if(is_humans_turn) {
            if(humans_move[0] != null &&
               humans_move[1] == null && humans_move[2] == null) {
                let current_pos = mouseevent_to_xy(e);
                // diagonal
                if(Math.abs(current_pos.x - humans_move[0].x) == 1 &&
                   Math.abs(current_pos.y - humans_move[0].y) == 1) {
                    humans_move[1] = current_pos;
//                     console.log("mouse move detected: ", humans_move[1]);
                    // draw temporary
                    var pix = xy_to_pixel(humans_move[1]);
                    drawTemporaryStone(context, pix);
                }
            } else if(humans_move[0] != null &&
                      humans_move[1] != null && humans_move[2] == null) {
                // just show the last stone while chosing it.
                // It does not actually move a stone.
                let current_pos = mouseevent_to_xy(e);
                drawBoard(context, separo, player_R, player_B, turn_color + "'s turn");
                drawTemporaryStone(context, xy_to_pixel(humans_move[0]));
                drawTemporaryStone(context, xy_to_pixel(humans_move[1]));
                drawTemporaryStone(context, xy_to_pixel(current_pos));
            }
        }
    });

    const human_player = function(color) {
        return async function(board) {
//             console.log("human.play() function started");
            if(!board.can_move(color)) {
//                 console.log("You cannot move. return.");
                return board;
            }
            is_humans_turn = true;
            while (true) {
                drawBoard(context, board, player_R, player_B, turn_color + "'s turn");
//                 console.log("waiting human...");

                canvas.addEventListener('mousedown', function(e) {
                    humans_move[0] = mouseevent_to_xy(e);
//                     console.log("mouse down detected: ", humans_move[0]);

                    // draw temporary
                    var pix = xy_to_pixel(humans_move[0]);
                    drawTemporaryStone(context, pix);
                }, {once: true});

                var mouse_upped = false;
                canvas.addEventListener('mouseup', function(e) {
                    if(humans_move[0] != null && humans_move[1] != null) {
                        humans_move[2] = mouseevent_to_xy(e);
//                         console.log("mouse up detected: ", humans_move[2]);
                    }
                    mouse_upped = true;
                }, {once: true});

                while(!mouse_upped) {
                    await sleep(200);
                }

                if(humans_move.includes(null)) {
                    humans_move = [null, null, null];
                    continue;
                }

                if(board.apply_move_if_possible(
                    humans_move[0].x, humans_move[0].y,
                    humans_move[1].x, humans_move[1].y,
                    humans_move[2].x, humans_move[2].y, color)) {
                    break;
                }
                humans_move = [null, null, null];
            }
//             console.log("done.");
            humans_move    = [null, null, null];
            is_humans_turn = false;
            return board;
        }
    };

    if(player_R == "Random") {
        playerR = module.RandomPlayer.new(0, gen_seed(), gen_seed());
    } else if (player_R == "Naive MC") {
        playerR = module.NaiveMonteCarlo.new(0, gen_seed(), gen_seed(), time_limit);
    } else if (player_R == "UCT MC") {
        playerR = module.UCTMonteCarlo.new(0, gen_seed(), gen_seed(), time_limit, 1.4, 3, board_size);
    } else {
        playerR = {play: human_player(0)};
    }
    if(player_B == "Random") {
        playerB = module.RandomPlayer.new(1, gen_seed(), gen_seed());
    } else if (player_B == "Naive MC") {
        playerB = module.NaiveMonteCarlo.new(1, gen_seed(), gen_seed(), time_limit);
    } else if (player_B == "UCT MC") {
        playerB = module.UCTMonteCarlo.new(1, gen_seed(), gen_seed(), time_limit, 1.4, 3, board_size);
    } else {
        playerB = {play: human_player(1)};
    }

    while(!separo.is_gameover()) {
        turn_color = "Red";
        separo = await playerR.play(separo);

        drawBoard(context, separo, player_R, player_B, "Blue's turn");
        await sleep(100);

        turn_color = "Blue";
        separo = await playerB.play(separo);

        drawBoard(context, separo, player_R, player_B, "Red's turn");
        await sleep(100);
    }

    var last_score_red  = separo.score(0);
    var last_score_blue = separo.score(1);
    var result = "draw!";
    if (last_score_blue < last_score_red) {
        result = "Red wins!";
    } else if (last_score_red < last_score_blue) {
        result = "Blue wins!";
    }
    drawBoard(context, separo, player_R, player_B, result);
    is_running = false;
    return;
}

function drawBoard(context, board, red_name, blue_name, msg) {

    const board_state = JSON.parse(board.to_json());
    const red_score  = board.score(0);
    const blue_score = board.score(1);

    const stones = board_state["stones"];
    const roots  = board_state["roots"];

    // clear the board before redraw
    context.clearRect(0, 0, canvas_width, canvas_height);
    context.fillStyle=board_color;
    context.fillRect(0, 0, canvas_width, canvas_height);

    // show current score
    context.font      = "20px sans-serif"
    var metrics = context.measureText(" | ");
    context.fillStyle = stroke_colors[0];
    context.textAlign = "right";
    context.fillText(`${red_name}: ${red_score}`,
                     (canvas_width - metrics.width)/ 2, 40.0);

    context.fillStyle = stroke_colors[1];
    context.textAlign = "left";
    context.fillText(`${blue_name}: ${blue_score}`,
                     (canvas_width + metrics.width)/ 2, 40.0);

    context.fillStyle = "rgb(0,0,0)"
    context.textAlign = "center"
    context.fillText("|", canvas_width / 2, 40.0);
    context.fillText(msg, canvas_width / 2, 70.0);

    // draw grid
    context.strokeStyle=grid_color;
    context.lineWidth=2.0

    context.beginPath();
    for(let x=0; x<board_size; x++) {
        context.moveTo(board_margin + grid_width * x,              canvas_header + board_margin + grid_width * 0);
        context.lineTo(board_margin + grid_width * x,              canvas_header + board_margin + grid_width * (board_size-1));
    }
    for(let y=0; y<board_size; y++) {
        context.moveTo(board_margin + grid_width * 0,              canvas_header + board_margin + grid_width * y);
        context.lineTo(board_margin + grid_width * (board_size-1), canvas_header + board_margin + grid_width * y);
    }
    context.stroke();

    // draw all the stones and roots
    stones.forEach(function(stone) {
        drawStone(context, stone["x"], stone["y"], stone["color"]);
    });
    roots.forEach(function(root) {
        drawRoot(context, root["x1"], root["y1"], root["x2"], root["y2"], root["color"]);
    });

    if(draw_guide) {
        JSON.parse(board.possible_moves_as_json()).forEach(function(root) {
            drawTemporaryRoot(context, root["x1"], root["y1"],
                                       root["x2"], root["y2"], root["color"]);
        });
    }
}

function drawStone(context, x, y, color_idx) {
    context.beginPath();

    context.lineWidth   = stone_stroke;
    context.fillStyle   = fill_colors[color_idx];
    context.strokeStyle = stroke_colors[color_idx];

    context.arc(x * grid_width + board_margin, y * grid_width + board_margin + canvas_header,
                stone_radius, 0, 2 * Math.PI, false);
    context.fill();
    context.stroke();
}

function drawTemporaryStone(context, pix) {
    context.beginPath();

    context.strokeStyle = "rgb(0,0,0)";
    context.lineWidth = 2;
    context.setLineDash([4,4]);

    context.arc(pix.x, pix.y, stone_radius, 0, 2 * Math.PI, false);
    context.stroke();

    context.setLineDash([]);
}

function drawRoot(context, x1, y1, x2, y2, color_idx) {
    context.beginPath();

    context.lineWidth = root_stroke;
    context.lineCap = 'round';
    context.fillStyle   = fill_colors[color_idx];
    context.strokeStyle = stroke_colors[color_idx];

    context.moveTo(x1 * grid_width + board_margin, y1 * grid_width + board_margin + canvas_header);
    context.lineTo(x2 * grid_width + board_margin, y2 * grid_width + board_margin + canvas_header);
    context.stroke();
}

function drawTemporaryRoot(context, x1, y1, x2, y2, color_idx) {
    context.beginPath();

    context.strokeStyle = color_idx == 0 ? "rgba(255,0,0,0.9)" : "rgba(0,0,255,0.9)";
    context.lineWidth = 5;
    context.setLineDash([10]);
    context.lineCap = 'round';

    context.beginPath();
    context.moveTo(x1 * grid_width + board_margin, y1 * grid_width + board_margin + canvas_header);
    context.lineTo(x2 * grid_width + board_margin, y2 * grid_width + board_margin + canvas_header);
    context.stroke();

    context.setLineDash([]);
}
