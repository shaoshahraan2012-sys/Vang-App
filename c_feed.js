'use strict';
/* c_feed.js - how a post looks: media/carousel, likes line, caption, comments link; plus scroll/video position keeping. */
/* ---------- media + posts ---------- */
const obs=new IntersectionObserver(es=>es.forEach(e=>{const v=e.target;if(e.isIntersecting&&e.intersectionRatio>.6){v.muted=S.muted;v.play().catch(()=>{})}else v.pause()}),{threshold:[0,.6]});
const vids=()=>document.querySelectorAll('video[data-v]').forEach(v=>obs.observe(v));
function mediaH(p,ctx=''){const L=mmOf(p);if(!L.length)return `<div class="sq" style="background:${G[p.g|0]}" data-dbl="${p.id}">${tx(p.t)}</div>`;
const flt=cssFilter(p.f,p.adj),ar=Math.min(1.91,Math.max(.8,p.ar||1));
const it=L.map((m,i)=>m.k=='v'?`<video data-v="${ctx}${p.id}-${i}" src="${BASE}/_blob/${m.i}" muted loop playsinline preload="metadata" data-a="mute"></video>`:`<img src="${BASE}/_blob/${m.i}" style="filter:${flt}" loading="lazy" alt="${esc(p.alt||'Photo by '+pr(p.uid).username)}">`).join('');
return `<div class="media" data-dbl="${p.id}"><div class="car" data-car style="aspect-ratio:${ar}">${it}</div>${L.length>1?`<div class="cnt">1/${L.length}</div><div class="dots">${L.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}${mchip(p,'p'+p.id)}</div>`}
const EXP={};
function postH(p,ctx=''){const u=pr(p.uid),L=likesOf(p.id),lk=L.some(x=>x.u==S.uid),sv=S.sav.some(x=>x.id==p.id+'_'+S.uid),C=cmOf(p.id),tg=(p.tg||[]).filter(x=>S.P[x]);
 const fl=L.find(x=>x.u!=S.uid&&fst(x.u)=='ok'),likeTxt=p.hl&&p.uid!=S.uid?'Liked by others':fl?`Liked by <b>${esc(pr(fl.u).username)}</b>${L.length>1?` and <b>${L.length-1} other${L.length>2?'s':''}</b>`:''}`:L.length+(L.length==1?' like':' likes'),
 cap=p.t&&mmOf(p).length?(p.t.length>110&&!EXP[p.id]?`${tx(p.t.slice(0,110))}… <span class="mu" data-a="more" data-x="${p.id}" style="cursor:pointer">more</span>`:tx(p.t)):'';
 return `<article class="post" data-pid="${ctx}${p.id}"><div class="ph">${avt(p.uid,32,1)}<div class="pn"><b data-a="user" data-x="${esc(p.uid)}">${esc(u.username)}</b>${p.loc?`<small>${esc(p.loc)}</small>`:''}${tg.length?`<small>with ${tg.map(x=>`<span data-a="user" data-x="${esc(x)}" style="font-weight:600;cursor:pointer">${esc(pr(x).username)}</span>`).join(', ')}</small>`:''}</div><button class="ic sp" data-a="pmenu" data-x="${p.id}">${I('more')}</button></div>${mediaH(p,ctx)}
<div class="acts"><button class="ic ${lk?'liked':''}" data-a="like" data-x="${p.id}">${I('heart')}</button>${p.nc?'':`<button class="ic" data-a="comments" data-x="${p.id}">${I('comment')}</button>`}<button class="ic" data-a="share" data-x="${p.id}">${I('send')}</button><button class="ic sp ${sv?'saved':''}" data-a="save" data-x="${p.id}">${I('save')}</button></div>
<div class="lk" data-a="likers" data-x="${p.id}">${likeTxt}</div>${cap?`<div class="cap"><b>${esc(u.username)}</b> ${cap}</div>`:''}
${!p.nc&&C.length?`<div class="vc" data-a="comments" data-x="${p.id}">View all ${C.length} comment${C.length>1?'s':''}</div>`:''}<div class="tm">${ago(p.at)}${p.e?' · edited':''}</div></article>`}
Object.assign(A,{more(id){EXP[id]=1;draw()}});
const vis=()=>S.posts.filter(p=>!blk(p.uid)&&!p.arch).sort((a,b)=>b.at-a.at);
function snap(){const m={sc:{},vt:{},mn:0};document.querySelectorAll('.car').forEach(c=>{const k=(c.closest('[data-pid]')||{}).dataset;if(k)m.sc[k.pid]=c.scrollLeft});document.querySelectorAll('video[data-v]').forEach(v=>m.vt[v.dataset.v]=v.currentTime);const mn=document.querySelector('main');m.mn=mn?mn.scrollTop:0;m.tab=S.tab;return m}
function unsnap(m){document.querySelectorAll('.car').forEach(c=>{const k=(c.closest('[data-pid]')||{}).dataset;if(k&&m.sc[k.pid])c.scrollLeft=m.sc[k.pid]});document.querySelectorAll('video[data-v]').forEach(v=>{const t=m.vt[v.dataset.v];if(t)v.currentTime=t});const mn=document.querySelector('main');if(mn&&m.tab==S.tab)mn.scrollTop=m.mn}
