'use strict';
/* c_main.js - builds each tab (V_), draws the whole screen, keeps scroll/video/focus when data refreshes. */
V_.home=()=>{const f=S.feed=='fol'?new Set([S.uid,...S.fol.filter(x=>x.a==S.uid&&x.st!='pending').map(x=>x.b)]):null,l=vis().filter(p=>!f||f.has(p.uid));
return `${storyRail()}<div class="ftabs"><button class="${S.feed=='for'?'on':''}" data-a="feed" data-x="for">For you</button><button class="${S.feed=='fol'?'on':''}" data-a="feed" data-x="fol">Following</button></div>${homeFeed(l)||'<div class="c"><div class="logo big">Vang</div><p class="mu" style="margin:10px 0 16px">Welcome! Follow people or share your first photo.</p><button class="btn" data-a="create" data-x="post">Create post</button></div>'}`};
V_.prof=()=>profH(S.sub||S.uid);
/* feed with "Suggested for you" after the 3rd post and an "all caught up" footer */
function homeFeed(l){if(!l.length)return '';const sug=S.prof.map(p=>p.uid||p.id).filter(u=>u!=S.uid&&!blk(u)&&!fst(u)).slice(0,8),card=u=>`<div class="sgc"><div style="display:grid;place-items:center">${avt(u,64)}</div><b data-a="user" data-x="${esc(u)}">${esc(pr(u).username)}</b><small class="mu">${esc(pr(u).name||'Suggested for you')}</small><button class="btn" data-a="follow" data-x="${esc(u)}">Follow</button></div>`;
 const sugH=sug.length?`<div class="sug"><div class="row"><b>Suggested for you</b></div><div class="sgs">${sug.map(card).join('')}</div></div>`:'';
 return l.map((p,i)=>postH(p)+(i==2?sugH:'')).join('')+(l.length<3?sugH:'')+`<div class="c mu" style="padding:24px"><div style="font-size:28px">✓</div>You're all caught up</div>`}
let obsOn=0;
function draw(){cancelAnimationFrame(rq);rq=requestAnimationFrame(_draw)}
function _draw(){if(!S.ready)return;if(!S.me){V.innerHTML='';if(!S.onb){S.onb=1;editProfile(true)}return}
const m=snap(),f=fi(),t=S.tab,own=(S.sub||S.uid)==S.uid,un=pr(S.sub||S.uid).username;let head='';
const nn=actItems().filter(x=>x.at>S.aseen).length+S.fol.filter(x=>x.b==S.uid&&x.st=='pending').length,dm=msgUnread();
if(t=='home')head=`<header class="top"><div class="logo">Vang</div><div class="hr"><button class="ic" data-a="activity" style="position:relative">${I('heart')}${nn?`<i class="bdge">${nn>9?'9+':nn}</i>`:''}</button><button class="ic" data-a="inbox" style="position:relative">${I('send')}${dm?'<i class="dot"></i>':''}</button></div></header>`;
else if(t=='prof')head=`<header class="top"><div class="un">${S.sub&&!own?`<button class="ic" data-a="tab" data-x="home" style="margin-left:-8px">${I('back')}</button>`:''}${pr(S.sub||S.uid).priv?I('lock','style="width:16px;height:16px"'):''}${esc(un)}</div><div class="hr">${own?`<button class="ic" data-a="create">${I('add')}</button><button class="ic" data-a="settings">${I('menu')}</button>`:`<button class="ic" data-a="pmore" data-x="${esc(S.sub)}">${I('more')}</button>`}</div></header>`;
else if(t=='reels')head='';
V.innerHTML=`${head}<main>${V_[t]()}</main><nav class="bn">${[['home','home'],['search','explore'],['add','create'],['reels','reels']].map(([ic,tb])=>`<button class="${t==tb||(tb=='explore'&&t=='explore')?'on':''}" data-a="${tb=='create'?'create':'tab'}" data-x="${tb}">${I(ic)}</button>`).join('')}<button class="${t=='prof'&&own?'on':''}" data-a="me">${avt(S.uid,26)}</button></nav>`;
unsnap(m);rf(f);vids();playUI();OV.forEach(e=>e.r&&e.r())}
