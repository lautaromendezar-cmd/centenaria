/* ⚠️ SIN USO DESDE EL 22-sep-2026. Esta herramienta emitia la copia de archivo (la
   polaroid apoyada en el hito 1918). Se saco: el cliente pidio que ESA MISMA foto
   fuera el FONDO del capitulo, y quedaba dos veces en pantalla —ademas de estirar la
   fila de hitos 456 px, que era casi todo lo que hacia alta la seccion—. Hoy la foto
   entra por material/PROMPTS-ESCENAS.md (01 · historia) y el pie honesto quedo en el
   HTML como .cap__credito. Se deja el script por si vuelve a hacer falta un recorte
   de esta foto; no lo corras esperando que aparezca algo en la home.

   La foto de la fabrica que mando el cliente (21-sep), como copia de archivo
   para el hito 1918 de Historia. NO es de 1918: es la fabrica de hoy con un
   filtro sepia y el marco de una app de celular. Se recorta el marco y se
   emite en dos anchos; el pie honesto va en el HTML.

   Fuente (no viaja con el repo): material/assets/foto-fabrica-hoy-filtro-sepia.jpeg
      node tools/fabrica.cjs                      -> img/fabrica-hoy-{480,800}.webp
      node tools/fabrica.cjs L T W H              -> con el recorte a mano (px del original)
      node tools/fabrica.cjs --medir              -> solo imprime el tamano y sale        */
const { req } = require('./_entorno.cjs');
const sharp = req('sharp');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const FUENTE = path.join(RAIZ, 'material/assets/foto-fabrica-hoy-filtro-sepia.jpeg');
const ANCHOS = [480, 800];   /* el original mide 1098 px: nada de upscale */
const args = process.argv.slice(2);

(async () => {
  const meta = await sharp(FUENTE).metadata();
  console.log(`fuente: ${meta.width}x${meta.height}`);
  if (args[0] === '--medir') return;

  /* recorte por defecto: el marco del filtro son bandas arriba y abajo; se
     ajusta a mano mirando la foto (ver CONTINUAR) */
  let [L, T, W, H] = args.length >= 4 ? args.map(Number) : [0, 0, meta.width, meta.height];
  W = Math.min(W, meta.width - L); H = Math.min(H, meta.height - T);
  const base = sharp(FUENTE).extract({ left: L, top: T, width: W, height: H });
  for (const w of ANCHOS) {
    if (w > W) { console.log(`  ${w}: mas ancho que el recorte (${W}), se salta`); continue; }
    const out = path.join(RAIZ, `img/fabrica-hoy-${w}.webp`);
    const info = await base.clone().resize(w).webp({ quality: 78, effort: 6 }).toFile(out);
    console.log(`  -> img/fabrica-hoy-${w}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
