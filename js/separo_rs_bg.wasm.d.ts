/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export function __wbg_coord_free(a: number): void;
export function __wbg_board_free(a: number): void;
export function board_new(a: number): number;
export function board_apply_move_if_possible(a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number): number;
export function board_can_move(a: number, b: number): number;
export function board_is_gameover(a: number): number;
export function board_score(a: number, b: number): number;
export function board_to_json(a: number, b: number): void;
export function board_possible_moves_as_json(a: number, b: number): void;
export function __wbg_get_randomplayer_color(a: number): number;
export function __wbg_set_randomplayer_color(a: number, b: number): void;
export function randomplayer_new(a: number, b: number, c: number): number;
export function randomplayer_play(a: number, b: number): number;
export function __wbg_naivemontecarlo_free(a: number): void;
export function __wbg_get_naivemontecarlo_color(a: number): number;
export function __wbg_set_naivemontecarlo_color(a: number, b: number): void;
export function naivemontecarlo_new(a: number, b: number, c: number, d: number): number;
export function naivemontecarlo_play(a: number, b: number): number;
export function __wbg_uctmontecarlo_free(a: number): void;
export function __wbg_get_uctmontecarlo_color(a: number): number;
export function __wbg_set_uctmontecarlo_color(a: number, b: number): void;
export function uctmontecarlo_new(a: number, b: number, c: number, d: number, e: number, f: number, g: number): number;
export function uctmontecarlo_play(a: number, b: number): number;
export function __wbg_move_free(a: number): void;
export function __wbg_randomplayer_free(a: number): void;
export function __wbindgen_free(a: number, b: number): void;
