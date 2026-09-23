/* LAS TRES VARIEDADES, cada una en su propia escena (23-sep).
   Antes los envases eran la foto real recortada con alfa (298x499, tools/paquetes-alfa.cjs)
   parada sobre la escena WebGL, y el recorte se veia pegado. Ahora cada variedad
   tiene UNA escena generada con el envase adentro —gpt_image_2_5 con el recorte
   real como referencia, 16:9 2k— y de esa escena salen todos los tamanios:

     img/var-<n>-v1-<lado>.webp          cuadrado, centrado en el envase: la tarjeta de la home
     img/var-<n>-fondo-v1-<ancho>.webp   la escena entera 16:9: fondo de /variedades/<slug>/
     img/var-<n>-alto-v1-<ancho>.webp    4:5 centrado en el envase: el mismo fondo en celular
     img/og-var-<n>.jpg                  1200x630 para compartir la pagina de la variedad

   ⚠️ El envase LO GENERA EL MODELO a partir de la foto real. Se revisa a resolucion
   nativa antes de exportar: marca, variedad, sello y cuadro legal tienen que leerse
   igual que en el envase real. Lo que el modelo inventa son las lineas diminutas
   alrededor del sello, que en la foto real de 298 px tampoco se leen. Si alguna
   vez cambia el envase o la escena, SUBE LA VERSION del nombre (/img/ es immutable).

   El centro horizontal del envase (CX) se mira a ojo sobre el preview y se
   verifica con la hoja de contacto que deja este script.

      node tools/variedades.cjs        -> img/var-*.webp, img/og-var-*.jpg, tools/_qc-variedades.jpg */
const { req } = require('./_entorno.cjs');
const sharp = req('sharp');
const fs = require('fs');

const VERSION = 'v1';
const SRC = '_gen/variedades/';
/* [archivo, centro x del envase (0-1), centro y (0-1)] */
const ESCENAS = {
  original: ['original-a.png', .671, .55],
  azul:     ['azul-a.png',     .675, .53],
  esencial: ['esencial-a.png', .657, .55]
};
const LADOS = [600, 900, 1300];        /* tarjeta: 3 por fila en 1400 => ~440 css px, x2 retina */
const ANCHOS = [1100, 1600, 2200];     /* fondo 16:9, como las escenas del mundo */
const ALTOS = [600, 900];              /* 4:5 para celular */

function recorte(m, cx, cy, ar) {
  /* rectangulo de proporcion `ar` (ancho/alto) lo mas grande posible, centrado en (cx,cy) */
  let h = m.height, w = Math.round(h * ar);
  if (w > m.width) { w = m.width; h = Math.round(w / ar); }
  const left = Math.max(0, Math.min(m.width - w, Math.round(cx * m.width - w / 2)));
  const top = Math.max(0, Math.min(m.height - h, Math.round(cy * m.height - h / 2)));
  return { left, top, width: w, height: h };
}

(async () => {
  const hoja = [];
  for (const [n, [archivo, cx, cy]] of Object.entries(ESCENAS)) {
    const src = SRC + archivo;
    if (!fs.existsSync(src)) { console.log('falta', src); continue; }
    const m = await sharp(src).metadata();

    /* tarjeta cuadrada */
    const cuad = recorte(m, cx, cy, 1);
    const bufCuad = await sharp(src).extract(cuad).toBuffer();
    for (const l of LADOS)
      await sharp(bufCuad).resize({ width: l, withoutEnlargement: true })
        .webp({ quality: 82 }).toFile(`img/var-${n}-${VERSION}-${l}.webp`);
    hoja.push(await sharp(bufCuad).resize({ width: 420 }).jpeg({ quality: 80 }).toBuffer());

    /* fondo entero */
    for (const a of ANCHOS)
      await sharp(src).resize({ width: a, withoutEnlargement: true })
        .webp({ quality: 80 }).toFile(`img/var-${n}-fondo-${VERSION}-${a}.webp`);

    /* 4:5 para celular */
    const alto = recorte(m, cx, cy, 4 / 5);
    const bufAlto = await sharp(src).extract(alto).toBuffer();
    for (const a of ALTOS)
      await sharp(bufAlto).resize({ width: a, withoutEnlargement: true })
        .webp({ quality: 80 }).toFile(`img/var-${n}-alto-${VERSION}-${a}.webp`);

    /* og 1200x630: centrado un poco hacia el envase para que no quede al borde */
    const og = recorte(m, Math.min(cx, .58), .5, 1200 / 630);
    await sharp(src).extract(og).resize(1200, 630).jpeg({ quality: 84 }).toFile(`img/og-var-${n}.jpg`);

    console.log(n, `${m.width}x${m.height}`, 'cuadrado', JSON.stringify(cuad), 'alto', JSON.stringify(alto));
  }

  /* hoja de contacto: las tres tarjetas y los tres 4:5, para mirar el centrado */
  const filas = [];
  for (const b of hoja) filas.push({ input: b, left: filas.length * 430, top: 0 });
  let i = 0;
  for (const n of Object.keys(ESCENAS)) {
    const f = `img/var-${n}-alto-${VERSION}-600.webp`;
    if (fs.existsSync(f)) filas.push({ input: await sharp(f).resize({ width: 336 }).jpeg().toBuffer(), left: i * 430, top: 430 });
    i++;
  }
  await sharp({ create: { width: 430 * 3, height: 430 + 420, channels: 3, background: '#111' } })
    .composite(filas).jpeg({ quality: 80 }).toFile('tools/_qc-variedades.jpg');
  console.log('-> tools/_qc-variedades.jpg');
})();
