/* Escenarios de FALLA del hero. El caso feliz ya se mira a ojo; esto prueba las
   cuatro formas en que esta pagina se rompe sin que se note:

     1. GSAP no carga (CDN caido, bloqueador)   -> la pagina tiene que leerse igual
     2. main.js no carga                        -> idem, y sin nada oculto
     3. no hay WebGL                            -> tienen que quedar las capas <img>
     4. prefers-reduced-motion                  -> quieto pero completo, no vacio

   Contra el servidor que ya este levantado:  node tools/servir.cjs 4740
                                              node tools/robustez.cjs 4740          */
const { req, CHROME } = require('./_entorno.cjs');
const puppeteer = req('puppeteer-core');

const P = Number(process.argv[2] || 4740);
const URL = `http://localhost:${P}/`;

/* Un elemento "se lee" si esta en el flujo, tiene tamano, cae dentro de la ventana
   y no es transparente. Mirar solo opacity deja pasar el texto empujado fuera. */
const SONDA = () => {
  const ver = s => {
    const el = document.querySelector(s);
    if (!el) return { s, existe: false };
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    return {
      s, existe: true,
      op: +cs.opacity,
      vis: cs.visibility !== 'hidden' && cs.display !== 'none',
      dentro: r.top < innerHeight && r.bottom > 0 && r.width > 4 && r.height > 4,
      texto: (el.textContent || '').trim().slice(0, 22)
    };
  };
  return {
    partes: ['.hero__titulo', '.hero__bajada', '.hero .volanta', '.boton--oro', '.boton--linea'].map(ver),
    webgl: document.querySelector('.mundo').classList.contains('mundo--webgl'),
    capasVisibles: getComputedStyle(document.querySelector('.mundo__capas')).visibility,
    cortina: document.querySelector('.cortina') ? getComputedStyle(document.querySelector('.cortina')).display : 'sin',
    cargando: document.documentElement.classList.contains('cargando'),
    desborde: document.documentElement.scrollWidth > window.innerWidth + 1,
    alto: document.documentElement.scrollHeight
  };
};

async function correr(nombre, preparar, esperaMs = 3400) {
  const b = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  });
  const pg = await b.newPage();
  await pg.setViewport({ width: 1440, height: 900 });
  const errores = [];
  pg.on('pageerror', e => errores.push(e.message));
  await preparar(pg);
  await pg.goto(URL, { waitUntil: 'networkidle0' }).catch(() => {});
  await new Promise(r => setTimeout(r, esperaMs));
  const r = await pg.evaluate(SONDA);
  await b.close();

  const mudos = r.partes.filter(p => !p.existe || !p.vis || p.op < .9 || !p.dentro);
  const tapado = r.cortina !== 'none' || r.cargando;
  const ok = mudos.length === 0 && !r.desborde && !tapado && errores.length === 0;
  console.log(`${ok ? 'OK ' : 'MAL'} ${nombre.padEnd(30)} webgl=${r.webgl ? 'si' : 'no '} capas=${r.capasVisibles.padEnd(7)} cortina=${r.cortina.padEnd(4)} alto=${r.alto}`);
  if (tapado) console.log('      la cortina sigue tapando la pagina');
  if (mudos.length) mudos.forEach(m => console.log(`      ilegible ${m.s}  ${m.existe ? 'op=' + m.op + ' dentro=' + m.dentro : 'NO EXISTE'}`));
  if (r.desborde) console.log('      hay scroll horizontal');
  errores.forEach(e => console.log('      error: ' + e));
  return ok;
}

const bloquear = patron => async pg => {
  await pg.setRequestInterception(true);
  pg.on('request', q => (patron.test(q.url()) ? q.abort() : q.continue()));
};

(async () => {
  let malos = 0;
  if (!await correr('caso feliz', async () => {})) malos++;
  if (!await correr('sin GSAP (CDN caido)', bloquear(/gsap|ScrollTrigger/i))) malos++;
  if (!await correr('sin main.js', bloquear(/js\/main\.js/))) malos++;
  if (!await correr('sin monte.js (sin motor)', bloquear(/js\/monte\.js/))) malos++;
  if (!await correr('sin WebGL', async pg => {
    await pg.evaluateOnNewDocument(() => {
      const g = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (t) {
        if (String(t).indexOf('webgl') === 0 || t === 'experimental-webgl') return null;
        return g.apply(this, arguments);
      };
    });
  })) malos++;
  if (!await correr('prefers-reduced-motion', async pg => {
    await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  })) malos++;

  console.log(malos ? `\n${malos} escenario(s) rotos` : '\nlos 6 escenarios se leen');
  process.exit(malos ? 1 : 0);
})();
