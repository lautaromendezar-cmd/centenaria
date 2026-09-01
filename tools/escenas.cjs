/* Las escenas de los capitulos: una foto entera por capitulo, en tres anchos.
   No llevan alfa ni recorte — la profundidad de tres planos vale para el hero,
   donde la camara entra al monte; en un aereo o un interior seria falsa. Lo que
   las mantiene vivas es el avance de camara, el grado, el grano y la linterna.
      node tools/escenas.cjs                                                        */
const { createRequire } = require('module');
const req = createRequire('C:/Users/Lautaro/Desktop/Claude/latina/node_modules/');
const sharp = req('sharp');
const fs = require('fs');

const ANCHOS = [2200, 1600, 1100];
const ESCENAS = ['historia', 'origen', 'variedades', 'porque', 'ritual', 'cierre'];

(async () => {
  let total = 0;
  for (const n of ESCENAS) {
    const src = `_gen/esc/${n}.png`;
    if (!fs.existsSync(src)) { console.log(n.padEnd(12), 'FALTA', src); continue; }
    for (const a of ANCHOS) {
      await sharp(src).resize({ width: a, withoutEnlargement: true })
        .webp({ quality: 74, effort: 6 }).toFile(`img/esc-${n}-${a}.webp`);
    }
    const kb = ANCHOS.map(a => Math.round(fs.statSync(`img/esc-${n}-${a}.webp`).size / 1024));
    total += kb[1];
    console.log(n.padEnd(12), ANCHOS.join('/'), '->', kb.map(k => k + 'k').join(' '));
  }
  console.log('\nlas 6 escenas a 1600 suman', total + 'k (se cargan despues del hero, no bloquean nada)');
})();
