/* PRIMEROS PLANOS de las escenas de los capitulos (20-sep).

   Cada escena deja de ser una sola foto: tiene un fondo (esc-*.webp, entero) y
   un PRIMER PLANO con alfa apoyado en una esquina —una rama, la copa de una
   araucaria, el atado de yerba seca— que el motor dibuja con mas empuje de
   camara que el fondo. Esa diferencia de velocidad es la profundidad: la camara
   entra a la escena como entra al monte en el hero.

   Se generaron con seedream_v5_pro (4:3, 2k, remove_bg) sobre fondo gris plano,
   prompts en _gen/frentes/*.txt (comun.txt es el bloque de optica compartido).
   Cada uno salio 3 creditos.

   El archivo que se emite es CUADRADO, y el elemento va apoyado en la esquina
   del anclaje: en el shader (uFit=1) la textura se ajusta al lado corto del
   viewport y se ancla a esa misma esquina, asi que la rama queda del mismo
   tamano relativo en escritorio (alto) y en celular (ancho), y nunca cae sobre
   el centro del cuadro. El margen transparente del otro lado evita que el
   CLAMP_TO_EDGE chorree el borde cuando la camara se mueve.

   Los nombres llevan VERSION porque /img/ se sirve immutable un anio sin hash:
   rehacer uno con el mismo nombre deja al que ya entro viendo el viejo.
   Hay que subirla tambien en cargarEscenas (js/monte.js).

      node tools/frentes.cjs            -> img/frente-<n>-v1-{1000,1600}.webp
      node tools/frentes.cjs historia   -> solo esa                                */
const { req } = require('./_entorno.cjs');
const sharp = req('sharp');
const fs = require('fs');

const VERSION = 'v1';
const LADOS = [1600, 1000];
const G = '_gen/frentes/';

/* ancla: x 0 izq / 1 der, y 0 abajo / 1 arriba, .5 centro (igual que main.js).
   tam: fraccion del lado del cuadrado que ocupa el elemento (el lado mayor del
   recorte). desenfoque: sigma sobre el lado 1600, 0 = nitido. */
/* historia SALIO el 22-sep: su fondo dejo de ser una escena generada y paso a ser la
   foto real de la ervateira (ver material/PROMPTS-ESCENAS.md), que ya trae su propio
   primer plano —el porton, la garita, los arboles pelados—. La rama colgando caia
   sobre el galpon y el sol y eran dos primeros planos peleando. El prompt y el PNG
   siguen en _gen/frentes/historia.* por si vuelve; si vuelve, hay que reponerla
   tambien en cargarEscenas (js/main.js). */
const FRENTES = {
  origen:     { ancla: [1, 0],  tam: .74, desenfoque: 0.8 },  /* copa de araucaria desde arriba */
  variedades: { ancla: [0, .5], tam: .60, desenfoque: 1.0 },  /* rama de yerba desde la izquierda */
  porque:     { ancla: [1, 0],  tam: .72, desenfoque: 0.6 },  /* hojas con rocio, ya vienen desenfocadas */
  ritual:     { ancla: [0, 1],  tam: .64, desenfoque: 1.2 },  /* atado de yerba seca colgado */
  cierre:     { ancla: [1, 0],  tam: .70, desenfoque: 0.7 }   /* brotes con rocio al amanecer */
};

async function emitir(n, cfg) {
  const src = G + n + '.png';
  if (!fs.existsSync(src)) { console.log(n.padEnd(11), 'FALTA', src); return; }
  /* trim recorta el margen transparente; el elemento queda pegado al borde por el
     que entra en cuadro, que es el lado que despues se apoya en la esquina */
  const rec = await sharp(src).ensureAlpha().trim({ threshold: 12 }).png().toBuffer({ resolveWithObject: true });
  const { width: rw, height: rh } = rec.info;
  for (const L of LADOS) {
    const mayor = Math.round(L * cfg.tam);
    const esc = Math.min(mayor / rw, mayor / rh);
    const w = Math.round(rw * esc), h = Math.round(rh * esc);
    let el = sharp(rec.data).resize({ width: w, height: h });
    if (cfg.desenfoque) el = el.blur(cfg.desenfoque * L / 1600);
    const buf = await el.png().toBuffer();
    const left = cfg.ancla[0] === 1 ? L - w : cfg.ancla[0] === 0 ? 0 : Math.round((L - w) / 2);
    /* sharp cuenta desde arriba: y=1 (arriba) es top 0 */
    const top = cfg.ancla[1] === 1 ? 0 : cfg.ancla[1] === 0 ? L - h : Math.round((L - h) / 2);
    const out = `img/frente-${n}-${VERSION}-${L}.webp`;
    await sharp({ create: { width: L, height: L, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: buf, left, top }])
      .webp({ quality: 74, alphaQuality: 88, effort: 6 })
      .toFile(out);
    console.log(out.padEnd(34), `${w}x${h} en (${left},${top})`, Math.round(fs.statSync(out).size / 1024) + 'k');
  }
}

(async () => {
  const solo = process.argv[2];
  for (const n of Object.keys(FRENTES)) {
    if (solo && n !== solo) continue;
    await emitir(n, FRENTES[n]);
  }
})();
