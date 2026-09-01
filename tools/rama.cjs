/* El gajo suelto que da profundidad a los capitulos.

   v1 reusaba la rama del frente del hero (frente-*.webp) recortada, pero esa capa
   venia CORTADA por el borde de la foto original: suelta en un capitulo se le
   veian los tajos rectos. Se genero un gajo nuevo, entero dentro del cuadro:

     seedream_v5_pro 4:3 2k  ->  remove_background (devuelve el alfa ya hecho)
     job 9b192309-76b9-415a-9706-18aaee1e3bb9  ->  _gen/gajo.png

   OJO con el nombre de salida: /img/ se sirve con cache inmutable de un anio
   (vercel.json), asi que una imagen nueva SIEMPRE lleva nombre nuevo. Por eso
   esto emite gajo-*.webp y no pisa los rama-*.webp viejos.

      node tools/rama.cjs        ->  img/gajo-760.webp  img/gajo-520.webp        */
const { req } = require('./_entorno.cjs');
const sharp = req('sharp');

(async () => {
  /* trim recorta el borde que coincide con el pixel (0,0) — aca, transparente */
  const base = sharp('_gen/gajo.png').trim({ threshold: 12 });
  for (const ancho of [760, 520]) {
    const salida = `img/gajo-${ancho}.webp`;
    await base.clone().resize({ width: ancho }).webp({ quality: 82 }).toFile(salida);
    const m = await sharp(salida).metadata();
    console.log(`${salida}  ${m.width}x${m.height}`);
  }
})();
