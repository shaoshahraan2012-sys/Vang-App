// Vang server: zero dependencies. Node 18+.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=process.env.PORT||3000,DIR=process.env.DATA_DIR||path.join(__dirname,'data'),PUB=__dirname;
fs.mkdirSync(DIR+'/up',{recursive:true});
const F=DIR+'/db.json';let D={users:{},sess:{},docs:{}};try{D=JSON.parse(fs.readFileSync(F))}catch(e){}
let st;const save=()=>{clearTimeout(st);st=setTimeout(()=>{fs.writeFileSync(F+'.tmp',JSON.stringify(D));fs.renameSync(F+'.tmp',F)},300)};
// collection -> field that holds the author's id (server forces it to the logged-in user)
const OWN={blocks:'a',posts:'uid',stories:'uid',comments:'u',likes:'u',saves:'u',follows:'a',messages:'a',views:'u',votes:'u',profiles:'uid'};
const rnd=n=>crypto.randomBytes(n).toString('hex'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const hashPw=(pw,salt=rnd(16))=>salt+':'+crypto.scryptSync(pw,salt,64).toString('hex');
const chkPw=(pw,h)=>{const[s,x]=h.split(':'),y=crypto.scryptSync(String(pw),s,64).toString('hex');return crypto.timingSafeEqual(Buffer.from(x),Buffer.from(y))};
const body=(req,max)=>new Promise((ok,no)=>{const b=[];let n=0;req.on('data',c=>{n+=c.length;if(n>max){no(new Error('too big'));req.destroy()}else b.push(c)});req.on('end',()=>ok(Buffer.concat(b)));req.on('error',no)});
const send=(res,code,obj,hd={})=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store',...hd});res.end(JSON.stringify(obj))};
const cookie=req=>Object.fromEntries((req.headers.cookie||'').split(/;\s*/).filter(Boolean).map(c=>c.split('=')));
const auth=req=>{const t=cookie(req).vsid;if(!t)return null;const s=D.sess[sha(t)];if(!s||s.exp<Date.now())return null;const u=D.users[s.uid];return u?{uid:s.uid,username:u.username}:null};
const tries={},limited=k=>{const n=Date.now(),a=(tries[k]||[]).filter(t=>n-t<6e5);tries[k]=a;return a.length>=10};
const sess=(req,uid)=>{const t=rnd(32);D.sess[sha(t)]={uid,exp:Date.now()+365*864e5};save();return{'Set-Cookie':`vsid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${365*86400}${req.headers['x-forwarded-proto']=='https'?'; Secure':''}`}};
const rcode=()=>{const r=rnd(5);return r.slice(0,5)+'-'+r.slice(5)};
const CLR={'Set-Cookie':'vsid=; HttpOnly; Path=/; Max-Age=0'};
const dropSess=uid=>{for(const k in D.sess)if(D.sess[k].uid==uid)delete D.sess[k]};
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.jpg':'image/jpeg','.gif':'image/gif','.webp':'image/webp'};
const json=async(req,max)=>{try{const j=JSON.parse((await body(req,max)).toString()||'{}');return j&&typeof j=='object'&&!Array.isArray(j)?j:{}}catch(e){return{}}};

http.createServer(async(req,res)=>{try{
const u=new URL(req.url,'http://x'),p=u.pathname,m=req.method;
res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
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
 if(p=='/api/logout'){delete D.sess[sha(cookie(req).vsid||'')];save();return send(res,200,{ok:1},CLR)}
 if(p=='/api/password'){const b=await json(req,2000);
  if(!chkPw(b.old||'',D.users[me.uid].pw))return send(res,401,{error:'wrong current password'});
  const n=String(b.new||'');if(n.length<8||n.length>100)return send(res,400,{error:'new password needs 8+ characters'});
  D.users[me.uid].pw=hashPw(n);dropSess(me.uid);return send(res,200,{ok:1},sess(req,me.uid))}
 if(p=='/api/recovery'&&m=='POST'){const b=await json(req,2000);if(!chkPw(b.password||'',D.users[me.uid].pw))return send(res,401,{error:'wrong password'});const rc=rcode();D.users[me.uid].rc=hashPw(rc);save();return send(res,200,{recovery:rc})}
 if(p=='/api/account'&&m=='DELETE'){for(const c in D.docs)for(const i in D.docs[c])if(D.docs[c][i].o==me.uid)delete D.docs[c][i];dropSess(me.uid);delete D.users[me.uid];save();return send(res,200,{ok:1},CLR)}
 if(p=='/api/upload'&&m=='POST'){const b=await body(req,8e6),t=b.subarray(0,12);let x=null;
  if(t[0]==0xff&&t[1]==0xd8)x='jpg';else if(t[0]==0x89&&t.subarray(1,4).toString()=='PNG')x='png';else if(t.subarray(0,3).toString()=='GIF')x='gif';else if(t.subarray(0,4).toString()=='RIFF'&&t.subarray(8,12).toString()=='WEBP')x='webp';
  if(!x)return send(res,400,{error:'images only (jpg, png, gif, webp)'});const id=rnd(16);fs.writeFileSync(`${DIR}/up/${id}.${x}`,b);return send(res,200,{id})}
 const mm=p.match(/^\/api\/c\/(\w+)(?:\/([\w.-]{1,120}))?$/);if(!mm||!OWN[mm[1]])return send(res,404,{error:'not found'});
 const col=mm[1];let id=mm[2];const C=D.docs[col]=D.docs[col]||{};
 if(m=='GET'&&!id){let l=Object.entries(C).map(([i,x])=>({id:i,...x.d}));
  if(col=='messages')l=l.filter(x=>String(x.pair).split('|').includes(me.uid));if(col=='saves')l=l.filter(x=>x.u==me.uid);if(col=='blocks')l=l.filter(x=>x.a==me.uid||x.b==me.uid);
  return send(res,200,l.sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,600))}
 if(m=='DELETE'){if(!id||!C[id])return send(res,200,{ok:1});if(C[id].o!=me.uid&&!(col=='comments'&&(D.docs.posts||{})[C[id].d.p]?.o==me.uid))return send(res,403,{error:'not yours'});delete C[id];save();return send(res,200,{ok:1})}
 if(['POST','PUT','PATCH'].includes(m)){
  if(m=='POST'&&id||m!='POST'&&!id)return send(res,400,{error:'bad path'});
  const d=await json(req,20000);delete d.id;d[OWN[col]]=me.uid;if(m=='POST')id=rnd(10);
  const ok={likes:id.endsWith('_'+me.uid),saves:id.endsWith('_'+me.uid),views:id.endsWith('_'+me.uid),votes:id.endsWith('_'+me.uid),follows:id.startsWith(me.uid+'_'),blocks:id.startsWith(me.uid+'_'),profiles:id==me.uid}[col];
  if(ok===false)return send(res,403,{error:'bad id'});
  if(col=='messages'){const pp=String(d.pair).split('|');if(!pp.includes(me.uid))return send(res,403,{error:'bad chat'});const ot=pp.find(x=>x!=me.uid);if(Object.values(D.docs.blocks||{}).some(x=>(x.d.a==me.uid&&x.d.b==ot)||(x.d.a==ot&&x.d.b==me.uid)))return send(res,403,{error:'cannot message this user'})}
  if(col=='profiles')d.username=me.username;
  const old=C[id];if(old&&old.o!=me.uid)return send(res,403,{error:'not yours'});
  if(m=='PATCH'){if(!old)return send(res,404,{error:'missing'});C[id]={o:me.uid,d:{...old.d,...d}}}else C[id]={o:me.uid,d};
  save();return send(res,200,{id})}
 return send(res,405,{});
}
if(p.startsWith('/_blob/')){if(!auth(req)){res.writeHead(401);return res.end()}
 const id=p.slice(7);if(!/^[0-9a-f]{32}$/.test(id)){res.writeHead(404);return res.end()}
 for(const x of['jpg','png','gif','webp']){const f=`${DIR}/up/${id}.${x}`;if(fs.existsSync(f)){res.writeHead(200,{'Content-Type':MIME['.'+(x=='jpg'?'jpg':x)],'Cache-Control':'private, max-age=31536000, immutable'});return fs.createReadStream(f).pipe(res)}}
 res.writeHead(404);return res.end()}
const PUBLIC=['index.html','sw.js','manifest.webmanifest','icon-192.png','icon-512.png'],nm=p=='/'?'index.html':p.slice(1);
if(!PUBLIC.includes(nm)){res.writeHead(404);return res.end('not found')}
let f=path.join(PUB,nm);
res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':f.endsWith('sw.js')||f.endsWith('index.html')?'no-cache':'public, max-age=3600'});fs.createReadStream(f).pipe(res);
}catch(e){try{send(res,500,{error:'server error'})}catch(x){}}}).listen(PORT,()=>console.log('Vang running on :'+PORT));
