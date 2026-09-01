# Centenaria · web nueva

Sitio de **Seleme Centenaria** (yerba mate, desde 1918) — reemplaza el WordPress + Elementor
de `yerbamatecentenaria.com.ar`, que hice yo. Vanilla, **sin build**: HTML + CSS + GSAP +
un motor WebGL propio.

**Estado: la home está completa y verificada. Faltan las tres páginas internas.**

---

## Correr y verificar

```bash
node tools/servir.cjs 4740      # http://localhost:4740/

node tools/robustez.cjs 4740    # los 6 escenarios de FALLA (es el que más importa)
node tools/contraste.cjs 4740   # contraste de toda la home sobre el fondo real
node tools/entrada.cjs 4740     # cortina + LCP medido
node tools/rodar.cjs 4740       # hoja de contactos del scroll (agregá 390 844 para móvil)
```

Los scripts toman `sharp` y `puppeteer-core` de `../latina/node_modules` con `createRequire`,
a propósito: **este repo no tiene `package.json`**. Si aparece uno, Vercel deja de servir
estático y sale a buscar un build que no existe.

## Cómo está armado

| | |
|---|---|
| `index.html` | La home entera. El disco (sol → sello 1918, solo en el hero) es SVG inline |
| `css/estilo.css` | Hoja única. Tokens arriba, secciones en el orden en que se leen |
| `js/monte.js` | **Motor WebGL propio**, ~15 KB escritos a mano. No es three.js: ver abajo |
| `js/main.js` | GSAP + ScrollTrigger sobre ese motor. Sin `type="module"`: anda con doble clic |
| `img/` | Todo generado por `tools/`, nada arrastrado a mano |
| `tools/` | Preparación de imágenes y los cuatro verificadores |
| `_gen/` | Las generaciones crudas (Higgsfield). Gitignoreadas: 94 MB de PNG regenerables |

**Scripts viejos.** `verificar.cjs`, `mirar.cjs`, `movil.cjs` y `zoom.cjs` son de la home v1
descartada y apuntan a selectores que ya no existen; **`verificar.cjs` además está roto**
(llama `alListen(srv)` con `srv` sin definir). Los reemplazan los cuatro de arriba.
`paquetes.cjs`, `imagenes.cjs` y `nervadura.cjs` sí siguen sirviendo: generaron los tres
envases, las fotos reales del cliente y el patrón de nervadura.

## La idea

**El sol se convierte en el sello.** El sol sale detrás de la vegetación, se despega,
se enfría —pierde el halo, se le endurece el borde, aparece el filo dorado— y se convierte en
el **sello «est · 1918» que está impreso en los tres paquetes**. Ahí termina su viaje: con el
manifiesto se retira y no vuelve. (Hubo una versión donde seguía mutando por los capítulos
—luna, boca del mate, botón— y se descartó: fuera del hero quedaba como un círculo pegado
que sobraba.)

No es un adorno: el sello real ya trae el año, la frase del titular y «cien años abasteciendo
a América Latina». El sol y el sello tienen la misma forma, así que la transición no es un
efecto — es un reconocimiento.

El fondo es **uno solo y fijo** para toda la home. Las secciones no traen fondo propio: lo que
las hace legibles es `.mundo__sombra`, que sube por capítulo. Por eso el scroll se siente una
sola toma y no una pila de bloques.

## Decisiones que no son obvias

- **La copy no se inventó**: sale del folleto v2 que el cliente ya aprobó y usa.
- **El motor es WebGL propio y no three.js.** Hacen falta 5 quads con profundidad, niebla,
  motas y una luz que sigue al puntero. Un grafo de escena completo serían ~450 KB para no
  usar el 98% — y todo demo de three.js termina pareciéndose al anterior.
- **Tres capas, no cuatro.** Con foto real cada matte de más es un borde de más para que se
  note. La profundidad la completan la niebla, las motas y la linterna.
- **El mundo se genera; el paquete jamás.** La IA le reescribe el microtexto de la etiqueta.
  Los tres envases son fotos reales recortadas por detección.
- **La fuente de luz quedó FUERA de cuadro a propósito** al elegir la imagen. Un sol quemado
  dentro de la foto pelearía con el sol que sube y se enfría.
- **El velo del hero está calibrado, no elegido**: `tools/contraste.cjs` oculta el texto,
  captura el frame compuesto y mide el **peor píxel** detrás de cada línea. El H1 estaba en
  2,37:1 antes de recalibrarlo.
- **El oro nunca va como texto sobre fondo claro** — da 1,25:1. (Variedades fue una zona
  clara y hoy es oscura como el resto; la regla sigue valiendo dentro de las tarjetas blancas.)
- **Si GSAP no carga, la página se lee igual.** El respaldo está en el script inline del
  `<head>`, no dentro de `main.js` — que es justo el que puede no cargar. Lo mismo la cortina:
  el plazo que la retira lo arma el `<head>`, así que no hay forma de quedar encerrado atrás
  de un preloader.

### Dos cosas medidas que no eran obvias

- **En esta página el LCP es siempre el texto del hero.** Un `<canvas>` no es candidato nunca,
  y Chrome descarta las imágenes que cubren exactamente el viewport: las toma por fondo. (La
  misma imagen a 1400×800 sí califica; a 1440×900 no.) Por eso la entrada del hero arranca
  *junto* con el telón y no después: el texto pinta detrás mientras sube, y el LCP no mira
  oclusión. 2888 → 964 ms.
- **Varios tweens con `scrub` sobre la misma propiedad se pisan.** GSAP le toma el valor
  inicial a cada tween cuando lo crea, así que el de un capítulo posterior —todavía en
  progreso 0— devolvía `.mundo__sombra` a cero y dejaba el mundo brillante abajo del texto.
  Dio un fallo de contraste real (2,22:1). Todo tramo va con `fromTo` + `immediateRender:false`.

## Lo que falta

**Del cliente** (detallado en `material/PENDIENTES.md`, fuera del repo):
lista de puntos de venta, cuál de los dos Facebook es el bueno, si el mínimo mayorista es
20 o 100 kg, si Azul con Palo existe en ½ kg, y el **logo en vectorial** (hoy es un PNG
de 600 px).

**Deliberadamente NO publicado**, y conviene que siga así hasta que él confirme: la lista de
29 distribuidores (son teléfonos de personas reales y la lista está deducida de Latina), los
precios mayoristas (envejecen solos y le muestran la estructura de costos a la competencia) y
el Facebook.

**Mío:** las tres páginas internas (`/donde-comprar/`, `/vende-centenaria/`, `/contacto/`),
autohospedar las fuentes (hoy son de Google y el swap de Fraunces es el cuello del LCP; de
paso el sitio andaría sin internet), y volver a chequear precios contra la tienda antes de
publicar.

## ⚠️ El repo es PÚBLICO

Por eso `material/` está gitignoreado: adentro hay teléfonos y nombres de 29 distribuidores
—personas reales, y encima una lista **sin confirmar**—, la lista de precios mayorista y las
notas internas. **Si el repo pasa a privado**, se saca esa línea del `.gitignore` y se
commitea. Vercel despliega repos privados sin problema.

`material/` y `tools/` además están en `.vercelignore`: aunque se versionen algún día, no se
sirven en la web.
