
let wasm;

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
    if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory0;
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

let WASM_VECTOR_LEN = 0;

let cachedTextEncoder = new TextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length);
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len);

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3);
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function notDefined(what) { return () => { throw new Error(`${what} is not defined`); }; }
/**
*/
export const Color = Object.freeze({ Red:0,"0":"Red",Blue:1,"1":"Blue", });
/**
*/
export class Board {

    static __wrap(ptr) {
        const obj = Object.create(Board.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_board_free(ptr);
    }
    /**
    * @param {number} width
    * @returns {Board}
    */
    static new(width) {
        var ret = wasm.board_new(width);
        return Board.__wrap(ret);
    }
    /**
    * @param {number} x1
    * @param {number} y1
    * @param {number} x2
    * @param {number} y2
    * @param {number} x3
    * @param {number} y3
    * @param {number} color
    * @returns {boolean}
    */
    apply_move_if_possible(x1, y1, x2, y2, x3, y3, color) {
        var ret = wasm.board_apply_move_if_possible(this.ptr, x1, y1, x2, y2, x3, y3, color);
        return ret !== 0;
    }
    /**
    * @param {number} turn
    * @returns {boolean}
    */
    can_move(turn) {
        var ret = wasm.board_can_move(this.ptr, turn);
        return ret !== 0;
    }
    /**
    * @returns {boolean}
    */
    is_gameover() {
        var ret = wasm.board_is_gameover(this.ptr);
        return ret !== 0;
    }
    /**
    * @param {number} color
    * @returns {number}
    */
    score(color) {
        var ret = wasm.board_score(this.ptr, color);
        return ret;
    }
    /**
    * @returns {string}
    */
    to_json() {
        try {
            const retptr = wasm.__wbindgen_export_0.value - 16;
            wasm.__wbindgen_export_0.value = retptr;
            wasm.board_to_json(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_export_0.value += 16;
            wasm.__wbindgen_free(r0, r1);
        }
    }
    /**
    * @returns {string}
    */
    possible_moves_as_json() {
        try {
            const retptr = wasm.__wbindgen_export_0.value - 16;
            wasm.__wbindgen_export_0.value = retptr;
            wasm.board_possible_moves_as_json(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_export_0.value += 16;
            wasm.__wbindgen_free(r0, r1);
        }
    }
}
/**
*/
export class Coord {

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_coord_free(ptr);
    }
}
/**
*/
export class GameGifRecorder {

    static __wrap(ptr) {
        const obj = Object.create(GameGifRecorder.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_gamegifrecorder_free(ptr);
    }
    /**
    * @returns {GameGifRecorder}
    */
    static new() {
        var ret = wasm.gamegifrecorder_new();
        return GameGifRecorder.__wrap(ret);
    }
    /**
    * @param {string} img
    */
    add_frame(img) {
        var ptr0 = passStringToWasm0(img, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.gamegifrecorder_add_frame(this.ptr, ptr0, len0);
    }
    /**
    * @returns {string}
    */
    dump() {
        try {
            const retptr = wasm.__wbindgen_export_0.value - 16;
            wasm.__wbindgen_export_0.value = retptr;
            wasm.gamegifrecorder_dump(retptr, this.ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_export_0.value += 16;
            wasm.__wbindgen_free(r0, r1);
        }
    }
}
/**
*/
export class Move {

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_move_free(ptr);
    }
}
/**
*/
export class NaiveMonteCarlo {

    static __wrap(ptr) {
        const obj = Object.create(NaiveMonteCarlo.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_naivemontecarlo_free(ptr);
    }
    /**
    * @returns {number}
    */
    get color() {
        var ret = wasm.__wbg_get_naivemontecarlo_color(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set color(arg0) {
        wasm.__wbg_set_naivemontecarlo_color(this.ptr, arg0);
    }
    /**
    * @param {number} color
    * @param {number} seed0
    * @param {number} seed1
    * @param {number} timelimit
    * @returns {NaiveMonteCarlo}
    */
    static new(color, seed0, seed1, timelimit) {
        var ret = wasm.naivemontecarlo_new(color, seed0, seed1, timelimit);
        return NaiveMonteCarlo.__wrap(ret);
    }
    /**
    * @param {Board} board
    * @returns {Board}
    */
    play(board) {
        _assertClass(board, Board);
        var ptr0 = board.ptr;
        board.ptr = 0;
        var ret = wasm.naivemontecarlo_play(this.ptr, ptr0);
        return Board.__wrap(ret);
    }
}
/**
*/
export class RandomPlayer {

    static __wrap(ptr) {
        const obj = Object.create(RandomPlayer.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_randomplayer_free(ptr);
    }
    /**
    * @returns {number}
    */
    get color() {
        var ret = wasm.__wbg_get_randomplayer_color(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set color(arg0) {
        wasm.__wbg_set_randomplayer_color(this.ptr, arg0);
    }
    /**
    * @param {number} color
    * @param {number} seed0
    * @param {number} seed1
    * @returns {RandomPlayer}
    */
    static new(color, seed0, seed1) {
        var ret = wasm.randomplayer_new(color, seed0, seed1);
        return RandomPlayer.__wrap(ret);
    }
    /**
    * @param {Board} board
    * @returns {Board}
    */
    play(board) {
        _assertClass(board, Board);
        var ptr0 = board.ptr;
        board.ptr = 0;
        var ret = wasm.randomplayer_play(this.ptr, ptr0);
        return Board.__wrap(ret);
    }
}
/**
*/
export class UCTMonteCarlo {

    static __wrap(ptr) {
        const obj = Object.create(UCTMonteCarlo.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_uctmontecarlo_free(ptr);
    }
    /**
    * @returns {number}
    */
    get color() {
        var ret = wasm.__wbg_get_uctmontecarlo_color(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set color(arg0) {
        wasm.__wbg_set_uctmontecarlo_color(this.ptr, arg0);
    }
    /**
    * @param {number} color
    * @param {number} seed0
    * @param {number} seed1
    * @param {number} timelimit
    * @param {number} ucb1_coeff
    * @param {number} expand_threshold
    * @param {number} board_width
    * @returns {UCTMonteCarlo}
    */
    static new(color, seed0, seed1, timelimit, ucb1_coeff, expand_threshold, board_width) {
        var ret = wasm.uctmontecarlo_new(color, seed0, seed1, timelimit, ucb1_coeff, expand_threshold, board_width);
        return UCTMonteCarlo.__wrap(ret);
    }
    /**
    * @param {Board} board
    * @returns {Board}
    */
    play(board) {
        _assertClass(board, Board);
        var ptr0 = board.ptr;
        board.ptr = 0;
        var ret = wasm.uctmontecarlo_play(this.ptr, ptr0);
        return Board.__wrap(ret);
    }
}

async function load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {

        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

async function init(input) {
    if (typeof input === 'undefined') {
        input = import.meta.url.replace(/\.js$/, '_bg.wasm');
    }
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_now_183f7bc3060d798d = typeof Date.now == 'function' ? Date.now : notDefined('Date.now');
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        var ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_log_3bafd82835c6de6d = function(arg0) {
        console.log(getObject(arg0));
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    const { instance, module } = await load(await input, imports);

    wasm = instance.exports;
    init.__wbindgen_wasm_module = module;

    return wasm;
}

export default init;

