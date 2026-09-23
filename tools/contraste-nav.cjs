/* Contraste de la CABECERA sobre el fondo real, seccion por seccion. La nav no
   estaba en el PLAN de tools/contraste.cjs y ahora tiene items en oro sobre un
   cielo que la escena nueva de historia dejo mucho mas claro.
   Metodo: el de contraste.cjs —se oculta el texto con visibility (sin mover el
   layout), se captura y se mide el PEOR pixel dentro de la caja real de cada
   linea, sacada con Range—.
      node tools/servir.cjs 4740
      node tools/contraste-nav.cjs 4740        (agrega 390 844 para movil)      */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');
const sharp = req('sharp');

const P = Number(process.argv[2] || 4740);
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);

const lum = (r, g, b) => {
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

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

  const ids = await p.evaluate(() =>
    Array.prototype.slice.call(document.querySelectorAll('main section[id]')).map(s => s.id));

  console.log(`\n=== cabecera ${W}x${H} · exige 4.5:1 (texto chico)\n`);
  let peorGlobal = 99, peorDonde = '';

  for (const id of ids) {
    await p.evaluate((id) => {
      const s = document.getElementById(id);
      const t = s.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, t + s.getBoundingClientRect().height * 0.4);
    }, id);
    await new Promise(r => setTimeout(r, 900));

    /* cajas reales + color declarado de cada enlace, y despues se ocultan */
    const cajas = await p.evaluate(() => {
      const out = [];
      document.querySelectorAll('.cabecera__nav a').forEach(a => {
        if (a.closest('.cabecera__sub')) return;   /* el panel de Variedades esta cerrado */
        const r = document.createRange(); r.selectNodeContents(a);
        const c = r.getBoundingClientRect();
        if (!c.width || !c.height) return;
        out.push({
          t: a.textContent.trim(), activo: !!a.getAttribute('aria-current'),
          color: getComputedStyle(a).color,
          fondo: getComputedStyle(a).backgroundColor,
          x: Math.floor(c.left), y: Math.floor(c.top),
          w: Math.ceil(c.width), h: Math.ceil(c.height)
        });
      });
      document.querySelector('.cabecera__nav').style.visibility = 'hidden';
      return out;
    });

    const png = await p.screenshot();
    const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });

    await p.evaluate(() => { document.querySelector('.cabecera__nav').style.visibility = ''; });

    let peorSec = 99, cual = '';
    for (const c of cajas) {
      const m = c.color.match(/\d+/g).map(Number);
      const lt = lum(m[0], m[1], m[2]);
      let peor = 99;
      /* Tienda (23-sep) es una pildora con fondo PROPIO: se mide contra su fondo
         y no contra lo que hay detras (con el texto en tinta eso daba 1.00:1 falso) */
      const mf = (c.fondo || '').match(/\d+(\.\d+)?/g);
      if (mf && (mf.length < 4 || Number(mf[3]) > 0)) {
        peor = ratio(lt, lum(Number(mf[0]), Number(mf[1]), Number(mf[2])));
      } else
      for (let y = c.y; y < Math.min(c.y + c.h, info.height); y++) {
        for (let x = c.x; x < Math.min(c.x + c.w, info.width); x++) {
          const i = (y * info.width + x) * info.channels;
          const r = ratio(lt, lum(data[i], data[i + 1], data[i + 2]));
          if (r < peor) peor = r;
        }
      }
      if (peor < peorSec) { peorSec = peor; cual = c.t + (c.activo ? ' [activo]' : ''); }
    }
    if (peorSec < peorGlobal) { peorGlobal = peorSec; peorDonde = `#${id} · ${cual}`; }
    console.log(`${peorSec >= 4.5 ? 'OK  ' : 'MAL '} #${id.padEnd(11)} peor=${peorSec.toFixed(2)}:1  (${cual})`);
  }

  console.log(`\npeor de toda la cabecera: ${peorGlobal.toFixed(2)}:1 en ${peorDonde}`);
  console.log(peorGlobal >= 4.5 ? 'la cabecera pasa AA' : '⚠️ LA CABECERA NO PASA');
  await b.close();
})();
