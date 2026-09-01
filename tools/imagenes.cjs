const { req, CHROME } = require('./_entorno.cjs');
const sharp = req('sharp');
const A = 'C:/Users/Lautaro/Desktop/Claude/pdf-centenaria/assets/';

const JOBS = [
  ['full/pack-mar.webp',        'hero-mar',      { top: .24, bot: .84, ar: 16 / 9 }, [1600, 1100, 760]],
  ['foto-brasil.jpg',           'monte',         null,                               [1600, 1100, 760]],
  ['full/lifestyle-playa.webp', 'playa',         { top: .30, bot: .98, ar: 4 / 5, xoff: .28 },  [1000, 700]],
  ['full/boca-bombonera.webp',  'boca',          { top: .22, bot: .95, ar: 4 / 5 },  [900, 640]],
  ['full/stand-evento.webp',    'stand',         { top: .12, bot: .88, ar: 4 / 5 },  [1000, 700]],
  ['full/pavas-gigantes.webp',  'pavas',         { top: .10, bot: .90, ar: 4 / 5 },  [900, 640]],
  ['full/spread-productos.webp','spread',        { top: .16, bot: .92, ar: 4 / 5 },  [900, 640]],
];

(async () => {
  for (const [src, name, crop, anchos] of JOBS) {
    let base = sharp(A + src);
    const m = await base.metadata();
    if (crop) {
      const top = Math.round(m.height * crop.top);
      let h = Math.round(m.height * (crop.bot - crop.top));
      let w = Math.round(h * crop.ar);
      if (w > m.width) { w = m.width; h = Math.round(w / crop.ar); }
      const left = Math.max(0, Math.min(m.width - w, Math.round((m.width - w) * (crop.xoff === undefined ? .5 : crop.xoff))));
      base = base.extract({ left, top, width: w, height: Math.min(h, m.height - top) });
    }
    const buf = await base.toBuffer();
    for (const a of anchos) {
      await sharp(buf).resize({ width: a, withoutEnlargement: true })
        .webp({ quality: 82 }).toFile(`img/${name}-${a}.webp`);
    }
    console.log(name, m.width + 'x' + m.height, '->', anchos.join(','));
  }
  await sharp(A + 'logo.webp').resize({ width: 600 }).webp({ quality: 92 }).toFile('img/logo.webp');
  await sharp(A + '1918.webp').resize({ width: 300 }).webp({ quality: 92 }).toFile('img/1918.webp');
  console.log('logo + 1918 ok');
})();
