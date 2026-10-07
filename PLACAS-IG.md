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

Las imágenes no se suben al repo porque pesan demasiado. Están en el Drive y en la PC de la oficina.

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

## Lo que sigue

1. El cliente elige ambientes. Faltan las otras placas: «Hacé crecer tu góndola»,
   «Tu próximo pedido mayorista» (la tienda online) y una de las tres variedades.
2. Sin definir: si la placa deja lugar para el logo o el @ del distribuidor, y si va el
   WhatsApp 3446 510714.
3. Con las fotos del cliente se retoma el depósito y se pueden hacer placas con **un solo paquete grande**,
   que hoy no salen nítidas.

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
