/* Contraste de TODA la home sobre el fondo real compuesto (mundo + velo + sombra +
   grano + vinieta). Generaliza tools/contraste-hero.cjs a los capitulos, que es
   donde el riesgo es mayor: ahi el texto cae sobre una foto que ademas se mueve.

   Metodo: se scrollea hasta la seccion, se oculta el texto con visibility (sin mover
   el layout), se captura y se mide el PEOR pixel detras de cada linea. Se usa Range
   para la caja real de las lineas — el rect del elemento incluye aire que el texto
   no ocupa y regala contraste.

      node tools/servir.cjs 4740
      node tools/contraste.cjs 4740                                                  */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');
const sharp = req('sharp');

const P = Number(process.argv[2] || 4740);

const lum = (r, g, b) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/* seccion -> que texto mirar. El color es el declarado en la hoja; el tamano decide
   el umbral AA (3:1 desde 24px, 4,5:1 abajo de eso). */
const PLAN = [
  ['#historia', [['.cap__titulo', 48], ['.cap__entrada', 17], ['.hito__dato', 60], ['.hito__texto', 16], ['.volanta', 12]]],
  ['#origen',   [['.cap__titulo', 48], ['.cap__entrada', 17], ['.cadena__causa', 16], ['.cadena__efecto', 16], ['.cadena__sentis', 17]]],
  ['#variedades', [['.claro__titulo', 48], ['.claro__bajada', 17], ['.ficha__nombre', 28], ['.ficha__texto', 16], ['.escala__quien', 21], ['.escala__nota', 14]]],
  /* Las fichas quedan ABAJO DEL PLIEGUE cuando se mira #variedades desde arriba,
     asi que en escritorio no se median. Desde que los envases dejaron la tarjeta
     blanca ese texto es crema sobre el mundo y hay que mirarlo: va aparte. */
  ['.fichas', [['.ficha__nombre', 28], ['.ficha__sub', 12], ['.ficha__texto', 16], ['.chips li', 12]]],
  ['#ritual',   [['.cap__titulo', 48], ['.paso__titulo', 28], ['.paso__texto', 16], ['.tip', 16]]],
  ['#porque',   [['.beneficio h3', 24], ['.beneficio p', 16], ['.cita p', 40]]],
  ['#comprar',  [['.cap__titulo', 48], ['.puerta__titulo', 28], ['.puerta__texto', 16], ['.contacto__lista a', 18], ['.proceso', 16]]]
];

(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  });
  let fallos = 0;

  for (const vp of [{ w: 1440, h: 900, n: 'escritorio' }, { w: 390, h: 844, n: 'celular' }]) {
    const pg = await b.newPage();
    await pg.setViewport({ width: vp.w, height: vp.h });
    await pg.goto(`http://localhost:${P}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 3000));
    console.log(`\n════ ${vp.n} ${vp.w}x${vp.h}`);

    for (const [seccion, sels] of PLAN) {
      const hay = await pg.evaluate(s => !!document.querySelector(s), seccion);
      if (!hay) continue;
      await pg.evaluate(s => {
        const el = document.querySelector(s);
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 40);
      }, seccion);
      await new Promise(r => setTimeout(r, 1300));

      /* cajas reales de cada linea, y el color efectivo que el navegador aplica */
      const cajas = await pg.evaluate((s, sels) => {
        const sec = document.querySelector(s), out = [];
        for (const [sel, px] of sels) {
          for (const el of sec.querySelectorAll(sel)) {
            const cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .5) continue;
            const rg = document.createRange(); rg.selectNodeContents(el);
            for (const r of rg.getClientRects()) {
              if (r.width > 8 && r.height > 6 && r.top > -20 && r.bottom < innerHeight + 20)
                out.push({ sel, px, color: cs.color, x: r.x, y: r.y, w: r.width, h: r.height });
            }
          }
        }
        return out;
      }, seccion, sels);
      if (!cajas.length) { console.log(`   ${seccion}: nada visible en pantalla`); continue; }

      await pg.evaluate((s, sels) => {
        const sec = document.querySelector(s);
        for (const [sel] of sels) sec.querySelectorAll(sel).forEach(e => { e.style.visibility = 'hidden'; });
      }, seccion, sels);
      await new Promise(r => setTimeout(r, 260));
      const png = await pg.screenshot({ type: 'png' });
      const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
      const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
      await pg.evaluate((s, sels) => {
        const sec = document.querySelector(s);
        for (const [sel] of sels) sec.querySelectorAll(sel).forEach(e => { e.style.visibility = ''; });
      }, seccion, sels);

      const peor = {};
      for (const c of cajas) {
        const m = c.color.match(/\d+/g) || [255, 255, 255];
        const lTxt = lum(+m[0], +m[1], +m[2]);
        let r0 = Infinity;
        for (let y = Math.max(0, Math.floor(c.y)); y < Math.min(info.height, Math.ceil(c.y + c.h)); y += 2)
          for (let x = Math.max(0, Math.floor(c.x)); x < Math.min(info.width, Math.ceil(c.x + c.w)); x += 2)
            r0 = Math.min(r0, ratio(lTxt, lum(...px(x, y))));
        if (!peor[c.sel] || r0 < peor[c.sel].r) peor[c.sel] = { r: r0, px: c.px };
      }
      console.log(`   ${seccion}`);
      for (const [sel, v] of Object.entries(peor)) {
        const exige = v.px >= 24 ? 3 : 4.5;
        const ok = v.r >= exige;
        if (!ok) fallos++;
        console.log(`     ${ok ? 'OK ' : 'MAL'} ${sel.padEnd(20)} peor=${v.r.toFixed(2)}:1  (exige ${exige}:1)`);
      }
    }
    await pg.close();
  }

  await b.close();
  console.log(fallos ? `\n${fallos} par(es) por debajo de AA` : '\ntoda la home pasa AA sobre el fondo real');
  process.exit(fallos ? 1 : 0);
})();
