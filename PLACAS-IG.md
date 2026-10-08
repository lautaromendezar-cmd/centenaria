# Placas de Instagram para distribuidores (7-oct-2026)

Historias **9:16, sin precio**, genéricas: Centenaria se las pasa a sus distribuidores
para que las suban (las referencias venían de @maximagualeguaychu).
Primera placa hecha: **«Sumá Centenaria a tu negocio»** en varios ambientes.

## Dónde está cada cosa

| Qué | Dónde |
|---|---|
| Placas entregables (1080×1920 JPG + zip) | `Desktop/Claude/contenido-centenaria/drive/` → se suben al Drive |
| Originales 2k, variantes y descartadas | `contenido-centenaria/ejemplos/` (`fondos/`, `descartadas/`) |
| Placas viejas del cliente (referencia) | `contenido-centenaria/ref/` |
| Fotos reales del paquete usadas como referencia | `contenido-centenaria/ref-packs/` (se sacan de `pdf-centenaria/assets/full/pack3-verde.png` y de `img/pack-*-v2.webp`) |
| Prompt base | al final de este archivo; copia local en `centenaria/material/placas-ig/` (ignorada por git) |
| Renderizador HTML→PNG y la variante por composición | `contenido-centenaria/comp/` (`render.py`, `placa-a.html`) |

Las imágenes no se suben a este repo porque es público. Las placas, las referencias, los prompts y los scripts están en el repo privado `ads-latina-centenaria`, en `centenaria/placas-distribuidores-9x16/`. Lo pesado (los 2k y las descartadas) está en el Drive.

## La regla: el paquete no se toca

Las placas que venían usando estaban hechas con IA y **el paquete salía mal en todas**:
decía «1915», «SINTA CC» y «Selene» en vez de *seleme*, y la letra chica era inventada.
Es lo primero que mira el cliente. Ninguna placa se entrega sin hacerles **zoom a los paquetes**.

## Comparativa de modelos (misma placa y las mismas 4 referencias del paquete)

| Modelo | Resultado |
|---|---|
| **GPT Image 2** (`gpt_image_2`) | **El elegido.** Copia los tres paquetes casi exactos, con 1918 y Sin T.A.C.C. bien |
| GPT Image 2.5 (`gpt_image_2_5`) | Casi igual de fiel; algún error mínimo de letra chica («PRODUCTO AR BENSIL») |
| Nano Banana Pro | Inventa la letra chica del azul («BIAI DA GPACOS») y escribe «TERBA MATE» |
| Seedream 5 Pro | Descartado: el título dice «a tu **negosio**» |
| Fondo IA + recorte real (HTML) | Descartado por Lautaro: se nota el recorte. Además, el recorte mide solo ~298 px de ancho |

Cómo se genera (Higgsfield CLI, desde `contenido-centenaria/`):

```bash
higgsfield generate create gpt_image_2 \
  --prompt "$(cat out/b/base.txt) <ESCENA> <PROPORCIÓN>" \
  --image ref-packs/tres-packs.png --image ref-packs/pack-original.png \
  --image ref-packs/pack-azul.png --image ref-packs/pack-esencial.png \
  --aspect_ratio 9:16 --resolution 2k --wait --json
```

Salen a 1520×2688. Para entregar se recortan 4 px por lado y se pasan a 1080×1920 en JPG con calidad 92.

## Ambientes

**Aprobados:** estudio amarillo con pedestal verde, mesa verde vista desde arriba (con mate y termo),
mostrador de almacén antiguo, cocina a la mañana, yerbal.

**Góndola:** la primera salió **chata**. Se rehízo sumando esta frase de proporción, que conviene dejar en todas:

> PACKAGE PROPORTIONS — CRITICAL: each package is a tall narrow 1kg brick, the front face is
> about 1.7 times taller than it is wide (roughly 12 cm wide x 21 cm tall x 8 cm deep)…
> Never squash, widen or shorten the packages.

**Depósito: EN PAUSA.** El paquete sale gigante al lado del pallet y las cajas. La IA no sabe
cuánto mide una caja ni cuántos paquetes entran, así que adivina. Se retoma cuando el cliente mande
fotos reales: depósito, caja cerrada y abierta, una carga o envío, góndolas de clientes y los
tres paquetes de frente con buena luz. Esas fotos se pasan como `--image` de escena.

Ojo con lo que el modelo agrega solo:
- En el mostrador inventó carteles con frases («Calidad que se siente», «Tradición argentina desde 1918»).
  Si la marca no las usa, hay que pedirle que no ponga texto en el fondo.
- En la góndola agrega productos de relleno. Hay que pedir que queden borrosos y sin texto legible.
- Existen **dos amarillos reales**: el «con palo» del folleto, que es el que usamos, y el
  «despalada / padrón uruguayo» de la foto del stand. No mezclarlos en una misma placa.

## Sin «Consultanos para distribuir» (8-oct)

El cliente pidió sacar esa línea de las 8 placas: la persona que las sube solo hace la publicidad,
no es distribuidora, y la frase prestaba a confusión. Quedan el separador y el @.

- No se regeneró nada. La línea se borró con inpaint de OpenCV y después se le devolvió el grano
  del fondo, copiado de una franja limpia de la misma placa (si no, quedan manchas lisas en la tela y la madera).
- Scripts en `contenido-centenaria/comp/`: `borrar-linea.py` (detecta el texto y hace el inpaint) y
  `borrar-linea-textura.py` (le devuelve el grano). Se corren desde la carpeta de las placas
  y reciben como argumento la carpeta de salida, que tiene que tener una subcarpeta `sin/`.
- Entregables: `contenido-centenaria/drive/Placas distribuidores 9x16 - sin consultanos/`
  + `Centenaria-placas-sin-consultanos.zip`, con los mismos nombres que las originales.

## Lo que sigue

1. El cliente elige ambientes. Faltan las otras placas: «Hacé crecer tu góndola»,
   «Tu próximo pedido mayorista» (la tienda online) y una de las tres variedades.
2. Sin definir: si la placa deja lugar para el logo o el @ del distribuidor, y si va el
   WhatsApp 3446 510714.
3. Con las fotos del cliente se retoma el depósito y se pueden hacer placas con **un solo paquete grande**,
   que hoy no salen nítidas.

## Campaña Meta 4:5 para sumar distribuidores (7-oct, misma tarde)

Pedido de Nahuel, que tomó como referencia un carrusel de Rei Verde. **A Lautaro no le gusta ese diseño**: de ahí solo se tomó la estructura del mensaje.
El objetivo es que escriban por WhatsApp (en Meta, CTA «Enviar mensaje de WhatsApp»).

**El filtro es la clave.** En campañas anteriores escribía mucha gente que quiere revender desde su casa. Centenaria busca distribuidores
con estructura que compren volumen, así que las piezas tienen que dejar afuera al que solo está probando.

| Tanda | Carpeta (en `contenido-centenaria/ejemplos/`) | Qué tiene | Prompt |
|---|---|---|---|
| 1 | `ads/` | Tradición «100 años», mano con paquete «BUSCAMOS DISTRIBUIDORES», «Llevá Centenaria a tu región». No filtra | `out/ads/base.txt` |
| 2 | `ads-estructura/` | «SOLO DISTRIBUIDORES Y MAYORISTAS» + «Logística propia / Cartera de comercios / Compra por volumen»; «Si movés volumen, hablemos» | `out/ads2/base.txt` |
| 3 | `ads-volumen/` | Con fotos reales del depósito: pallet, carga de camión, fardo + paquete para dar escala, foto real retocada | `out/ads3/base.txt` |

- **El teléfono se sacó** de todas las imágenes a pedido de Lautaro. El botón «Escribinos por WhatsApp» quedó sin número.
  Se borró con inpaint de OpenCV; las versiones con número siguen en `out/ads/`.
- **Logística real** (fotos y videos del cliente en `ref-deposito/`, convertidas en `ref-fardos/`): se despacha en
  **fardos de papel kraft** con impresión verde agua (hojas, «seleme CENTENARIA YERBA MATE», sello redondo)
  sobre pallets con film. Hay una camioneta blanca con la marca y un camión amarillo «Ervateira Seleme».
  Pasando esas fotos como `--image`, la escala sale bien. Los fardos generados quedan más cuadrados
  y prolijos que los reales; la foto real retocada es la más creíble.
- **Hay que confirmar con el cliente** frases que se escribieron sin dato: «Trabajamos por pallet», «de todo el país».
  Lo que mejor filtraría es una **compra mínima concreta** (Rei Verde pone «desde 200 kilos»): falta pedirle el dato a Nahuel.

**Estado al cierre:** a Lautaro **no le gustó el diseño de ninguna de las tres tandas**. Va a buscar referencias
y lo retoma desde casa. Lo que sí quedó validado: GPT Image 2, las referencias reales (paquete y fardos),
el filtro de «con estructura / por volumen» y el texto del anuncio. Lo que hay que cambiar es la dirección visual.

Texto del anuncio en Meta (con filtro):

> Buscamos distribuidores y mayoristas con estructura propia 🚚
> Si tenés logística, cartera de comercios y comprás por volumen, sumá Yerba Mate Centenaria: tres variedades, sin T.A.C.C., desde 1918.
> Escribinos por WhatsApp.
> *Venta exclusiva a distribuidores. No vendemos por unidad ni para reventa desde casa.*

Títulos: «Solo distribuidores con estructura» · «Venta mayorista por volumen» · «Sumá Centenaria a tu distribuidora».

## Para seguir desde otra PC

La carpeta `contenido-centenaria/` está solo en la PC de la oficina. Para seguir desde otra:
1. Bajar del Drive `contenido-centenaria-trabajo.zip` y descomprimirlo en `Desktop/Claude/`.
   Tiene las referencias del paquete y de los fardos, los prompts y todos los ejemplos.
   No incluye los videos originales: están en la PC de la oficina.
2. Instalar el CLI: `npm i -g @higgsfield/cli`, después `higgsfield auth login` y una sola vez `higgsfield workspace set <id>`.
3. Generar desde `contenido-centenaria/` con el comando de arriba, cambiando el prompt por el de la tanda.

## Prompt base (copia textual de `contenido-centenaria/out/b/base.txt`)

```text
Vertical 9:16 Instagram story for a yerba mate brand, aimed at shop owners and distributors. Premium, warm, editorial product advertising photography.

PRODUCT — CRITICAL: every yerba mate package must be an EXACT copy of the reference images (blue "Yerba Mate con Palo", yellow "Yerba Mate", white "Esencial"). Same proportions, colors, leaf line illustration, round seal "est 1918 Original Yerba Mate", "seleme" script, "CENTENARIA" wordmark, "1Kg" box and "Sin T.A.C.C." badge. Do not redesign, do not invent or change any text on the packages. The year is 1918. Packages must be fully visible, not cropped by the frame and not covered by other objects.

TEXT (Spanish, spelled exactly as written, check every letter, top area, clean geometric sans-serif + serif for CENTENARIA, generous margins):
Headline: "SUMÁ" / "CENTENARIA" (dark green serif capitals on a yellow #F8DD00 band) / "a tu negocio"
Subline: "Tu próximo producto estrella está acá."
Three short benefits with small round green icons: "Alta rotación" · "Calidad premium" · "Tres variedades para todos los consumidores"
Bottom: "Consultanos para distribuir" and "@yerbacentenariaargentina"
Text must be perfectly legible over the background (use darker areas or a subtle gradient behind it).
Leave the top 200px and bottom 250px free of important elements (Instagram UI safe zones). No prices. No extra logos, no watermarks.

SCENE AND CAMERA:
```

Después de `SCENE AND CAMERA:` va la escena, y al final la frase de proporción.
