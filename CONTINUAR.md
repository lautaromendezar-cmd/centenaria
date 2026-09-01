# CONTINUAR · Centenaria

Estado al **1-sep-2026 (tarde, desde la notebook)**. Para retomar desde otra máquina,
leer esto y después el [README](README.md), que explica cómo está armado y las
decisiones que no son obvias.

- **Online:** https://centenaria.vercel.app/ (Vercel, preset *Other*, sin build, push a `main` redespliega)
- **Repo:** `lautaromendezar-cmd/centenaria` · **PÚBLICO** · commit `13541b2`
- **Estado: esperando la devolución del cliente** sobre la ronda de ajustes del 1-sep:
  - El disco termina su viaje en el hero (sol → sello y se retira con el manifiesto);
    fuera la luna, la boca del mate y el círculo de oro.
  - Variedades dejó el velo claro: misma noche que el resto, la luz la ponen las tarjetas.
  - Menú móvil de pantalla completa (X, links centrados, contactos abajo); la cabecera
    móvil quedó solo con marca y hamburguesa.
  - `og:image` apunta a la URL de Vercel para que WhatsApp arme la tarjeta —
    **volverla al dominio propio cuando salga** (comentario en el head).
  - Fix real de scrub: volver al hero restaura bajada/botones/sello (fromTo + cajas;
    la nota larga está en el timeline del hero de `main.js`).
  - Títulos de capítulo entran por líneas (máscara del hero) y hay un gajo de yerba
    en primer plano con parallax en historia, ritual y cierre (`tools/rama.cjs`,
    `img/gajo-*.webp` — nombre nuevo por el caché inmutable de `/img/`).
- Las herramientas de `tools/` ahora resuelven `node_modules` y Chrome por máquina
  vía `tools/_entorno.cjs` (casa: `latina/node_modules`; notebook: `Desktop\Claude`).
  En la notebook NO correr `contraste.cjs`/`entrada.cjs` (WebGL por software clava la
  CPU): la suite completa se corre en la PC de casa antes de publicar.

---

## ⚠️ Lo que NO viaja con el repo

Esto es lo primero que hay que resolver en una máquina nueva. El sitio **funciona igual**
—todo lo que se sirve está commiteado— pero las herramientas no.

### 1. Las herramientas piden `sharp` y `puppeteer-core` de una ruta absoluta

Todos los scripts de `tools/` hacen:

```js
const req = createRequire('C:/Users/Lautaro/Desktop/Claude/latina/node_modules/');
```

Es a propósito: **este repo no puede tener `package.json`** (si Vercel lo ve, deja de servir
estático y sale a buscar un build que no existe). En otra máquina hay dos salidas:

- que exista el proyecto hermano `latina/` con sus `node_modules` en la misma ruta, o
- crear una carpeta cualquiera **fuera del repo**, correr ahí `npm i sharp puppeteer-core`,
  y cambiar esa ruta en los scripts.

También asumen Chrome en `C:/Program Files/Google/Chrome/Application/chrome.exe`.

### 2. `material/` está gitignoreado

Adentro está **todo el material del proyecto**: la copy aprobada, los datos, los precios, las
referencias de diseño, los pendientes y los prompts. Sin eso no se puede seguir escribiendo el
sitio. Va gitignoreado porque el repo es público y contiene teléfonos y nombres de 29
distribuidores —personas reales— y la lista de precios mayorista.

**Hay que copiarlo a mano** desde la máquina vieja (o pasar el repo a privado, sacar esa línea
del `.gitignore` y commitearlo).

### 3. `_gen/` está gitignoreado (94 MB)

Son los PNG crudos que salieron de Higgsfield. **No hacen falta para que el sitio ande**: los
WebP que se sirven ya están en `img/`. Sólo se necesitan si hay que volver a emitir las
imágenes en otros anchos o reencuadrarlas (`tools/capas.cjs`, `tools/escenas.cjs`).

Cómo se generaron, por si hay que rehacerlas:

| Qué | Modelo | Notas |
|---|---|---|
| Mundo del hero | `nano_banana_pro` 21:9 2k | Se eligió el encuadre con **la fuente de luz fuera de cuadro**: un sol quemado dentro de la foto pelearía con el sol que sube y se enfría |
| Rama de yerba (frente) | `seedream_v5_pro` con `remove_bg` | Devuelve el recorte con alfa ya hecho |
| Vegetación media | `recraft_v4_1` sobre negro + `remove_background` | |
| Las 6 escenas | `nano_banana_pro` 21:9 2k | Galpón 1918, aéreo atardecer, yerbal luminoso, mate en la mesa, noche, amanecer |

Ojo con `models_explore action:'recommend'`: devuelve 4-5 modelos y **se come los mejores**.
Nano Banana Pro no aparece ahí; hay que listar el catálogo entero.

---

## Lo que falta

### Del cliente (bloquea publicar en el dominio)

1. **La lista de puntos de venta.** Tenemos 29 distribuidores relevados del sitio de Latina y
   hay indicios fuertes de que es la misma red, pero son teléfonos de personas: no se publican
   por deducción. Hoy la sección usa el estado "todavía no llegamos a tu zona" como camino
   principal, con dos salidas escritas.
2. **Cuál de los dos Facebook es el bueno.** Por eso no está linkeado en ningún lado.
3. **El mínimo mayorista: ¿20 o 100 kg?** La tienda y el folleto se contradicen.
4. **¿Azul con Palo existe en ½ kg?** La ficha hoy dice sólo 1 kg, que es lo verificable en la
   tienda.
5. **El logo en vectorial.** Hoy es un PNG de 600 px.

### Mío

1. **Las tres páginas internas:** `/donde-comprar/`, `/vende-centenaria/`, `/contacto/`. Se
   mantienen los slugs del WordPress, que están indexados.
2. **Autohospedar las fuentes.** Hoy son de Google y el swap de Fraunces es el cuello del LCP;
   de paso el sitio andaría sin internet abriendo el `index.html`.
3. **El cache de `/img/`.** `vercel.json` le pone `immutable, max-age=31536000` pero los
   archivos **no llevan hash en el nombre**: si se regenera una imagen con el mismo nombre,
   quien ya entró sigue viendo la vieja un año. O se baja ese `max-age`, o se versionan los
   nombres. **Decisión pendiente de Lautaro.**
4. **Rechequear precios contra la tienda** antes de publicar (los relevados son del 30-ago).

### Decisión de hosting

El plan **Hobby de Vercel es para proyectos personales y no comerciales**, y esto es el sitio
de una empresa. Para la URL de revisión no hay problema. Cuando vaya al dominio propio hay que
decidir: Vercel en plan pago, o **Cloudflare Pages**, que ya usamos en Luraschi por exactamente
este motivo y es gratis para este caso.

---

## Decisiones tomadas que NO se reabren

- **La home v1** (ilustración de tres tintas, colinas de yerbal) está descartada por el
  cliente. No revivirla.
- **El mundo se genera; el paquete jamás.** La IA le reescribe el microtexto de la etiqueta.
  Los tres envases son fotos reales recortadas por detección.
- **La copy no se inventa**: sale del folleto v2 aprobado.
- **"Esencial" con una sola `s`**, que es lo que dice el envase real. La tienda vende
  "Essencial" — conviene avisarle.
- **El velo va neutro** (`--fondo #0A0B0B`), no en verde marca.
- **No se publican** ni los distribuidores, ni los precios mayoristas, ni el Facebook.

---

## Verificar (siempre antes de publicar)

```bash
node tools/servir.cjs 4740
node tools/robustez.cjs 4740    # 6 escenarios de FALLA — el que más importa
node tools/contraste.cjs 4740   # peor píxel detrás de cada línea, toda la home
node tools/entrada.cjs 4740     # cortina + LCP medido
node tools/rodar.cjs 4740       # hoja de contactos (agregá 390 844 para móvil)
```

Los cuatro pasaban al cerrar: 6/6 escenarios, toda la home en AA, LCP 964 ms.
