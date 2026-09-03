/* Los TRES PAQUETES con alfa de verdad, para poder pararlos dentro del mundo.
   Los pack-*.webp viejos eran recortes RECTANGULARES apretados (el borde del
   cuadro corta el paquete): servian sobre una tarjeta blanca, pero sobre el
   monte se leen como un rectangulo pegado.

   El fondo del original es verde plano, asi que la clave se saca por INUNDACION
   DESDE LOS BORDES, no por "todo pixel verde": los paquetes tienen verde adentro
   —la nervadura del amarillo, el sello y el texto del blanco— y una clave global
   les haria agujeros. Al inundar solo desde afuera, el verde encerrado se salva.

   Despues va un DESPILL en el borde: el halo verde que deja cualquier clave sobre
   fondo de color. Sin eso, sobre el monte oscuro se ve un contorno verdoso.

      node tools/paquetes-alfa.cjs        -> img/pack-<n>-v2-<ancho>.webp         */
const { req } = require('./_entorno.cjs');
const sharp = req('sharp');
const fs = require('fs');

const SRC = 'C:/Users/Lautaro/Desktop/Claude/pdf-centenaria/assets/full/pack3-verde.png';
const NOMBRES = ['azul', 'original', 'esencial'];   /* de izquierda a derecha en el original */
/* Un solo tamanio: el original es un folleto de 1080x1440 y cada paquete mide
   ~298x499 nativos. Pedir 900/640/440 devolvia TRES ARCHIVOS IDENTICOS porque
   `withoutEnlargement` no agranda. Ojo: a ~330px de alto en pantalla esto es
   1.5x, suficiente en pantalla comun pero justo en retina. La unica solucion
   real es pedirle al cliente las fotos de los envases en alta — no un upscale:
   el upscale reescribe el microtexto de la etiqueta. */
const VERSION = 'v2';

/* El original es un FOLLETO entero: arriba tiene el titulo amarillo y una banda
   blanca, abajo una cinta amarilla. Todo eso tambien es "no verde", asi que sin
   acotar la clave se lleva medio afiche. Esta es la banda donde viven los tres
   paquetes, medida sobre el archivo (perfil por fila de pixeles no verdes). */
const BANDA = { y0: 650, y1: 1200 };

(async () => {
  /* OJO: sharp.metadata() devuelve el tamanio del ARCHIVO, no el del extract.
     Hay que tomar ancho/alto/canales del propio toBuffer o se lee fuera de rango
     (me costo un rato: daba un solo grupo que abarcaba todo). */
  const { data, info } = await sharp(SRC)
    .extract({ left: 0, top: BANDA.y0, width: 1080, height: BANDA.y1 - BANDA.y0 })
    .raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, C = info.channels;
  const idx = (x, y) => (y * W + x) * C;
  /* El fondo es verde OSCURO y la sombra bajo los paquetes tambien: con
     `g > r+12 && g > b+12` la sombra quedaba del lado del paquete y los tres
     salian pegados en un solo grupo. El tope `g < 170` es lo que deja afuera al
     paquete blanco (g~232) y al amarillo (g~200) sin tocar la sombra. */
  const verde = (x, y) => {
    const i = idx(x, y), r = data[i], g = data[i + 1], b = data[i + 2];
    return g < 170 && g >= r - 2 && g >= b + 2;
  };

  /* --- inundacion desde los bordes: marca SOLO el fondo conectado al exterior --- */
  const fondo = new Uint8Array(W * H);
  const pila = [];
  for (let x = 0; x < W; x++) { pila.push([x, 0], [x, H - 1]); }
  for (let y = 0; y < H; y++) { pila.push([0, y], [W - 1, y]); }
  while (pila.length) {
    const [x, y] = pila.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const k = y * W + x;
    if (fondo[k]) continue;
    if (!verde(x, y)) continue;
    fondo[k] = 1;
    pila.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  /* --- alfa + despill --- */
  const out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x, i = idx(x, y), o = k * 4;
    let r = data[i], g = data[i + 1], b = data[i + 2];
    let a = fondo[k] ? 0 : 255;
    if (a) {
      /* si toca fondo, es borde: ahi vive el halo verde */
      let vecino = false;
      for (let dy = -1; dy <= 1 && !vecino; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < W && ny < H && fondo[ny * W + nx]) { vecino = true; break; }
      }
      if (vecino) { const m = (r + b) / 2; if (g > m) g = m; }   /* despill */
    }
    out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a;
  }

  const plano = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();

  /* --- caja de cada paquete a partir del alfa, no de heuristicas de color --- */
  const cols = new Array(W).fill(0);
  for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) if (!fondo[y * W + x]) cols[x]++;
  const grupos = []; let ini = null;
  cols.forEach((v, x) => {
    if (v > H * 0.04 && ini === null) ini = x;
    else if (v <= H * 0.04 && ini !== null) { if (x - ini > W * 0.06) grupos.push([ini, x]); ini = null; }
  });
  if (ini !== null && W - ini > W * 0.06) grupos.push([ini, W]);
  console.log('grupos en x:', JSON.stringify(grupos));

  fs.mkdirSync('_gen/packs', { recursive: true });
  for (let i = 0; i < grupos.length && i < 3; i++) {
    const [xa, xb] = grupos[i];
    let ya = H, yb = 0;
    for (let y = 0; y < H; y++) for (let x = xa; x < xb; x++)
      if (!fondo[y * W + x]) { if (y < ya) ya = y; if (y > yb) yb = y; }
    const caja = { left: xa, top: ya, width: xb - xa, height: yb - ya + 1 };
    const rec = await sharp(plano).extract(caja).png().toBuffer();
    fs.writeFileSync(`_gen/packs/${NOMBRES[i]}.png`, rec);
    const destino = `img/pack-${NOMBRES[i]}-${VERSION}.webp`;
    await sharp(rec).webp({ quality: 90, effort: 6, alphaQuality: 100 }).toFile(destino);
    const kb = Math.round(fs.statSync(destino).size / 1024);
    console.log(NOMBRES[i].padEnd(10), caja.width + 'x' + caja.height, '->', kb + 'k');
  }
})();
