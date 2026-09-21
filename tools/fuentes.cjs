/* Baja las fuentes que sirve css/fuentes.css: los MISMOS woff2 (subset latin)
   que Google entregaba para la URL que usaba el sitio. Correrlo solo si hay que
   rehacer fonts/ (p. ej. para sumar el subset latin-ext o cambiar los rangos).

   ⚠️ Fraunces tiene eje opsz: la URL pide el rango entero (9..144) como pedia
   el sitio; sin opsz Google entrega una instancia fija y los titulos cambian
   de dibujo. Y hay que pedir el CSS con un User-Agent de Chrome moderno, o
   Google devuelve TTF/instancias estaticas en vez del variable woff2.

      node tools/fuentes.cjs        -> fonts/*.woff2 y la lista de URLs usadas   */
const fs = require('fs');
const path = require('path');

const URL_CSS = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..700&family=Montserrat:wght@300..700&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const DESTINO = path.resolve(__dirname, '../fonts');
/* subset latin de cada cara -> nombre local */
const NOMBRE = { 'Fraunces|normal': 'fraunces-latin.woff2', 'Fraunces|italic': 'fraunces-italic-latin.woff2', 'Montserrat|normal': 'montserrat-latin.woff2' };

(async () => {
  const css = await (await fetch(URL_CSS, { headers: { 'User-Agent': UA } })).text();
  const bloques = css.split('@font-face').slice(1);
  fs.mkdirSync(DESTINO, { recursive: true });
  for (const b of bloques) {
    if (!/\/\* latin \*\//.test(b)) continue;
    const fam = /font-family:\s*'([^']+)'/.exec(b)[1];
    const estilo = /font-style:\s*(\w+)/.exec(b)[1];
    const peso = /font-weight:\s*([^;]+)/.exec(b)[1].trim();
    const url = /url\(([^)]+)\)/.exec(b)[1];
    const nombre = NOMBRE[fam + '|' + estilo];
    if (!nombre) continue;
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(DESTINO, nombre), buf);
    console.log(`${nombre.padEnd(28)} ${fam} ${estilo} ${peso}  ${(buf.length / 1024).toFixed(0)} KB\n   ${url}`);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
