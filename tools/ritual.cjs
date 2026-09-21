/* Hoja de contactos del RITUAL FIJADO: doce cuadros a lo largo del pin, desde
   que la seccion se fija hasta que se suelta. Es la vista que importa para esta
   escena: el mate tiene que transformarse paso a paso, con UN solo paso de
   texto en pantalla por vez, y nada pisandose con la cabeza ni con el mate.
   Imprime el progreso del pin, que paso esta visible y la opacidad del disco.

   Contra el servidor que ya este levantado:
      node tools/servir.cjs 4740
      node tools/ritual.cjs 4740              -> tools/_qc-ritual.jpg
      node tools/ritual.cjs 4740 390 844      -> tools/_qc-ritual-movil.jpg     */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');
const sharp = req('sharp');

const P = Number(process.argv[2] || 4740);
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);
const MOVIL = W < 900;
const PUNTOS = [-.3, 0, .08, .16, .25, .34, .43, .52, .61, .70, .80, .90, 1, 1.35];

(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  });
  const pg = await b.newPage();
  await pg.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  /* la maquina puede tener las animaciones apagadas (Windows: "Mostrar animaciones"),
     y Chrome lo traduce a prefers-reduced-motion: el sitio tomaria el camino quieto */
  await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  const errores = [];
  pg.on('pageerror', e => errores.push('pageerror: ' + e.message));
  pg.on('requestfailed', r => errores.push('fail: ' + r.url().replace(/^https?:\/\/[^/]+/, '')));
  pg.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text()); });
  await pg.goto(`http://localhost:${P}/`, { waitUntil: 'networkidle0', timeout: 90000 });
  await new Promise(r => setTimeout(r, 3000));

  const pin = await pg.evaluate(() => {
    const t = ScrollTrigger.getAll().find(t => t.vars.pin && t.trigger && t.trigger.id === 'ritual');
    return t ? { start: t.start, end: t.end } : null;
  });
  if (!pin) { console.log('el ritual NO esta fijado (sin pin en #ritual)'); await b.close(); process.exit(1); }
  console.log(`pin de #ritual: ${Math.round(pin.start)} -> ${Math.round(pin.end)} (${((pin.end - pin.start) / H).toFixed(2)} pantallas); documento ${(await pg.evaluate(() => document.documentElement.scrollHeight) / H).toFixed(1)} pantallas`);

  const esc = MOVIL ? .5 : .28;
  const cw = Math.round(W * esc), ch = Math.round(H * esc);
  const cuadros = [];
  for (const f of PUNTOS) {
    const y = Math.round(pin.start + f * (pin.end - pin.start));
    await pg.evaluate(v => window.scrollTo(0, v), y);
    await new Promise(r => setTimeout(r, 1000));
    const st = await pg.evaluate(() => {
      const vis = Array.from(document.querySelectorAll('#ritual .paso')).map((p, i) => [i + 1, +getComputedStyle(p).opacity])
        .filter(([, o]) => o > .05).map(([i, o]) => `${i}:${o.toFixed(2)}`);
      const d = document.getElementById('disco'), r = d.getBoundingClientRect();
      const tip = document.querySelector('#ritual .tip');
      /* se pisa algo? cabeza vs disco, disco vs paso */
      const cab = document.querySelector('#ritual .cap__cabeza').getBoundingClientRect();
      const paso = document.querySelector('#ritual .pasos').getBoundingClientRect();
      const cruza = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const discoOp = +getComputedStyle(d).opacity;
      return {
        pasos: vis.join(' ') || '-', disco: discoOp.toFixed(2),
        cx: Math.round((r.left + r.width / 2) / innerWidth * 100), cy: Math.round((r.top + r.height / 2) / innerHeight * 100),
        tip: tip ? (+getComputedStyle(tip).opacity).toFixed(2) : '-',
        pisa: discoOp > .5 ? [cruza(cab, r) ? 'cabeza' : '', cruza(paso, r) ? 'paso' : ''].filter(Boolean).join('+') : ''
      };
    });
    console.log(`${(f >= 0 ? '+' : '') + f.toFixed(2)}: pasos [${st.pasos}]  disco ${st.disco} en ${st.cx}%,${st.cy}%  tip ${st.tip}${st.pisa ? '  PISA ' + st.pisa : ''}`);
    const png = await pg.screenshot({ type: 'png' });
    cuadros.push(await sharp(png).resize(cw, ch).png().toBuffer());
  }
  const gap = 4, cols = MOVIL ? 7 : 7;
  const filas = Math.ceil(cuadros.length / cols);
  const comp = cuadros.map((buf, i) => ({ input: buf, left: (i % cols) * (cw + gap), top: Math.floor(i / cols) * (ch + gap) }));
  const out = `tools/_qc-ritual${MOVIL ? '-movil' : ''}.jpg`;
  await sharp({ create: { width: cols * (cw + gap), height: filas * (ch + gap), channels: 3, background: '#222' } })
    .composite(comp).jpeg({ quality: 82 }).toFile(out);
  console.log('->', out);
  if (errores.length) console.log('ERRORES:\n  ' + errores.join('\n  '));
  await b.close();
})();
