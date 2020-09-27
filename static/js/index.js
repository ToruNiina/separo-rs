const canvas_header = 100;
const canvas_width  = 540;
const canvas_height = 640;
const board_margin  =  30;
const board_width   = 480;
let board_size      =   9;
let grid_width      = board_width / (board_size - 1);
let stone_radius    =  grid_width * 0.3;
let scale           = 1.0;
const stone_stroke  =   2;
const root_stroke   =   5;
const RED           =   0;
const BLUE          =   1;

const board_color   = "rgb(255,255,255)";
const grid_color    = "rgb(0,0,0)";
const fill_colors   = ['rgba(255,128,128,0.95)', 'rgba(128,128,255,0.95)'];
const stroke_colors = ['rgb(255,0,0)', 'rgb(0,0,255)'];

const guide_checkbox = document.getElementById("guide");
let draw_guide = guide_checkbox.checked;
let is_running = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function mouseevent_to_xy(e) {
    return offset_to_xy(e.offsetX, e.offsetY);
}

function touchevent_to_xy(e) {
    const touchObject = e.changedTouches[0];
    const touchX = touchObject.pageX;
    const touchY = touchObject.pageY;

    const element = touchObject.target;
    const elemRect = element.getBoundingClientRect();
    const originX = elemRect.left + window.pageXOffset;
    const originY = elemRect.top + window.pageYOffset;

    return offset_to_xy(touchX - originX, touchY - originY);
}

function offset_to_xy(offsetX, offsetY) {
    return {
        x: Math.floor((scale * offsetX + grid_width / 2 - board_margin)                 / grid_width),
        y: Math.floor((scale * offsetY + grid_width / 2 - board_margin - canvas_header) / grid_width),
    };
}

function xy_to_pixel(xy) {
    const pix_x = xy.x * grid_width + board_margin;
    const pix_y = xy.y * grid_width + board_margin + canvas_header;
    return {x:pix_x, y:pix_y};
}

function update_board_size() {
    board_size = Math.floor(document.getElementById("board-size").valueAsNumber);
    grid_width = board_width / (board_size - 1);
    stone_radius = grid_width * 0.3;
}

document.getElementById("board-size").addEventListener('input', function(e) {
    if(is_running) {
        return; // ignore change while playing a game
    }
    update_board_size();
});

let gif_base64 = ""
document.getElementById("download-button").addEventListener('click', function(e) {
    let element = document.createElement("a");
    element.setAttribute("href", gif_base64);
    element.setAttribute("download", "separo.gif");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
});


async function run(module) {
    if(is_running) {return;}
    is_running = true;

    // check current board size
    update_board_size();

    let separo = module.Board.new(board_size);
    let canvas = document.getElementById("separo-board");

    scale = canvas_width / canvas.offsetWidth;
    canvas.width  = canvas_width;
    canvas.height = canvas_height;

    let context = canvas.getContext('2d');

    const time_limit = Math.floor(document.getElementById("time-limit").valueAsNumber);

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
    let is_humans_turn = false;
    let humans_move    = [null, null, null];
    let humans_possible_moves = [];
    let turn_color     = "Red";
    let is_canceled = false;

    function list_up_possible_moves(board, color) {
        humans_possible_moves = [];
        JSON.parse(board.possible_moves_as_json()).forEach(function(root) {
            if (root["color"] == color) {
                humans_possible_moves.push(root["stones"]);
            }
        });
    }

    function filter_possible_moves(index, next_move) {
        return humans_possible_moves.filter(move => {
            return move[index].x == next_move.x && move[index].y == next_move.y;
        });
    }

    let md = new MobileDetect(window.navigator.userAgent);
    if (md.mobile() || md.tablet()) {
        canvas.addEventListener('touchend', function(e) {
            if (is_humans_turn) {
                if (humans_move[0] == null) {
                    humans_move[0] = touchevent_to_xy(e);
                    humans_possible_moves = filter_possible_moves(0, humans_move[0]);
                    if (humans_possible_moves.length == 0) {
                        is_canceled = true;
                        return;
                    }
                    let pix = xy_to_pixel(humans_move[0]);
                    drawTemporaryStone(context, pix);
                } else if (humans_move[1] == null) {
                    humans_move[1] = touchevent_to_xy(e);
                    humans_possible_moves = filter_possible_moves(1, humans_move[1]);
                    if (humans_possible_moves.length == 0) {
                        is_canceled = true;
                        return;
                    }
                    let pix = xy_to_pixel(humans_move[1]);
                    drawTemporaryStone(context, pix);
                } else if (humans_move[2] == null) {
                    humans_move[2] = touchevent_to_xy(e);
                    humans_possible_moves = filter_possible_moves(2, humans_move[2]);
                    if (humans_possible_moves.length == 0) {
                        is_canceled = true;
                        return;
                    }
                    let pix = xy_to_pixel(humans_move[2]);
                    drawTemporaryStone(context, pix);
                }
            }
        });
    } else {
        canvas.addEventListener('mousemove', function(e) {
            if (!is_humans_turn || humans_move[0] == null || humans_move[2] != null) {
                return;
            }

            if (humans_move[1] == null) {
                let current_pos = mouseevent_to_xy(e);
                filtered = filter_possible_moves(1, current_pos);
                if (filtered.length == 0) {
                    return;
                }

                humans_move[1] = current_pos;
                humans_possible_moves = filtered;

                // draw temporary
                let pix = xy_to_pixel(humans_move[1]);
                drawTemporaryStone(context, pix);
            } else {
                // just show the last stone while chosing it.
                // It does not actually move a stone.
                let current_pos = mouseevent_to_xy(e);
                filtered = filter_possible_moves(2, current_pos);
                if (filtered.length == 0) {
                    return;
                }

                drawBoard(context, separo, player_R, player_B, turn_color + "'s turn");
                drawTemporaryStone(context, xy_to_pixel(humans_move[0]));
                drawTemporaryStone(context, xy_to_pixel(humans_move[1]));
                drawTemporaryStone(context, xy_to_pixel(current_pos));
            }
        });

        canvas.addEventListener('mousedown', function(e) {
            if (!is_humans_turn || humans_move[0] != null) {
                return;
            }

            let current_pos = mouseevent_to_xy(e);
            filtered = filter_possible_moves(0, current_pos);
            if (filtered.length == 0) {
                return;
            }

            humans_move[0] = current_pos;
            humans_possible_moves = filtered;
            let pix = xy_to_pixel(humans_move[0]);
            drawTemporaryStone(context, pix);
        });

        canvas.addEventListener('mouseup', function(e) {
            if (!is_humans_turn) {
                return;
            }

            if (humans_move[0] == null || humans_move[1] == null) {
                is_canceled = true;
                return;
            }

            let current_pos = mouseevent_to_xy(e);
            filtered = filter_possible_moves(2, current_pos);
            if (filtered.length == 0) {
                is_canceled = true;
                return;
            }

            humans_move[2] = current_pos;
            humans_possible_moves = filtered;
            let pix = xy_to_pixel(humans_move[2]);
            drawTemporaryStone(context, pix);
        })

        canvas.addEventListener('mouseleave', function(e) {
            if (!is_humans_turn) {
                return;
            }

            is_canceled = true;
        })
    }

    const human_player = function(color) {
        return async function(board) {
            if(!board.can_move(color)) {
                return board;
            }
            is_humans_turn = true;

            drawBoard(context, board, player_R, player_B, turn_color + "'s turn");
            list_up_possible_moves(board, color);
            while (true) {
                await sleep(200);

                if (is_canceled) {
                    humans_move = [null, null, null];
                    list_up_possible_moves(board, color);
                    drawBoard(context, board, player_R, player_B, turn_color + "'s turn");
                    is_canceled = false;
                    continue;
                }

                if (humans_move.includes(null)) {
                    continue;
                }

                if(board.apply_move_if_possible(
                    humans_move[0].x, humans_move[0].y,
                    humans_move[1].x, humans_move[1].y,
                    humans_move[2].x, humans_move[2].y, color)) {
                    break;
                }

                humans_move = [null, null, null];
                drawBoard(context, board, player_R, player_B, turn_color + "'s turn");
            }
            humans_move    = [null, null, null];
            is_humans_turn = false;
            return board;
        }
    };

    if(player_R == "Random") {
        playerR = module.RandomPlayer.new(RED, gen_seed(), gen_seed());
    } else if (player_R == "Naive MC") {
        playerR = module.NaiveMonteCarlo.new(RED, gen_seed(), gen_seed(), time_limit);
    } else if (player_R == "UCT MC") {
        playerR = module.UCTMonteCarlo.new(RED, gen_seed(), gen_seed(), time_limit, 1.4, 3, board_size);
    } else {
        playerR = {play: human_player(RED)};
    }
    if(player_B == "Random") {
        playerB = module.RandomPlayer.new(BLUE, gen_seed(), gen_seed());
    } else if (player_B == "Naive MC") {
        playerB = module.NaiveMonteCarlo.new(BLUE, gen_seed(), gen_seed(), time_limit);
    } else if (player_B == "UCT MC") {
        playerB = module.UCTMonteCarlo.new(BLUE, gen_seed(), gen_seed(), time_limit, 1.4, 3, board_size);
    } else {
        playerB = {play: human_player(BLUE)};
    }

    let gif_recorder = module.GameGifRecorder.new();
    gif_recorder.add_frame(canvas.toDataURL('image/png'));
    while(!separo.is_gameover()) {
        if(separo.can_move(RED)) {
            turn_color = "Red";
            separo = await playerR.play(separo);

            drawBoard(context, separo, player_R, player_B, "Blue's turn");
            gif_recorder.add_frame(canvas.toDataURL('image/png'));
        }
        await sleep(100);
        // -------------------------------------------------------------------
        if(separo.can_move(BLUE)) {
            turn_color = "Blue";
            separo = await playerB.play(separo);

            drawBoard(context, separo, player_R, player_B, "Red's turn");
            gif_recorder.add_frame(canvas.toDataURL('image/png'));
        }
        await sleep(100);
    }

    let last_score_red  = separo.score(RED);
    let last_score_blue = separo.score(BLUE);
    let result = "draw!";
    if (last_score_blue < last_score_red) {
        result = "Red wins!";
    } else if (last_score_red < last_score_blue) {
        result = "Blue wins!";
    }
    drawBoard(context, separo, player_R, player_B, result);

    gif_recorder.add_frame(canvas.toDataURL('image/png'));
    gif_base64 = "data:image/gif;base64," + gif_recorder.dump();

    is_running = false;
    return;
}

function drawBoard(context, board, red_name, blue_name, msg) {

    const board_state = JSON.parse(board.to_json());
    const red_score  = board.score(RED);
    const blue_score = board.score(BLUE);

    const stones = board_state["stones"];
    const roots  = board_state["roots"];

    // clear the board before redraw
    context.clearRect(0, 0, canvas_width, canvas_height);
    context.fillStyle=board_color;
    context.fillRect(0, 0, canvas_width, canvas_height);

    // show current score
    context.font      = "20px sans-serif"
    let metrics = context.measureText(" | ");
    context.fillStyle = stroke_colors[RED];
    context.textAlign = "right";
    context.fillText(`${red_name}: ${red_score}`,
                     (canvas_width - metrics.width)/ 2, 40.0);

    context.fillStyle = stroke_colors[BLUE];
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
            let stone1 = root["stones"][0];
            let stone2 = root["stones"][1];
            let stone3 = root["stones"][2];
            let color = root["color"];
            drawTemporaryRoot(context, stone1["x"], stone1["y"],
                                       stone2["x"], stone2["y"], color);
            drawTemporaryRoot(context, stone2["x"], stone2["y"],
                                       stone3["x"], stone3["y"], color);
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
