!function(e){function n(n){for(var t,r,l=n[0],i=n[1],a=0,u=[];a<l.length;a++)r=l[a],Object.prototype.hasOwnProperty.call(o,r)&&o[r]&&u.push(o[r][0]),o[r]=0;for(t in i)Object.prototype.hasOwnProperty.call(i,t)&&(e[t]=i[t]);for(c&&c(n);u.length;)u.shift()()}var t={},o={0:0};var r={};var l={3:function(){return{"./index_bg.js":{__wbg_now_183f7bc3060d798d:function(){return t[2].exports.i()},__wbindgen_string_new:function(e,n){return t[2].exports.k(e,n)},__wbg_log_61ea781bd002cc41:function(e){return t[2].exports.h(e)},__wbindgen_object_drop_ref:function(e){return t[2].exports.j(e)},__wbindgen_throw:function(e,n){return t[2].exports.l(e,n)}}}}};function i(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,i),o.l=!0,o.exports}i.e=function(e){var n=[],t=o[e];if(0!==t)if(t)n.push(t[2]);else{var a=new Promise((function(n,r){t=o[e]=[n,r]}));n.push(t[2]=a);var u,s=document.createElement("script");s.charset="utf-8",s.timeout=120,i.nc&&s.setAttribute("nonce",i.nc),s.src=function(e){return i.p+""+({}[e]||e)+".js"}(e);var c=new Error;u=function(n){s.onerror=s.onload=null,clearTimeout(f);var t=o[e];if(0!==t){if(t){var r=n&&("load"===n.type?"missing":n.type),l=n&&n.target&&n.target.src;c.message="Loading chunk "+e+" failed.\n("+r+": "+l+")",c.name="ChunkLoadError",c.type=r,c.request=l,t[1](c)}o[e]=void 0}};var f=setTimeout((function(){u({type:"timeout",target:s})}),12e4);s.onerror=s.onload=u,document.head.appendChild(s)}return({1:[3]}[e]||[]).forEach((function(e){var t=r[e];if(t)n.push(t);else{var o,a=l[e](),u=fetch(i.p+""+{3:"8af9a22345da96c6c8e6"}[e]+".module.wasm");if(a instanceof Promise&&"function"==typeof WebAssembly.compileStreaming)o=Promise.all([WebAssembly.compileStreaming(u),a]).then((function(e){return WebAssembly.instantiate(e[0],e[1])}));else if("function"==typeof WebAssembly.instantiateStreaming)o=WebAssembly.instantiateStreaming(u,a);else{o=u.then((function(e){return e.arrayBuffer()})).then((function(e){return WebAssembly.instantiate(e,a)}))}n.push(r[e]=o.then((function(n){return i.w[e]=(n.instance||n).exports})))}})),Promise.all(n)},i.m=e,i.c=t,i.d=function(e,n,t){i.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:t})},i.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},i.t=function(e,n){if(1&n&&(e=i(e)),8&n)return e;if(4&n&&"object"==typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(i.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var o in e)i.d(t,o,function(n){return e[n]}.bind(null,o));return t},i.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return i.d(n,"a",n),n},i.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},i.p="",i.oe=function(e){throw console.error(e),e},i.w={};var a=window.webpackJsonp=window.webpackJsonp||[],u=a.push.bind(a);a.push=n,a=a.slice();for(var s=0;s<a.length;s++)n(a[s]);var c=u;i(i.s=0)}([function(e,n,t){const o=1n,r=["rgba(255,128,128,0.95)","rgba(128,128,255,0.95)"],l=["rgb(255,0,0)","rgb(0,0,255)"],i=document.getElementById("guide");var a=i.checked;function u(e){return new Promise(n=>setTimeout(n,e))}function s(e){return{x:Math.floor((e.offsetX+30-30)/60),y:Math.floor((e.offsetY+30-30-100)/60)}}function c(e){return{x:60*e.x+30,y:60*e.y+30+100}}let f=!1;async function d(){if(f)return;f=!0;let e=await t.e(1).then(t.bind(null,1)),n=e.Board.new(9),r=document.getElementById("separo-board");r.width=540,r.height=640;var l=r.getContext("2d");const d=document.getElementById("red player"),m=document.getElementById("blue player"),g=d.options[d.selectedIndex].value,b=m.options[m.selectedIndex].value;if(console.log("player red  = ",g),console.log("player blue = ",b),p(l,n,g,b,'Select players and Click "Start"'),i.addEventListener("input",(function(e){a=i.checked,p(l,n,g,b,a?"guide turned on":"guide turned off")})),"NotSelected"==g||"NotSelected"==b)return void(f=!1);let h,v,w=function(){return BigInt(Math.floor(1e7*Math.random()))};var x=!1,_=[null,null,null],S="Red";r.addEventListener("mousemove",(function(e){if(x)if(null!=_[0]&&null==_[1]&&null==_[2]){let n=s(e);if(1==Math.abs(n.x-_[0].x)&&1==Math.abs(n.y-_[0].y)){_[1]=n,console.log("mouse move detected: ",_[1]);var t=c(_[1]);y(l,t)}}else if(null!=_[0]&&null!=_[1]&&null==_[2]){let t=s(e);p(l,n,g,b,S+"'s turn"),y(l,c(_[0])),y(l,c(_[1])),y(l,c(t))}}));const P=function(e){return async function(n){if(console.log("human.play() function started"),!n.can_move(e))return console.log("You cannot move. return."),n;for(x=!0;;){p(l,n,g,b,S+"'s turn"),console.log("waiting human..."),r.addEventListener("mousedown",(function(e){_[0]=s(e),console.log("mouse down detected: ",_[0]);var n=c(_[0]);y(l,n)}),{once:!0});var t=!1;for(r.addEventListener("mouseup",(function(e){null!=_[0]&&null!=_[1]&&(_[2]=s(e),console.log("mouse up detected: ",_[2])),t=!0}),{once:!0});!t;)await u(200);if(_.includes(null))_=[null,null,null];else{if(n.apply_move_if_possible(_[0].x,_[0].y,_[1].x,_[1].y,_[2].x,_[2].y,e))break;_=[null,null,null]}}return console.log("done."),_=[null,null,null],x=!1,n}};for(h="Random"==g?e.RandomPlayer.new(0,w()):"Naive MC"==g?e.NaiveMonteCarlo.new(0,w(),o):"UCT MC"==g?e.UCTMonteCarlo.new(0,w(),o,1.4,3,9):{play:P(0)},v="Random"==b?e.RandomPlayer.new(1,w()):"Naive MC"==b?e.NaiveMonteCarlo.new(1,w(),o):"UCT MC"==b?e.UCTMonteCarlo.new(1,w(),o,1.4,3,9):{play:P(1)};!n.is_gameover();)S="Red",n=await h.play(n),p(l,n,g,b,"Blue's turn"),await u(100),S="Blue",n=await v.play(n),p(l,n,g,b,"Red's turn"),await u(100);var T=n.score(0),k=n.score(1),M="draw!";k<T?M="Red wins!":T<k&&(M="Blue wins!"),p(l,n,g,b,M),f=!1}function p(e,n,t,o,i){const u=JSON.parse(n.to_json()),s=n.score(0),c=n.score(1),f=u.stones,d=u.roots;e.clearRect(0,0,540,640),e.fillStyle="rgb(255,255,255)",e.fillRect(0,0,540,640),e.font="20px sans-serif";var p=e.measureText(" | ");e.fillStyle=l[0],e.textAlign="right",e.fillText(`${t}: ${s}`,(540-p.width)/2,40),e.fillStyle=l[1],e.textAlign="left",e.fillText(`${o}: ${c}`,(540+p.width)/2,40),e.fillStyle="rgb(0,0,0)",e.textAlign="center",e.fillText("|",270,40),e.fillText(i,270,70),e.strokeStyle="rgb(0,0,0)",e.lineWidth=2,e.beginPath();for(let n=0;n<9;n++)e.moveTo(30+60*n,130),e.lineTo(30+60*n,610);for(let n=0;n<9;n++)e.moveTo(30,130+60*n),e.lineTo(510,130+60*n);e.stroke(),f.forEach((function(n){!function(e,n,t,o){e.beginPath(),e.lineWidth=2,e.fillStyle=r[o],e.strokeStyle=l[o],e.arc(60*n+30,60*t+30+100,18,0,2*Math.PI,!1),e.fill(),e.stroke()}(e,n.x,n.y,n.color)})),d.forEach((function(n){!function(e,n,t,o,i,a){e.beginPath(),e.lineWidth=5,e.lineCap="round",e.fillStyle=r[a],e.strokeStyle=l[a],e.moveTo(60*n+30,60*t+30+100),e.lineTo(60*o+30,60*i+30+100),e.stroke()}(e,n.x1,n.y1,n.x2,n.y2,n.color)})),a&&JSON.parse(n.possible_moves_as_json()).forEach((function(n){!function(e,n,t,o,r,l){e.beginPath(),e.strokeStyle=0==l?"rgba(255,0,0,0.9)":"rgba(0,0,255,0.9)",e.lineWidth=5,e.setLineDash([10]),e.lineCap="round",e.beginPath(),e.moveTo(60*n+30,60*t+30+100),e.lineTo(60*o+30,60*r+30+100),e.stroke(),e.setLineDash([])}(e,n.x1,n.y1,n.x2,n.y2,n.color)}))}function y(e,n){e.beginPath(),e.strokeStyle="rgb(0,0,0)",e.lineWidth=2,e.setLineDash([4,4]),e.arc(n.x,n.y,18,0,2*Math.PI,!1),e.stroke(),e.setLineDash([])}document.getElementById("start-button").onclick=d,d()}]);