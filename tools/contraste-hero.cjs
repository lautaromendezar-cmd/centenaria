/* Contraste REAL del texto del hero sobre el fondo COMPUESTO (capas + WebGL + velo + grano).
   El truco: se oculta el texto (visibility:hidden, sin mover nada), se
   captura el viewport y se miden los píxeles del fondo justo donde
   estaban las letras. Se toma el peor caso — el píxel más CLARO detrás
   de texto claro — no el promedio, que siempre da un número lindo.
   Se usa Range para la caja real de las líneas: el rect del <h1> incluye
   aire que el texto no ocupa. */
const { createRequire } = require('module');
const req = createRequire('C:/Users/Lautaro/Desktop/Claude/latina/node_modules/');
const puppeteer = req('puppeteer-core');
const sharp = req('sharp');
const http = require('http'), fs = require('fs'), path = require('path');

const RAIZ = path.resolve(__dirname, '..'), P = 4734;
const T = { '.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml' };

const lum = (r, g, b) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);


function alListen(srv, p) {
  srv.on('error', e => {
    console.error(e.code === 'EADDRINUSE'
      ? `PUERTO ${p} OCUPADO por otro proceso (probablemente un dev server de otro proyecto). NO lo mato: cambiá PUERTO en este script.`
      : 'error del servidor: ' + e.message);
    process.exit(2);
  });
}

(async () => {
  const srv = http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.join(RAIZ,u);if(!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end();}s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(s);}).listen(P); alListen(srv, P);

  const b = await puppeteer.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:'new', args:['--no-sandbox','--hide-scrollbars','--enable-unsafe-swiftshader','--use-angle=swiftshader'] });
  let fallos = 0;

  for (const vp of [{w:1440,h:900,n:'escritorio'},{w:390,h:844,n:'celular'}]) {
    const pg = await b.newPage();
    await pg.setViewport({ width: vp.w, height: vp.h });
    await pg.goto(`http://localhost:${P}/`, { waitUntil:'networkidle0' });
    await new Promise(r=>setTimeout(r, 3000));

    // cajas reales del texto, con Range (no el rect del elemento)
    const cajas = await pg.evaluate(() => {
      const sel = [['.hero__titulo','#F1EFE2',48],['.hero__bajada','#F1EFE2',17],['.hero .volanta','#F8DD00',12],['.hero__pista','#F1EFE2',12],['.boton--linea','#F1EFE2',13],['.cabecera__nav a','#F1EFE2',12]];
      const out = [];
      for (const [s, color, px] of sel) {
        const el = document.querySelector(s); if (!el) continue;
        const rg = document.createRange(); rg.selectNodeContents(el);
        for (const r of rg.getClientRects()) {
          if (r.width > 6 && r.height > 6) out.push({ sel: s, color, px, x: r.x, y: r.y, w: r.width, h: r.height });
        }
      }
      return out;
    });

    // ocultar el texto sin mover el layout, y capturar el fondo limpio
    await pg.evaluate(() => {
      document.querySelectorAll('.hero__titulo, .hero__bajada, .hero .volanta, .hero__pista, .boton--linea, .cabecera__nav a')
        .forEach(e => { e.style.visibility = 'hidden'; });
    });
    await new Promise(r=>setTimeout(r, 250));
    const png = await pg.screenshot({ type:'png' });      // sólo el viewport
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
    const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i+1], data[i+2]]; };

    console.log(`\n── ${vp.n} ${vp.w}x${vp.h}`);
    const peorPorSel = {};
    for (const c of cajas) {
      const lTxt = lum(...[c.color.slice(1,3), c.color.slice(3,5), c.color.slice(5,7)].map(h => parseInt(h,16)));
      let peor = Infinity, peorLum = 0;
      for (let y = Math.max(0, Math.floor(c.y)); y < Math.min(info.height, Math.ceil(c.y + c.h)); y += 2) {
        for (let x = Math.max(0, Math.floor(c.x)); x < Math.min(info.width, Math.ceil(c.x + c.w)); x += 2) {
          const lf = lum(...px(x, y));
          const r = ratio(lTxt, lf);
          if (r < peor) { peor = r; peorLum = lf; }
        }
      }
      const k = c.sel;
      if (!peorPorSel[k] || peor < peorPorSel[k].r) peorPorSel[k] = { r: peor, l: peorLum, px: c.px };
    }
    for (const [sel, v] of Object.entries(peorPorSel)) {
      // AA: 4,5:1 para texto normal; 3:1 si es >=24px (o >=18,66px en negrita)
      const exige = v.px >= 24 ? 3 : 4.5;
      const ok = v.r >= exige;
      if (!ok) fallos++;
      console.log(`   ${ok ? 'OK ' : 'MAL'} ${sel.padEnd(16)} peor=${v.r.toFixed(2)}:1  (exige ${exige}:1, ${v.px}px)  fondo lum=${v.l.toFixed(3)}`);
    }
    await pg.close();
  }
  await b.close(); srv.close();
  console.log(fallos ? `\n${fallos} par(es) por debajo de AA` : '\ntodo el texto del hero pasa AA sobre la foto');
  process.exit(fallos ? 1 : 0);
})();
