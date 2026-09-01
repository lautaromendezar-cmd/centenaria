/* Capas del hero, a partir de lo generado en _gen/v2/.
   El mundo es fotografico (Nano Banana Pro, 21:9): rayos volumetricos entrando por
   arriba a la derecha, con la FUENTE FUERA DE CUADRO a proposito — el sol lo dibuja
   el shader y tiene que poder subir, crecer y enfriarse. Un sol quemado dentro de
   la foto pelearia con eso.

   Tres capas, no cuatro: con foto real cada matte de mas es un borde de mas para
   que se note. La profundidad la completan la niebla y las motas del shader.

      node tools/capas.cjs                                                          */
const { req, CHROME } = require('./_entorno.cjs');
const sharp = req('sharp');
const fs = require('fs');

const ANCHOS = [2200, 1600, 1100];
const G = '_gen/v2/';

async function emitir(src, nombre, opciones) {
  const o = opciones || {};
  for (const a of ANCHOS) {
    let im = sharp(src).resize({ width: a, withoutEnlargement: true });
    if (o.grade) im = im.modulate(o.grade);
    await im.webp({ quality: 78, alphaQuality: 88, effort: 6 }).toFile(`img/${nombre}-${a}.webp`);
  }
  const kb = ANCHOS.map(a => Math.round(fs.statSync(`img/${nombre}-${a}.webp`).size / 1024) + 'k');
  console.log(nombre.padEnd(10), ANCHOS.join('/'), '->', kb.join(' '));
}

/* Las capas con alfa vienen encuadradas ocupando medio cuadro. A tamano completo
   tapan el mundo. Se las mete en un lienzo transparente mas grande anclado al
   borde que corresponde: quedan de marco y dejan libre la zona del texto.
   El margen transparente ademas evita que el CLAMP_TO_EDGE del shader chorree
   la hoja cuando la camara se aleja. */
async function marco(src, dst, fx, fy, anclaje) {
  const m = await sharp(src).metadata();
  const espejar = !!anclaje.espejo;
  const W = Math.round(m.width * fx), H = Math.round(m.height * fy);
  const left = anclaje.x === 'der' ? W - m.width : anclaje.x === 'izq' ? 0 : Math.round((W - m.width) / 2);
  const top = anclaje.y === 'abajo' ? H - m.height : anclaje.y === 'arriba' ? 0 : Math.round((H - m.height) / 2);
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(src).ensureAlpha()[espejar ? 'flop' : 'clone']().png().toBuffer(), left, top }])
    .png().toFile(dst);
  console.log('  marco', dst.split('/').pop(), m.width + 'x' + m.height, '->', W + 'x' + H);
}

(async () => {
  /* 1. el mundo, tal cual sale del modelo */
  await emitir(G + 'mundo.png', 'cielo');

  /* 2. capa media: troncos, lianas y helechos arboreos a contraluz */
  if (fs.existsSync(G + 'medio-alfa.png')) {
    /* espejado: el helecho viene pegado al borde derecho y ahi ya entra la rama
       de yerba. Invertido, cada uno enmarca de un lado. */
    await marco(G + 'medio-alfa.png', G + 'medio-marco.png', 1.45, 1.25, { x: 'izq', y: 'abajo', espejo: true });
    await emitir(G + 'medio-marco.png', 'cerca');
  } else console.log('cerca: falta _gen/v2/medio-alfa.png (remove_background)');

  /* 3. frente: la rama de yerba mate. Seedream ya la devuelve con alfa. */
  if (fs.existsSync(G + 'frente-alfa.png')) {
    await marco(G + 'frente-alfa.png', G + 'frente-marco.png', 2.20, 1.75, { x: 'der', y: 'abajo' });
    await emitir(G + 'frente-marco.png', 'frente');
  } else console.log('frente: falta _gen/v2/frente-alfa.png');
})();
