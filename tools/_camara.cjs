/* ¿La camara se mueve DENTRO de cada capitulo, o solo en el cruce?
   Barre la pagina y reporta z (el empuje) de la escena que manda en cada punto. */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');
const P = Number(process.argv[2] || 4740);
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--hide-scrollbars','--enable-unsafe-swiftshader','--use-angle=swiftshader'] });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1280, height: 720 });
  await pg.evaluateOnNewDocument(() => {
    let _M;
    Object.defineProperty(window, 'Monte', { configurable: true, get(){return _M;},
      set(v){ _M=v; if(v&&v.iniciar){const o=v.iniciar; v.iniciar=function(){const r=o.apply(this,arguments);
        if(r&&r.estado) window.__e=r.estado; return r;};}}});
  });
  await pg.goto(`http://localhost:${P}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));
  const alto = await pg.evaluate(() => document.body.scrollHeight);
  const NOM = ['historia','origen','variedades','porque','ritual','cierre'];
  console.log(' %pag  escena   z de la escena que manda   deriva');
  const zs = [];
  for (let i = 0; i <= 40; i++) {
    const y = Math.round(alto * i / 40);
    await pg.evaluate(v => window.scrollTo(0, v), y);
    await new Promise(r => setTimeout(r, 55));
    const d = await pg.evaluate(() => {
      const e = window.__e; if (!e) return null;
      const idx = Math.max(0, e.escena), iA = Math.floor(idx), mez = idx - iA;
      const dom = mez > .5 ? iA : iA - 1;          /* la que pesa mas */
      const c = e.camaras[Math.max(0, dom)] || {};
      return { esc: e.escena, dom, z: c.z, dy: c.dy };
    });
    if (!d) continue;
    zs.push(d);
    const barra = '#'.repeat(Math.max(0, Math.round((d.z - 1.04) / .11 * 26)));
    console.log(String(Math.round(i/40*100)).padStart(4) + '%  ' +
      d.esc.toFixed(2).padStart(5) + '  ' + (NOM[d.dom]||'-').padEnd(11) +
      (d.z != null ? d.z.toFixed(3) : ' -   ') + ' ' + barra);
  }
  await b.close();
  const mov = zs.filter(d => d.z != null);
  const rangos = {};
  mov.forEach(d => { const k = NOM[d.dom] || '-'; rangos[k] = rangos[k] || [9,0];
    rangos[k][0] = Math.min(rangos[k][0], d.z); rangos[k][1] = Math.max(rangos[k][1], d.z); });
  console.log('\nrecorrido de la camara por escena (min -> max):');
  for (const k in rangos) console.log('  ' + k.padEnd(12) + rangos[k][0].toFixed(3) + ' -> ' + rangos[k][1].toFixed(3) +
    (rangos[k][1] - rangos[k][0] > .02 ? '   se mueve' : '   CLAVADA'));
})();
