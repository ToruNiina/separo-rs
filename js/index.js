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

const board_color = "rgb(255,255,255)";
const grid_color  = "rgb(0,0,0)";

const red_color  = 0;
const blue_color = 1;
const fill_colors   = ['rgba(255,128,128,0.95)', 'rgba(128,128,255,0.95)'];
const stroke_colors = ['rgb(255,0,0)', 'rgb(0,0,255)'];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    let module = await import('../pkg/index.js');
    let separo = module.make_board(9);
    let playerR = module.make_random_player(0, 12345n);
    let playerB = module.make_random_player(1, 67890n);
    let canvas = document.getElementById("separo-board");

    canvas.width  = canvas_width;
    canvas.height = canvas_height;

    var context = canvas.getContext('2d');

    drawBoard(context, JSON.parse(separo.to_json()));

    var halt = false; // for debugging
    canvas.addEventListener('click', function(e) {
        halt = !halt;
    })

    while(!separo.is_gameover()) {
        if(halt) {
            await sleep(1000);
            continue;
        }

        console.log("Next is RED's turn")
        separo = playerR.play(separo);

        drawBoard(context, JSON.parse(separo.to_json()));
        await sleep(1000);

        console.log("Next is BLUE's turn")
        separo = playerB.play(separo);

        drawBoard(context, JSON.parse(separo.to_json()));
        await sleep(1000);
    }
}

function drawBoard(context, board) {

    const stones = board["stones"];
    const roots  = board["roots"];
    // clear the board before redraw
    context.clearRect(0, 0, canvas_width, canvas_height);
    context.fillStyle=board_color;
    context.fillRect(0, 0, canvas_width, canvas_height);

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

function drawTemporary(context, x0, y0, x1, y1, color_idx) {
    context.beginPath();

    context.strokeStyle = "rgb(0,0,0)"
    context.lineWidth   = 2;
    context.setLineDash([4, 4]);

    // draw root
    context.lineCap = 'round';
    context.moveTo(x0 * grid_width + board_margin, y0 * grid_width + board_margin + canvas_header);
    context.lineTo(x1 * grid_width + board_margin, y1 * grid_width + board_margin + canvas_header);
    context.stroke();

    // draw stone
    context.arc(x1 * grid_width + board_margin, y1 * grid_width + board_margin + canvas_header,
                stone_radius, 0, 2 * Math.PI, false);
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

run()
