// Genera la nervadura de hoja (el patrón de los paquetes) como paths SVG.
// Una hoja = nervio central + pares de venas que salen en diagonal y se curvan.
const fs = require('fs');
const r2 = n => Math.round(n * 100) / 100;

function hoja(cx, base, alto, ancho, venas, semilla) {
  let s = semilla;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const d = [`M ${r2(cx)} ${r2(base)} C ${r2(cx - ancho * .06)} ${r2(base - alto * .4)} ${r2(cx + ancho * .04)} ${r2(base - alto * .72)} ${r2(cx)} ${r2(base - alto)}`];
  for (let i = 1; i <= venas; i++) {
    const t = i / (venas + 1);                 // 0 abajo -> 1 arriba
    const y = base - alto * t * .93;
    const largo = ancho * (0.5 + 0.5 * Math.sin(Math.PI * t)) * (0.82 + rnd() * .3);
    const subida = alto * (0.16 + 0.1 * (1 - t));
    for (const lado of [-1, 1]) {
      const x2 = cx + lado * largo, y2 = y - subida;
      d.push(`M ${r2(cx)} ${r2(y)} Q ${r2(cx + lado * largo * .45)} ${r2(y - subida * .18)} ${r2(x2)} ${r2(y2)}`);
    }
  }
  return d.join(' ');
}

// banda ancha para separadores / fondo
function banda(w, h, n, semilla) {
  const paths = [];
  for (let i = 0; i < n; i++) {
    const cx = (w / n) * (i + .5);
    const alto = h * (0.72 + ((i * 37 % 11) / 11) * 0.28);
    paths.push(hoja(cx, h * 1.02, alto, (w / n) * .42, 7, semilla + i * 977));
  }
  return paths;
}

const W = 1200, H = 600;
const svgBanda = `<svg class="nerv" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
${banda(W, H, 7, 12345).map((d, i) => `  <path d="${d}" data-vena="${i}"/>`).join('\n')}
</svg>`;
fs.writeFileSync('tools/_nervadura-banda.svg', svgBanda);

const W2 = 420, H2 = 720;
const svgHoja = `<svg class="nerv nerv--sola" viewBox="0 0 ${W2} ${H2}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <path d="${hoja(W2 / 2, H2 * .99, H2 * .95, W2 * .40, 9, 777)}" data-vena="0"/>
</svg>`;
fs.writeFileSync('tools/_nervadura-hoja.svg', svgHoja);
console.log('banda:', svgBanda.length, 'bytes | hoja:', svgHoja.length, 'bytes');
