# Centenaria · web nueva

Sitio de **Seleme Centenaria** (yerba mate, desde 1918) — reemplaza el WordPress + Elementor
de `yerbamatecentenaria.com.ar`, que hice yo. Vanilla, **sin build**: HTML + CSS + GSAP.

**Estado: la home está hecha y verificada. Falta todo lo demás.**

---

## Correr y verificar

```bash
node tools/servir.cjs 4740      # http://localhost:4740/
node tools/verificar.cjs        # Chrome real: consola, reveals, alt, scroll lateral
node tools/contraste-hero.cjs   # contraste del texto del hero SOBRE la foto
node tools/mirar.cjs            # capturas del riel pinneado
node tools/movil.cjs            # recorrido a 390 px + menú abierto
```

Los scripts toman `sharp` y `puppeteer-core` de `../latina/node_modules` con `createRequire`,
a propósito: **este repo no tiene `package.json`**. Si aparece uno, Vercel deja de servir
estático y sale a buscar un build que no existe.

## Cómo está armado

| | |
|---|---|
| `index.html` | La home entera. Los SVG de nervadura van inline (se animan con `stroke-dashoffset`) |
| `css/estilo.css` | Hoja única. Tokens arriba, secciones en el orden en que se leen |
| `js/main.js` | GSAP + ScrollTrigger. Sin `type="module"`: tiene que andar con doble clic |
| `img/` | Todo generado por `tools/`, nada arrastrado a mano |
| `tools/` | Preparación de imágenes, generador de la nervadura y los verificadores |

## Decisiones que no son obvias

- **La copy no se inventó**: sale del folleto v2 que el cliente ya aprobó y usa.
- **Los tres paquetes se recortaron por detección**, no a ojo: `tools/paquetes.cjs` busca las
  columnas no-verdes de `pack3-verde.png` y saca las cajas. Son provisorios — van a
  reemplazarse por fotos de producto en alta.
- **La nervadura de hoja es SVG generado** (`tools/nervadura.cjs`), no una imagen: por eso se
  puede dibujar con el scroll. Es el patrón real de los paquetes y las gazebos.
- **El oro nunca va como texto sobre fondo claro** — da 1,25:1. Sobre `--papel` se usa
  `--oro-hondo`. Eso define la arquitectura: el sitio es mayoritariamente oscuro y las zonas
  claras quedan para variedades, perfil de sabor y ritual.
- **El velo del hero está calibrado, no elegido**: se abre a la derecha para que se vea el
  paquete, y `tools/contraste-hero.cjs` mide el peor píxel detrás de cada línea de texto
  ocultando el texto y muestreando el frame compuesto. Todo pasa AA.
- **El riel de variedades se pinnea sólo en ≥1000 px.** En el celular queda como carrusel
  nativo con scroll-snap: se maneja mejor con el dedo y no pelea con el scroll vertical.
- **La escala de sabor tiene versión apilada en ≤700 px.** La horizontal es ilegible ahí.
- **Si GSAP no carga, la página se lee igual.** El respaldo está en el script inline del
  `<head>`, no dentro de `main.js` — que es justo el que puede no cargar.

## Lo que falta

**Del cliente** (está todo detallado en `material/PENDIENTES.md`, fuera del repo):
lista de puntos de venta, cuál de los dos Facebook es el bueno, si el mínimo mayorista es
20 o 100 kg, si Azul con Palo existe en ½ kg, **video** (no hay ninguno) y el **logo en
vectorial** (hoy es un PNG de 600 px).

**Mío:** las otras tres páginas (`/donde-comprar/`, `/vende-centenaria/`, `/contacto/`), las
fotos de producto en alta, los fondos generados que faltan, y volver a chequear precios
contra la tienda antes de publicar.

## ⚠️ El repo es PÚBLICO

Por eso `material/` está gitignoreado: adentro hay teléfonos y nombres de 29 distribuidores
—personas reales, y encima una lista **sin confirmar**—, la lista de precios mayorista y las
notas internas. **Si el repo pasa a privado**, se saca esa línea del `.gitignore` y se
commitea. Vercel despliega repos privados sin problema.

`material/` y `tools/` además están en `.vercelignore`: aunque se versionen algún día, no se
sirven en la web.
