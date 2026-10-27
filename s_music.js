// s_music.js - music search + audio streaming THROUGH the server.
// Why: calling Apple's search straight from a phone often fails ("no connection") because of networks, ad-blockers or regional blocks.
// The server asks Apple on the phone's behalf. Only 30-second preview clips from Apple's public catalogue are used.
const {Readable}=require('stream'),{send}=require('./s_http'),{ITUNES}=require('./s_config');
const cache=new Map(),hits={};
const limited=uid=>{const n=Date.now(),a=(hits[uid]||[]).filter(t=>n-t<6e4);a.push(n);hits[uid]=a;return a.length>40};
async function search(q){const key=q.toLowerCase(),c=cache.get(key);if(c&&Date.now()-c.t<6e5)return c.d;
 const r=await fetch(ITUNES+'/search?media=music&entity=song&limit=25&term='+encodeURIComponent(q||'top hits'),{signal:AbortSignal.timeout(9000),headers:{'User-Agent':'Vang/1.0'}});
 if(!r.ok)throw new Error('upstream '+r.status);const j=await r.json();
 const d=(j.results||[]).filter(x=>x.previewUrl).map(x=>({mn:x.trackName,ma:x.artistName,mi:x.artworkUrl60,mu:x.previewUrl,ml:x.trackViewUrl||''}));
 cache.set(key,{t:Date.now(),d});if(cache.size>200)cache.delete(cache.keys().next().value);return d}
const hostOk=u=>(u.protocol=='https:'&&/(^|\.)mzstatic\.com$/.test(u.hostname))||(process.env.ALLOW_TEST_HTTP=='1'&&u.hostname=='localhost');
module.exports=async function(req,res,p,m,me,u){
 if(p=='/api/music'&&m=='GET'){if(limited(me.uid)){send(res,429,{error:'slow down a little'});return true}
  try{send(res,200,{results:await search((u.searchParams.get('q')||'').slice(0,80))})}catch(e){send(res,502,{error:'Music search is not available right now'})}return true}
 if(p=='/api/audio'&&m=='GET'){let url;try{url=new URL(u.searchParams.get('u')||'')}catch(e){send(res,400,{error:'bad url'});return true}
  if(!hostOk(url)){send(res,400,{error:'not allowed'});return true}
  try{const r=await fetch(url,{headers:req.headers.range?{Range:req.headers.range}:{},signal:AbortSignal.timeout(20000)}),hd={'Content-Type':r.headers.get('content-type')||'audio/mp4','Cache-Control':'public, max-age=86400','Accept-Ranges':'bytes'};
   for(const k of['content-length','content-range'])if(r.headers.get(k))hd[k]=r.headers.get(k);res.writeHead(r.status,hd);Readable.fromWeb(r.body).pipe(res)}catch(e){try{send(res,502,{error:'could not load this sound'})}catch(x){}}return true}
 return false};
