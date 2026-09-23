/* Mapa del scroll muerto: donde empieza cada seccion, donde aparece su PRIMER
   texto, y cuanto se scrollea en el medio sin ver nada.
      node tools/hueco-mapa.cjs <puerto> [ancho] [alto]                             */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');

const P = Number(process.argv[2] || 4740);
const W = Number(process.argv[3] || 1920);
const H = Number(process.argv[4] || 1040);
const PASO = 40;

const SEL = '.cap__titulo,.cap__entrada,.volanta,.hito__dato,.hito__texto,' +
  '.claro__titulo,.claro__bajada,.tarjeta__nombre,.beneficio h3,.cita p,' +
  '.paso__titulo,.paso__texto,.manifiesto__titulo,.manifiesto__texto,' +
  '.salida__titulo,.tramite__paso p,.remate__titulo,.remate__frase,' +
  '.razon__titulo,.historia__anio,.cap__credito,.hero__titulo,.hero__bajada';

(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--force-prefers-reduced-motion=no-preference']
  });
  const p = await b.newPage();
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await p.goto(`http://localhost:${P}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));

  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const muestras = [];
  for (let y = 0; y < total - H; y += PASO) {
    await p.evaluate(y => window.scrollTo(0, y), y);
    await new Promise(r => setTimeout(r, 45));
    muestras.push([y, await p.evaluate((H, SEL) => {
      for (const el of document.querySelectorAll(SEL)) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 8 || r.top > H - 8 || !r.width || !r.height) continue;
        if (getComputedStyle(el).visibility === 'hidden') continue;
        let op = 1, n = el;
        while (n && n !== document.body) { op *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; }
        if (op > 0.28) {
          const s = el.closest('section,footer');
          return s ? (s.id || s.className.split(' ')[0]) : 'algo';
        }
      }
      return null;
    }, H, SEL)]);
  }

  await p.evaluate(() => window.scrollTo(0, 0));
  const topes = await p.evaluate(() => {
    const o = {};
    document.querySelectorAll('main section[id], .hero').forEach(s => {
      o[s.id || 'hero'] = Math.round(s.getBoundingClientRect().top + window.scrollY);
    });
    return o;
  });

  console.log(`\npuerto ${P} · ${W}x${H} · documento ${total}px\n`);
  console.log('hueco                      largo        lo que estabas mirando -> lo que aparece');
  let ini = null, antes = null;
  for (let i = 0; i < muestras.length; i++) {
    const [y, q] = muestras[i];
    if (!q && ini === null) { ini = y; antes = i ? muestras[i - 1][1] : '(arriba de todo)'; }
    if (q && ini !== null) {
      const d = y - ini;
      if (d >= 300) {
        console.log(`  ${String(ini).padStart(5)} → ${String(y).padEnd(6)}  ${String(d).padStart(5)}px ` +
          `(${(d / H).toFixed(2)} pant.)  ${String(antes).padEnd(12)} -> ${q}`);
      }
      ini = null;
    }
  }
  console.log('\ntope de cada seccion:');
  Object.entries(topes).forEach(([k, v]) => console.log(`   ${k.padEnd(12)} ${v}`));
  await b.close();
})();
