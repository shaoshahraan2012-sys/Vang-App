'use strict';
/* c_create.js - the "New post" flow, step by step like Instagram:
   1) pick photos/videos (or take one, or write a text post)  2) crop + filter + adjust  3) caption, tag people, location, music, advanced.  */
let CP=null,CPE=null;
const ACC='image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime';
const pickMusic=m=>({mu:m.mu,mn:m.mn,ma:m.ma,mi:m.mi||'',ml:m.ml||'',ms:m.ms||0,md:m.md||30});
function createPost(auto){const st=CP={step:'pick',files:[],aspect:'1',f:0,adj:{...ADJ0},tab:'f',g:0,music:null,loc:'',alt:'',tags:[],hl:0,nc:0,cap:'',adv:0};
 const el=CPE=full({static:1,title:'New post',right:'<button class="lnk" id="nx" style="padding:8px 12px;display:none"></button>',onclose:()=>{stopSong();CP=null;CPE=null},body:()=>cpBody(st)});
 el.stepBack=()=>{if(st.step=='caption'){st.step=st.files.length?'edit':'pick';cpRender();return true}if(st.step=='edit'){st.step='pick';cpRender();return true}return false};
 el.querySelector('#nx').onclick=()=>{if(st.step=='edit'){st.step='caption';cpRender()}else if(st.step=='caption')cpShare()};
 el.addEventListener('change',cpFiles);cpRender();if(auto=='cam')setTimeout(()=>el.querySelector('#cfc')&&el.querySelector('#cfc').click(),60)}
function cpRender(){const el=CPE,st=CP;if(!el||!st)return;el.r(1);const nx=el.querySelector('#nx');el.querySelector('.tt').textContent=st.step=='edit'?'Edit':'New post';nx.style.display=st.step=='pick'?'none':'';nx.textContent=st.step=='caption'?'Share':'Next'}
async function cpFiles(e){if(e.target.id!='cf'&&e.target.id!='cfc')return;const st=CP;if(!st)return;
 for(const f of [...e.target.files]){if(st.files.length>=10){toast('You can add up to 10 files');break}const v=await probe(f,90);if(!v.ok){toast(v.msg);continue}if(v.a){toast('Add music with the music button instead');continue}st.files.push({type:f.type||'',u:URL.createObjectURL(f),f,ar:v.ar})}
 e.target.value='';if(st.files.length)st.step='edit';cpRender()}
const cpAr=st=>{const f=st.files[0];if(st.aspect=='1')return 1;if(st.aspect=='0.8')return .8;return Math.min(1.91,Math.max(.8,(f&&f.ar)||1))};
function cpBody(st){const F=st.files,f0=F[0];
 if(st.step=='pick')return `<div class="form"><div class="c" style="padding:30px 0 10px"><div style="font-size:54px">🖼️</div><b style="font-size:18px">Create a new post</b><p class="mu">Share photos and videos with your followers</p></div><input type="file" id="cf" accept="${ACC}" multiple hidden><input type="file" id="cfc" accept="image/*,video/*" capture="environment" hidden><button class="btn wide" data-a="cp_pick">Select from device</button><button class="btn g wide" data-a="cp_cam">Take a photo or video</button><button class="btn g wide" data-a="cp_text">Write a text post</button></div>`;
 if(st.step=='edit'){const isImg=f0.type.startsWith('image'),flt=cssFilter(st.f,st.adj);
  const prev=isImg?`<img id="cpimg" src="${f0.u}" style="width:100%;height:100%;object-fit:cover;filter:${flt}">`:`<video src="${f0.u}" autoplay muted loop playsinline style="width:100%;height:100%;object-fit:cover"></video>`;
  return `<input type="file" id="cf" accept="${ACC}" multiple hidden><div style="background:#000"><div class="cropv" style="aspect-ratio:${cpAr(st)}">${prev}${F.length>1?`<div class="cnt">1/${F.length}</div>`:''}</div></div>
<div class="form" style="gap:10px">${isImg?`<div class="chips">${[['orig','Original'],['1','Square 1:1'],['0.8','Portrait 4:5']].map(([k,n])=>`<button class="chip ${st.aspect==k?'on':''}" data-a="cp_asp" data-x="${k}">${n}</button>`).join('')}</div>`:''}
<div class="prev">${F.map((f,i)=>`<div class="pv">${f.type.startsWith('video')?`<video src="${f.u}" muted></video>`:`<img src="${f.u}">`}<button class="pvx" data-a="cp_rm" data-x="${i}">✕</button></div>`).join('')}${F.length<10?'<button class="pv add" data-a="cp_pick">＋</button>':''}</div>
${isImg?`<div class="seg"><button class="${st.tab=='f'?'on':''}" data-a="cp_tab" data-x="f">Filter</button><button class="${st.tab=='a'?'on':''}" data-a="cp_tab" data-x="a">Adjust</button></div>${st.tab=='f'?`<div class="flt">${FL.map((x,i)=>`<div class="${st.f==i?'on':''}" data-a="cp_flt" data-x="${i}"><img src="${f0.u}" style="filter:${cssFilter(i,null)}">${x[0]}</div>`).join('')}</div>`:`${[['b','Brightness'],['c','Contrast'],['s','Saturation'],['w','Warmth']].map(([k,n])=>`<div class="adj"><span>${n}</span><input type="range" min="-100" max="100" value="${st.adj[k]}" data-in="cp_adj" data-k="${k}" style="padding:0"><b>${st.adj[k]}</b></div>`).join('')}<button class="lnk" data-a="cp_reset">Reset adjustments</button>`}`:'<small class="mu">Crop and filters work on photos. Videos are posted as they are.</small>'}</div>`}
 const th=f0?(f0.type.startsWith('video')?`<video src="${f0.u}" muted></video>`:`<img src="${f0.u}" style="filter:${cssFilter(st.f,st.adj)}">`):`<div style="background:${G[st.g]};width:100%;height:100%"></div>`;
 return `<div class="form"><div style="display:flex;gap:10px"><div class="cth">${th}</div><textarea id="cpc" rows="4" maxlength="500" placeholder="Write a caption… use #tags and @mentions" data-in="cp_cap">${esc(st.cap)}</textarea></div>
${f0?'':`<div class="sw">${G.map((x,j)=>`<i style="background:${x}" class="${j==st.g?'on':''}" data-a="cp_bg" data-x="${j}"></i>`).join('')}</div>`}
<div class="item" data-a="cp_tag" style="padding:12px 0">${I('tagp')}<span>Tag people${st.tags.length?' · '+st.tags.map(u=>'@'+esc(pr(u).username)).join(', '):''}</span></div>
<input placeholder="Add location" maxlength="40" value="${esc(st.loc)}" data-in="cp_loc">
<div class="item" data-a="cp_music" style="padding:12px 0">${I('music')}<span>${st.music?esc(st.music.ma+' · '+st.music.mn):'Add music'}</span>${st.music?'<span class="sp lnk" data-a="cp_nomusic">Remove</span>':''}</div>
<div class="item" data-a="cp_adv" style="padding:12px 0"><span>Advanced settings</span><span class="sp mu">${st.adv?'▲':'▼'}</span></div>
${st.adv?`<div class="row r" style="padding:6px 0" data-a="cp_hl"><span class="t">Hide like count on this post</span><i class="tg ${st.hl?'on':''}"></i></div><div class="row r" style="padding:6px 0" data-a="cp_nc"><span class="t">Turn off commenting</span><i class="tg ${st.nc?'on':''}"></i></div>${f0?`<label class="mu" style="font-size:12px">Alt text (describes the photo for people who can't see it)</label><input maxlength="120" value="${esc(st.alt)}" data-in="cp_alt" placeholder="Write alt text…">`:''}`:''}
<div class="bar"><i id="cbar"></i></div><div class="err" id="cerr"></div></div>`}
async function cpShare(){const st=CP,el=CPE;if(!st)return;const g=id=>el.querySelector('#'+id),b=g('nx');if(!st.files.length&&!st.cap.trim())return toast('Write something or add a photo');b.disabled=true;g('cerr').textContent='';
 try{const mm=[],n=st.files.length;let ar=1;
  for(let j=0;j<n;j++){const F=st.files[j];if(!F.up){b.textContent=`${j+1}/${n}…`;let blob=F.f,far=F.ar||1;if(F.type.startsWith('image')){const c=await cropImage(F.f,st.aspect);blob=c.blob;far=c.ar}F.up=await upRetry(blob,p=>{g('cbar').style.width=((j+p)/n*100)+'%'});F.far=far}if(j==0)ar=F.far||1;mm.push({i:F.up.id,k:F.up.k})}
  b.textContent='Sharing…';const d={uid:S.uid,t:st.cap.trim(),g:st.g,f:st.f,adj:st.adj,ar:Math.round(ar*1000)/1000,loc:st.loc.trim(),alt:st.alt.trim(),hl:st.hl,nc:st.nc,at:now()};
  if(st.tags.length)d.tg=st.tags;if(mm.length)d.mm=mm;if(st.music)Object.assign(d,pickMusic(st.music));
  await add('posts',d);closeOv(el);stopSong();S.tab='home';toast('Post shared');draw()}
 catch(e){g('cerr').innerHTML=`${esc(e.message||'Something went wrong')} <span class="lnk" data-a="cp_retry" style="cursor:pointer">Retry</span>`;b.disabled=false;b.textContent='Share';g('cbar').style.width='0'}}
Object.assign(A,{cp_pick(){const e=CPE&&CPE.querySelector('#cf');e&&e.click()},cp_cam(){const e=CPE&&CPE.querySelector('#cfc');e&&e.click()},cp_text(){CP.step='caption';cpRender()},
 cp_asp(k){CP.aspect=k;cpRender()},cp_rm(i){CP.files.splice(+i,1);if(!CP.files.length)CP.step='pick';cpRender()},cp_tab(t){CP.tab=t;cpRender()},cp_flt(i){CP.f=+i;cpRender()},
 cp_reset(){CP.adj={...ADJ0};cpRender()},cp_bg(j){CP.g=+j;cpRender()},cp_adv(){CP.adv=CP.adv?0:1;cpRender()},cp_hl(){CP.hl=CP.hl?0:1;cpRender()},cp_nc(){CP.nc=CP.nc?0:1;cpRender()},
 cp_music(){musicPicker(s=>{CP.music=s;cpRender()})},cp_nomusic(){CP.music=null;cpRender()},cp_retry(){const b=CPE&&CPE.querySelector('#nx');b&&b.click()},
 cp_tag(){const st=CP,ps=S.prof.map(p=>p.uid||p.id).filter(u=>u!=S.uid&&!blk(u));const e=sheet(`<div class="form" style="padding-top:4px"><b style="font-size:16px">Tag people</b>${ps.map(u=>`<div class="row" style="padding:4px 0">${avt(u,40)}<div class="t"><b>${esc(pr(u).username)}</b><small>${esc(pr(u).name||'')}</small></div><input type="checkbox" data-u="${esc(u)}" ${st.tags.includes(u)?'checked':''} style="width:22px;height:22px"></div>`).join('')||'<div class="mu">Nobody to tag yet</div>'}<button class="btn wide" id="tgd">Done</button></div>`);
  e.querySelector('#tgd').onclick=()=>{st.tags=[...e.querySelectorAll('[data-u]:checked')].map(c=>c.dataset.u);e.remove();cpRender()}},
 in_cp_cap(v){CP.cap=v},in_cp_loc(v){CP.loc=v},in_cp_alt(v){CP.alt=v},
 in_cp_adj(v,el){CP.adj[el.dataset.k]=+v;el.nextElementSibling.textContent=v;const i=CPE&&CPE.querySelector('#cpimg');if(i)i.style.filter=cssFilter(CP.f,CP.adj)}});
