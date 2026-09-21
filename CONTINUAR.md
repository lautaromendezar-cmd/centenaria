# CONTINUAR · Centenaria

Estado al **21-sep-2026 (tarde, desde la PC de la oficina)**. Para retomar desde otra máquina,
leer esto y después el [README](README.md), que explica cómo está armado y las
decisiones que no son obvias.

- **Online:** https://centenaria.vercel.app/ (Vercel, preset *Other*, sin build).
  ⚠️ **El push a `main` YA NO redespliega** (21-sep): la integración de Vercel es una GitHub
  App y la cuenta de GitHub está marcada desde el 7-sep. Se publica a mano, desde un clon
  limpio para no subir `_gen/` ni `material/` (ver «Publicar» al final).
- **Repo:** `lautaromendezar-cmd/centenaria` · **PÚBLICO** · último commit: ver `git log -1`
- **Estado: el sitio está terminado de mi lado.** El 21-sep en la oficina se cerraron los
  seis pasos que faltaban, un commit por paso:
  1. **Ritual como escena fijada** (`ritualFijo` en main.js, `#dMate` en el SVG del disco,
     `html.ritual-fijo` en CSS): la sección se fija como el hero, el disco vuelve como la
     boca del mate y los cinco pasos lo transforman con el scroll, de a uno.
  2. **Cierre:** el sol del hero sale de nuevo sobre el monte en el pasaje al cierre y la
     página cierra con la frase literal «El día empieza con yerba mate» (`.cierre__remate`).
  3. **Historia:** el 1918 cuenta hasta hoy con el scroll (`contarHistoria`) y la foto de la
     fábrica va como copia de archivo en el hito 1918 (`tools/fabrica.cjs`, pie honesto).
  4. **Las tres páginas internas** con los slugs del WordPress: `/donde-comprar/`,
     `/vende-centenaria/`, `/contacto/` (sin motor, mundo quieto). Más `sitemap.xml` y
     `robots.txt`, y enlaces en el pie de todas.
  5. **Fuentes autohospedadas** en `fonts/` + `css/fuentes.css` (ver la trampa de opsz ahí).
     Ya no hay ninguna llamada a Google Fonts. **GSAP también está autohospedado**
     (`js/vendor/`), así que el sitio anda offline entero.
  6. **Precios y presentaciones cotejados** contra la tienda: coinciden (Original y
     Essencial en ½ y 1 kg, Azul con Palo solo 1 kg). La tienda pide **100 kg** de mínimo
     mayorista; el folleto dice 20. Sigue sin publicarse hasta que el cliente confirme.
- **⚠️ Los pasos 2 a 6 NO están verificados en Chrome.** En la oficina la CPU estaba
  ocupada codificando video y el WebGL por software no puede correr en paralelo. Del paso 1
  sí: robustez 6/6, pasajes OK (escritorio) y `tools/ritual.cjs` en escritorio y celular.
  **Falta la batería completa en la PC de casa antes de mostrárselo al cliente**
  (robustez, contraste, entrada, cruce-contraste, pasajes, ritual; escritorio y celular).
  Lo que hay que mirar a ojo además: el `.historia__anio` (arriba a la derecha de Historia,
  cae cerca del frente WebGL de la araucaria), el sol del cierre contra el velo `.60`, y
  que `contraste.cjs` en `#ritual` ya no mide los pasos (están en opacidad 0 al inicio del
  pin): si hace falta, sumar un punto a mitad del pin.
- **Bugs que aparecieron de paso (arreglados):** `--display-3`, `--radio-card` y
  `--radio-chip` se habían perdido en el commit de la home nueva (8297af5) y los títulos de
  fichas, pasos, puertas y contacto caían a 1rem. Restaurados con los valores originales:
  **esos títulos ahora se ven más grandes que en lo publicado** el 21-sep a la madrugada.
- Las herramientas de `tools/` resuelven `node_modules` y Chrome por máquina
  vía `tools/_entorno.cjs` (casa: `latina/node_modules`; notebook y oficina:
  `Desktop\Claude`). En la notebook y en la oficina NO correr `contraste.cjs`/`entrada.cjs`
  (WebGL por software clava la CPU): la suite completa se corre en la PC de casa.
  Desde el 21-sep todas emulan `prefers-reduced-motion: no-preference`: la PC de la
  oficina tiene las animaciones de Windows apagadas y Chrome tomaba el camino quieto.

### La PC de la oficina (21-sep), por si se vuelve a usar

- WMI está roto («Clase no válida»): `tasklist`/`taskkill` no andan y puppeteer no puede
  cerrar Chrome si el script se cae → quedan Chrome huérfanos comiendo CPU. Cerrarlos con
  `Get-Process chrome | Where StartTime` + `Stop-Process` (el Chrome del usuario tiene
  `MainWindowTitle`; no matar por nombre).
- Chrome headless reporta `prefers-reduced-motion: reduce` (ya contemplado en las tools).
- La red es flaky para cdnjs (por eso GSAP pasó a `js/vendor/`).
- Una sola corrida de puppeteer por vez, y avisar antes: si Lautaro está codificando
  video, la máquina no da para las dos cosas.

### Mensaje para el cliente (pedir todo junto)

> Hola [nombre]. Te paso lo que me falta de tu lado para dejar el sitio listo para el
> dominio, así lo resolvemos de una:
> 1. **La lista de puntos de venta** (comercios o distribuidores con localidad y, si
>    querés, teléfono). Mientras tanto la página dice «todavía no llegamos a tu zona» y
>    manda a la tienda online.
> 2. **Cuál Facebook es el oficial**: hay dos páginas dando vueltas y no quiero linkear
>    la equivocada.
> 3. **El mínimo mayorista**: la tienda dice 100 kg y el folleto 20 kg. ¿Cuál publico?
> 4. **Azul con Palo, ¿existe en ½ kg?** En la tienda solo está en 1 kg; en el sitio
>    dejé solo 1 kg.
> 5. **El logo en vectorial** (AI, SVG, PDF o EPS). Hoy tengo un PNG de 600 px y en
>    pantallas retina se nota.
> 6. **Fotos de los tres envases en alta** (la foto original, sin comprimir). Las del
>    folleto están al límite.
> 7. **La foto de la fábrica sin el filtro**, la original que sacaron, y **el nombre del
>    pueblo** donde está, para el pie de foto. Ojo que esa foto es de la fábrica de hoy,
>    no de 1918: la puse como «La ervateira Seleme, hoy. Donde empezó todo».
> Con eso cierro y pasamos al dominio. ¡Gracias!

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

### 2-bis. Lo NUEVO que tampoco viaja (2-sep)

- `material/PROMPTS-ESCENAS.md` — los seis prompts del mundo, con el bloque común de óptica
  y grado. **Sin esto no se puede regenerar ninguna escena.**
- `_gen/esc-v2/` — los PNG fuente de las seis escenas, los `.txt` de cada prompt, y las dos
  descartadas (`_ritual-dia-descartada.png`, `_variedades-nubes-descartada.png`).
- `_gen/packs/` — los recortes con alfa a resolución nativa.
- `_gen/frentes/` — los seis PNG con alfa de los primeros planos (21-sep) y sus prompts
  (`*.txt` + `comun.txt`). Sin esto no se puede rehacer ninguno.
- El respaldo del mundo v1 vive **fuera del repo**, en
  `Desktop/Claude/_centenaria-fondos-v1-20260902` (140 MB).

Lo que sí viaja y alcanza para que el sitio ande: los `.webp` de `img/`.

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
| Las 6 escenas (v2) | `nano_banana_pro` 21:9 2k | **Una sola película**, ver abajo. Los prompts están en `material/PROMPTS-ESCENAS.md` |
| Primeros planos de las 6 escenas (21-sep) | `seedream_v5_pro` 4:3 2k `remove_bg` | Sobre gris plano, 3 créditos c/u. Prompts en `_gen/frentes/`; se emiten con `tools/frentes.cjs` |

Ojo con `models_explore action:'recommend'`: devuelve 4-5 modelos y **se come los mejores**.
Nano Banana Pro no aparece ahí; hay que listar el catálogo entero.

---

## El mundo v2 — una película, no seis fotos (2-sep)

La v1 eran **seis fotos sin relación**: dos interiores casi idénticos (`porque` y `ritual`),
dos aéreos casi idénticos (`origen` y `cierre`) y un campo blanco (`variedades`) que no
pertenecía a ese mundo. Por buenas que fueran una por una, juntas se leían como un banco de
imágenes. Se ve en `tools/_qc-cruces.jpg`, columna del medio.

La v2 es **una sola tarde que se hace noche y termina amaneciendo**, bajando del monte a la
mesa. El tiempo siempre avanza; la altura hace el viaje:

| # | Sección | Cámara | Momento |
|---|---|---|---|
| 01 | `historia` | El secadero entre araucarias, humo del barbacuá | Última luz |
| 02 | `origen` | Justo sobre el dosel, niebla en los valles | Atardecer |
| 03 | `variedades` | Entre las hileras del yerbal, con los envases parados adentro | Atardecer |
| 04 | `porque` | De vuelta entre las hojas, rocío a contraluz | Noche |
| 05 | `ritual` | La mesa junto a la ventana, farol | Noche cerrada |
| 06 | `cierre` | El monte otra vez, ventana encendida a lo lejos | Amanece |

El 06 cierra el círculo contra el hero, que dice «El día empieza con yerba mate».

**Lo que hace que se lean como un mundo no es el guion, es el bloque común de óptica y grado**
que va pegado en los seis prompts sin cambiar una palabra: misma lente, mismo grano, misma
aberración, mismo bosque, y la luz siempre arriba a la derecha con el cuadrante inferior
izquierdo vacío, que es donde vive el texto. Si cada prompt trae su propia óptica, vuelven a
ser seis fotos.

### Los tres envases dejaron la tarjeta blanca (2-sep)

Las tres tarjetas blancas cortaban la película al medio: eran lo único del sitio que no
pertenecía al mundo. Ahora **los envases se paran dentro del yerbal**.

Cómo está resuelto, que es lo que importa para no romperlo:

- **Los envases NO se generan.** Son la foto real, recortada con alfa por
  `tools/paquetes-alfa.cjs` desde el folleto `pdf-centenaria/assets/full/pack3-verde.png`.
  Se probó generarlos en ambiente y el modelo escribió **«YERBA MATE DUS PALO»** en el azul
  (dice CON PALO) y microtexto inventado en los tres. Impublicable sobre el producto de un
  cliente.
- **El fondo es el mundo WebGL, no una foto compuesta.** Si el conjunto fuera una sola
  imagen 21:9, los envases no se podrían animar por separado y su posición quedaría fija
  mientras el texto reflowea: en cada resolución se desalinearían. Separados, el texto sigue
  siendo HTML y acomoda solo.
- **Lo que los apoya es su sombra de contacto** (`.ficha__peana::after`), no el suelo de la
  foto. El fondo es fijo y la sección scrollea encima, así que ningún horizonte pintado
  calzaría en más de una posición de scroll.
- **El filo cálido va con `drop-shadow`, no `box-shadow`**: drop-shadow respeta el alfa y
  sigue la silueta; box-shadow dibujaría un rectángulo.
- **Entran escalonados y viajan a distinta velocidad** (el del medio un poco más), para que
  la fila se abra en profundidad en vez de moverse pegada.

⚠️ **Recorte:** el fondo del original es verde oscuro **y la sombra bajo los envases también**.
Con `g > r+12 && g > b+12` la sombra quedaba del lado del paquete y los tres salían pegados en
un solo grupo. El criterio que separa es `g < 170 && g >= r-2 && g >= b+2` — el tope de 170 es
lo que deja afuera al envase blanco. Y `sharp.metadata()` devuelve el tamaño del **archivo**,
no el del `extract`: hay que tomar ancho/alto/canales del propio `toBuffer`.

⚠️ **Resolución:** el único original es un folleto de 1080×1440, así que cada envase mide
~298×499 nativos — alcanza, pero está justo en retina. **Pedirle al cliente las fotos de los
envases en alta.** No sirve un upscale: reescribe el microtexto de la etiqueta.

⚠️ **El velo afloja en esta sección** (`.62 → .52`) para que el yerbal se lea, y arranca recién
a `top 45%`: con el tramo por defecto empezaba a abrirse mientras el texto de `#origen` seguía
en pantalla y `.cadena__sentis` caía a 4.07:1 contra los 4.5 que exige.

⚠️ **`ritual` salió de día en el primer intento** y hubo que rehacerla: el bloque común pide
la luz arriba a la derecha, y el modelo la metió por la ventana como si fuera la mañana. Para
una escena nocturna hay que decir «DEEP NIGHT», negar explícitamente el amanecer y los haces,
y dejar la ventana como fuente fría. La descartada quedó en `_gen/esc-v2/_ritual-dia-descartada.png`.

⚠️ **La versión del nombre va en `tools/escenas.cjs` (`VERSION`) y en `cargarEscenas` de
`js/monte.js`. Hoy es `v3`.** Se sube CADA VEZ que se regenera cualquier escena, aunque sea
una sola: `/img/` se sirve `immutable` un año sin hash, así que reusar el nombre deja al que
ya entró viendo la imagen vieja. Ya pasó dos veces en este proyecto — la segunda, regenerando
`variedades` sobre el mismo `-v2-` que ya estaba publicado.

**Respaldo de la v1:** `Desktop/Claude/_centenaria-fondos-v1-20260902` (140 MB, fuera del
repo) y los PNG fuente también en `_gen/esc-v1/`.

**Costo:** 2 créditos por imagen 21:9 2k. Las seis + una repetición salieron 14.

---

## Planos y pasajes — la respuesta a «se siente plano» (20/21-sep)

Diagnóstico, que el cliente confirmó sin saberlo: el hero es un LUGAR (tres planos que se
separan, un sol que se transforma, el texto se va y el mundo actúa) y los capítulos eran un
FONDO DE PANTALLA: una foto chata con zoom (Ken Burns, no profundidad), detrás de un velo al
55–70% durante toda la página, y el cruce entre escenas pasaba debajo del título nuevo,
donde nadie lo veía. Además, el 1-sep se había sacado el viaje del disco después del hero
y no se lo reemplazó con otro hilo. Lo que se hizo:

### 1. Cada escena son dos planos (`tools/frentes.cjs`, `js/monte.js`)

- Fondo: la misma foto entera de siempre (`img/esc-<n>-v3-*.webp`, no se tocó).
- **Primer plano con alfa apoyado en una esquina:** rama de araucaria (historia), copa de
  araucaria desde arriba (origen), rama de yerba desde la izquierda (variedades), hojas con
  rocío (porque), atado de yerba seca colgado (ritual), brotes al amanecer (cierre).
  Se sirven como `img/frente-<n>-v1-{1000,1600}.webp`, **cuadrados**.
- Generados con **seedream_v5_pro 4:3 2k `remove_bg: true`** sobre fondo gris plano,
  3 créditos cada uno (18 en total). Prompts en `_gen/frentes/*.txt` más `comun.txt`
  (bloque de óptica compartido, distinto al de las escenas porque el sujeto va aislado).
  Los PNG fuente están en `_gen/frentes/` (**no viajan con el repo**).
- El motor dibuja el frente con **`uFit=1`**: la textura se ajusta al lado CORTO del
  viewport y se ancla a la esquina (`uAncla`), no cover-fit. Con cover-fit una rama pegada
  a una esquina desaparece en vertical (el 21:9 se recorta a su centro). El zoom se hace
  sobre el centro del VIEWPORT, así que al avanzar la esquina se abre hacia afuera.
- El frente viaja con el mismo empuje de cámara que el fondo, **amplificado ×2,7**, con más
  deriva de puntero y viento propio. Esa diferencia de velocidad es la profundidad.
- ⚠️ El anclaje de cada frente está en DOS lugares y tienen que coincidir: `FRENTES` en
  `tools/frentes.cjs` y el segundo argumento de `cargarEscenas` en `main.js`
  (`pedirEscenas`).
- ⚠️ `dibujarCapa` (las capas del hero) comparte programa con los frentes y **tiene que
  volver a poner `uFit=0`** en cada dibujo, o hereda el anclaje del último frente.
- Los gajos DOM de historia y ritual (`.rama--historia`, `.rama--ritual`) se sacaron:
  caían sobre el mismo rincón que el frente WebGL y quedaban dos ramas apiladas. Queda
  solo el del cierre.
- Las doce texturas se piden **recién cuando la cortina salió** (`pedirEscenas`, llamado
  desde `retirarCortina`) y se suben **de a una por cuadro** (cola en `cargarEscenas`).
  Antes se pedían al arrancar el motor y las subidas caían justo sobre la salida de la
  cortina: por software el LCP se iba a 4,1–4,4 s; diferidas, 2,4–2,8 s.

### 2. Pasajes: el mundo recupera la pantalla entre capítulos (`index.html`, `main.js`, CSS)

- Un `<div class="pasaje">` antes de cada capítulo (seis). Miden **130vh** en escritorio
  y **120vh** en celular, y **solo existen con `html.con-pasajes`**, que la pone
  `escena()` en main.js (o sea: con motor y con scroll animado). Sin JS o sin WebGL
  quedan en alto 0, nada de agujeros. La página pasó de 12,7 a 20,5 pantallas en
  escritorio y de 16,4 a 23,6 en celular.
- Cada pasaje es UN timeline con scrub (`top 22%` → `bottom 84%` del pasaje): velo del
  capítulo anterior → **.12** → velo del capítulo nuevo (`VELO = [.58,.62,.52,.64,.58,.60]`),
  y en el medio el cruce `e.escena i → i+1` y el arranque de la cámara nueva. Dos tweens
  sobre `.mundo__sombra` en secuencia dentro del mismo timeline no se pisan: la trampa
  era entre scrollTriggers distintos.
- Se fueron los tramos de velo por sección, incluido el «dos tiempos» de variedades: con
  el cruce dentro del pasaje no hay texto en pantalla, y `cruce-contraste.cjs` dice «sin
  texto en pantalla» en los seis cruces, en escritorio y en celular.
- `node tools/pasajes.cjs 4740 [390 844]` arma la hoja de contactos de los seis pasajes
  (`tools/_qc-pasajes*.jpg`) e imprime `e.escena` y el velo en siete puntos de cada uno.
- ⚠️ `contraste.cjs` puede dar un **falso `1.00:1` en `.proceso`** (#comprar): mide
  mientras la tercera tarjeta todavía está entrando (stagger del reveal). Repetir la
  corrida antes de creerle; el 21-sep pasó las dos veces siguientes.

### 3. Ritual como escena fijada, Cierre e Historia (HECHOS el 21-sep, tarde)

Lo que aprobó Lautaro el 21-sep: **Ritual primero, después el Cierre, Historia opcional.**
Se hicieron los tres (ver el estado arriba). Seis escenas fijadas cansan y la página
mediría el triple: es una sola fijada (Ritual, 4,6 pantallas) más dos gestos (el sol del
cierre y el 1918 que cuenta). El plan original, para entender lo que hay:

- **Ritual:** la sección se fija (pin) como el hero. El disco vuelve como **la boca del
  mate vista desde arriba** (era parte de la idea original aprobada: sol → sello → luna →
  boca del mate) y los cinco pasos lo transforman con el scroll: se llena a tres cuartos,
  se inclina, entra el hilo de agua, la bombilla, la cebada. Los pasos se reemplazan uno a
  uno sobre la escena de la mesa mientras la cámara sigue. Dibujarlo en SVG sobre
  `#disco` (ya existe, fixed, hoy se retira en el manifiesto) y moverlo con scroll como el
  hero. El frente actual de ritual (atado seco, arriba a la izquierda) puede quedar o irse
  según estorbe. El texto largo de los cinco pasos no entra en una pantalla fija: va de a
  un paso por vez.
- **Cierre:** el sol sale de nuevo sobre el monte al amanecer y cierra contra «El día
  empieza con yerba mate». Es el mismo `FS_SOL` del hero (`e.sol*`, `solSobre`). Para que
  se oculte tras el monte la escena de cierre necesitaría alfa en el cielo; dibujarlo
  delante con halo es más simple y probablemente alcance.
- **Historia (opcional):** el `1918` de la cortina contando hasta hoy sobre la fábrica,
  con la foto real del cliente como copia de archivo (ver abajo).

### La foto de la fábrica que mandó el cliente (21-sep)

Está en `material/assets/foto-fabrica-hoy-filtro-sepia.jpeg` (el original mide 1098×1433,
no 617×805) y **no viaja con el repo**; lo que se sirve sí: `img/fabrica-hoy-{480,800}.webp`,
emitidos con `node tools/fabrica.cjs 20 20 1058 1393` (recorta el marco del filtro). ⚠️ **NO es de 1918**, aunque
él la mandó como «cómo se veía la fábrica en 1918»: es la fábrica de hoy con filtro sepia y
marco de app de celular (chapa galvanizada, portón moderno, cartel «Ervateira SELEME ·
Desde 1918» con las franjas de la marca actual, araucarias). Presentarla como 1918 es un
error que cualquiera nota. Vale igual: es el lugar real y tiene las mismas araucarias que
la escena de historia. Va como copia de archivo en el hito 1918 de Historia, recortando el
marco del filtro, con pie honesto («La ervateira Seleme, hoy. Donde empezó todo»).
Pedirle el original sin filtro y el nombre del pueblo. A 617 px alcanza para una copia de
unos 400 px, no para pantalla completa.

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

1. ~~Las tres páginas internas~~ HECHO 21-sep.
2. ~~Autohospedar las fuentes~~ HECHO 21-sep (y GSAP también).
3. **El cache de `/img/` (y ahora `/fonts/`).** `vercel.json` les pone `immutable,
   max-age=31536000` pero los archivos **no llevan hash en el nombre**: si se regenera una
   imagen con el mismo nombre, quien ya entró sigue viendo la vieja un año. O se baja ese
   `max-age`, o se versionan los nombres (las escenas y frentes ya van con `-v3-`/`-v1-`).
   **Decisión pendiente de Lautaro.**
4. ~~Rechequear precios contra la tienda~~ HECHO 21-sep: coinciden; el sitio no publica precios.
5. **La batería completa en la PC de casa** (ver arriba) y recién después mostrárselo al
   cliente y mandarle el mensaje de la sección «Mensaje para el cliente».

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
node tools/cruce-contraste.cjs 4740   # contraste A MITAD de cada cruce (tiene que decir «sin texto en pantalla»)
node tools/pasajes.cjs 4740     # hoja de contactos de los seis pasajes (agregá 390 844 para móvil)
node tools/ritual.cjs 4740      # hoja de contactos del ritual fijado (agregá 390 844 para móvil)
```

Al cerrar el 21-sep: 6/6 escenarios, toda la home en AA, sin texto a mitad de los cruces, LCP 2,4–2,8 s por software (máquina cargada; el árbol anterior daba 2,4–4,2 ese día).

## Publicar (desde el 21-sep, a mano)

El webhook de Vercel no dispara. Deployar el commit que está en `main`, desde una copia
limpia (el árbol de trabajo tiene `_gen/` y `material/`, que no están en `.vercelignore`):

```bash
D=$TEMP/cent-deploy && rm -rf "$D" && mkdir -p "$D"
git archive HEAD | tar -x -C "$D" && cp -r .vercel "$D/.vercel"
(cd "$D" && vercel deploy --prod --yes)
vercel ls          # tiene que aparecer un deploy de hace segundos, Ready, Production
```

`.vercel/` es la carpeta que deja `vercel link` (gitignoreada): si en una máquina nueva no
está, correr `vercel link` una vez dentro del repo. Después cotejar lo publicado contra el
commit bajando `index.html`, `css/`, `js/` e `img/` con `curl` y comparando con `cmp`.
