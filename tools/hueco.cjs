/* ¿Cuanto scroll queda SIN NADA DE TEXTO en pantalla? Barre la home de arriba a
   abajo y, en cada paso, mira si hay algun texto de capitulo visible (en el
   viewport y con opacidad util). Despues informa las rachas vacias mas largas,
   en px y en pantallas.
      node tools/hueco.cjs <puerto> [ancho] [alto]                                  */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');

const P = Number(process.argv[2] || 4740);
const W = Number(process.argv[3] || 1440);
const H = Number(process.argv[4] || 900);
const PASO = 60;

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

  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  const muestras = [];

  for (let y = 0; y < total - H; y += PASO) {
    await p.evaluate(y => window.scrollTo(0, y), y);
    await new Promise(r => setTimeout(r, 55));
    const hay = await p.evaluate((H) => {
      const sel = '.cap__titulo,.cap__entrada,.volanta,.hito__dato,.hito__texto,' +
        '.claro__titulo,.claro__bajada,.tarjeta__nombre,.beneficio h3,.cita p,' +
        '.paso__titulo,.paso__texto,.manifiesto__titulo,.manifiesto__texto,' +
        '.salida__titulo,.tramite__paso p,.remate__titulo,.remate__frase,' +
        '.razon__titulo,.historia__anio,.cap__credito,.hero__titulo,.hero__bajada';
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 8 || r.top > H - 8 || !r.width || !r.height) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden') continue;
        /* la opacidad util puede venir de un padre: subo la cadena */
        let op = 1, n = el;
        while (n && n !== document.body) { op *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; }
        if (op > 0.28) return true;
      }
      return false;
    }, H);
    muestras.push([y, hay]);
  }

  /* rachas sin texto */
  const rachas = [];
  let ini = null;
  for (const [y, hay] of muestras) {
    if (!hay && ini === null) ini = y;
    if (hay && ini !== null) { rachas.push([ini, y]); ini = null; }
  }
  if (ini !== null) rachas.push([ini, total - H]);

  const grandes = rachas.map(([a, z]) => [a, z, z - a]).filter(r => r[2] >= 200)
    .sort((x, y2) => y2[2] - x[2]);

  console.log(`\npuerto ${P} · ${W}x${H} · documento ${total}px (${(total / H).toFixed(1)} pantallas)`);
  console.log(`rachas SIN texto de 200px para arriba: ${grandes.length}`);
  grandes.slice(0, 8).forEach(([a, z, d]) =>
    console.log(`   ${String(d).padStart(5)}px (${(d / H).toFixed(2)} pantallas)  de ${a} a ${z}`));
  const suma = grandes.reduce((s, r) => s + r[2], 0);
  console.log(`   total vacio: ${suma}px = ${(suma / total * 100).toFixed(1)}% del documento`);

  await b.close();
})();
