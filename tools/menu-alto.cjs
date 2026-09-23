/* ¿Entran los 9 items del menu de pantalla completa en telefonos cortos?
   Abre el menu y mide desborde y si alguna etiqueta se parte en dos renglones.
      node tools/menu-alto.cjs 4740   (deja tools/_qc-menu-alturas.jpg)                                                */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');
const sharp = req('sharp');

const P = Number(process.argv[2] || 4740);
/* iPhone SE, 8, 12 mini, 14, 14 Pro Max, y un Android angosto */
const PANTALLAS = [[320, 568], [375, 667], [360, 740], [390, 844], [430, 932], [768, 1024]];

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  const tiras = [];

  for (const [W, H] of PANTALLAS) {
    await p.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
    await p.goto(`http://localhost:${P}/`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1500));
    await p.click('#menuBoton');
    await new Promise(r => setTimeout(r, 900));

    const r = await p.evaluate(() => {
      const menu = document.querySelector('.menu');
      const nav = document.querySelector('.menu__nav');
      const items = [...nav.querySelectorAll('a')];
      /* alto de una linea = el minimo de los items GRANDES; si alguno mide mucho
         mas, partio. Los del submenu de Variedades (.menu__sub, 23-sep) son mas
         chicos y se miran aparte, contra su propio minimo. */
      const grupo = a => a.closest('.menu__sub') ? 'sub' : (a.classList.contains('menu__tienda') ? 'tienda' : 'item');
      const altos = items.map(a => Math.round(a.getBoundingClientRect().height));
      const base = {};
      items.forEach((a, i) => { const g = grupo(a); base[g] = Math.min(base[g] === undefined ? 1e9 : base[g], altos[i]); });
      const partidos = items.filter((a, i) => altos[i] > base[grupo(a)] * 1.5).map(a => a.textContent.trim());
      const contacto = document.querySelector('.menu__contacto');
      const ultimo = items[items.length - 1].getBoundingClientRect();
      const primero = items[0].getBoundingClientRect();
      return {
        desborde: Math.round(menu.scrollHeight - menu.clientHeight),
        recortadoArriba: Math.round(primero.top) < 0,
        pisaContacto: contacto ? Math.round(ultimo.bottom - contacto.getBoundingClientRect().top) : 0,
        partidos, items: items.length
      };
    });

    const mal = r.desborde > 1 || r.recortadoArriba || r.pisaContacto > 0 || r.partidos.length;
    console.log(`${mal ? 'MAL ' : 'OK  '} ${String(W).padStart(4)}x${String(H).padEnd(5)} items ${r.items}` +
      `  desborde ${r.desborde}px  ${r.recortadoArriba ? '⚠️ recortado arriba ' : ''}` +
      `${r.pisaContacto > 0 ? '⚠️ pisa el bloque de contacto por ' + r.pisaContacto + 'px ' : ''}` +
      `${r.partidos.length ? '⚠️ parte: ' + r.partidos.join(', ') : ''}`);

    tiras.push(await sharp(await p.screenshot()).resize({ height: 620 }).toBuffer());
  }

  const metas = await Promise.all(tiras.map(t => sharp(t).metadata()));
  const ancho = metas.reduce((a, m) => a + m.width + 8, 0);
  let x = 0;
  await sharp({ create: { width: ancho, height: 620, channels: 3, background: '#222' } })
    .composite(tiras.map((t, i) => { const o = { input: t, top: 0, left: x }; x += metas[i].width + 8; return o; }))
    .jpeg({ quality: 86 }).toFile(require('path').join(__dirname, '_qc-menu-alturas.jpg'));
  console.log('\n-> tools/_qc-menu-alturas.jpg');
  await b.close();
})();
