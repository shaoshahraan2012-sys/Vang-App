// s_privacy.js - decides what each person is allowed to see. Everything the app shows passes through here.
const {D}=require('./s_store'),{DAY}=require('./s_config');
function ctx(me){const Dd=D.docs,prof=Dd.profiles||{},fol=Object.values(Dd.follows||{}).map(x=>x.d),blk=Object.values(Dd.blocks||{}).map(x=>x.d);
 const priv=new Set(Object.entries(prof).filter(([,x])=>x.d.priv).map(([i])=>i)),appr=new Set(fol.filter(f=>f.a==me.uid&&f.st!='pending').map(f=>f.b)),bl=new Set(),bm=new Set();
 blk.forEach(b=>{if(b.a==me.uid)bl.add(b.b);if(b.b==me.uid){bl.add(b.a);bm.add(b.a)}});
 const cf=new Set(Object.values(Dd.cfriends||{}).map(x=>x.d).filter(x=>x.b==me.uid).map(x=>x.a)),posts=Dd.posts||{},stor=Dd.stories||{},cms=Dd.comments||{},msgs=Dd.messages||{};
 const okU=u=>u==me.uid||(!bl.has(u)&&(!priv.has(u)||appr.has(u)));                       // may I see this person's content?
 const pOk=id=>{const p=posts[id];return !!p&&okU(p.d.uid)&&(!p.d.arch||p.d.uid==me.uid)};  // post visible?
 const sOk=id=>{const s=stor[id];if(!s)return false;const d=s.d;if(d.uid==me.uid)return true;if(!okU(d.uid))return false;if(!d.hl&&Date.now()-d.at>DAY)return false;if(d.aud=='cf'&&!cf.has(d.uid))return false;return true}; // story visible? (24h, close friends)
 const cOk=id=>{const c=cms[id];return !!c&&pOk(c.d.p)&&!bl.has(c.d.u)};
 const mOk=id=>{const m=msgs[id];return !!m&&String(m.d.pair).split('|').includes(me.uid)};
 return{priv,appr,bl,bm,cf,okU,pOk,sOk,cOk,mOk,posts,stor,fol,prof}}
const listCol=(col,me,X0)=>{const X=X0||ctx(me);let l=Object.entries(D.docs[col]||{}).map(([i,x])=>({id:i,...x.d}));
 if(col=='messages')l=l.filter(x=>String(x.pair).split('|').includes(me.uid)&&!String(x.pair).split('|').some(u=>u!=me.uid&&X.bl.has(u)));
 else if(col=='saves'||col=='reports')l=l.filter(x=>x.u==me.uid);
 else if(col=='blocks'||col=='cfriends')l=l.filter(x=>x.a==me.uid);
 else if(col=='reads')l=l.filter(x=>String(x.k).split('|').includes(me.uid));
 else if(col=='follows')l=l.filter(x=>{if(x.a==me.uid||x.b==me.uid)return true;if(x.st=='pending')return false;return X.okU(x.a)&&X.okU(x.b)});
 else if(col=='posts')l=l.filter(x=>X.pOk(x.id));
 else if(col=='stories')l=l.filter(x=>X.sOk(x.id));
 else if(col=='comments')l=l.filter(x=>X.cOk(x.id));
 else if(col=='likes'){const hid=new Set(Object.entries(X.posts).filter(([,p])=>p.d.hl&&p.d.uid!=me.uid).map(([i])=>i));l=l.filter(x=>(X.pOk(x.p)||X.cOk(x.p)||X.mOk(x.p))&&!X.bl.has(x.u)&&!(hid.has(x.p)&&x.u!=me.uid))}
 else if(col=='votes')l=l.filter(x=>X.sOk(x.s)&&(!x.a||x.u==me.uid||(X.stor[x.s]&&X.stor[x.s].d.uid==me.uid)));   // typed answers: only the story owner and the answerer
 else if(col=='views')l=l.filter(x=>X.sOk(x.s)&&(x.u==me.uid||(X.stor[x.s]&&X.stor[x.s].d.uid==me.uid)));
 else if(col=='profiles'){const fr={},fg={},np={};X.fol.forEach(f=>{if(f.st!='pending'){fr[f.b]=(fr[f.b]||0)+1;fg[f.a]=(fg[f.a]||0)+1}});Object.values(X.posts).forEach(p=>{if(!p.d.arch)np[p.d.uid]=(np[p.d.uid]||0)+1});
  l=l.filter(x=>!X.bm.has(x.uid||x.id)).map(x=>{const u=x.uid||x.id,o={...x,fr:fr[u]||0,fg:fg[u]||0,np:np[u]||0};if(u!=me.uid&&!X.appr.has(u)){delete o.act;delete o.note;delete o.noteAt}return o})}
 return l.sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,600)};
module.exports={ctx,listCol};
