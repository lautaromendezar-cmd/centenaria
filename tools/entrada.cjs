/* La entrada: tira de fotogramas de los primeros segundos + LCP real.
   MEDIDO acá, y no es obvio: en esta pagina el LCP es SIEMPRE el bloque de texto
   mas grande del hero. Dos motivos que se suman:
     - un <canvas> no es candidato a LCP nunca (no esta en la lista);
     - Chrome descarta las imagenes que cubren el viewport entero, las toma por
       fondo. La misma imagen a 1400x800 SI califica; a 1440x900 no.
   O sea que no hay imagen que salve la metrica: lo unico que la mueve es que el
   texto del hero pinte temprano. Por eso el umbral de abajo es sobre el tiempo,
   no sobre quien gana.

      node tools/servir.cjs 4740
      node tools/entrada.cjs 4740          -> tools/_qc-entrada.jpg                   */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');
const sharp = req('sharp');

const P = Number(process.argv[2] || 4740);
const W = 1440, H = 900;
const MARCAS = [120, 400, 700, 1000, 1400, 1800, 2300, 2900];

(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  });
  const pg = await b.newPage();
  await pg.setViewport({ width: W, height: H });
  /* la maquina puede tener las animaciones apagadas (Windows: "Mostrar animaciones"),
     y Chrome lo traduce a prefers-reduced-motion: el sitio tomaria el camino quieto */
  await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await pg.setCacheEnabled(false);

  await pg.evaluateOnNewDocument(() => {
    window.__lcp = null; window.__lcps = []; window.__cortinaFuera = null;
    new PerformanceObserver(l => {
      for (const u of l.getEntries()) {
        const d = { t: Math.round(u.startTime), tag: u.element ? u.element.tagName : '?',
          cls: u.element ? (u.element.className || '').toString().slice(0, 34) : '',
          src: (u.url || '').split('/').pop(), size: u.size };
        window.__lcps.push(d); window.__lcp = d;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    /* cuando la cortina deja de tapar */
    addEventListener('DOMContentLoaded', () => {
      const c = document.querySelector('.cortina');
      if (!c) return;
      const t0 = performance.now();
      const iv = setInterval(() => {
        if (getComputedStyle(c).display === 'none') { window.__cortinaFuera = Math.round(performance.now()); clearInterval(iv); }
        if (performance.now() - t0 > 9000) clearInterval(iv);
      }, 60);
    });
  });

  const t0 = Date.now();
  await pg.goto(`http://localhost:${P}/`, { waitUntil: 'domcontentloaded' });
  const shots = [];
  for (const ms of MARCAS) {
    const falta = ms - (Date.now() - t0);
    if (falta > 0) await new Promise(r => setTimeout(r, falta));
    shots.push({ ms, buf: await pg.screenshot({ type: 'jpeg', quality: 80 }) });
  }
  await new Promise(r => setTimeout(r, 2500));
  const info = await pg.evaluate(() => ({ lcp: window.__lcp, lcps: window.__lcps, cortinaFuera: window.__cortinaFuera }));
  await b.close();

  const an = 470, al = Math.round(an * H / W), g = 6, cols = 4;
  const piezas = await Promise.all(shots.map(async (s, i) => ({
    input: await sharp(s.buf).resize({ width: an }).toBuffer(),
    left: (i % cols) * (an + g) + g, top: Math.floor(i / cols) * (al + g) + g
  })));
  await sharp({ create: { width: cols * (an + g) + g, height: 2 * (al + g) + g, channels: 3, background: '#0b0b0b' } })
    .composite(piezas).jpeg({ quality: 86 }).toFile('tools/_qc-entrada.jpg');

  console.log('fotogramas en ms:', MARCAS.join(', '));
  (info.lcps || []).forEach(e => console.log(`   candidato ${String(e.t).padStart(5)} ms  area=${String(e.size).padStart(7)}  <${e.tag} class="${e.cls}"> ${e.src}`));
  console.log('LCP:', info.lcp ? `${info.lcp.t} ms  <${info.lcp.tag} class="${info.lcp.cls}"> ${info.lcp.src}` : 'no medido');
  console.log('cortina fuera a los:', info.cortinaFuera != null ? info.cortinaFuera + ' ms' : 'NUNCA');
  const TOPE = 1700;   /* corrida local, sin cache y con GL por software */
  if (!info.lcp || info.lcp.t > TOPE) {
    console.log(`
⚠ LCP ${info.lcp ? info.lcp.t : '?'} ms, por encima de ${TOPE}: la cortina o la entrada demoran el texto`);
    process.exit(1);
  }
  console.log(`
LCP dentro de ${TOPE} ms`);
  console.log('-> tools/_qc-entrada.jpg');
})();
