(window.webpackJsonp=window.webpackJsonp||[]).push([[1],[,function(t,r,n){"use strict";n.r(r);var e=n(2);n.d(r,"Color",(function(){return e.b})),n.d(r,"Board",(function(){return e.a})),n.d(r,"Coord",(function(){return e.c})),n.d(r,"Move",(function(){return e.d})),n.d(r,"NaiveMonteCarlo",(function(){return e.e})),n.d(r,"RandomPlayer",(function(){return e.f})),n.d(r,"UCTMonteCarlo",(function(){return e.g})),n.d(r,"__wbg_now_183f7bc3060d798d",(function(){return e.i})),n.d(r,"__wbindgen_string_new",(function(){return e.k})),n.d(r,"__wbg_log_61ea781bd002cc41",(function(){return e.h})),n.d(r,"__wbindgen_object_drop_ref",(function(){return e.j})),n.d(r,"__wbindgen_throw",(function(){return e.l}))},function(t,r,n){"use strict";(function(t){n.d(r,"b",(function(){return h})),n.d(r,"a",(function(){return b})),n.d(r,"c",(function(){return v})),n.d(r,"d",(function(){return y})),n.d(r,"e",(function(){return g})),n.d(r,"f",(function(){return j})),n.d(r,"g",(function(){return m})),n.d(r,"i",(function(){return O})),n.d(r,"k",(function(){return k})),n.d(r,"h",(function(){return A})),n.d(r,"j",(function(){return B})),n.d(r,"l",(function(){return C}));var e=n(3);let o=new("undefined"==typeof TextDecoder?(0,t.require)("util").TextDecoder:TextDecoder)("utf-8",{ignoreBOM:!0,fatal:!0});o.decode();let u=null;function c(t,r){return o.decode((null!==u&&u.buffer===e.v.buffer||(u=new Uint8Array(e.v.buffer)),u).subarray(t,t+r))}const i=new Array(32).fill(void 0);i.push(void 0,null,!0,!1);let s=i.length;function a(t){return i[t]}function f(t){const r=a(t);return function(t){t<36||(i[t]=s,s=t)}(t),r}let p=null;function l(){return null!==p&&p.buffer===e.v.buffer||(p=new Int32Array(e.v.buffer)),p}const d=new Uint32Array(2),_=new BigUint64Array(d.buffer);function w(t,r){if(!(t instanceof r))throw new Error("expected instance of "+r.name);return t.ptr}const h=Object.freeze({Red:0,0:"Red",Blue:1,1:"Blue"});class b{static __wrap(t){const r=Object.create(b.prototype);return r.ptr=t,r}free(){const t=this.ptr;this.ptr=0,e.a(t)}static new(t){var r=e.r(t);return b.__wrap(r)}apply_move_if_possible(t,r,n,o,u,c,i){return 0!==e.o(this.ptr,t,r,n,o,u,c,i)}can_move(t){return 0!==e.p(this.ptr,t)}is_gameover(){return 0!==e.q(this.ptr)}score(t){return e.t(this.ptr,t)}to_json(){try{const n=e.m.value-16;e.m.value=n,e.u(n,this.ptr);var t=l()[n/4+0],r=l()[n/4+1];return c(t,r)}finally{e.m.value+=16,e.n(t,r)}}possible_moves_as_json(){try{const n=e.m.value-16;e.m.value=n,e.s(n,this.ptr);var t=l()[n/4+0],r=l()[n/4+1];return c(t,r)}finally{e.m.value+=16,e.n(t,r)}}}class v{free(){const t=this.ptr;this.ptr=0,e.b(t)}}class y{free(){const t=this.ptr;this.ptr=0,e.f(t)}}class g{static __wrap(t){const r=Object.create(g.prototype);return r.ptr=t,r}free(){const t=this.ptr;this.ptr=0,e.g(t)}get color(){return e.c(this.ptr)>>>0}set color(t){e.i(this.ptr,t)}static new(t,r,n){_[0]=r;const o=d[0],u=d[1];_[0]=n;const c=d[0],i=d[1];var s=e.w(t,o,u,c,i);return g.__wrap(s)}play(t){w(t,b);var r=t.ptr;t.ptr=0;var n=e.x(this.ptr,r);return b.__wrap(n)}}class j{static __wrap(t){const r=Object.create(j.prototype);return r.ptr=t,r}free(){const t=this.ptr;this.ptr=0,e.h(t)}get color(){return e.d(this.ptr)>>>0}set color(t){e.j(this.ptr,t)}static new(t,r){_[0]=r;const n=d[0],o=d[1];var u=e.y(t,n,o);return j.__wrap(u)}play(t){w(t,b);var r=t.ptr;t.ptr=0;var n=e.z(this.ptr,r);return b.__wrap(n)}}class m{static __wrap(t){const r=Object.create(m.prototype);return r.ptr=t,r}free(){const t=this.ptr;this.ptr=0,e.l(t)}get color(){return e.e(this.ptr)>>>0}set color(t){e.k(this.ptr,t)}static new(t,r,n,o,u,c){_[0]=r;const i=d[0],s=d[1];_[0]=n;const a=d[0],f=d[1];var p=e.A(t,i,s,a,f,o,u,c);return m.__wrap(p)}play(t){w(t,b);var r=t.ptr;t.ptr=0;var n=e.B(this.ptr,r);return b.__wrap(n)}}const O="function"==typeof Date.now?Date.now:(x="Date.now",()=>{throw new Error(x+" is not defined")});var x;const k=function(t,r){return function(t){s===i.length&&i.push(i.length+1);const r=s;return s=i[r],i[r]=t,r}(c(t,r))},A=function(t){console.log(a(t))},B=function(t){f(t)},C=function(t,r){throw new Error(c(t,r))}}).call(this,n(4)(t))},function(t,r,n){"use strict";var e=n.w[t.i];t.exports=e;n(2);e.C()},function(t,r){t.exports=function(t){if(!t.webpackPolyfill){var r=Object.create(t);r.children||(r.children=[]),Object.defineProperty(r,"loaded",{enumerable:!0,get:function(){return r.l}}),Object.defineProperty(r,"id",{enumerable:!0,get:function(){return r.i}}),Object.defineProperty(r,"exports",{enumerable:!0}),r.webpackPolyfill=1}return r}}]]);