/* CONTRASTE A MITAD DEL CRUCE — el estado que contraste.cjs no mira.
   contraste.cjs se para en cada seccion; pero entre dos secciones hay un momento
   en que el fondo esta a mitad de camino entre dos escenas Y hay texto en pantalla.
   Con el fundido plano ese instante era el mas OSCURO (dos fotos promediadas), asi
   que nunca fallaba. Con el barrido direccional puede aparecer una escena luminosa
   entera detras de una linea de texto: hay que medirlo.
      node tools/cruce-contraste.cjs 4740                                          */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');
const sharp = req('sharp');
const P = Number(process.argv[2] || 4740);

const lum = (r, g, b) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/* mismos objetivos que contraste.cjs, pero sin acotar a una seccion: a mitad del
   cruce hay texto de DOS capitulos en pantalla a la vez. */
const SELS = [['.cap__titulo',48],['.cap__entrada',17],['.hito__dato',60],['.hito__texto',16],
  ['.volanta',12],['.cadena__causa',16],['.cadena__efecto',16],['.cadena__sentis',17],
  ['.claro__titulo',48],['.claro__bajada',17],['.ficha__nombre',28],['.ficha__texto',16],
  ['.escala__quien',21],['.escala__nota',14],['.paso__titulo',28],['.paso__texto',16],
  ['.tip',16],['.beneficio h3',24],['.beneficio p',16],['.cita p',40],
  ['.cierre__remate',22],['.puerta__titulo',28],['.puerta__texto',16],['.contacto__lista a',18],['.proceso',16]];

const NOM = ['hero→historia','historia→origen','origen→variedades','variedades→porqué','porqué→ritual','ritual→cierre'];

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox','--hide-scrollbars','--enable-unsafe-swiftshader','--use-angle=swiftshader'] });
  let fallos = 0;

  for (const vp of [{ w:1440, h:900, n:'escritorio' }, { w:390, h:844, n:'celular' }]) {
    const pg = await b.newPage();
    await pg.setViewport({ width: vp.w, height: vp.h });
    /* la maquina puede tener las animaciones apagadas (Windows: "Mostrar animaciones"),
       y Chrome lo traduce a prefers-reduced-motion: el sitio tomaria el camino quieto */
    await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await pg.evaluateOnNewDocument(() => {
      let _M;
      Object.defineProperty(window, 'Monte', { configurable:true, get(){return _M;},
        set(v){ _M=v; if(v&&v.iniciar){const o=v.iniciar; v.iniciar=function(){const r=o.apply(this,arguments);
          if(r&&r.estado) window.__e=r.estado; return r;};}}});
    });
    await pg.goto(`http://localhost:${P}/`, { waitUntil:'networkidle0' });
    await new Promise(r => setTimeout(r, 3000));
    console.log(`\n════ ${vp.n} ${vp.w}x${vp.h}`);

    const alto = await pg.evaluate(() => document.body.scrollHeight);
    const mapa = [];
    for (let i = 0; i <= 300; i++) {
      const y = Math.round(alto * i / 300);
      await pg.evaluate(v => window.scrollTo(0, v), y);
      await new Promise(r => setTimeout(r, 22));
      const esc = await pg.evaluate(() => window.__e ? window.__e.escena : null);
      if (esc != null) mapa.push({ y, esc });
    }
    if (!mapa.length) { console.log('   sin motor: nada que medir'); await pg.close(); continue; }
    const cerca = v => mapa.reduce((a,x) => Math.abs(x.esc-v) < Math.abs(a.esc-v) ? x : a);

    for (let k = 1; k <= 6; k++) {
      const peor = {};
      for (const f of [.3, .45, .6, .75]) {          /* varios puntos del cruce */
        const t = cerca(k - 1 + f);
        await pg.evaluate(v => window.scrollTo(0, v), t.y);
        await new Promise(r => setTimeout(r, 900));

        const cajas = await pg.evaluate(sels => {
          const out = [];
        /* La CABECERA es fixed y va por encima: el texto del capitulo le pasa por
           debajo. Medirlo ahi da 1.00:1 porque el "fondo" que se lee son las letras
           crema del menu, no el mundo. Es un falso positivo, no un fallo del sitio:
           esas cajas se descartan. */
        const cab = document.querySelector('.cabecera');
        const rc = cab ? cab.getBoundingClientRect() : null;
        const tapado = r => !!rc && r.top < rc.bottom + 4 && r.bottom > rc.top - 4;

          for (const [sel, px] of sels) for (const el of document.querySelectorAll(sel)) {
            const cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .5) continue;
            const rg = document.createRange(); rg.selectNodeContents(el);
            for (const r of rg.getClientRects())
              if (r.width > 8 && r.height > 6 && r.top > -20 && r.bottom < innerHeight + 20
                  && !tapado(r))
                out.push({ sel, px, color: cs.color, x:r.x, y:r.y, w:r.width, h:r.height });
          }
          return out;
        }, SELS);
        if (!cajas.length) continue;

        await pg.evaluate(sels => { for (const [s] of sels)
          document.querySelectorAll(s).forEach(e => { e.style.visibility = 'hidden'; }); }, SELS);
        await new Promise(r => setTimeout(r, 240));
        const png = await pg.screenshot({ type:'png' });
        await pg.evaluate(sels => { for (const [s] of sels)
          document.querySelectorAll(s).forEach(e => { e.style.visibility = ''; }); }, SELS);

        const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject:true });
        const px = (x,y) => { const i = (y*info.width+x)*info.channels; return [data[i],data[i+1],data[i+2]]; };
        for (const c of cajas) {
          const m = c.color.match(/\d+/g) || [255,255,255];
          const lTxt = lum(+m[0], +m[1], +m[2]);
          let r0 = Infinity;
          for (let y = Math.max(0,Math.floor(c.y)); y < Math.min(info.height, Math.ceil(c.y+c.h)); y += 2)
            for (let x = Math.max(0,Math.floor(c.x)); x < Math.min(info.width, Math.ceil(c.x+c.w)); x += 2)
              r0 = Math.min(r0, ratio(lTxt, lum(...px(x,y))));
          if (!peor[c.sel] || r0 < peor[c.sel].r) peor[c.sel] = { r:r0, px:c.px, f };
        }
      }
      const filas = Object.entries(peor);
      if (!filas.length) { console.log(`   ${NOM[k-1]}: sin texto en pantalla`); continue; }
      console.log(`   ${NOM[k-1]}`);
      for (const [sel, v] of filas) {
        const exige = v.px >= 24 ? 3 : 4.5;
        const ok = v.r >= exige;
        if (!ok) fallos++;
        console.log(`     ${ok?'OK ':'MAL'} ${sel.padEnd(20)} peor=${v.r.toFixed(2)}:1  (exige ${exige}:1, en mez ${v.f})`);
      }
    }
    await pg.close();
  }
  await b.close();
  console.log(fallos ? `\n${fallos} par(es) por debajo de AA A MITAD DEL CRUCE` : '\ntambien a mitad del cruce, todo pasa AA');
  process.exit(fallos ? 1 : 0);
})();
