/* Las escenas de los capitulos: una foto entera por capitulo, en tres anchos.
   No llevan alfa ni recorte — la profundidad de tres planos vale para el hero,
   donde la camara entra al monte; en un aereo o un interior seria falsa. Lo que
   las mantiene vivas es el avance de camara, el grado, el grano y la linterna.
      node tools/escenas.cjs                                                        */
const { req, CHROME } = require('./_entorno.cjs');
const sharp = req('sharp');
const fs = require('fs');

const ANCHOS = [2200, 1600, 1100];
const ESCENAS = ['historia', 'origen', 'variedades', 'porque', 'ritual', 'cierre'];

/* ⚠️ EL NOMBRE LLEVA VERSION Y NO ES UN CAPRICHO.
   vercel.json cachea /img/ como `immutable, max-age=31536000` y los archivos no
   tienen hash. Si se regenera una escena con el MISMO nombre, todo el que ya
   entro al sitio sigue viendo la vieja durante un anio. Al cambiar el mundo hay
   que subir esta version y actualizar el patron en js/monte.js (cargarEscenas).
   Mismo criterio que se uso con img/gajo-*.webp. */
const VERSION = 'v3';

(async () => {
  let total = 0;
  for (const n of ESCENAS) {
    const src = `_gen/esc/${n}.png`;
    if (!fs.existsSync(src)) { console.log(n.padEnd(12), 'FALTA', src); continue; }
    for (const a of ANCHOS) {
      await sharp(src).resize({ width: a, withoutEnlargement: true })
        .webp({ quality: 74, effort: 6 }).toFile(`img/esc-${n}-${VERSION}-${a}.webp`);
    }
    const kb = ANCHOS.map(a => Math.round(fs.statSync(`img/esc-${n}-${VERSION}-${a}.webp`).size / 1024));
    total += kb[1];
    console.log(n.padEnd(12), ANCHOS.join('/'), '->', kb.map(k => k + 'k').join(' '));
  }
  console.log('\nlas 6 escenas a 1600 suman', total + 'k (se cargan despues del hero, no bloquean nada)');
})();
