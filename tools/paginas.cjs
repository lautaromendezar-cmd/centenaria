/* Paginas internas: errores de consola, imagenes que no cargan, alts vacios en
   imagenes con contenido, y que todo enlace interno responda 200.
      MSYS_NO_PATHCONV=1 node tools/paginas.cjs 4740 /variedades/original/ /contacto/ ...
   (MSYS_NO_PATHCONV: en Git Bash un argumento que empieza con / se convierte en
   ruta de Windows y Chrome recibe una URL invalida)                              */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');
const http = require('http');
const P = Number(process.argv[2] || 4740);
const RUTAS = process.argv.slice(3);

function estado(ruta) {
  return new Promise(res => {
    http.get({ host: 'localhost', port: P, path: ruta }, r => { r.resume(); res(r.statusCode); }).on('error', () => res(0));
  });
}

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  let fallos = 0;
  for (const ruta of RUTAS) {
    const p = await b.newPage();
    const errores = [];
    p.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    p.on('pageerror', e => errores.push('pageerror ' + e.message));
    p.on('requestfailed', r => errores.push('requestfailed ' + r.url()));
    await p.setViewport({ width: 1440, height: 900 });
    await p.goto(`http://localhost:${P}${ruta}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 800));
    const info = await p.evaluate(() => {
      const imgs = [...document.images].map(i => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, alt: i.getAttribute('alt') }));
      const links = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
      const h1 = document.querySelectorAll('h1').length;
      const titulo = document.title;
      const canon = (document.querySelector('link[rel=canonical]') || {}).href;
      return { imgs, links, h1, titulo, canon };
    });
    const rotas = info.imgs.filter(i => !i.ok);
    const sinAlt = info.imgs.filter(i => i.alt === null);
    const internos = [...new Set(info.links.filter(h => h.startsWith('/') && !h.startsWith('//')))];
    const malos = [];
    for (const h of internos) {
      const ruta2 = h.split('#')[0] || '/';
      const st = await estado(ruta2);
      if (st !== 200) malos.push(`${h} -> ${st}`);
    }
    const ok = !errores.length && !rotas.length && !sinAlt.length && !malos.length && info.h1 === 1;
    if (!ok) fallos++;
    console.log(`${ok ? 'OK ' : 'MAL'} ${ruta}  «${info.titulo}»  h1=${info.h1}  imgs=${info.imgs.length}  enlaces internos=${internos.length}`);
    errores.forEach(e => console.log('     consola:', e));
    rotas.forEach(i => console.log('     imagen rota:', i.src));
    sinAlt.forEach(i => console.log('     sin alt:', i.src));
    malos.forEach(m => console.log('     enlace:', m));
    await p.close();
  }
  await b.close();
  console.log(fallos ? `\n${fallos} pagina(s) con problemas` : '\ntodas las paginas bien');
  process.exit(fallos ? 1 : 0);
})();
