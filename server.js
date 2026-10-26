// Vang server: zero dependencies. Node 18+.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000,DIR=process.env.DATA_DIR||path.join(__dirname,'data'),PUB=__dirname;
fs.mkdirSync(DIR+'/up',{recursive:true});
const F=DIR+'/db.json';let D={users:{},sess:{},docs:{}};try{D=JSON.parse(fs.readFileSync(F))}catch(e){}
const clients=new Set();let bct;const bcast=()=>{clearTimeout(bct);bct=setTimeout(()=>{for(const r of clients){try{r.write('data: 1\n\n')}catch(e){clients.delete(r)}}},60)};
let st;const save=()=>{bcast();clearTimeout(st);st=setTimeout(()=>{fs.writeFileSync(F+'.tmp',JSON.stringify(D));fs.renameSync(F+'.tmp',F)},300)};
// collection -> field that holds the author's id (server forces it to the logged-in user)
const OWN={cfriends:'a',reads:'u',reports:'u',blocks:'a',posts:'uid',stories:'uid',comments:'u',likes:'u',saves:'u',follows:'a',messages:'a',views:'u',votes:'u',profiles:'uid'};
const rnd=n=>crypto.randomBytes(n).toString('hex'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const hashPw=(pw,salt=rnd(16))=>salt+':'+crypto.scryptSync(pw,salt,64).toString('hex');
const chkPw=(pw,h)=>{const[s,x]=h.split(':'),y=crypto.scryptSync(String(pw),s,64).toString('hex');return crypto.timingSafeEqual(Buffer.from(x),Buffer.from(y))};
const body=(req,max)=>new Promise((ok,no)=>{const b=[];let n=0;req.on('data',c=>{n+=c.length;if(n>max){no(new Error('too big'));req.destroy()}else b.push(c)});req.on('end',()=>ok(Buffer.concat(b)));req.on('error',no)});
const send=(res,code,obj,hd={})=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store',...hd});res.end(JSON.stringify(obj))};
const cookie=req=>Object.fromEntries((req.headers.cookie||'').split(/;\s*/).filter(Boolean).map(c=>c.split('=')));
const tok=req=>{const a=req.headers.authorization||'';return a.startsWith('Bearer ')?a.slice(7):cookie(req).vsid};
const auth=req=>{const t=tok(req);if(!t)return null;const s=D.sess[sha(t)];if(!s||s.exp<Date.now())return null;const u=D.users[s.uid];return u?{uid:s.uid,username:u.username}:null};
const tries={},limited=k=>{const n=Date.now(),a=(tries[k]||[]).filter(t=>n-t<6e5);tries[k]=a;return a.length>=10};
const sess=(req,uid)=>{const t=rnd(32);D.sess[sha(t)]={uid,exp:Date.now()+365*864e5};save();return{'Set-Cookie':`vsid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${365*86400}${req.headers['x-forwarded-proto']=='https'?'; Secure':''}`,'X-Vang-Token':t}};
const rcode=()=>{const r=rnd(5);return r.slice(0,5)+'-'+r.slice(5)};
const CLR={'Set-Cookie':'vsid=; HttpOnly; Path=/; Max-Age=0'};
const dropSess=uid=>{for(const k in D.sess)if(D.sess[k].uid==uid)delete D.sess[k]};
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.mp4':'video/mp4','.webm':'video/webm','.jpg':'image/jpeg','.gif':'image/gif','.webp':'image/webp'};
const json=async(req,max)=>{try{const j=JSON.parse((await body(req,max)).toString()||'{}');return j&&typeof j=='object'&&!Array.isArray(j)?j:{}}catch(e){return{}}};

const DAY=864e5;
function ctx(me){const Dd=D.docs,prof=Dd.profiles||{},fol=Object.values(Dd.follows||{}).map(x=>x.d),blk=Object.values(Dd.blocks||{}).map(x=>x.d);
 const priv=new Set(Object.entries(prof).filter(([,x])=>x.d.priv).map(([i])=>i)),appr=new Set(fol.filter(f=>f.a==me.uid&&f.st!='pending').map(f=>f.b)),bl=new Set(),bm=new Set();
 blk.forEach(b=>{if(b.a==me.uid)bl.add(b.b);if(b.b==me.uid){bl.add(b.a);bm.add(b.a)}});
 const cf=new Set(Object.values(Dd.cfriends||{}).map(x=>x.d).filter(x=>x.b==me.uid).map(x=>x.a)),posts=Dd.posts||{},stor=Dd.stories||{},cms=Dd.comments||{},msgs=Dd.messages||{};
 const okU=u=>u==me.uid||(!bl.has(u)&&(!priv.has(u)||appr.has(u)));
 const pOk=id=>{const p=posts[id];return !!p&&okU(p.d.uid)&&(!p.d.arch||p.d.uid==me.uid)};
 const sOk=id=>{const s=stor[id];if(!s)return false;const d=s.d;if(d.uid==me.uid)return true;if(!okU(d.uid))return false;if(!d.hl&&Date.now()-d.at>DAY)return false;if(d.aud=='cf'&&!cf.has(d.uid))return false;return true};
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
 else if(col=='votes')l=l.filter(x=>X.sOk(x.s));
 else if(col=='views')l=l.filter(x=>X.sOk(x.s)&&(x.u==me.uid||(X.stor[x.s]&&X.stor[x.s].d.uid==me.uid)));
 else if(col=='profiles'){const fr={},fg={},np={};X.fol.forEach(f=>{if(f.st!='pending'){fr[f.b]=(fr[f.b]||0)+1;fg[f.a]=(fg[f.a]||0)+1}});Object.values(X.posts).forEach(p=>{if(!p.d.arch)np[p.d.uid]=(np[p.d.uid]||0)+1});
  l=l.filter(x=>!X.bm.has(x.uid||x.id)).map(x=>{const u=x.uid||x.id,o={...x,fr:fr[u]||0,fg:fg[u]||0,np:np[u]||0};if(u!=me.uid&&!X.appr.has(u)){delete o.act;delete o.note;delete o.noteAt}return o})}
 return l.sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,600)};
http.createServer(async(req,res)=>{try{
const u=new URL(req.url,'http://x'),p=u.pathname,m=req.method;
res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
res.setHeader('Access-Control-Allow-Origin',process.env.ALLOW_ORIGIN||'*');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-Vang,Authorization');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');res.setHeader('Access-Control-Expose-Headers','X-Vang-Token');
if(m=='OPTIONS'){res.writeHead(204);return res.end()}
if(p.startsWith('/api/')){
 if(m!='GET'&&req.headers['x-vang']!='1')return send(res,403,{error:'bad request'});
 if(p=='/api/reset'&&m=='POST'){const b=await json(req,2000),un=String(b.username||'').trim().toLowerCase(),key='r'+req.socket.remoteAddress+un;
  if(limited(key))return send(res,429,{error:'too many tries, wait 10 minutes'});
  const e=Object.entries(D.users).find(([,x])=>x.username==un),n=String(b.password||''),c=String(b.code||'').trim().toLowerCase();
  if(!e||!e[1].rc||!chkPw(c,e[1].rc)){tries[key].push(Date.now());return send(res,401,{error:'wrong username or recovery code'})}
  if(n.length<8||n.length>100)return send(res,400,{error:'new password needs 8+ characters'});
  const rc=rcode();e[1].pw=hashPw(n);e[1].rc=hashPw(rc);dropSess(e[0]);return send(res,200,{ok:1,recovery:rc},sess(req,e[0]))}
 if(p=='/api/signup'||p=='/api/login'){
  if(m!='POST')return send(res,405,{});
  const b=await json(req,2000),un=String(b.username||'').trim().toLowerCase(),pw=String(b.password||''),key=req.socket.remoteAddress+un;
  if(limited(key))return send(res,429,{error:'too many tries, wait 10 minutes'});
  if(p=='/api/signup'){
   if(!/^[a-z0-9._]{3,20}$/.test(un))return send(res,400,{error:'username: 3-20 chars, a-z 0-9 . _'});
   if(pw.length<8||pw.length>100)return send(res,400,{error:'password needs 8+ characters'});
   if(Object.values(D.users).some(x=>x.username==un))return send(res,409,{error:'username taken'});
   const uid=rnd(8),rc=rcode();D.users[uid]={username:un,pw:hashPw(pw),rc:hashPw(rc),at:Date.now()};return send(res,200,{ok:1,recovery:rc},sess(req,uid));
  }
  const e=Object.entries(D.users).find(([,x])=>x.username==un);
  if(!e||!chkPw(pw,e[1].pw)){tries[key].push(Date.now());return send(res,401,{error:'wrong username or password'})}
  return send(res,200,{ok:1},sess(req,e[0]));
 }
 const me=auth(req);
 if(p=='/api/me')return send(res,200,me||{uid:null});
 if(!me)return send(res,401,{error:'login'});
 if(p=='/api/logout'){delete D.sess[sha(tok(req)||'')];save();return send(res,200,{ok:1},CLR)}
 if(p=='/api/password'){const b=await json(req,2000);
  if(!chkPw(b.old||'',D.users[me.uid].pw))return send(res,401,{error:'wrong current password'});
  const n=String(b.new||'');if(n.length<8||n.length>100)return send(res,400,{error:'new password needs 8+ characters'});
  D.users[me.uid].pw=hashPw(n);dropSess(me.uid);return send(res,200,{ok:1},sess(req,me.uid))}
 if(p=='/api/recovery'&&m=='POST'){const b=await json(req,2000);if(!chkPw(b.password||'',D.users[me.uid].pw))return send(res,401,{error:'wrong password'});const rc=rcode();D.users[me.uid].rc=hashPw(rc);save();return send(res,200,{recovery:rc})}
 if(p=='/api/account'&&m=='DELETE'){for(const c in D.docs)for(const i in D.docs[c])if(D.docs[c][i].o==me.uid)delete D.docs[c][i];dropSess(me.uid);delete D.users[me.uid];save();return send(res,200,{ok:1},CLR)}
 if(p=='/api/upload'&&m=='POST'){const b=await body(req,30e6),t=b.subarray(0,12);let x=null,vid=false;
  if(t[0]==0xff&&t[1]==0xd8)x='jpg';else if(t[0]==0x89&&t.subarray(1,4).toString()=='PNG')x='png';else if(t.subarray(0,3).toString()=='GIF')x='gif';else if(t.subarray(0,4).toString()=='RIFF'&&t.subarray(8,12).toString()=='WEBP')x='webp';
  else if(t.subarray(4,8).toString()=='ftyp'){x='mp4';vid=true}else if(t[0]==0x1a&&t[1]==0x45&&t[2]==0xdf&&t[3]==0xa3){x='webm';vid=true}
  if(!x)return send(res,400,{error:'use jpg, png, gif, webp, mp4 or webm'});if(!vid&&b.length>8e6)return send(res,400,{error:'photo too big (max 8MB)'});
  const id=rnd(16);fs.writeFileSync(`${DIR}/up/${id}.${x}`,b);return send(res,200,{id,k:vid?'v':'i'})}
 if(p=='/api/stream'&&m=='GET'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'});res.write(': ok\n\n');clients.add(res);const hb=setInterval(()=>{try{res.write(': hb\n\n')}catch(e){}},20000);req.on('close',()=>{clients.delete(res);clearInterval(hb)});return}
 if(p=='/api/sync'&&m=='GET'){const o={},X=ctx(me);for(const c in OWN)o[c]=listCol(c,me,X);return send(res,200,o)}
 const mm=p.match(/^\/api\/c\/(\w+)(?:\/([\w.-]{1,120}))?$/);if(!mm||!OWN[mm[1]])return send(res,404,{error:'not found'});
 const col=mm[1];let id=mm[2];const C=D.docs[col]=D.docs[col]||{};
 if(m=='GET'&&!id)return send(res,200,listCol(col,me));
 if(m=='DELETE'){if(!id||!C[id])return send(res,200,{ok:1});if(C[id].o!=me.uid&&!(col=='comments'&&(D.docs.posts||{})[C[id].d.p]?.o==me.uid)&&!(col=='follows'&&C[id].d.b==me.uid))return send(res,403,{error:'not yours'});delete C[id];save();return send(res,200,{ok:1})}
 if(['POST','PUT','PATCH'].includes(m)){
  if(m=='POST'&&id||m!='POST'&&!id)return send(res,400,{error:'bad path'});
  const d=await json(req,20000);delete d.id;d[OWN[col]]=me.uid;if(m=='POST')id=rnd(10);
  if(col=='follows'){const o0=C[id];if(m=='PATCH'&&o0&&o0.d.b==me.uid){o0.d.st='ok';save();return send(res,200,{id})}
   if(m=='PATCH')delete d.st;else{if(id!=me.uid+'_'+d.b)return send(res,403,{error:'bad id'});d.st=(D.docs.profiles||{})[d.b]?.d.priv?'pending':'ok'}}
  const ok={likes:id.endsWith('_'+me.uid),saves:id.endsWith('_'+me.uid),views:id.endsWith('_'+me.uid),votes:id.endsWith('_'+me.uid),follows:id.startsWith(me.uid+'_'),blocks:id.startsWith(me.uid+'_'),cfriends:id.startsWith(me.uid+'_'),reads:id.endsWith('_'+me.uid),profiles:id==me.uid}[col];
  if(ok===false)return send(res,403,{error:'bad id'});
  if(col=='messages'){const pp=String(d.pair).split('|');if(!pp.includes(me.uid))return send(res,403,{error:'bad chat'});const ot=pp.find(x=>x!=me.uid);if(Object.values(D.docs.blocks||{}).some(x=>(x.d.a==me.uid&&x.d.b==ot)||(x.d.a==ot&&x.d.b==me.uid)))return send(res,403,{error:'cannot message this user'})}
  {const X=ctx(me);
   if(col=='comments'){if(!X.pOk(d.p))return send(res,403,{error:'you cannot comment on this post'});const po=X.posts[d.p];if(po.d.nc&&po.d.uid!=me.uid)return send(res,403,{error:'comments are turned off'})}
   if(col=='likes'&&!(X.pOk(d.p)||X.cOk(d.p)||X.mOk(d.p)))return send(res,403,{error:'not allowed'});
   if(col=='saves'&&!X.pOk(d.p))return send(res,403,{error:'not allowed'});
   if((col=='views'||col=='votes')&&!X.sOk(d.s))return send(res,403,{error:'not allowed'});
   if(col=='follows'&&m!='PATCH'&&X.bl.has(d.b))return send(res,403,{error:'not allowed'});
   if(col=='stories'&&d.aud&&d.aud!='cf')delete d.aud}
  if(col=='profiles'){d.username=me.username;delete d.fr;delete d.fg;delete d.np}
  const old=C[id];if(old&&old.o!=me.uid)return send(res,403,{error:'not yours'});
  if(m=='PATCH'){if(!old)return send(res,404,{error:'missing'});C[id]={o:me.uid,d:{...old.d,...d}}}else C[id]={o:me.uid,d};
  save();return send(res,200,{id})}
 return send(res,405,{});
}
if(p.startsWith('/_blob/')){
 const id=p.slice(7);if(!/^[0-9a-f]{32}$/.test(id)){res.writeHead(404);return res.end()}
 for(const x of['jpg','png','gif','webp','mp4','webm']){const f=`${DIR}/up/${id}.${x}`;if(fs.existsSync(f)){const sz=fs.statSync(f).size,hd={'Content-Type':MIME['.'+x],'Accept-Ranges':'bytes','Cache-Control':'public, max-age=31536000, immutable'},rg=/bytes=(\d*)-(\d*)/.exec(req.headers.range||'');
  if(rg){let a0=rg[1]?+rg[1]:0,e0=rg[2]?+rg[2]:sz-1;if(!rg[1]&&rg[2]){a0=sz-(+rg[2]);e0=sz-1}e0=Math.min(e0,sz-1);if(a0>e0||a0>=sz){res.writeHead(416,{'Content-Range':'bytes */'+sz});return res.end()}res.writeHead(206,{...hd,'Content-Range':`bytes ${a0}-${e0}/${sz}`,'Content-Length':e0-a0+1});return fs.createReadStream(f,{start:a0,end:e0}).pipe(res)}
  res.writeHead(200,{...hd,'Content-Length':sz});return fs.createReadStream(f).pipe(res)}}
 res.writeHead(404);return res.end()}
const PUBLIC=['index.html','sw.js','manifest.webmanifest','icon-192.png','icon-512.png'],nm=p=='/'?'index.html':p.slice(1);
if(!PUBLIC.includes(nm)){res.writeHead(404);return res.end('not found')}
let f=path.join(PUB,nm);
res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':f.endsWith('sw.js')||f.endsWith('index.html')?'no-cache':'public, max-age=3600'});fs.createReadStream(f).pipe(res);
}catch(e){try{send(res,500,{error:'server error'})}catch(x){}}}).listen(PORT,()=>console.log('Vang running on :'+PORT));
