'use strict';
/* c_ui.js - bottom sheets, full-screen pages, the overlay stack, clipboard. */
/* ---------- overlays ---------- */
const OV=[];
function sheet(html){const el=document.createElement('div');el.className='bk';el.innerHTML=`<div class="sh">${html}</div>`;el.onclick=e=>{if(e.target==el)closeSheet(el)};O.appendChild(el);return el}
function closeSheet(el){if(el.onClose)el.onClose();el.remove()}
function full(o){const el=document.createElement('div');el.className='page';el.innerHTML=`<div class="ph2">${o.back===false?'':`<button class="ic" data-a="back">${I('back')}</button>`}<div class="tt">${o.head?o.head():esc(o.title||'')}</div>${o.right||''}</div><div class="bd2"></div>${o.foot?`<div class="ft">${o.foot}</div>`:''}`;
el.o=o;el.r=force=>{if(o.static&&el.done&&!force)return;el.done=1;const b=el.querySelector('.bd2'),near=b.scrollHeight-b.scrollTop-b.clientHeight<80,f=fi();b.innerHTML=o.body(el);if(o.stick&&near)b.scrollTop=b.scrollHeight;rf(f);vids()};O.appendChild(el);OV.push(el);el.r();if(o.stick)el.querySelector('.bd2').scrollTop=1e9;return el}
function closeOv(el){el=el||OV[OV.length-1];if(!el)return;if(el.o.onclose)el.o.onclose(el);el.remove();OV.splice(OV.indexOf(el),1)}
const closeAll=()=>{while(OV.length)closeOv();[...O.querySelectorAll('.bk,.sv')].forEach(e=>{if(e.onClose)e.onClose();if(e.dispose)e.dispose();e.remove()});stopSong()};
const topOv=()=>OV[OV.length-1];
function copy(t,m){try{navigator.clipboard.writeText(t);toast(m||'Copied')}catch(e){prompt('Copy this:',t)}}
