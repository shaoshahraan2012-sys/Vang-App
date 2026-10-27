'use strict';
/* c_media.js - checking files before upload, uploading with progress + automatic retry, cropping photos, and filter/adjust CSS. */
const IMGT=/^image\/(jpeg|png|gif|webp)$/,VIDT=/^video\/(mp4|webm|quicktime)$/,AUDT=/^audio\/(mpeg|mp3|mp4|x-m4a|m4a|aac|ogg|wav|x-wav|wave|webm)$/;
const ADJ0={b:0,c:0,s:0,w:0};
/* filter + adjustments -> one CSS filter string (used for preview and for display in feed/stories) */
function cssFilter(f,adj){const a=adj||ADJ0;let s=(FL[f|0]||FL[0])[1];s=s=='none'?'':s;
 if(a.b)s+=` brightness(${1+a.b/100})`;if(a.c)s+=` contrast(${1+a.c/100})`;if(a.s)s+=` saturate(${1+a.s/100})`;
 if(a.w>0)s+=` sepia(${a.w/250}) saturate(${1+a.w/400})`;else if(a.w<0)s+=` hue-rotate(${a.w*.4}deg)`;return s.trim()||'none'}
/* Look inside a file before uploading: right type, small enough, and (for video/audio) really playable + not too long. */
function probe(f,max=90){return new Promise(res=>{const t=f.type||'',n=(f.name||'').toLowerCase();
 if(IMGT.test(t))return res(f.size>8e6?{ok:0,msg:'Photo is too big (max 8 MB)'}:{ok:1});
 const isA=AUDT.test(t)||/\.(mp3|m4a|ogg|wav|aac)$/.test(n),isV=VIDT.test(t);
 if(!isV&&!isA)return res({ok:0,msg:'Unsupported file. Use JPG, PNG, GIF, WebP, MP4 or WebM.'});
 if(isA&&f.size>15e6)return res({ok:0,msg:'Audio is too big (max 15 MB)'});if(isV&&f.size>30e6)return res({ok:0,msg:'Video is too big (max 30 MB)'});
 const v=document.createElement(isA?'audio':'video'),u=URL.createObjectURL(f),done=r=>{URL.revokeObjectURL(u);res(r)},bad={ok:0,msg:isA?"This audio can't be played on your device. Try MP3 or M4A.":"This video can't be played on your device. Export it as MP4 (H.264) and try again."},tm=setTimeout(()=>done(bad),9000);
 v.preload='metadata';v.muted=true;v.onloadedmetadata=()=>{clearTimeout(tm);done(v.duration>max?{ok:0,msg:`${isA?'Audio':'Video'} is too long (max ${max>=120?Math.round(max/60)+' minutes':max+' seconds'})`}:{ok:1,dur:v.duration,ar:isA?0:(v.videoWidth/v.videoHeight||1),a:isA})};v.onerror=()=>{clearTimeout(tm);done(bad)};v.src=u})}
function upFile(f,prog){return new Promise((ok,no)=>{if(f.size>30e6)return no(Object.assign(new Error('File is too big (max 30 MB)'),{fatal:1}));const x=new XMLHttpRequest();x.open('POST',BASE+'/api/upload');x.setRequestHeader('X-Vang','1');if(TK())x.setRequestHeader('Authorization','Bearer '+TK());x.timeout=180000;
 x.upload.onprogress=e=>{if(prog&&e.lengthComputable)prog(e.loaded/e.total)};x.onload=()=>{let j={};try{j=JSON.parse(x.responseText)}catch(e){}if(x.status>=200&&x.status<300)ok(j);else no(Object.assign(new Error(j.error||'Upload failed (server error)'),{fatal:x.status<500}))};
 x.onerror=()=>no(new Error('Network problem. Check your connection.'));x.ontimeout=()=>no(new Error('Upload timed out'));x.send(f)})}
async function upRetry(f,prog,n=3){let err;for(let i=0;i<n;i++){try{return await upFile(f,prog)}catch(e){err=e;if(e.fatal)break;await new Promise(r=>setTimeout(r,900*(i+1)))}}throw err}
/* Crop a photo to 1:1 / 4:5 / original and shrink it (max 1440px). Returns {blob, ar}. GIFs are left alone. */
async function cropImage(file,aspect){if(file.type=='image/gif')return{blob:file,ar:1};
 const url=URL.createObjectURL(file);try{const img=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>no(new Error('Could not read this photo'));i.src=url});
 let w=img.naturalWidth,h=img.naturalHeight,tw=w,th=h;const want=aspect=='1'?1:aspect=='0.8'?.8:null;let sx=0,sy=0,sw=w,sh=h;
 if(want){const cur=w/h;if(cur>want){sw=Math.round(h*want);sx=Math.round((w-sw)/2)}else{sh=Math.round(w/want);sy=Math.round((h-sh)/2)}tw=sw;th=sh}
 const sc=Math.min(1,1440/Math.max(tw,th)),cw=Math.round(tw*sc),ch=Math.round(th*sc),cv=document.createElement('canvas');cv.width=cw;cv.height=ch;cv.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,cw,ch);
 const blob=await new Promise(r=>cv.toBlob(r,'image/jpeg',.9));if(!blob)throw new Error('Could not process this photo');return{blob,ar:cw/ch}}finally{URL.revokeObjectURL(url)}}
