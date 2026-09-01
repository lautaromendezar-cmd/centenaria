/* Roda el hero con Chrome real y arma una hoja de contactos del scroll.
   Usa el servidor que ya este levantado en el puerto que le pases (no abre otro:
   levantar un segundo server para verificar es como se pisan los puertos ajenos).
      node tools/servir.cjs 4740
      node tools/rodar.cjs 4740                       -> tools/_qc-hero.jpg
      node tools/rodar.cjs 4740 390 844               -> movil                     */
const { createRequire } = require('module');
const req = createRequire('C:/Users/Lautaro/Desktop/Claude/latina/node_modules/');
const puppeteer = req('puppeteer-core');
const sharp = req('sharp');

const P = Number(process.argv[2] || 4740);
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);
const MOVIL = W < 900;
const PASOS = [0, .07, .14, .21, .28, .35, .42, .50, .60, .72, .85, .96];

(async () => {
  const b = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  });
  const pg = await b.newPage();
  await pg.setViewport({ width: W, height: H, deviceScaleFactor: 1 });

  const errores = [];
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errores.push(m.type() + ': ' + m.text()); });
  pg.on('pageerror', e => errores.push('pageerror: ' + e.message));
  pg.on('requestfailed', r => errores.push('404/fail: ' + r.url().replace(/^https?:\/\/[^/]+/, '')));

  await pg.goto(`http://localhost:${P}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2200));

  const info = await pg.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl');
    return {
      webgl: !!gl,
      motorVivo: document.querySelector('.mundo').classList.contains('mundo--webgl'),
      alto: document.documentElement.scrollHeight,
      capas: Array.prototype.map.call(document.querySelectorAll('.mundo__capa'),
        i => i.dataset.capa + (i.naturalWidth ? ' ok' : ' ROTA')),
      lineasVisibles: getComputedStyle(document.querySelector('.hero__titulo')).opacity
    };
  });

  const max = info.alto - H;
  const shots = [];
  for (const t of PASOS) {
    await pg.evaluate(y => window.scrollTo(0, y), Math.round(max * t));
    await new Promise(r => setTimeout(r, 950));
    shots.push(await pg.screenshot({ type: 'jpeg', quality: 84 }));
  }

  const cols = MOVIL ? 4 : 3, an = MOVIL ? 300 : 470;
  const al = Math.round(an * H / W), g = 6;
  const filas = Math.ceil(shots.length / cols);
  const piezas = await Promise.all(shots.map(async (s, i) => ({
    input: await sharp(s).resize({ width: an }).toBuffer(),
    left: (i % cols) * (an + g) + g, top: Math.floor(i / cols) * (al + g) + g
  })));
  const salida = MOVIL ? 'tools/_qc-hero-movil.jpg' : 'tools/_qc-hero.jpg';
  await sharp({ create: { width: cols * (an + g) + g, height: filas * (al + g) + g, channels: 3, background: '#0b0b0b' } })
    .composite(piezas).jpeg({ quality: 86 }).toFile(salida);

  await b.close();
  console.log(JSON.stringify(info, null, 1));
  console.log(errores.length ? 'PROBLEMAS:\n  ' + [...new Set(errores)].join('\n  ') : 'consola limpia');
  console.log('->', salida);
})();
