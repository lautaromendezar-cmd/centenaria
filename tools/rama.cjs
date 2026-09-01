/* La rama suelta que da profundidad a los capitulos. No es un asset nuevo: es la
   MISMA rama de yerba del frente del hero (frente-*.webp), recortada a su caja
   real de pixeles con alfa. Reusarla es a proposito — una planta distinta se
   leeria como decoracion pegada; esta ya pertenece al mundo.

      node tools/rama.cjs        ->  img/rama-760.webp  img/rama-520.webp        */
const { req } = require('./_entorno.cjs');
const sharp = req('sharp');

(async () => {
  /* trim recorta el borde que coincide con el pixel (0,0) — aca, transparente */
  const base = sharp('img/frente-2200.webp').trim({ threshold: 12 });
  for (const ancho of [760, 520]) {
    const salida = `img/rama-${ancho}.webp`;
    await base.clone().resize({ width: ancho }).webp({ quality: 82 }).toFile(salida);
    const m = await sharp(salida).metadata();
    console.log(`${salida}  ${m.width}x${m.height}`);
  }
})();
