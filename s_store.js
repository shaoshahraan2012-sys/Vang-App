// s_store.js - the database (one JSON file), saving, and live-update broadcasting.
const fs=require('fs'),crypto=require('crypto'),{DIR}=require('./s_config');
fs.mkdirSync(DIR+'/up',{recursive:true});
const F=DIR+'/db.json';
let D={users:{},sess:{},docs:{}};try{D=JSON.parse(fs.readFileSync(F))}catch(e){}
const clients=new Set();let bct,st;
// tell every connected browser "something changed, re-sync" (Server-Sent Events)
const bcast=()=>{clearTimeout(bct);bct=setTimeout(()=>{for(const r of clients){try{r.write('data: 1\n\n')}catch(e){clients.delete(r)}}},60)};
const save=()=>{bcast();clearTimeout(st);st=setTimeout(()=>{fs.writeFileSync(F+'.tmp',JSON.stringify(D));fs.renameSync(F+'.tmp',F)},300)};
const rnd=n=>crypto.randomBytes(n).toString('hex'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
module.exports={D,save,clients,rnd,sha};
