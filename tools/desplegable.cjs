/* El submenu de Variedades: abierto con el mouse y abierto con el teclado.
      node tools/desplegable.cjs http://localhost:4740/ tools/_qc-desplegable                                */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');
const [,, URL, OUT] = process.argv;

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(URL, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  const visible = () => p.evaluate(() => {
    const s = document.querySelector('.cabecera__sub');
    const cs = getComputedStyle(s);
    const r = s.getBoundingClientRect();
    return { vis: cs.visibility, op: cs.opacity, x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
  });

  console.log('cerrado:', JSON.stringify(await visible()));
  await p.hover('.cabecera__grupo > a');
  await new Promise(r => setTimeout(r, 500));
  console.log('mouse:  ', JSON.stringify(await visible()));
  await p.screenshot({ path: OUT + '-mouse.jpg', type: 'jpeg', quality: 82, clip: { x: 400, y: 0, width: 900, height: 320 } });

  /* teclado: Tab hasta llegar a Variedades y una mas para entrar al panel */
  await p.mouse.move(10, 600);
  await new Promise(r => setTimeout(r, 400));
  let foco = '', pasos = 0;
  while (pasos < 12) {
    await p.keyboard.press('Tab'); pasos++;
    foco = await p.evaluate(() => (document.activeElement && document.activeElement.textContent.trim()) || '');
    if (foco === 'Variedades') break;
  }
  await new Promise(r => setTimeout(r, 400));
  console.log('teclado en «' + foco + '» tras', pasos, 'Tab:', JSON.stringify(await visible()));
  await p.keyboard.press('Tab');
  await new Promise(r => setTimeout(r, 300));
  const dentro = await p.evaluate(() => (document.activeElement && document.activeElement.textContent.trim()) || '');
  console.log('un Tab mas, foco en «' + dentro + '»:', JSON.stringify(await visible()));
  await p.screenshot({ path: OUT + '-teclado.jpg', type: 'jpeg', quality: 82, clip: { x: 400, y: 0, width: 900, height: 320 } });
  await b.close();
})();
