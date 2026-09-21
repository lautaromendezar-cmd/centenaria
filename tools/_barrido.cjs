/* Un solo cruce, paso a paso: 6 fotogramas de mez 0 a 1 para ver el barrido
   avanzar. El del medio es el que antes era un pure marron.
      node tools/_barrido.cjs 4740 [nroCruce 1..6]                              */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core'), sharp = req('sharp');
const P = Number(process.argv[2] || 4740);
const K = Number(process.argv[3] || 2);
const W = 1280, H = 720;
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--hide-scrollbars','--enable-unsafe-swiftshader','--use-angle=swiftshader'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: W, height: H });
  /* la maquina puede tener las animaciones apagadas (Windows: "Mostrar animaciones"),
     y Chrome lo traduce a prefers-reduced-motion: el sitio tomaria el camino quieto */
  await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await pg.evaluateOnNewDocument(() => {
    let _M;
    Object.defineProperty(window, 'Monte', { configurable: true, get(){return _M;},
      set(v){ _M=v; if(v&&v.iniciar){const o=v.iniciar; v.iniciar=function(){const r=o.apply(this,arguments);
        if(r&&r.estado) window.__e=r.estado; return r;};}}});
  });
  await pg.goto(`http://localhost:${P}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));
  const alto = await pg.evaluate(() => document.body.scrollHeight);
  const m = [];
  for (let i = 0; i <= 300; i++) {
    const y = Math.round(alto * i / 300);
    await pg.evaluate(v => window.scrollTo(0, v), y);
    await new Promise(r => setTimeout(r, 26));
    const esc = await pg.evaluate(() => window.__e ? window.__e.escena : null);
    if (esc != null) m.push({ y, esc });
  }
  const cerca = v => m.reduce((a, x) => Math.abs(x.esc - v) < Math.abs(a.esc - v) ? x : a);
  const tomas = [];
  for (const f of [0, .2, .4, .5, .7, 1]) {
    const t = cerca(K - 1 + f);
    await pg.evaluate(v => window.scrollTo(0, v), t.y);
    await new Promise(r => setTimeout(r, 450));
    tomas.push({ buf: await pg.screenshot({ type:'jpeg', quality:84 }), esc: t.esc });
    console.log('  mez pedido ' + f.toFixed(2) + '  ->  escena ' + t.esc.toFixed(3));
  }
  await b.close();
  const an = 420, al = Math.round(an*H/W), g = 5, cols = 3;
  const comps = [];
  for (let i = 0; i < tomas.length; i++)
    comps.push({ input: await sharp(tomas[i].buf).resize({ width: an }).toBuffer(),
      left: (i%cols)*(an+g)+g, top: Math.floor(i/cols)*(al+g)+g });
  await sharp({ create:{ width: cols*(an+g)+g, height: 2*(al+g)+g, channels:3, background:'#111' } })
    .composite(comps).jpeg({ quality:86 }).toFile('tools/_qc-barrido.jpg');
  console.log('-> tools/_qc-barrido.jpg');
})();
