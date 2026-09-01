/* Imagen para compartir (WhatsApp, Facebook, X): 1200x630 desde el mismo mundo del
   hero, oscurecida a la izquierda para que entren el logo y la frase. Se genera, no
   se arrastra a mano: si cambia el mundo, se vuelve a correr.
      node tools/og.cjs                                  -> img/og.jpg               */
const { createRequire } = require('module');
const req = createRequire('C:/Users/Lautaro/Desktop/Claude/latina/node_modules/');
const sharp = req('sharp');

const W = 1200, H = 630;

const velo = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">' +
  '<stop offset="0" stop-color="#0A0B0B" stop-opacity=".94"/>' +
  '<stop offset=".52" stop-color="#0A0B0B" stop-opacity=".62"/>' +
  '<stop offset="1" stop-color="#0A0B0B" stop-opacity=".10"/>' +
  '</linearGradient>' +
  '<linearGradient id="p" x1="0" y1="1" x2="0" y2="0">' +
  '<stop offset="0" stop-color="#0A0B0B" stop-opacity=".8"/>' +
  '<stop offset=".55" stop-color="#0A0B0B" stop-opacity="0"/>' +
  '</linearGradient></defs>' +
  '<rect width="100%" height="100%" fill="url(#g)"/>' +
  '<rect width="100%" height="100%" fill="url(#p)"/>' +
  '</svg>');

const texto = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' +
  '<style>' +
  '.t{font-family:Georgia,serif;fill:#F1EFE2}' +
  '.v{font-family:Montserrat,Arial,sans-serif;fill:#F8DD00;font-size:19px;font-weight:700;letter-spacing:5.6px}' +
  '.b{font-family:Montserrat,Arial,sans-serif;fill:#F1EFE2;font-size:23px;opacity:.85}' +
  '</style>' +
  '<text class="v" x="72" y="238">YERBA MATE &#183; DESDE 1918</text>' +
  '<text class="t" x="72" y="330" font-size="72">El d&#237;a empieza</text>' +
  '<text class="t" x="72" y="404" font-size="72">con yerba mate.</text>' +
  '<text class="b" x="72" y="466">Padr&#243;n uruguayo &#183; envasada en origen</text>' +
  '</svg>');

(async () => {
  const fondo = await sharp('_gen/v2/mundo.png')
    .resize(W, H, { fit: 'cover', position: 'right top' })
    .modulate({ saturation: 1.15 })
    .toBuffer();

  const logo = await sharp('img/logo.webp').resize({ width: 210 }).toBuffer();

  await sharp(fondo)
    .composite([
      { input: velo },
      { input: texto },
      { input: logo, left: 72, top: 96 }
    ])
    .jpeg({ quality: 86, chromaSubsampling: '4:4:4' })
    .toFile('img/og.jpg');

  const m = await sharp('img/og.jpg').metadata();
  console.log('img/og.jpg', m.width + 'x' + m.height);
})();
