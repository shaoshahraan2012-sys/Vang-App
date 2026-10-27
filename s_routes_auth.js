// s_routes_auth.js - sign up, log in, reset password, log out, change password, delete account.
const {D,save,rnd,sha}=require('./s_store'),{send,json}=require('./s_http'),A=require('./s_auth');
module.exports=async function(req,res,p,m,me){
 if(p=='/api/reset'&&m=='POST'){const b=await json(req,2000),un=String(b.username||'').trim().toLowerCase(),key='r'+req.socket.remoteAddress+un;
  if(A.limited(key)){send(res,429,{error:'too many tries, wait 10 minutes'});return true}
  const e=Object.entries(D.users).find(([,x])=>x.username==un),n=String(b.password||''),c=String(b.code||'').trim().toLowerCase();
  if(!e||!e[1].rc||!A.chkPw(c,e[1].rc)){A.tries[key].push(Date.now());send(res,401,{error:'wrong username or recovery code'});return true}
  if(n.length<8||n.length>100){send(res,400,{error:'new password needs 8+ characters'});return true}
  const rc=A.rcode();e[1].pw=A.hashPw(n);e[1].rc=A.hashPw(rc);A.dropSess(e[0]);send(res,200,{ok:1,recovery:rc},A.sess(req,e[0]));return true}
 if(p=='/api/signup'||p=='/api/login'){
  if(m!='POST'){send(res,405,{});return true}
  const b=await json(req,2000),un=String(b.username||'').trim().toLowerCase(),pw=String(b.password||''),key=req.socket.remoteAddress+un;
  if(A.limited(key)){send(res,429,{error:'too many tries, wait 10 minutes'});return true}
  if(p=='/api/signup'){
   if(!/^[a-z0-9._]{3,20}$/.test(un)){send(res,400,{error:'username: 3-20 chars, a-z 0-9 . _'});return true}
   if(pw.length<8||pw.length>100){send(res,400,{error:'password needs 8+ characters'});return true}
   if(Object.values(D.users).some(x=>x.username==un)){send(res,409,{error:'username taken'});return true}
   const uid=rnd(8),rc=A.rcode();D.users[uid]={username:un,pw:A.hashPw(pw),rc:A.hashPw(rc),at:Date.now()};send(res,200,{ok:1,recovery:rc},A.sess(req,uid));return true}
  const e=Object.entries(D.users).find(([,x])=>x.username==un);
  if(!e||!A.chkPw(pw,e[1].pw)){A.tries[key].push(Date.now());send(res,401,{error:'wrong username or password'});return true}
  send(res,200,{ok:1},A.sess(req,e[0]));return true}
 if(p=='/api/me'){send(res,200,me||{uid:null});return true}
 if(!me){send(res,401,{error:'login'});return true}
 if(p=='/api/logout'){delete D.sess[sha(A.tok(req)||'')];save();send(res,200,{ok:1},A.CLR);return true}
 if(p=='/api/password'){const b=await json(req,2000);
  if(!A.chkPw(b.old||'',D.users[me.uid].pw)){send(res,401,{error:'wrong current password'});return true}
  const n=String(b.new||'');if(n.length<8||n.length>100){send(res,400,{error:'new password needs 8+ characters'});return true}
  D.users[me.uid].pw=A.hashPw(n);A.dropSess(me.uid);send(res,200,{ok:1},A.sess(req,me.uid));return true}
 if(p=='/api/recovery'&&m=='POST'){const b=await json(req,2000);if(!A.chkPw(b.password||'',D.users[me.uid].pw)){send(res,401,{error:'wrong password'});return true}const rc=A.rcode();D.users[me.uid].rc=A.hashPw(rc);save();send(res,200,{recovery:rc});return true}
 if(p=='/api/account'&&m=='DELETE'){for(const c in D.docs)for(const i in D.docs[c])if(D.docs[c][i].o==me.uid)delete D.docs[c][i];A.dropSess(me.uid);delete D.users[me.uid];save();send(res,200,{ok:1},A.CLR);return true}
 return false};
