'use strict';
/* c_core.js - shared state (S), data sync, API helpers, small utilities, and the click/keyboard dispatcher (A = actions). */
const BASE='';
const TK=()=>{try{return localStorage.getItem('vt')||''}catch(e){return ''}};
const LSg=(k,d)=>{try{const v=localStorage.getItem(k);return v===null?d:v}catch(e){return d}},LSs=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
if(LSg('vth',''))document.documentElement.dataset.t=LSg('vth','');
const V=document.getElementById('v'),O=document.getElementById('o');
const I=(n,x='')=>`<svg class="i" ${x}><use href="#${n}"/></svg>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const now=()=>Date.now(),imgOk=i=>/^[0-9a-f]{32}$/.test(i||''),okAud=u=>/^https:\/\/[\w.-]+\.mzstatic\.com\//.test(u||'')||/^up:[0-9a-f]{32}$/.test(u||'')||/^syn:[a-z0-9]+$/.test(u||'');
const audSrc=u=>u.startsWith('up:')?BASE+'/_blob/'+u.slice(3):BASE+'/api/audio?u='+encodeURIComponent(u);
const ago=t=>{const s=(now()-t)/1e3;return s<60?'now':s<3600?(s/60|0)+'m':s<86400?(s/3600|0)+'h':s<604800?(s/86400|0)+'d':(s/604800|0)+'w'};
const G=['linear-gradient(135deg,#ff2bd6,#8a5cff)','linear-gradient(135deg,#00c6ff,#8a5cff)','linear-gradient(135deg,#b6ff3b,#00c6a2)','linear-gradient(135deg,#ff6a00,#d62976)','linear-gradient(135deg,#1a0033,#d62976)'];
const FL=[['Normal','none'],['Clarendon','contrast(1.2) saturate(1.35)'],['Gingham','brightness(1.05) hue-rotate(-10deg)'],['Moon','grayscale(1) contrast(1.1) brightness(1.1)'],['Lark','contrast(.9) saturate(1.2) brightness(1.1)'],['Reyes','sepia(.22) brightness(1.1) contrast(.85) saturate(.75)'],['Juno','sepia(.35) contrast(1.15) brightness(1.15) saturate(1.8)'],['Slumber','saturate(.66) brightness(1.05)'],['Crema','sepia(.5) contrast(.9) saturate(.9)'],['Ludwig','sepia(.25) contrast(1.05) brightness(.95) saturate(1.5)']];
const H=()=>({'Content-Type':'application/json','X-Vang':'1',...(TK()?{Authorization:'Bearer '+TK()}:{})});
const api=async(m,u,b)=>{const r=await fetch(BASE+u,{method:m,headers:H(),body:b?JSON.stringify(b):undefined});const tk=r.headers.get('x-vang-token');if(tk)LSs('vt',tk);const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error||'error'),{code:r.status});return j};
const COL={profiles:'prof',posts:'posts',likes:'likes',comments:'cm',follows:'fol',saves:'sav',stories:'stories',messages:'msgs',views:'views',votes:'votes',blocks:'blocks',reads:'reads',reports:'reports',cfriends:'cfr'};
const S={np:(()=>{try{return JSON.parse(LSg('vnp','{}'))}catch(e){return{}}})(),vol:+LSg('vvol','0.8'),tab:'home',feed:'for',sub:null,pt:'grid',q:'',qt:'acc',seen:{},muted:true,play:null,ready:0,P:{},me:null,uid:null,ghost:LSg('vgh','')=='1',aseen:+LSg('vas','0')};
for(const k in COL)S[COL[k]]=[];
let ME={uid:null},last='',rq=0;
async function sync(){if(document.hidden&&S.ready)return;try{const r=await api('GET','/api/sync'),s=JSON.stringify(r);if(s==last)return;last=s;for(const c in COL)S[COL[c]]=r[c]||[];S.P={};S.prof.forEach(p=>S.P[p.uid||p.id]=p);S.me=S.P[S.uid]||null;draw()}catch(e){if(e.code==401){LSs('vt','');location.reload()}}}
const wr=(m,c,id,d)=>api(m,`/api/c/${c}${id?'/'+id:''}`,d).then(r=>{sync();return r}),put=(c,id,d)=>wr('PUT',c,id,d),upd=(c,id,d)=>wr('PATCH',c,id,d),del=(c,id)=>wr('DELETE',c,id),add=(c,d)=>wr('POST',c,'',d);
const act=async(f,m)=>{try{return await f()}catch(e){toast(e.message&&e.message!='error'?e.message:(m||'something went wrong'))}};
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;O.appendChild(d);setTimeout(()=>d.remove(),2400)}
const pr=u=>S.P[u]||{username:'deleted',name:''},blk=u=>S.blocks.some(b=>(b.a==S.uid&&b.b==u)||(b.b==S.uid&&b.a==u));
const fst=u=>{const f=S.fol.find(x=>x.a==S.uid&&x.b==u);return f?(f.st=='pending'?'pending':'ok'):null};
const likesOf=id=>S.likes.filter(x=>x.p==id),cmOf=id=>S.cm.filter(x=>x.p==id);
const stOf=u=>S.stories.filter(s=>s.uid==u&&now()-s.at<864e5&&!blk(u)).sort((a,b)=>a.at-b.at),hlOf=u=>S.stories.filter(s=>s.uid==u&&s.hl).sort((a,b)=>a.at-b.at);
const mmOf=p=>p.mm&&p.mm.length?p.mm:(p.img?[{i:p.img,k:'i'}]:[]);
const cnt=(n)=>n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'K':n;
const tx=s=>esc(s).replace(/#(\w+)/g,(m,t)=>`<span class="tag" data-a="tag" data-x="${t.toLowerCase()}">${m}</span>`).replace(/@([a-z0-9._]{3,20})/gi,(m,n)=>`<span class="tag men" data-a="uname" data-x="${n.toLowerCase()}">${m}</span>`);
function avt(u,sz=32,ring=0,extra=''){const p=pr(u),inner=imgOk(p.pic)?`<img src="${BASE}/_blob/${p.pic}" alt="">`:`<span>${esc((p.name||p.username||'?')[0].toUpperCase())}</span>`,l=ring?stOf(u):[],un=l.some(s=>!S.seen[s.id]);
return `<div class="avw ${l.length?'ring'+(un?'':' seen')+(un&&l.some(s=>s.aud=='cf')?' cf':''):''}" style="--s:${sz}px" data-a="${l.length?'story':'user'}" data-x="${esc(u)}"><div class="av">${inner}</div>${extra}</div>`}
const fi=()=>{const a=document.activeElement;return a&&a.id&&(a.tagName=='INPUT'||a.tagName=='TEXTAREA')?{id:a.id,v:a.value,s:a.selectionStart}:null},rf=f=>{if(!f)return;const e=document.getElementById(f.id);if(e){e.value=f.v;e.focus();try{e.setSelectionRange(f.s,f.s)}catch(x){}}};
/* ---------- actions ---------- */
const A={};
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(t&&A[t.dataset.a])A[t.dataset.a](t.dataset.x,t,e)});
const busy=new Set();let lt=0,lel=null,rdl=0;document.addEventListener('click',e=>{const t=e.target.closest('[data-dbl]');if(!t)return;const n=now();if(n-lt<350&&lel===t){lt=0;if(!e.target.closest('[data-a=music]'))A.dbl(t.dataset.dbl,t,e)}else{lt=n;lel=t}});
document.addEventListener('input',e=>{const t=e.target.dataset&&e.target.dataset.in;if(t&&A['in_'+t])A['in_'+t](e.target.value,e.target)});
document.addEventListener('keydown',e=>{const t=e.target.dataset&&e.target.dataset.enter;if(t&&e.key=='Enter'&&A[t]){e.preventDefault();A[t](e.target.value,e.target)}});
document.addEventListener('timeupdate',e=>{const v=e.target;if(v.dataset&&v.dataset.reel!==undefined&&v.duration){const i=v.parentNode.querySelector('.rprog i');if(i)i.style.width=(v.currentTime/v.duration*100)+'%'}},true);document.addEventListener('playing',e=>{const v=e.target;if(v.dataset&&v.dataset.reel!==undefined){const r=v.parentNode.querySelector('.rerr');if(r)r.style.display='none'}},true);document.addEventListener('error',e=>{const v=e.target;if(v.tagName=='VIDEO'&&v.dataset.reel!==undefined){const r=v.parentNode.querySelector('.rerr');if(r)r.style.display='grid'}},true);
document.addEventListener('scroll',e=>{const c=e.target;if(c.dataset&&c.dataset.car!==undefined&&c.clientWidth){const i=Math.round(c.scrollLeft/c.clientWidth),p=c.parentNode;p.querySelectorAll('.dots i').forEach((d,k)=>d.classList.toggle('on',k==i));const n=p.querySelector('.cnt');if(n)n.textContent=(i+1)+'/'+c.children.length}},true);

const V_={};   // tab views: each module adds its own (V_.home, V_.explore, V_.reels, V_.prof)
