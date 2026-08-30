const { createRequire } = require('module');
const req = createRequire('C:/Users/Lautaro/Desktop/Claude/latina/node_modules/');
const puppeteer = req('puppeteer-core'); const sharp = req('sharp');
const http = require('http'), fs = require('fs'), path = require('path');
const RAIZ = path.resolve(__dirname, '..'), P = 4733;
const T = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml' };
const srv = http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(RAIZ,u);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);}).listen(P); alListen(srv, P);

function alListen(srv, p) {
  srv.on('error', e => {
    console.error(e.code === 'EADDRINUSE'
      ? `PUERTO ${p} OCUPADO por otro proceso (probablemente un dev server de otro proyecto). NO lo mato: cambiá PUERTO en este script.`
      : 'error del servidor: ' + e.message);
    process.exit(2);
  });
}

(async () => {
  const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new', args:['--no-sandbox','--hide-scrollbars'] });
  const pg = await b.newPage(); await pg.setViewport({ width:1440, height:900 });
  await pg.goto(`http://localhost:${P}/`, { waitUntil:'networkidle0' });
  await new Promise(r=>setTimeout(r,2600));
  // con el pin, offsetParent cambia y offsetTop miente: va rect + scrollY
  const y0 = await pg.evaluate(()=>document.querySelector('.variedades').getBoundingClientRect().top + window.scrollY);
  const shots=[];
  for (const d of [0, 300, 700, 1100, 1500, 1900]) {
    await pg.evaluate(v=>window.scrollTo(0,v), y0+d);
    await new Promise(r=>setTimeout(r,700));
    shots.push(await pg.screenshot({ type:'jpeg', quality:82 }));
  }
  const c = shots.map((s,i)=>({ input:s, left:(i%3)*486+6, top:Math.floor(i/3)*310+6 }));
  const rs = await Promise.all(c.map(async o=>({ ...o, input: await sharp(o.input).resize({width:480}).toBuffer() })));
  await sharp({create:{width:3*486+6,height:2*310+6,channels:3,background:'#000'}}).composite(rs).jpeg({quality:86}).toFile('tools/_qc-riel.jpg');
  await b.close(); srv.close(); console.log('ok');
})();
