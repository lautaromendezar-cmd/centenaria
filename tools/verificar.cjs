/* Verificación con Chrome real: sirve el sitio, lo recorre, saca capturas
   y chequea lo que NO se ve mirando (errores de consola, reveals que
   quedaron invisibles, orden de foco, alt faltantes). */
const { createRequire } = require('module');
const req = createRequire('C:/Users/Lautaro/Desktop/Claude/latina/node_modules/');
const puppeteer = req('puppeteer-core');
const sharp = req('sharp');
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = 4735;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };

function servidor() {
  return http.createServer((rq, rs) => {
    let u = decodeURIComponent(rq.url.split('?')[0]);
    if (u.endsWith('/')) u += 'index.html';
    const f = path.join(RAIZ, u);
    if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      rs.writeHead(404); return rs.end('404');
    }
    rs.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(rs);
  }).listen(PUERTO); alListen(srv, PUERTO);
}


function alListen(srv, p) {
  srv.on('error', e => {
    console.error(e.code === 'EADDRINUSE'
      ? `PUERTO ${p} OCUPADO por otro proceso (probablemente un dev server de otro proyecto). NO lo mato: cambiá PUERTO en este script.`
      : 'error del servidor: ' + e.message);
    process.exit(2);
  });
}

(async () => {
  const srv = servidor();
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--force-device-scale-factor=1', '--hide-scrollbars']
  });

  const problemas = [];
  const anchos = [{ w: 1440, h: 900, n: 'escritorio' }, { w: 390, h: 844, n: 'celular' }];

  for (const vp of anchos) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h, deviceScaleFactor: 1 });

    const consola = [];
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consola.push(m.type().toUpperCase() + ': ' + m.text()); });
    page.on('pageerror', e => consola.push('PAGEERROR: ' + e.message));
    page.on('requestfailed', r => consola.push('REQ FALLIDA: ' + r.url().slice(0, 110)));
    page.on('response', r => { if (r.status() >= 400) consola.push('HTTP ' + r.status() + ': ' + r.url().slice(0, 110)); });

    await page.goto(`http://localhost:${PUERTO}/`, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(r => setTimeout(r, 2600)); // que corra la timeline del hero

    const estado = await page.evaluate(() => ({
      gsap: !!window.gsap,
      st: !!window.ScrollTrigger,
      clases: document.documentElement.className,
      alto: document.body.scrollHeight
    }));
    console.log(`\n── ${vp.n} ${vp.w}x${vp.h} · GSAP:${estado.gsap} ST:${estado.st} html="${estado.clases}" alto=${estado.alto}px`);

    if (!estado.gsap) problemas.push(`[${vp.n}] GSAP no cargó`);
    if (!estado.clases.includes('anim-ok')) problemas.push(`[${vp.n}] main.js no marcó anim-ok`);
    if (estado.clases.includes('reveal-forzado')) problemas.push(`[${vp.n}] saltó el respaldo: main.js tardó más de 2,2 s`);

    // recorrer toda la página para disparar todos los ScrollTrigger
    const capturas = [];
    const PASOS = 14;
    for (let i = 0; i <= PASOS; i++) {
      const y = Math.round((estado.alto - vp.h) * (i / PASOS));
      await page.evaluate(v => window.scrollTo(0, v), y);
      await new Promise(r => setTimeout(r, 620));
      if (vp.w === 1440) capturas.push(await page.screenshot({ type: 'jpeg', quality: 72 }));
    }
    await new Promise(r => setTimeout(r, 900));

    // ¿quedó algo invisible después de haber pasado por encima?
    const invisibles = await page.evaluate(() => {
      const malos = [];
      document.querySelectorAll('[data-reveal], [data-viaje], [data-paso], .pal, .lin, .escala__marca, .escala__eje, .nerv path').forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        // un trazo a medio dibujar también es un fallo, no sólo la opacidad
        const off = parseFloat(cs.strokeDashoffset || '0');
        if (off > 1) { malos.push(el.tagName + ' trazo sin dibujar, dashoffset=' + Math.round(off)); return; }
        if (parseFloat(cs.opacity) < .9 && el.getBoundingClientRect().width > 0) {
          malos.push((el.tagName + '.' + (el.className || '').toString().split(' ')[0]).slice(0, 48) +
                     ' op=' + cs.opacity + ' «' + el.textContent.trim().slice(0, 26) + '»');
        }
      });
      return malos.slice(0, 12);
    });
    if (invisibles.length) problemas.push(`[${vp.n}] ${invisibles.length} elementos siguen invisibles: ` + invisibles.join(' | '));

    // desbordes horizontales
    // lo que importa no es que un rect se pase, sino que la pagina scrollee
    // de costado: un hijo desbordado adentro de un overflow:hidden no molesta
    const scrollLateral = await page.evaluate(() => {
      const de = document.documentElement;
      window.scrollTo(200, window.scrollY);
      const x = window.scrollX;
      window.scrollTo(0, window.scrollY);
      return { x, ancho: de.scrollWidth, cliente: de.clientWidth };
    });
    if (scrollLateral.x > 0)
      problemas.push(`[${vp.n}] LA PAGINA SCROLLEA DE COSTADO ${scrollLateral.x}px (scrollWidth ${scrollLateral.ancho} vs ${scrollLateral.cliente})`);

    // imágenes sin alt y rotas
    const imgs = await page.evaluate(() => {
      const sinAlt = [], rotas = [];
      document.querySelectorAll('img').forEach(i => {
        if (!i.alt) sinAlt.push(i.getAttribute('src'));
        if (i.complete && i.naturalWidth === 0) rotas.push(i.getAttribute('src'));
      });
      return { sinAlt, rotas };
    });
    if (imgs.sinAlt.length) problemas.push(`[${vp.n}] img sin alt: ` + imgs.sinAlt.join(', '));
    if (imgs.rotas.length) problemas.push(`[${vp.n}] IMG ROTAS: ` + imgs.rotas.join(', '));

    if (consola.length) problemas.push(`[${vp.n}] consola: ` + [...new Set(consola)].slice(0, 6).join(' | '));

    // hoja de contactos del recorrido
    if (capturas.length) {
      const mini = [];
      for (let i = 0; i < capturas.length; i++) {
        mini.push({ input: await sharp(capturas[i]).resize({ width: 330 }).toBuffer(),
          left: (i % 5) * 340 + 8, top: Math.floor(i / 5) * 216 + 8 });
      }
      await sharp({ create: { width: 5 * 340 + 8, height: Math.ceil(mini.length / 5) * 216 + 8, channels: 3, background: '#000' } })
        .composite(mini).jpeg({ quality: 80 }).toFile('tools/_qc-scroll.jpg');
    }
    await page.close();
  }

  await browser.close();
  srv.close();

  console.log('\n═══ RESULTADO ═══');
  if (!problemas.length) console.log('sin problemas');
  else problemas.forEach(p => console.log('· ' + p));
  process.exit(problemas.length ? 1 : 0);
})();
