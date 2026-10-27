// s_media.js - uploads (photos, videos, audio) and serving them back with HTTP Range support (needed for video/audio seeking).
const fs=require('fs'),{DIR,MIME}=require('./s_config'),{rnd}=require('./s_store'),{body,send}=require('./s_http');
const EXTS=['jpg','png','gif','webp','mp4','webm','mp3','ogg','wav'];
// look at the first bytes to decide what the file really is (never trust the browser's label)
function sniff(t){const s=(a,b)=>t.subarray(a,b).toString('latin1');
 if(t[0]==0xff&&t[1]==0xd8)return{x:'jpg',k:'i'};if(t[0]==0x89&&s(1,4)=='PNG')return{x:'png',k:'i'};if(s(0,3)=='GIF')return{x:'gif',k:'i'};
 if(s(0,4)=='RIFF'&&s(8,12)=='WEBP')return{x:'webp',k:'i'};if(s(0,4)=='RIFF'&&s(8,12)=='WAVE')return{x:'wav',k:'a'};
 if(s(4,8)=='ftyp')return{x:'mp4',k:'v'};                                   // mp4 / mov / m4a (the app knows which from the file type)
 if(t[0]==0x1a&&t[1]==0x45&&t[2]==0xdf&&t[3]==0xa3)return{x:'webm',k:'v'};
 if(s(0,4)=='OggS')return{x:'ogg',k:'a'};if(s(0,3)=='ID3'||(t[0]==0xff&&(t[1]&0xe0)==0xe0))return{x:'mp3',k:'a'};
 return null}
async function upload(req,res){const b=await body(req,30e6),f=sniff(b.subarray(0,12));
 if(!f)return send(res,400,{error:'use jpg, png, gif, webp, mp4, webm, mp3, ogg or wav'});
 if(f.k=='i'&&b.length>8e6)return send(res,400,{error:'photo too big (max 8MB)'});
 if(f.k=='a'&&b.length>15e6)return send(res,400,{error:'audio too big (max 15MB)'});
 const id=rnd(16);fs.writeFileSync(`${DIR}/up/${id}.${f.x}`,b);send(res,200,{id,k:f.k})}
function serve(req,res,p){const id=p.slice(7);if(!/^[0-9a-f]{32}$/.test(id)){res.writeHead(404);return res.end()}
 for(const x of EXTS){const f=`${DIR}/up/${id}.${x}`;if(fs.existsSync(f)){const sz=fs.statSync(f).size,hd={'Content-Type':MIME['.'+x],'Accept-Ranges':'bytes','Cache-Control':'public, max-age=31536000, immutable'},rg=/bytes=(\d*)-(\d*)/.exec(req.headers.range||'');
  if(rg){let a0=rg[1]?+rg[1]:0,e0=rg[2]?+rg[2]:sz-1;if(!rg[1]&&rg[2]){a0=sz-(+rg[2]);e0=sz-1}e0=Math.min(e0,sz-1);if(a0>e0||a0>=sz){res.writeHead(416,{'Content-Range':'bytes */'+sz});return res.end()}res.writeHead(206,{...hd,'Content-Range':`bytes ${a0}-${e0}/${sz}`,'Content-Length':e0-a0+1});return fs.createReadStream(f,{start:a0,end:e0}).pipe(res)}
  res.writeHead(200,{...hd,'Content-Length':sz});return fs.createReadStream(f).pipe(res)}}
 res.writeHead(404);res.end()}
module.exports={upload,serve,sniff};
