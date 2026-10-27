// s_http.js - tiny HTTP helpers (no framework needed).
const body=(req,max)=>new Promise((ok,no)=>{const b=[];let n=0;req.on('data',c=>{n+=c.length;if(n>max){no(new Error('too big'));req.destroy()}else b.push(c)});req.on('end',()=>ok(Buffer.concat(b)));req.on('error',no)});
const send=(res,code,obj,hd={})=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store',...hd});res.end(JSON.stringify(obj))};
const json=async(req,max)=>{try{const j=JSON.parse((await body(req,max)).toString()||'{}');return j&&typeof j=='object'&&!Array.isArray(j)?j:{}}catch(e){return{}}};
const cookie=req=>Object.fromEntries((req.headers.cookie||'').split(/;\s*/).filter(Boolean).map(c=>c.split('=')));
module.exports={body,send,json,cookie};
