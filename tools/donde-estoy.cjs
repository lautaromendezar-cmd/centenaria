/* El menu marca donde estas (main.js, dondeEstoy): para cada seccion de la home
   scrollea hasta que su tope cruza la linea de activacion y mira que item de la
   cabecera y del menu lleva aria-current. Corre los TRES escenarios en que la
   pagina mide distinto: escritorio, escritorio con reduced-motion (los pasajes
   quedan en alto 0 y las secciones se pegan) y celular. Hay que volver a
   correrlo cada vez que cambia el alto de los pasajes o de una seccion.
      node tools/servir.cjs 4740
      node tools/donde-estoy.cjs 4740                                             */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');
const P = Number(process.argv[2] || 4740);

/* lo que tiene que estar encendido con el tope de cada seccion al 30% del alto
   (la linea de activacion esta en 35%); null = nada encendido, a proposito */
const ESPERADO = {
  hero: null, manifiesto: null,
  historia: '#historia', origen: '#origen', variedades: '#variedades',
  porque: '#porque', ritual: '#ritual',
  comprar: '/donde-comprar/', distribuir: '/vende-centenaria/',
  remate: null   /* sin item: el remate apaga todo, a proposito (main.js, DONDE) */
};
/* en la cabecera de escritorio no entran «Por que elegirla» ni «Vende
   Centenaria» (tools/cabecera.cjs): ahi lo esperado es nada */
const SIN_ITEM_CABECERA = { porque: true, distribuir: true };

const ESCENARIOS = [
  { n: 'escritorio', w: 1440, h: 900, quieto: false },
  { n: 'escritorio reduced-motion', w: 1440, h: 900, quieto: true },
  { n: 'celular', w: 390, h: 844, quieto: false }
];

(async () => {
  let fallas = 0, total = 0;
  for (const esc of ESCENARIOS) {
    const b = await puppeteer.launch({
      executablePath: CHROME, headless: 'new',
      args: ['--no-sandbox', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
    });
    const pg = await b.newPage();
    await pg.setViewport({ width: esc.w, height: esc.h, deviceScaleFactor: 1 });
    await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: esc.quieto ? 'reduce' : 'no-preference' }]);
    await pg.goto(`http://localhost:${P}/`, { waitUntil: 'networkidle0', timeout: 90000 });
    await new Promise(r => setTimeout(r, 2800));
    console.log(`\n═══ ${esc.n} ${esc.w}x${esc.h}`);
    const ids = await pg.evaluate(() => Array.from(document.querySelectorAll('main section[id]')).map(s => s.id));
    for (const id of ids) {
      /* scroll en pasos, como una persona: los triggers tienen que ver pasar el tope.
         Pasos lentos y espera larga a proposito: con WebGL por software el ticker
         de GSAP corre a pocos cuadros por segundo y las callbacks llegan tarde
         (con 30 ms por paso y 500 ms de espera marcaba siempre la seccion
         anterior, y los start de los triggers estaban exactos). */
      await pg.evaluate(async (id) => {
        const s = document.getElementById(id);
        const y = Math.max(0, Math.round(window.scrollY + s.getBoundingClientRect().top - innerHeight * .30));
        const desde = window.scrollY, pasos = 16;
        for (let i = 1; i <= pasos; i++) { window.scrollTo(0, desde + (y - desde) * i / pasos); await new Promise(r => setTimeout(r, 90)); }
      }, id);
      await new Promise(r => setTimeout(r, 1600));
      const r = await pg.evaluate(() => ({
        cab: Array.from(document.querySelectorAll('.cabecera__nav a[aria-current]')).map(a => a.getAttribute('href')),
        menu: Array.from(document.querySelectorAll('.menu__nav a[aria-current]')).map(a => a.getAttribute('href'))
      }));
      const esperadoMenu = ESPERADO[id] === undefined ? '?' : ESPERADO[id];
      const esperadoCab = SIN_ITEM_CABECERA[id] ? null : esperadoMenu;
      const okMenu = (r.menu[0] || null) === esperadoMenu;
      const okCab = esc.w < 900 ? true : (r.cab[0] || null) === esperadoCab;
      total++; if (!(okMenu && okCab)) fallas++;
      console.log(`${okMenu && okCab ? 'OK ' : 'MAL'} #${id.padEnd(11)} menu=${String(r.menu[0] || null).padEnd(18)} cabecera=${String(r.cab[0] || null)}`
        + (okMenu ? '' : `  (menu esperaba ${esperadoMenu})`) + (okCab ? '' : `  (cabecera esperaba ${esperadoCab})`));
    }
    await b.close();
  }
  console.log(`\n${total - fallas}/${total} bien` + (fallas ? '  ← REVISAR' : ''));
  process.exit(fallas ? 1 : 0);
})();
