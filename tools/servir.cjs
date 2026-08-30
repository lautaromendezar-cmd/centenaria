const http=require('http'),fs=require('fs'),path=require('path');
const RAIZ=path.resolve(__dirname,'..'), P=Number(process.argv[2]||4740);
const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const srv=http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(RAIZ,u);
 if(!f.startsWith(RAIZ)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end('404');}
 s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(f).pipe(s);});
srv.on('error',e=>{console.error(e.code==='EADDRINUSE'?`PUERTO ${P} OCUPADO — probá otro: node tools/servir.cjs 4741`:e.message);process.exit(2);});
srv.listen(P,()=>console.log(`Centenaria en http://localhost:${P}/  (Ctrl+C para cortar)`));
