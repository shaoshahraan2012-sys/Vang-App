// s_auth.js - passwords (scrypt), sessions, login rate limiting, recovery codes.
const crypto=require('crypto'),{D,save,rnd,sha}=require('./s_store'),{cookie}=require('./s_http');
const hashPw=(pw,salt=rnd(16))=>salt+':'+crypto.scryptSync(pw,salt,64).toString('hex');
const chkPw=(pw,h)=>{const[s,x]=h.split(':'),y=crypto.scryptSync(String(pw),s,64).toString('hex');return crypto.timingSafeEqual(Buffer.from(x),Buffer.from(y))};
const tok=req=>{const a=req.headers.authorization||'';return a.startsWith('Bearer ')?a.slice(7):cookie(req).vsid};
const auth=req=>{const t=tok(req);if(!t)return null;const s=D.sess[sha(t)];if(!s||s.exp<Date.now())return null;const u=D.users[s.uid];return u?{uid:s.uid,username:u.username}:null};
const tries={},limited=k=>{const n=Date.now(),a=(tries[k]||[]).filter(t=>n-t<6e5);tries[k]=a;return a.length>=10};
const sess=(req,uid)=>{const t=rnd(32);D.sess[sha(t)]={uid,exp:Date.now()+365*864e5};save();return{'Set-Cookie':`vsid=${t}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${365*86400}${req.headers['x-forwarded-proto']=='https'?'; Secure':''}`,'X-Vang-Token':t}};
const rcode=()=>{const r=rnd(5);return r.slice(0,5)+'-'+r.slice(5)};
const CLR={'Set-Cookie':'vsid=; HttpOnly; Path=/; Max-Age=0'};
const dropSess=uid=>{for(const k in D.sess)if(D.sess[k].uid==uid)delete D.sess[k]};
module.exports={hashPw,chkPw,tok,auth,tries,limited,sess,rcode,CLR,dropSess};
