'use strict';
/* c_actions.js - what each tap does: tabs, like, save, follow/unfollow, open post, share, create... */
Object.assign(A,{
tab(x){closeAll();if(x!='explore'||S.tab!='explore')S.q='';S.tab=x;S.sub=null;draw();const m=document.querySelector('main');if(m)m.scrollTop=0},
me(){closeAll();S.tab='prof';S.sub=null;S.pt='grid';draw()},
user(u){if(S.tab=='explore'&&S.q.trim())hpush('u',u);closeAll();S.tab='prof';S.sub=u==S.uid?null:u;S.pt='grid';draw()},
uname(n){const p=S.prof.find(x=>x.username==n);if(p)A.user(p.uid||p.id);else toast('No such user')},
tag(t){tagPage(t)},place(x){closeAll();full({title:'📍 '+x,body:()=>grid(vis().filter(p=>(p.loc||'').trim()==x))})},sq_enter(v){hpush('q',v.trim())},hopen(i){const x=hist()[i];if(!x)return;if(x.t=='u')A.user(x.v);else{S.q=x.v;draw()}},hdel(i){const l=hist();l.splice(+i,1);LSs('vsh',JSON.stringify(l));draw()},hclr(){LSs('vsh','[]');draw()},feed(x){S.feed=x;draw()},qt(x){S.qt=x;draw()},pt(x){S.pt=x;draw()},in_sq(v){S.q=v;draw()},
back(){const e=topOv();if(e&&e.stepBack&&e.stepBack())return;closeOv()},mute(_,el){S.muted=!S.muted;document.querySelectorAll('video').forEach(v=>{if(!v.closest('.sv'))v.muted=S.muted});document.querySelectorAll('.rmute').forEach(b=>b.textContent=S.muted?'🔇':'🔊');toast(S.muted?'Muted':'Sound on')},rplay(_,el){if(el.paused)el.play().catch(()=>{});else el.pause()},rretry(_,el){const v=el.parentNode.querySelector('video');el.style.display='none';v.load();v.play().catch(()=>{})},

like(id){const k=id+'_'+S.uid;if(busy.has(k))return;busy.add(k);const had=S.likes.some(x=>x.id==k);if(had)S.likes=S.likes.filter(x=>x.id!=k);else S.likes.push({id:k,p:id,u:S.uid,at:now()});draw();act(async()=>{try{if(had)await del('likes',k);else await put('likes',k,{p:id,u:S.uid,at:now()})}catch(e){sync();throw e}finally{busy.delete(k)}})},
dbl(id,el,e){const k=id+'_'+S.uid,r=el.getBoundingClientRect(),b=document.createElement('div');b.className='burst';b.innerHTML=I('heart');b.style.left=(e.clientX-r.left)+'px';b.style.top=(e.clientY-r.top)+'px';if(getComputedStyle(el).position=='static')el.style.position='relative';el.appendChild(b);setTimeout(()=>b.remove(),800);if(!S.likes.some(x=>x.id==k)&&!busy.has(k)){busy.add(k);S.likes.push({id:k,p:id,u:S.uid,at:now()});draw();act(()=>put('likes',k,{p:id,u:S.uid,at:now()}).finally(()=>busy.delete(k)))}},
save(id){const k=id+'_'+S.uid,had=S.sav.some(x=>x.id==k);if(had)S.sav=S.sav.filter(x=>x.id!=k);else{S.sav.push({id:k,p:id,u:S.uid});toast('Saved')}draw();act(async()=>{try{if(had)await del('saves',k);else await put('saves',k,{p:id,u:S.uid})}catch(e){sync();throw e}})},
follow(u){const f=S.fol.find(x=>x.id==S.uid+'_'+u);if(f){const pend=f.st=='pending',e=sheet(`<div class="c"><div style="margin-bottom:12px;display:grid;place-items:center">${avt(u,64)}</div><b>${pend?'Cancel follow request?':'Unfollow @'+esc(pr(u).username)+'?'}</b>${pr(u).priv&&!pend?'<p class="mu" style="margin:8px 0">This account is private. You would need to send a new request to follow again.</p>':''}<div style="display:flex;gap:8px;margin-top:14px"><button class="btn g wide" id="no">Cancel</button><button class="btn wide" style="background:var(--red)" id="yes">${pend?'Remove request':'Unfollow'}</button></div></div>`);e.querySelector('#no').onclick=()=>e.remove();e.querySelector('#yes').onclick=()=>act(async()=>{await del('follows',f.id);e.remove()})}else act(async()=>{await put('follows',S.uid+'_'+u,{a:S.uid,b:u,at:now()});if(pr(u).priv)toast('Follow request sent')})},
rmfol(u){act(async()=>{await del('follows',u+'_'+S.uid);toast('Follower removed')})},
dm(u){openChat(ck([u]))},
opost(id){const el=full({title:'Posts',body:()=>{const p=S.posts.find(x=>x.id==id);return p?postH(p,'o'):'<div class="c mu">This post is no longer available</div>'}});},
share(id){sharePost(id)},
comments(id){commentsOv(id)},
likers(id){const p=S.posts.find(x=>x.id==id);if(p&&p.hl&&p.uid!=S.uid)return;userList('Likes',()=>likesOf(id).map(x=>x.u))},
flist(x){const[u,w]=x.split('|');if(pr(u).priv&&u!=S.uid&&fst(u)!='ok')return toast('This account is private');userList(w=='0'?'Followers':'Following',()=>S.fol.filter(f=>(w=='0'?f.b:f.a)==u&&f.st!='pending').map(f=>w=='0'?f.a:f.b),w=='0'&&u==S.uid?x=>person(x,`<button class="btn g" data-a="rmfol" data-x="${esc(x)}">Remove</button>`):null)},
pmenu(id){postMenu(id)},pmore(u){userMenu(u)},
create(x){O.querySelectorAll('.bk').forEach(e=>e.remove());if(x=='story')createStory();else if(x=='post')createPost();else sheet(`<div class="item" data-a="create" data-x="post">${I('add')}<b>Post</b></div><div class="item" data-a="create" data-x="story">${I('plus')}<b>Story</b></div><div class="item" data-a="camp">${I('photo')}<b>Take a photo or video</b></div>`)},camp(){O.querySelectorAll('.bk').forEach(e=>e.remove());createPost('cam')},
story(u){closeAll();const rail=[...new Set(S.stories.filter(s=>now()-s.at<864e5&&!blk(s.uid)).map(s=>s.uid))].filter(x=>x!=S.uid);const q=(stOf(S.uid).length?[S.uid]:[]).concat(rail);const i=q.indexOf(u);const qq=i<0?[u]:q.slice(i);openStories(qq.map(x=>stOf(x)).filter(l=>l.length))},
activity(){activityOv()},inbox(){inboxOv()},settings(){settingsOv()},editp(){editProfile(false)},
shareprof(){copy(location.origin+'/#u='+pr(S.uid).username,'Profile link copied')},
});
