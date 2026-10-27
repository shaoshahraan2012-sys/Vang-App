// s_static.js - serves the website files (only names allowed by PUBLIC_RE, so server code and the database stay private).
const fs=require('fs'),path=require('path'),{PUB,MIME,PUBLIC_RE}=require('./s_config');
module.exports=function(req,res,p){const nm=p=='/'?'index.html':p.slice(1);
 if(!PUBLIC_RE.test(nm)||!fs.existsSync(path.join(PUB,nm))){res.writeHead(404);return res.end('not found')}
 const f=path.join(PUB,nm),ext=path.extname(f);
 res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':nm=='sw.js'||nm=='index.html'?'no-cache':'no-cache, must-revalidate'});fs.createReadStream(f).pipe(res)};
