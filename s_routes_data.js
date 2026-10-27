// s_routes_data.js - the data API: /api/sync, /api/stream (live updates) and /api/c/<collection>[/<id>].
// Every write is checked here, so the browser cannot cheat (own-only edits, private accounts, blocks, comments off ...).
const {D,save,clients,rnd}=require('./s_store'),{send,json}=require('./s_http'),{OWN}=require('./s_config'),{ctx,listCol}=require('./s_privacy');
module.exports=async function(req,res,p,m,me){
 if(p=='/api/stream'&&m=='GET'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'});res.write(': ok\n\n');clients.add(res);const hb=setInterval(()=>{try{res.write(': hb\n\n')}catch(e){}},20000);req.on('close',()=>{clients.delete(res);clearInterval(hb)});return true}
 if(p=='/api/sync'&&m=='GET'){const o={},X=ctx(me);for(const c in OWN)o[c]=listCol(c,me,X);send(res,200,o);return true}
 const mm=p.match(/^\/api\/c\/(\w+)(?:\/([\w.-]{1,120}))?$/);if(!mm)return false;if(!OWN[mm[1]]){send(res,404,{error:'not found'});return true}
 const col=mm[1];let id=mm[2];const C=D.docs[col]=D.docs[col]||{};
 if(m=='GET'&&!id){send(res,200,listCol(col,me));return true}
 if(m=='DELETE'){if(!id||!C[id]){send(res,200,{ok:1});return true}
  if(C[id].o!=me.uid&&!(col=='comments'&&(D.docs.posts||{})[C[id].d.p]?.o==me.uid)&&!(col=='follows'&&C[id].d.b==me.uid)){send(res,403,{error:'not yours'});return true}
  delete C[id];save();send(res,200,{ok:1});return true}
 if(['POST','PUT','PATCH'].includes(m)){
  if(m=='POST'&&id||m!='POST'&&!id){send(res,400,{error:'bad path'});return true}
  const d=await json(req,20000);delete d.id;d[OWN[col]]=me.uid;if(m=='POST')id=rnd(10);
  if(col=='follows'){const o0=C[id];if(m=='PATCH'&&o0&&o0.d.b==me.uid){o0.d.st='ok';save();send(res,200,{id});return true}
   if(m=='PATCH')delete d.st;else{if(id!=me.uid+'_'+d.b){send(res,403,{error:'bad id'});return true}d.st=(D.docs.profiles||{})[d.b]?.d.priv?'pending':'ok'}}
  // ids that must carry the author's id, so nobody can write as someone else (also makes "one like per person" automatic)
  const suf=id.endsWith('_'+me.uid),pre=id.startsWith(me.uid+'_');
  const ok={likes:suf,saves:suf,views:suf,votes:suf,reads:suf,follows:pre,blocks:pre,cfriends:pre,profiles:id==me.uid}[col];
  if(ok===false){send(res,403,{error:'bad id'});return true}
  if(col=='messages'){const pp=String(d.pair).split('|');if(!pp.includes(me.uid)){send(res,403,{error:'bad chat'});return true}const ot=pp.find(x=>x!=me.uid);if(Object.values(D.docs.blocks||{}).some(x=>(x.d.a==me.uid&&x.d.b==ot)||(x.d.a==ot&&x.d.b==me.uid))){send(res,403,{error:'cannot message this user'});return true}}
  {const X=ctx(me),no=m=>{send(res,403,{error:m});return true};
   if(col=='comments'){if(!X.pOk(d.p))return no('you cannot comment on this post');const po=X.posts[d.p];if(po.d.nc&&po.d.uid!=me.uid)return no('comments are turned off')}
   if(col=='likes'&&!(X.pOk(d.p)||X.cOk(d.p)||X.mOk(d.p)))return no('not allowed');
   if(col=='saves'&&!X.pOk(d.p))return no('not allowed');
   if((col=='views'||col=='votes')&&!X.sOk(d.s))return no('not allowed');
   if(col=='follows'&&m!='PATCH'&&X.bl.has(d.b))return no('not allowed');
   if(col=='stories'&&d.aud&&d.aud!='cf')delete d.aud}
  if(col=='profiles'){d.username=me.username;delete d.fr;delete d.fg;delete d.np}
  const old=C[id];if(old&&old.o!=me.uid){send(res,403,{error:'not yours'});return true}
  if(m=='PATCH'){if(!old){send(res,404,{error:'missing'});return true}C[id]={o:me.uid,d:{...old.d,...d}}}else C[id]={o:me.uid,d};
  save();send(res,200,{id});return true}
 send(res,405,{});return true};
