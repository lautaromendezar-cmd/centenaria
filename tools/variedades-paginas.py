# -*- coding: utf-8 -*-
# Genera /variedades/<slug>/index.html para las tres variedades desde UNA plantilla.
# Las tres paginas NO se editan a mano: se toca esto y se vuelve a correr.
#     python tools/variedades-paginas.py
import io, os
R = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')).replace(os.sep, '/') + '/'

V = [
  dict(i='01', slug='original', n='original', nombre=u'Original', plano=u'Original',
       sub=u'Padr&oacute;n uruguayo <span aria-hidden="true">&middot;</span> la cl&aacute;sica',
       texto=u'La de siempre. Padr&oacute;n uruguayo de molienda fina y alto contenido de hoja: sabor suave, naturalmente dulce y sin acidez. Ideal para un mate largo y equilibrado, de la primera a la &uacute;ltima cebada.',
       chips=[u'500 g', u'1 kg', u'Sin T.A.C.C.'], perfil=u'Suave <span aria-hidden="true">&middot;</span> dulce <span aria-hidden="true">&middot;</span> sin acidez',
       meta=u'Yerba Mate Seleme Centenaria Original: padrón uruguayo de molienda fina y alto contenido de hoja. Suave, naturalmente dulce y sin acidez. En 500 g y 1 kg, sin T.A.C.C.',
       alt=u'Paquete de Yerba Mate Seleme Centenaria Original parado en el yerbal, al atardecer'),
  dict(i='02', slug='azul-con-palo', n='azul', nombre=u'Azul <span aria-hidden="true">&middot;</span> Con Palo', plano=u'Azul · Con Palo',
       sub=u'Mistura de dos padrones',
       texto=u'Mistura entre el padr&oacute;n uruguayo y el argentino, con un sutil agregado de palos que suaviza el cuerpo manteniendo el sabor caracter&iacute;stico de Centenaria.',
       chips=[u'1 kg', u'Sin T.A.C.C.'], perfil=u'Cuerpo medio <span aria-hidden="true">&middot;</span> con palo',
       meta=u'Yerba Mate Seleme Centenaria Azul con Palo: mistura del padrón uruguayo y el argentino con un sutil agregado de palos. Cuerpo medio, el sabor de Centenaria. En 1 kg, sin T.A.C.C.',
       alt=u'Paquete de Yerba Mate Seleme Centenaria Azul con Palo parado en el yerbal, a la hora azul'),
  dict(i='03', slug='esencial', n='esencial', nombre=u'Esencial', plano=u'Esencial',
       sub=u'Blend con car&aacute;cter',
       texto=u'Un blend irresistible y con car&aacute;cter, con las propiedades que brinda la fibra de la hoja de yerba mate nativa. Lo esencial est&aacute; en tu mate.',
       chips=[u'500 g', u'1 kg', u'Sin T.A.C.C.'], perfil=u'Con car&aacute;cter <span aria-hidden="true">&middot;</span> m&aacute;s fibra',
       meta=u'Yerba Mate Seleme Centenaria Esencial: un blend con carácter y la fibra de la hoja de yerba mate nativa. En 500 g y 1 kg, sin T.A.C.C.',
       alt=u'Paquete de Yerba Mate Seleme Centenaria Esencial parado en el yerbal, a la ma&ntilde;ana'),
]

def tarjeta(v):
    return u'''        <li class="tarjeta">
          <a class="tarjeta__enlace" href="/variedades/%(slug)s/">
            <img class="tarjeta__foto" src="/img/var-%(n)s-v1-900.webp" srcset="/img/var-%(n)s-v1-600.webp 600w, /img/var-%(n)s-v1-900.webp 900w, /img/var-%(n)s-v1-1300.webp 1300w" sizes="(max-width:900px) 92vw, 440px" width="900" height="900" alt="%(alt)s" loading="lazy" decoding="async">
            <div class="tarjeta__pie">
              <div class="tarjeta__texto">
                <h3 class="tarjeta__nombre">%(nombre)s</h3>
                <span class="tarjeta__sub">%(sub)s</span>
              </div>
              <span class="tarjeta__flecha" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg></span>
            </div>
          </a>
        </li>
''' % v

PLANTILLA = u'''<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%(plano)s &middot; Yerba Mate Seleme Centenaria</title>
<meta name="description" content="%(meta)s">
<link rel="icon" href="/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">
<!-- Pagina nueva del 23-sep (no viene del WordPress): una por variedad, enlazada
     desde las tarjetas de #variedades en la home y desde las otras dos. Se genera
     desde una plantilla, ver CONTINUAR.md. -->
<link rel="canonical" href="https://yerbamatecentenaria.com.ar/variedades/%(slug)s/">
<meta name="theme-color" content="#0A0B0B">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Seleme Centenaria">
<meta property="og:locale" content="es_AR">
<meta property="og:url" content="https://yerbamatecentenaria.com.ar/variedades/%(slug)s/">
<meta property="og:title" content="%(plano)s &middot; Yerba Mate Seleme Centenaria">
<meta property="og:description" content="%(meta)s">
<meta property="og:image" content="https://centenaria.vercel.app/img/og-var-%(n)s.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Product","name":"Yerba Mate Seleme Centenaria %(plano)s","image":["https://centenaria.vercel.app/img/og-var-%(n)s.jpg"],"description":"%(meta)s","brand":{"@type":"Brand","name":"Seleme Centenaria"},"url":"https://yerbamatecentenaria.com.ar/variedades/%(slug)s/"}
</script>

<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/fraunces-latin.woff2">
<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/montserrat-latin.woff2">
<link rel="stylesheet" href="/css/fuentes.css">
<link rel="stylesheet" href="/css/estilo.css">
</head>

<body>

<a class="saltar" href="#contenido">Saltar al contenido</a>

<div class="grano" aria-hidden="true"></div>
<div class="vineta" aria-hidden="true"></div>

<header class="cabecera" id="cabecera">
  <a class="cabecera__marca" href="/">
    <img src="/img/logo.webp" width="600" height="343" alt="Seleme Centenaria" decoding="async">
  </a>
  <nav class="cabecera__nav" aria-label="Principal">
    <a href="/#historia">Historia</a>
    <a href="/#origen">Origen</a>
    <!-- Variedades lleva a la seccion de la home y ademas despliega las tres
         variedades (23-sep): :hover y :focus-within, sin JS. El padding-top de
         .cabecera__sub es el puente para que el mouse no "caiga" entre el item y
         el panel. -->
    <div class="cabecera__grupo">
      <a href="/#variedades" aria-current="true">Variedades</a>
      <div class="cabecera__sub">
        <div class="cabecera__panel">
%(sub_cab)s        </div>
      </div>
    </div>
    <a href="/#ritual">El ritual</a>
    <a href="/donde-comprar/">D&oacute;nde comprar</a>
    <a href="/contacto/">Contacto</a>
    <a class="cabecera__tienda" href="https://centenariayerbamateshop.com.ar/" target="_blank" rel="noopener">Tienda</a>
  </nav>
  <button class="cabecera__menu" id="menuBoton" type="button" aria-label="Abrir men&uacute;" aria-expanded="false" aria-controls="menu">
    <span></span><span></span>
  </button>
</header>

<div class="menu" id="menu" aria-hidden="true">
  <button class="menu__cerrar" id="menuCerrar" type="button" aria-label="Cerrar men&uacute;"></button>
  <p class="menu__marca">Seleme Centenaria <span aria-hidden="true">&middot;</span> 1918</p>
  <nav class="menu__nav" aria-label="Principal">
    <a href="/#historia">Historia</a>
    <a href="/#origen">Origen</a>
    <a href="/#variedades" aria-current="true">Variedades</a>
    <div class="menu__sub">
%(sub_menu)s    </div>
    <a href="/#porque">Por qu&eacute; elegirla</a>
    <a href="/#ritual">El ritual</a>
    <a href="/donde-comprar/">D&oacute;nde comprar</a>
    <a href="/vende-centenaria/">Vend&eacute; Centenaria</a>
    <a href="/contacto/">Contacto</a>
    <a class="menu__tienda" href="https://centenariayerbamateshop.com.ar/" target="_blank" rel="noopener">Tienda</a>
  </nav>
  <div class="menu__contacto">
    <a href="https://wa.me/5493446239393" target="_blank" rel="noopener">WhatsApp <span aria-hidden="true">&middot;</span> 3446 23-9393</a>
    <a href="mailto:persaimportadora.ventas@gmail.com">persaimportadora.ventas@gmail.com</a>
    <a href="https://www.instagram.com/yerbacentenariaargentina/" target="_blank" rel="noopener">@yerbacentenariaargentina</a>
  </div>
</div>
<script>
(function () {
  var raiz = document.documentElement;
  var boton = document.getElementById('menuBoton');
  var menu = document.getElementById('menu');
  var cerrar = document.getElementById('menuCerrar');
  if (!boton || !menu || !cerrar) return;
  function poner(abierto) {
    raiz.classList.toggle('menu-abierto', abierto);
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    menu.setAttribute('aria-hidden', abierto ? 'false' : 'true');
    raiz.style.overflow = abierto ? 'hidden' : '';
    (abierto ? cerrar : boton).focus();
  }
  boton.addEventListener('click', function () { poner(true); });
  cerrar.addEventListener('click', function () { poner(false); });
  menu.addEventListener('click', function (ev) { if (ev.target.closest('a')) poner(false); });
  addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && raiz.classList.contains('menu-abierto')) poner(false);
  });
})();
</script>

<main class="variedad" id="contenido">
  <section class="variedad__hero">
    <div class="variedad__texto">
      <p class="volanta">Nuestra l&iacute;nea <span aria-hidden="true">&middot;</span> %(i)s</p>
      <h1 class="pagina__titulo">%(nombre)s</h1>
      <p class="variedad__sub">%(sub)s</p>
    </div>
    <!-- Una sola <picture> para escritorio y celular: en escritorio es el fondo
         fijo de esta pantalla, en celular pasa al flujo como figura 4:5 (CSS).
         Dos recortes de la misma escena, tools/variedades.cjs. -->
    <picture class="variedad__escena">
      <source media="(max-width:900px)" srcset="/img/var-%(n)s-alto-v1-600.webp 600w, /img/var-%(n)s-alto-v1-900.webp 900w" sizes="100vw">
      <img src="/img/var-%(n)s-fondo-v1-1600.webp" srcset="/img/var-%(n)s-fondo-v1-1100.webp 1100w, /img/var-%(n)s-fondo-v1-1600.webp 1600w, /img/var-%(n)s-fondo-v1-2200.webp 2200w" sizes="100vw" width="2200" height="1244" alt="%(alt)s" fetchpriority="high" decoding="async">
    </picture>
    <div class="variedad__texto">
      <p class="pagina__bajada">%(texto)s</p>
      <ul class="chips">%(chips)s</ul>
      <p class="variedad__perfil"><b>Perfil</b>%(perfil)s</p>
      <p class="pagina__acciones">
        <a class="boton boton--oro" href="https://centenariayerbamateshop.com.ar/" target="_blank" rel="noopener">Comprar en la tienda</a>
        <a class="boton boton--linea" href="/donde-comprar/">D&oacute;nde comprar</a>
      </p>
    </div>
  </section>

  <div class="variedad__resto">
    <section class="variedad__caja">
      <p class="volanta">Las otras dos</p>
      <h2 class="pagina__subtitulo">Una yerba para cada mate</h2>
      <ul class="tarjetas">
%(otras)s      </ul>
      <p class="variedad__volver"><a class="enlace" href="/#variedades">Ver las tres variedades <span aria-hidden="true">&rarr;</span></a></p>
    </section>
  </div>
</main>

<footer class="pie">
  <div class="pie__caja">
    <img class="pie__1918" src="/img/1918.webp" width="300" height="273" alt="" loading="lazy" decoding="async">
    <p class="pie__marca">Seleme Centenaria <span aria-hidden="true">&middot;</span> Desde 1918</p>
    <p class="pie__legal">Elaborada en origen, Brasil <span aria-hidden="true">&middot;</span> Gualeguaych&uacute;, Entre R&iacute;os, Argentina</p>
    <nav class="pie__nav" aria-label="P&aacute;ginas">
      <a href="/donde-comprar/">D&oacute;nde comprar</a>
      <a href="/vende-centenaria/">Vend&eacute; Centenaria</a>
      <a href="/contacto/">Contacto</a>
    </nav>
    <p class="pie__credito">Dise&ntilde;o web: <a href="https://lautaromendez.com.ar" target="_blank" rel="noopener">Lautaro Mendez</a></p>
  </div>
</footer>

</body>
</html>
'''

for v in V:
    d = dict(v)
    d['chips'] = u''.join(u'<li>%s</li>' % c for c in v['chips'])
    d['otras'] = u''.join(tarjeta(o) for o in V if o['slug'] != v['slug'])
    # el submenu de Variedades, con la variedad de esta pagina marcada
    d['sub_cab'] = u''.join(u'          <a href="/variedades/%s/"%s><b>%s</b><span>%s</span></a>\n'
                            % (o['slug'], u' aria-current="page"' if o['slug'] == v['slug'] else u'', o['nombre'], o['sub']) for o in V)
    d['sub_menu'] = u''.join(u'      <a href="/variedades/%s/"%s>%s</a>\n'
                             % (o['slug'], u' aria-current="page"' if o['slug'] == v['slug'] else u'', o['nombre']) for o in V)
    carpeta = R + 'variedades/' + v['slug']
    if not os.path.isdir(carpeta): os.makedirs(carpeta)
    io.open(carpeta + '/index.html', 'w', encoding='utf-8', newline='').write(PLANTILLA % d)
    print('variedades/%s/index.html' % v['slug'])
