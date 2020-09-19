/* tslint:disable */
/* eslint-disable */
/**
*/
export enum Color {
  Red,
  Blue,
}
/**
*/
export class Board {
  free(): void;
/**
* @param {number} width
* @returns {Board}
*/
  static new(width: number): Board;
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
  apply_move_if_possible(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: number): boolean;
/**
* @param {number} turn
* @returns {boolean}
*/
  can_move(turn: number): boolean;
/**
* @returns {boolean}
*/
  is_gameover(): boolean;
/**
* @param {number} color
* @returns {number}
*/
  score(color: number): number;
/**
* @returns {string}
*/
  to_json(): string;
/**
* @returns {string}
*/
  possible_moves_as_json(): string;
}
/**
*/
export class Coord {
  free(): void;
}
/**
*/
export class GameGifRecorder {
  free(): void;
/**
* @returns {GameGifRecorder}
*/
  static new(): GameGifRecorder;
/**
* @param {string} img
*/
  add_frame(img: string): void;
/**
* @returns {string}
*/
  dump(): string;
}
/**
*/
export class Move {
  free(): void;
}
/**
*/
export class NaiveMonteCarlo {
  free(): void;
/**
* @param {number} color
* @param {number} seed0
* @param {number} seed1
* @param {number} timelimit
* @returns {NaiveMonteCarlo}
*/
  static new(color: number, seed0: number, seed1: number, timelimit: number): NaiveMonteCarlo;
/**
* @param {Board} board
* @returns {Board}
*/
  play(board: Board): Board;
/**
* @returns {number}
*/
  color: number;
}
/**
*/
export class RandomPlayer {
  free(): void;
/**
* @param {number} color
* @param {number} seed0
* @param {number} seed1
* @returns {RandomPlayer}
*/
  static new(color: number, seed0: number, seed1: number): RandomPlayer;
/**
* @param {Board} board
* @returns {Board}
*/
  play(board: Board): Board;
/**
* @returns {number}
*/
  color: number;
}
/**
*/
export class UCTMonteCarlo {
  free(): void;
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
  static new(color: number, seed0: number, seed1: number, timelimit: number, ucb1_coeff: number, expand_threshold: number, board_width: number): UCTMonteCarlo;
/**
* @param {Board} board
* @returns {Board}
*/
  play(board: Board): Board;
/**
* @returns {number}
*/
  color: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_coord_free: (a: number) => void;
  readonly __wbg_board_free: (a: number) => void;
  readonly board_new: (a: number) => number;
  readonly board_apply_move_if_possible: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
  readonly board_can_move: (a: number, b: number) => number;
  readonly board_is_gameover: (a: number) => number;
  readonly board_score: (a: number, b: number) => number;
  readonly board_to_json: (a: number, b: number) => void;
  readonly board_possible_moves_as_json: (a: number, b: number) => void;
  readonly __wbg_get_randomplayer_color: (a: number) => number;
  readonly __wbg_set_randomplayer_color: (a: number, b: number) => void;
  readonly randomplayer_new: (a: number, b: number, c: number) => number;
  readonly randomplayer_play: (a: number, b: number) => number;
  readonly __wbg_naivemontecarlo_free: (a: number) => void;
  readonly __wbg_get_naivemontecarlo_color: (a: number) => number;
  readonly __wbg_set_naivemontecarlo_color: (a: number, b: number) => void;
  readonly naivemontecarlo_new: (a: number, b: number, c: number, d: number) => number;
  readonly naivemontecarlo_play: (a: number, b: number) => number;
  readonly __wbg_uctmontecarlo_free: (a: number) => void;
  readonly __wbg_get_uctmontecarlo_color: (a: number) => number;
  readonly __wbg_set_uctmontecarlo_color: (a: number, b: number) => void;
  readonly uctmontecarlo_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
  readonly uctmontecarlo_play: (a: number, b: number) => number;
  readonly __wbg_gamegifrecorder_free: (a: number) => void;
  readonly gamegifrecorder_new: () => number;
  readonly gamegifrecorder_add_frame: (a: number, b: number, c: number) => void;
  readonly gamegifrecorder_dump: (a: number, b: number) => void;
  readonly __wbg_move_free: (a: number) => void;
  readonly __wbg_randomplayer_free: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number) => void;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
        