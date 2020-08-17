const canvas_header = 100;
const canvas_width  = 540;
const canvas_height = 640;
const board_size   =   9;
const board_margin =  30;
const board_width  = 480;
const grid_width   = board_width / (board_size - 1);
const stone_radius =  grid_width * 0.3;
const stone_stroke =   2;
const root_stroke  =   5;
const time_limit   =   1n;

const board_color = "rgb(255,255,255)";
const grid_color  = "rgb(0,0,0)";

const red_color  = 0;
const blue_color = 1;
const fill_colors   = ['rgba(255,128,128,0.95)', 'rgba(128,128,255,0.95)'];
const stroke_colors = ['rgb(255,0,0)', 'rgb(0,0,255)'];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// since wasm compilation should happen asynchronous, the function should be async.
async function run() {
    let module = await import('../pkg/index.js');
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

    drawBoard(context, JSON.parse(separo.to_json()),
              separo.score(0), separo.score(1));

    if(player_R == "NotSelected" || player_B == "NotSelected") {
        return;
    }

    let playerR = module.NaiveMonteCarlo.new(0, 12345n, time_limit);
    let playerB = module.NaiveMonteCarlo.new(1, 67890n, time_limit);

    while(!separo.is_gameover()) {
        console.log("Next is RED's turn")
        separo = playerR.play(separo);

        drawBoard(context, JSON.parse(separo.to_json()),
                  separo.score(0), separo.score(1));
        await sleep(1000);

        console.log("Next is BLUE's turn")
        separo = playerB.play(separo);

        drawBoard(context, JSON.parse(separo.to_json()),
                  separo.score(0), separo.score(1));
        await sleep(1000);
    }
}

function drawBoard(context, board, red_score, blue_score) {

    const stones = board["stones"];
    const roots  = board["roots"];
    // clear the board before redraw
    context.clearRect(0, 0, canvas_width, canvas_height);
    context.fillStyle=board_color;
    context.fillRect(0, 0, canvas_width, canvas_height);

    // show current score
    context.fillStyle = "rgb(0,0,0)"
    context.font      = "20px sans-serif"
    context.textAlign = "center"
    context.fillText(`Red: ${red_score} | Blue: ${blue_score}`,
                     canvas_width / 2, 40.0);

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

document.getElementById("start-button").onclick = run;
run();
