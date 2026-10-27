'use strict';
/* c_notifs.js - notifications: real events grouped (likes, comments, follows, mentions, tags), Today/This week sections, unread highlight, preferences. */
/* ---------- activity / unread ---------- */
function actItems(){const np=S.np,mine=new Set(S.posts.filter(p=>p.uid==S.uid).map(p=>p.id)),cm=new Set(S.cm.filter(c=>c.u==S.uid).map(c=>c.id)),a=[],mn='@'+(S.me?S.me.username:'~'),lg={};
S.likes.forEach(l=>{if(l.u==S.uid)return;if(mine.has(l.p))(lg[l.p]=lg[l.p]||[]).push(l);else if(cm.has(l.p))a.push({ty:'like',at:l.at,us:[l.u],t:'liked your comment'})});
Object.entries(lg).forEach(([p,ls])=>{ls.sort((x,y)=>y.at-x.at);a.push({ty:'like',at:ls[0].at,us:[...new Set(ls.map(x=>x.u))],t:'liked your post',p})});
S.cm.forEach(c=>{if(c.u==S.uid)return;if(mine.has(c.p))a.push({ty:'cm',at:c.at,us:[c.u],t:'commented: '+c.t,p:c.p});else if((c.t||'').toLowerCase().includes(mn))a.push({ty:'men',at:c.at,us:[c.u],t:'mentioned you: '+c.t,p:c.p})});
S.fol.forEach(f=>{if(f.b==S.uid&&f.st!='pending')a.push({ty:'fol',at:f.at,us:[f.a],t:'started following you',f:1})});
S.posts.forEach(p=>{if(p.uid!=S.uid&&((p.t||'').toLowerCase().includes(mn)||(p.tg||[]).includes(S.uid)))a.push({ty:'men',at:p.at,us:[p.uid],t:'mentioned you in a post',p:p.id})});
return a.filter(x=>x.us.some(u=>!blk(u))&&np[x.ty]!==false).sort((x,y)=>y.at-x.at).slice(0,60)}
/* ---------- activity ---------- */
let ls='';const nsec=x=>{const d=now()-x.at;return d<864e5?'Today':d<6048e5?'This week':'Earlier'};
function activityOv(){const prev=S.aseen;S.aseen=now();LSs('vas',S.aseen);draw();full({title:'Notifications',right:`<button class="ic" data-a="nprefs">${I('menu')}</button>`,body:()=>{const req=S.fol.filter(f=>f.b==S.uid&&f.st=='pending'),items=actItems();
return (req.length?`<div style="border-bottom:1px solid var(--bd)"><div class="row"><b>Follow requests</b></div>${req.map(f=>person(f.a,`<button class="btn" data-a="accept" data-x="${f.id}">Confirm</button><button class="btn g" data-a="decline" data-x="${f.id}">Delete</button>`)).join('')}</div>`:'')+
(((ls=''),items).map(x=>{const sc=nsec(x),hd=sc!=ls?(ls=sc,`<div class="row"><b>${sc}</b></div>`):'';const p=x.p&&S.posts.find(q=>q.id==x.p),fl=x.f&&!fst(x.us[0]),who=`<b>${esc(pr(x.us[0]).username)}</b>${x.us.length>1?` and ${x.us.length-1} other${x.us.length>2?'s':''}`:''}`,tgt=(x.ty=='cm'||x.ty=='men')&&x.p?'comments':x.p?'opost':'user';
return `${hd}<div class="row r ${x.at>prev?'unr':''}" data-a="${tgt}" data-x="${x.p||esc(x.us[0])}">${avt(x.us[0],44)}<div class="t" style="white-space:normal">${who} ${tx(x.t)} <span class="mu">${ago(x.at)}</span></div>${p&&mmOf(p)[0]&&mmOf(p)[0].k!='v'?`<img src="${BASE}/_blob/${mmOf(p)[0].i}" width="44" height="44" style="object-fit:cover;border-radius:4px">`:''}${fl?`<button class="btn" data-a="follow" data-x="${esc(x.us[0])}">Follow back</button>`:''}</div>`}).join('')||(req.length?'':'<div class="c"><b>No notifications</b><p class="mu">Likes, comments, mentions and new followers will show up here.</p></div>'))}})}
Object.assign(A,{accept(id){act(()=>upd('follows',id,{st:'ok'}))},decline(id){act(()=>del('follows',id))}});
