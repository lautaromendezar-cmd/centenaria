/* Hoja de contactos de los PASAJES: para cada tramo entre capitulos, siete
   cuadros desde que el texto anterior se va hasta que asoma el titulo siguiente.
   Es la vista que importa para esta feature: el mundo tiene que recuperar la
   pantalla (velo abajo, cruce y camara a la vista) y el texto no puede pisarlo.
   Imprime ademas e.escena y la opacidad del velo en cada cuadro.

   Contra el servidor que ya este levantado:
      node tools/servir.cjs 4740
      node tools/pasajes.cjs 4740              -> tools/_qc-pasajes.jpg
      node tools/pasajes.cjs 4740 390 844      -> tools/_qc-pasajes-movil.jpg     */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');
const sharp = req('sharp');

const P = Number(process.argv[2] || 4740);
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);
const MOVIL = W < 900;
const PUNTOS = [-.45, -.22, -.05, .12, .30, .48, .66];   /* fraccion de pantalla: pasaje.top - scrollY */

(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  });
  const pg = await b.newPage();
  await pg.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await pg.evaluateOnNewDocument(() => {
    let _M;
    Object.defineProperty(window, 'Monte', { configurable: true, get() { return _M; },
      set(v) { _M = v; if (v && v.iniciar) { const o = v.iniciar; v.iniciar = function () {
        const r = o.apply(this, arguments); if (r && r.estado) window.__e = r.estado; return r; }; } } });
  });
  const errores = [];
  pg.on('pageerror', e => errores.push('pageerror: ' + e.message));
  pg.on('requestfailed', r => errores.push('fail: ' + r.url().replace(/^https?:\/\/[^/]+/, '')));
  pg.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text()); });
  await pg.goto(`http://localhost:${P}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));

  const pasajes = await pg.evaluate(() => Array.from(document.querySelectorAll('.pasaje')).map(p => {
    const r = p.getBoundingClientRect(); return { top: r.top + scrollY, alto: r.height };
  }));
  console.log(`pasajes: ${pasajes.length}, alto ${pasajes[0] ? (pasajes[0].alto / H).toFixed(2) : '-'} pantallas; documento ${(await pg.evaluate(() => document.documentElement.scrollHeight) / H).toFixed(1)} pantallas`);

  const filas = [];
  const esc = MOVIL ? .5 : .28;
  const cw = Math.round(W * esc), ch = Math.round(H * esc);
  for (let i = 0; i < pasajes.length; i++) {
    const p = pasajes[i];
    const cuadros = [];
    const info = [];
    for (const f of PUNTOS) {
      /* f = posicion del top del pasaje en pantallas: -.2 => 20% arriba del viewport */
      const y = Math.round(p.top + f * H);
      await pg.evaluate(v => window.scrollTo(0, v), y);
      await new Promise(r => setTimeout(r, 950));
      const st = await pg.evaluate(() => ({
        esc: window.__e ? +window.__e.escena.toFixed(2) : null,
        velo: +getComputedStyle(document.querySelector('.mundo__sombra')).opacity
      }));
      info.push(`${f >= 0 ? '+' : ''}${f.toFixed(2)}: esc ${st.esc} velo ${st.velo.toFixed(2)}`);
      const png = await pg.screenshot({ type: 'png' });
      cuadros.push(await sharp(png).resize(cw, ch).png().toBuffer());
    }
    console.log(`pasaje ${i + 1}: ` + info.join(' | '));
    filas.push(cuadros);
  }
  const gap = 4;
  const filaW = cuadros_w(PUNTOS.length), totalH = filas.length * (ch + gap);
  function cuadros_w(n) { return n * (cw + gap); }
  const comp = [];
  filas.forEach((fila, r) => fila.forEach((buf, c) => comp.push({ input: buf, left: c * (cw + gap), top: r * (ch + gap) })));
  const out = `tools/_qc-pasajes${MOVIL ? '-movil' : ''}.jpg`;
  await sharp({ create: { width: filaW, height: totalH, channels: 3, background: '#222' } })
    .composite(comp).jpeg({ quality: 82 }).toFile(out);
  console.log('->', out);
  if (errores.length) console.log('ERRORES:\n  ' + errores.join('\n  '));
  await b.close();
})();
