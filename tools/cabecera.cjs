/* ¿Desde que ancho entra la cabecera en UN SOLO RENGLON? El numero del media
   query de .cabecera__nav sale de aca, no de tirarle un breakpoint redondo.
   ⚠️ Correrlo ANTES de agregar o alargar cualquier item de la nav: hasta el
   22-sep la nav aparecia a 761 px y sus items recien entraban a 860, asi que
   «EL RITUAL» y «DÓNDE COMPRAR» se partian en dos renglones y nadie lo vio.
   Mide sobre el DOM real —si todos los items comparten offsetTop y ninguno se
   partio—, no por aritmetica de anchos: calcular «espacio libre» a mano da
   numeros lindos y falsos, porque el flex le encoge el logo a la marca y el
   hueco parece mas grande de lo que es. Esa cuenta decia 827 donde la verdad
   era 972.
      node tools/servir.cjs 4740
      node tools/cabecera.cjs 4740                                           */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');

const P = Number(process.argv[2] || 4740);

/* cada variante: que hacer con la nav antes de medir */
const VARIANTES = {
  '7 items, como esta ahora':        [],
  '6 items (sin Contacto)':          [['quitar', 'Contacto']],
  '7 con «Comprar»':                 [['renombrar', 'Dónde comprar', 'Comprar']],
  '7 con «Comprar» y «Ritual»':      [['renombrar', 'Dónde comprar', 'Comprar'], ['renombrar', 'El ritual', 'Ritual']],
  '6 con «Comprar» (sin Contacto)':  [['quitar', 'Contacto'], ['renombrar', 'Dónde comprar', 'Comprar']]
};

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1400, height: 700 });
  await p.goto(`http://localhost:${P}/`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1200));

  const original = await p.evaluate(() => document.querySelector('.cabecera__nav').innerHTML);

  async function ok(W, ops) {
    await p.setViewport({ width: W, height: 700 });
    await new Promise(r => setTimeout(r, 170));
    return p.evaluate((ops, original) => {
      const nav = document.querySelector('.cabecera__nav');
      nav.innerHTML = original;
      ops.forEach(op => {
        const a = [...nav.querySelectorAll('a')].find(x => x.textContent.trim() === op[1]);
        if (!a) return;
        if (op[0] === 'quitar') a.remove();
        else a.textContent = op[2];
      });
      const prev = nav.style.display;
      if (getComputedStyle(nav).display === 'none') nav.style.display = 'flex';
      const items = [...nav.querySelectorAll('a')];
      /* "una sola fila" se mira por el CENTRO vertical, no por el top: desde el
         23-sep Tienda es una pildora mas alta que los otros items y con
         align-items:center su top queda unos px mas arriba sin haberse partido */
      const centros = items.map(a => { const r = a.getBoundingClientRect(); return r.top + r.height / 2; });
      const altos = items.map(a => Math.round(a.getBoundingClientRect().height));
      const base = Math.min(...altos);
      const marca = document.querySelector('.cabecera__marca').getBoundingClientRect();
      const nr = nav.getBoundingClientRect();
      const bien = Math.max(...centros) - Math.min(...centros) <= 3
        && !altos.some(h => h > base * 1.6)
        && nr.left >= marca.right - 1;
      nav.style.display = prev;
      nav.innerHTML = original;
      return bien;
    }, ops, original);
  }

  console.log('\nancho minimo donde la cabecera entra en un renglon\n');
  for (const [nombre, ops] of Object.entries(VARIANTES)) {
    let lo = 700, hi = 1600, min = null;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (await ok(mid, ops)) { min = mid; hi = mid - 1; } else lo = mid + 1;
    }
    console.log(`  ${nombre.padEnd(34)} ${min ? min + 'px' : '>1600px'}`);
  }
  await b.close();
})();
