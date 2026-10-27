// server.js - entry point. Zero dependencies, Node 18+.  Start with: node server.js
const http=require('http'),{PORT}=require('./s_config'),{send}=require('./s_http'),{auth}=require('./s_auth');
const routesAuth=require('./s_routes_auth'),routesData=require('./s_routes_data'),music=require('./s_music'),media=require('./s_media'),serveStatic=require('./s_static');
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://x'),p=u.pathname,m=req.method;
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','same-origin');
 res.setHeader('Access-Control-Allow-Origin',process.env.ALLOW_ORIGIN||'*');res.setHeader('Access-Control-Allow-Headers','Content-Type,X-Vang,Authorization');
 res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE,OPTIONS');res.setHeader('Access-Control-Expose-Headers','X-Vang-Token');
 if(m=='OPTIONS'){res.writeHead(204);return res.end()}
 if(p.startsWith('/api/')){
  if(m!='GET'&&req.headers['x-vang']!='1')return send(res,403,{error:'bad request'});     // CSRF guard: browsers cannot add this header cross-site
  const me=auth(req);
  if(await routesAuth(req,res,p,m,me))return;                                           // also answers 401 when not logged in
  if(p=='/api/upload'&&m=='POST')return media.upload(req,res);
  if(await music(req,res,p,m,me,u))return;
  if(await routesData(req,res,p,m,me))return;
  return send(res,404,{error:'not found'})}
 if(p.startsWith('/_blob/'))return media.serve(req,res,p);
 serveStatic(req,res,p);
}catch(e){try{send(res,500,{error:'server error'})}catch(x){}}}).listen(PORT,()=>console.log('Vang running on :'+PORT));
