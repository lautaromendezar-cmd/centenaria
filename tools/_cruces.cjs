/* Hoja de contactos de los CRUCES de escena: para cada cambio, el antes (mez~0),
   el medio (mez~.5) y el despues (mez~1). El medio es donde se juega el impacto. */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core'), sharp = req('sharp');
const P = Number(process.argv[2] || 4740);
const W = 1280, H = 720;

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--hide-scrollbars','--enable-unsafe-swiftshader','--use-angle=swiftshader'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: W, height: H });
  /* el estado del motor vive en un closure de main.js. En vez de tocar el repo,
     envuelvo Monte.iniciar apenas el script lo define y me quedo con el estado. */
  await pg.evaluateOnNewDocument(() => {
    let _M;
    Object.defineProperty(window, 'Monte', {
      configurable: true,
      get() { return _M; },
      set(v) {
        _M = v;
        if (v && v.iniciar) {
          const orig = v.iniciar;
          v.iniciar = function () { const r = orig.apply(this, arguments);
            if (r && r.estado) window.__e = r.estado; return r; };
        }
      }
    });
  });
  await pg.goto(`http://localhost:${P}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3500));

  const alto = await pg.evaluate(() => document.body.scrollHeight);
  /* barrido fino: guardo para cada paso el valor de e.escena */
  const muestras = [];
  const PASOS = 260;
  for (let i = 0; i <= PASOS; i++) {
    const y = Math.round(alto * i / PASOS);
    await pg.evaluate(v => window.scrollTo(0, v), y);
    await new Promise(r => setTimeout(r, 32));
    const esc = await pg.evaluate(() => (window.__e ? window.__e.escena : null));
    muestras.push({ y, esc });
  }
  const validas = muestras.filter(m => m.esc != null);
  if (!validas.length) { console.log('no pude leer e.escena — falta exponerlo'); await b.close(); return; }

  /* para cada cruce k -> k+1, busco el y mas cercano a k, k+.5, k+1 */
  const objetivo = v => validas.reduce((a, m) => Math.abs(m.esc - v) < Math.abs(a.esc - v) ? m : a);
  const NOMBRES = ['hero→historia','historia→origen','origen→variedades','variedades→porqué','porqué→ritual','ritual→cierre'];
  const filas = [];
  for (let k = 0; k < 6; k++) {
    const tomas = [];
    for (const f of [0, .5, 1]) {
      const m = objetivo(k + f);
      await pg.evaluate(v => window.scrollTo(0, v), m.y);
      await new Promise(r => setTimeout(r, 420));
      tomas.push({ buf: await pg.screenshot({ type: 'jpeg', quality: 82 }), esc: m.esc });
    }
    filas.push({ nombre: NOMBRES[k], tomas });
    console.log(NOMBRES[k].padEnd(20) + tomas.map(t => t.esc.toFixed(2)).join('  '));
  }
  await b.close();

  const an = 420, al = Math.round(an * H / W), g = 5;
  const piezas = [];
  filas.forEach((f, r) => f.tomas.forEach(async (t, c) => {}));
  const comps = [];
  for (let r = 0; r < filas.length; r++)
    for (let c = 0; c < 3; c++)
      comps.push({ input: await sharp(filas[r].tomas[c].buf).resize({ width: an }).toBuffer(),
                   left: c * (an + g) + g, top: r * (al + g) + g });
  await sharp({ create: { width: 3 * (an + g) + g, height: filas.length * (al + g) + g,
    channels: 3, background: '#111' } }).composite(comps).jpeg({ quality: 84 })
    .toFile('tools/_qc-cruces.jpg');
  console.log('\ncolumnas: antes | MEDIO DEL CRUCE | despues');
  console.log('-> tools/_qc-cruces.jpg');
})();
