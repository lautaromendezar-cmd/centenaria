// Detecta y recorta los 3 paquetes de pack3-verde.png (fondo verde con nervadura).
const { req, CHROME } = require('./_entorno.cjs');
const sharp = req('sharp');
const SRC = 'C:/Users/Lautaro/Desktop/Claude/pdf-centenaria/assets/full/pack3-verde.png';

(async () => {
  const im = sharp(SRC);
  const { width: W, height: H } = await im.metadata();
  const { data } = await im.raw().toBuffer({ resolveWithObject: true });
  const px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
  // el fondo es verde: g claramente mayor que r y que b
  const esFondo = ([r, g, b]) => g > r + 18 && g > b + 18;
  const y0 = Math.round(H * 0.42), y1 = Math.round(H * 0.70); // banda de los paquetes
  const cols = [];
  for (let x = 0; x < W; x++) {
    let n = 0;
    for (let y = y0; y < y1; y += 3) if (!esFondo(px(x, y))) n++;
    cols.push(n / ((y1 - y0) / 3));
  }
  // agrupa columnas con >35% de pixeles no-verdes
  const grupos = []; let ini = null;
  cols.forEach((v, x) => {
    if (v > 0.35 && ini === null) ini = x;
    else if (v <= 0.35 && ini !== null) { if (x - ini > W * 0.08) grupos.push([ini, x]); ini = null; }
  });
  if (ini !== null && W - ini > W * 0.08) grupos.push([ini, W]);
  console.log('W,H', W, H, '| grupos x:', JSON.stringify(grupos));
  // para cada grupo, el alto real
  const cajas = grupos.map(([xa, xb]) => {
    let ya = H, yb = 0;
    for (let y = Math.round(H * 0.30); y < Math.round(H * 0.80); y++) {
      let n = 0;
      for (let x = xa; x < xb; x += 3) if (!esFondo(px(x, y))) n++;
      if (n / ((xb - xa) / 3) > 0.6) { if (y < ya) ya = y; if (y > yb) yb = y; }
    }
    return { x: xa, y: ya, w: xb - xa, h: yb - ya };
  });
  console.log('cajas:', JSON.stringify(cajas));
  const nombres = ['azul', 'original', 'esencial'];
  for (let i = 0; i < cajas.length && i < 3; i++) {
    const c = cajas[i];
    if (c.h < 50 || c.w < 50) { console.log('descarto', i, c); continue; }
    await sharp(SRC).extract({ left: c.x, top: c.y, width: c.w, height: c.h }).resize({ width: 640 })
      .webp({ quality: 90 }).toFile(`img/pack-${nombres[i]}.webp`);
    console.log('->', `img/pack-${nombres[i]}.webp`, c.w + 'x' + c.h);
  }
})();
