const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core'); const sharp = req('sharp');
const http = require('http'), fs = require('fs'), path = require('path');
const RAIZ = path.resolve(__dirname,'..'), P = 4732;
const T={'.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
const srv = http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(RAIZ,u);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);}).listen(P); alListen(srv, P);

function alListen(srv, p) {
  srv.on('error', e => {
    console.error(e.code === 'EADDRINUSE'
      ? `PUERTO ${p} OCUPADO por otro proceso (probablemente un dev server de otro proyecto). NO lo mato: cambiá PUERTO en este script.`
      : 'error del servidor: ' + e.message);
    process.exit(2);
  });
}

(async()=>{
  const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--hide-scrollbars']});
  const pg=await b.newPage(); await pg.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  await pg.goto(`http://localhost:${P}/`,{waitUntil:'networkidle0'}); await new Promise(r=>setTimeout(r,2800));
  const alto=await pg.evaluate(()=>document.body.scrollHeight);
  const shots=[];
  for(let i=0;i<=9;i++){ await pg.evaluate(v=>window.scrollTo(0,v), Math.round((alto-844)*(i/9))); await new Promise(r=>setTimeout(r,650)); shots.push(await pg.screenshot({type:'jpeg',quality:80})); }
  // menu abierto
  await pg.evaluate(()=>window.scrollTo(0,0)); await new Promise(r=>setTimeout(r,400));
  const diag = await pg.evaluate(()=>{const b=document.getElementById('burger');return b?{existe:true,display:getComputedStyle(b).display,w:b.getBoundingClientRect().width}:{existe:false};});
  console.log('burger:',JSON.stringify(diag));
  console.log('DIAG:', JSON.stringify(await pg.evaluate(()=>({url:location.href, ready:document.readyState, hijos:[...document.body.children].map(e=>e.tagName).join(','), ids:[...document.querySelectorAll('[id]')].map(e=>e.id).slice(0,14)}))));
  await pg.evaluate(()=>document.getElementById('burger').click()); await new Promise(r=>setTimeout(r,500));
  shots.push(await pg.screenshot({type:'jpeg',quality:80}));
  const c=[]; for(let i=0;i<shots.length;i++){ c.push({input:await sharp(shots[i]).resize({width:250}).toBuffer(),left:(i%6)*258+6,top:Math.floor(i/6)*548+6}); }
  await sharp({create:{width:6*258+6,height:Math.ceil(shots.length/6)*548+6,channels:3,background:'#000'}}).composite(c).jpeg({quality:82}).toFile('tools/_qc-movil.jpg');
  await b.close(); srv.close(); console.log('ok', shots.length,'capturas');
})();
