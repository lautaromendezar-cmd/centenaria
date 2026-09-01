/* =========================================================================
   Centenaria — orquestacion. GSAP + ScrollTrigger sobre el motor de monte.js.
   Sin type="module": tiene que andar con doble clic sobre index.html.
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  if (!window.gsap) { console.warn('[centenaria] sin GSAP: queda la version legible'); return; }
  gsap.registerPlugin(ScrollTrigger);
  window.__cortina = true;   /* le avisa al script del <head> que la cortina la manejo yo */

  /* Ocultar lo que el JS va a revelar se hace ACA, no en el CSS: si este archivo
     no carga, .reveal ya vale opacity:1 y la pagina se lee entera. */
  var reveals = $$('.reveal');
  var lineas = $$('.hero__titulo .linea > span');
  gsap.set(reveals, { opacity: 0, y: 18 });
  gsap.set(lineas, { yPercent: 108 });

  var lienzo = $('#lienzo');
  var mundo = $('.mundo');
  var disco = $('#disco');
  var sello = $('.sello');
  var aroExt = $('.sello__aro--ext');
  var aroInt = $('.sello__aro--int');
  var selloTexto = $('.sello__texto');
  /* Los cuatro estados del disco. Es UN objeto que cambia de identidad, no cuatro
     adornos: sol (lo dibuja el shader) -> sello -> luna -> boca del mate -> boton. */
  var dSello = $('#dSello'), dLuna = $('#dLuna'), dMate = $('#dMate'), dOro = $('#dOro');
  var dYerba = $('#dYerba'), dBombilla = $('#dBombilla'), dAgua = $('#dAgua');

  /* ---------------------------------------------------------------- motor */
  var monte = null;
  var capas = {};
  $$('.mundo__capa').forEach(function (img) { capas[img.dataset.capa] = img; });

  function listas() {
    var todo = true;
    for (var k in capas) if (!capas[k].complete || !capas[k].naturalWidth) todo = false;
    return todo;
  }

  var iniciado = false;
  function arrancarMotor() {
    if (iniciado) return;
    iniciado = true;
    monte = window.Monte && window.Monte.iniciar({ lienzo: lienzo, capas: capas });
    if (monte) {
      mundo.classList.add('mundo--webgl');
      /* Una escena por capitulo. Se piden DESPUES del hero y por JS: no pasan por
         el DOM, no bloquean la cortina y no pelean por el LCP. Las seis a 1600
         suman ~234 KB. */
      if (monte.cargarEscenas) {
        monte.cargarEscenas(['historia', 'origen', 'variedades', 'porque', 'ritual', 'cierre']);
      }
      if (chico.matches || tocable) monte.estado.linterna = 0;
      if (quieto.matches) { monte.estado.linterna = 0; }
      escena();
    } else {
      /* Sin WebGL el paralaje lo hace el DOM: mas pobre, pero el sitio funciona. */
      escenaDom();
    }
  }

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)');
  var chico = window.matchMedia('(max-width: 900px)');
  var tocable = window.matchMedia('(hover: none)').matches;

  /* ------------------------------------------------------------- entrada */
  var entrada = gsap.timeline({ defaults: { ease: 'power3.out' }, paused: true });
  /* El LCP de esta pagina es SIEMPRE el bloque de texto mas grande del hero: el
     canvas no puede ser candidato y la imagen del mundo tampoco, porque Chrome
     descarta las que cubren el viewport entero (las toma por fondo). Por eso la
     bajada entra temprano y rapido: cada decima que se demore es LCP. */
  entrada
    .to(lineas, { yPercent: 0, duration: .95, stagger: .07 })
    .to($('.hero__volanta'), { opacity: 1, y: 0, duration: .5 }, .05)
    .to($('.hero__bajada'), { opacity: 1, y: 0, duration: .38 }, .10)
    .to($('.hero__acciones'), { opacity: 1, y: 0, duration: .6 }, .42)
    .to($('.hero__pista'), { opacity: .75, y: 0, duration: .6 }, .58);

  /* ------------------------------------------------------- puntero = farol */
  if (!tocable) {
    window.addEventListener('pointermove', function (ev) {
      if (!monte) return;
      monte.estado.ptr[0] = ev.clientX / window.innerWidth;
      monte.estado.ptr[1] = ev.clientY / window.innerHeight;
    }, { passive: true });
  }

  /* ------------------------------------------------------------- escenas */
  function prepararSello() {
    [aroExt, aroInt].forEach(function (c) {
      var l = 2 * Math.PI * c.r.baseVal.value;
      gsap.set(c, { strokeDasharray: l, strokeDashoffset: l });
    });
    gsap.set(selloTexto, { opacity: 0 });
    gsap.set(disco, { opacity: 0, scale: .82, rotate: -16 });
    gsap.set([dLuna, dMate, dOro], { opacity: 0 });
    gsap.set(dYerba, { y: 120, rotation: 0, svgOrigin: '200 200' });
    gsap.set([dBombilla, dAgua], { opacity: 0 });
    gsap.set(dBombilla, { x: -46, y: 46 });
  }
  prepararSello();

  function escena() {
    var e = monte.estado;

    if (quieto.matches) {
      /* Sin movimiento: el mundo ya esta abierto, el sol ya salio, el sello puesto. */
      gsap.set(e, { avance: .5, sol: 1, motas: .5, linterna: 0, vida: 0 });
      e.quieto = true;
      monte.frame();
      gsap.set(disco, { opacity: 1, scale: 1, rotate: 0 });
      gsap.set([aroExt, aroInt], { strokeDashoffset: 0 });
      gsap.set(selloTexto, { opacity: 1 });
      gsap.set(reveals, { opacity: 1, y: 0 });
      gsap.set(lineas, { yPercent: 0 });
      entrada.progress(1).pause();
      return;
    }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero', start: 'top top', end: '+=230%',
        pin: true, pinSpacing: true, scrub: .65, anticipatePin: 1
      }
    });

    /* 1. la camara entra al monte: las capas se separan y la niebla se abre.
          El sol sube DETRAS de la loma hasta despegarse del filo. */
    tl.to(e, { avance: 1, ease: 'none', duration: .54 }, 0)
      .to(e, { sol: 1, ease: 'power1.inOut', duration: .46 }, 0)
      /* el sol trepa hasta el punto de fuga de los rayos que ya trae la foto:
         si apareciera en otro lado se leeria como un disco pegado encima */
      .to(e, { solY: .70, solRadio: .10, ease: 'power1.inOut', duration: .46 }, 0)
      .to(e, { motas: 1, ease: 'power1.out', duration: .3 }, .10)

      /* 2. el texto del hero se va antes de que el sol quede solo en cuadro */
      .to([$('.hero__volanta'), $('.hero__titulo'), $('.hero__bajada'), $('.hero__acciones'), $('.hero__pista')],
        { opacity: 0, y: -50, ease: 'power2.in', duration: .2, stagger: .03 }, .14)

      /* 3. limpio de la cresta, pasa al frente, se centra y crece.
            Se lo deja respirar solo en cuadro: es el unico momento quieto del hero. */
      .to(e, { solX: .5, solRadio: .215, ease: 'power2.inOut', duration: .26 }, .42)
      .to(e, { motas: .3, ease: 'none', duration: .3 }, .5)

      /* 4. SE ENFRIA. El disco no se cambia por otro: pierde el halo, se le endurece
            el borde y vira al verde del envase. Recien sobre eso entra la tinta.
            Que sea el mismo objeto es lo que hace que se lea como reconocimiento
            —"ah, era el sello del paquete"— y no como un efecto de transicion. */
      .to(e, { solSobre: 1, ease: 'none', duration: .01 }, .60)
      .to(e, { solFrio: 1, ease: 'power2.inOut', duration: .16 }, .62)
      .to(e, { solY: .5, ease: 'power2.inOut', duration: .20 }, .60)
      .to(disco, { opacity: 1, scale: 1, rotate: 0, ease: 'power2.out', duration: .14 }, .74)
      .to(e, { solOpacidad: 0, ease: 'none', duration: .1 }, .76)
      .to([aroExt, aroInt], { strokeDashoffset: 0, ease: 'power2.inOut', duration: .2, stagger: .04 }, .76)
      .to(selloTexto, { opacity: 1, ease: 'power1.out', duration: .16 }, .84);

    /* ---------------------------------------------------------------------
       5. DE ACA EN ADELANTE: el disco atraviesa los capitulos cambiando de
       identidad. Nunca se va de pantalla y nunca se corta el fondo: eso es
       lo que hace que el scroll se sienta una sola toma.
       El disco vive en z-index 1, debajo del contenido — es un actor de
       fondo, no un elemento de interfaz. En el claro (que es opaco) queda
       tapado solo, sin que haya que apagarlo a mano.
       --------------------------------------------------------------------- */

    function tramo(donde, a, b) {
      return { trigger: donde, start: a || 'top 82%', end: b || 'top 28%', scrub: .6 };
    }

    /* OJO con esto, que costo un fallo de contraste real: varios tweens con scrub
       sobre la MISMA propiedad se pisan. GSAP le toma el valor inicial a cada tween
       cuando lo crea, asi que el de un capitulo posterior —todavia en progreso 0—
       devolvia la sombra a cero y dejaba el mundo brillante abajo del texto.
       Por eso todo tramo va con fromTo + immediateRender:false: cada uno declara de
       donde sale, y no toca nada hasta que le llega el turno. */
    function escalon(objetivo, prop, desde, hasta, cfg) {
      var a = {}, b = { ease: 'none', immediateRender: false, scrollTrigger: cfg };
      a[prop] = desde; b[prop] = hasta;
      return gsap.fromTo(objetivo, a, b);
    }
    function sombra(desde, hasta, cfg) { return escalon('.mundo__sombra', 'opacity', desde, hasta, cfg); }

    /* ---------------------------------------------------------------------
       LAS ESCENAS. `e.escena` es un solo numero continuo: 0 es el mundo del hero,
       1 la primera escena, 2,4 el 40% del camino entre la segunda y la tercera.
       Cada capitulo mueve ese numero un paso y el motor resuelve el cruce solo.
       Al ser un unico valor no hay estados que coordinar entre secciones.
       --------------------------------------------------------------------- */
    var ESCENAS = ['#historia', '#origen', '#variedades', '#porque', '#ritual', '#comprar'];
    ESCENAS.forEach(function (sec, i) {
      escalon(e, 'escena', i, i + 1, tramo(sec));
    });
    /* la vegetacion del hero pertenece a ESE punto de vista: se retira con el
       primer cambio de mundo, no se arrastra al galpon ni al aereo */
    escalon(e, 'frenteOp', 1, 0, tramo('#historia', 'top 88%', 'top 45%'));

    /* MANIFIESTO — el sello se corre, se achica y baja el tono para que se pueda
       leer encima. Pasa de protagonista a marca de agua, y ahi se queda durante
       la historia. */
    gsap.fromTo(disco,
      { scale: 1, xPercent: 0, yPercent: 0, opacity: 1 },
      { scale: .40, xPercent: 92, yPercent: -46, opacity: .3, ease: 'none',
        immediateRender: false, scrollTrigger: tramo('#manifiesto', 'top 92%', 'top 45%') });
    sombra(0, .58, tramo('#manifiesto', 'top 88%', 'top 30%'));

    /* 02 · ORIGEN — se enfria del todo: el mismo disco es ahora la luna sobre el
       monte de Brasil. Cruza al otro lado del cuadro porque el texto de este
       capitulo entra por la derecha. */
    gsap.timeline({ defaults: { immediateRender: false }, scrollTrigger: tramo('#origen') })
      .fromTo(dSello, { opacity: 1 }, { opacity: 0, duration: .4 }, 0)
      .fromTo(dLuna, { opacity: 0 }, { opacity: 1, duration: .4 }, .1)
      .fromTo(disco, { scale: .40, xPercent: 92, yPercent: -46, opacity: .3 },
                     { scale: .5, xPercent: -78, yPercent: -30, opacity: .34, duration: 1 }, 0);
    /* de noche el mundo se apaga mas y pierde saturacion */
    /* nada de tocar la saturacion por capitulo: el uniform lo comparten el mundo
       base y las escenas, y cada escena ya viene con su propio grado. */
    sombra(.58, .62, tramo('#origen'));

    /* 03 · VARIEDADES — el claro. Aca el mundo se ENCIENDE: la sombra se retira casi
       del todo y queda el yerbal luminoso detras de los envases. Antes esta seccion
       era un blanco plano y cortaba la pelicula al medio. El disco se apaga: en este
       capitulo los protagonistas son los tres paquetes. */
    escalon(disco, 'opacity', .34, 0, tramo('#variedades', 'top 90%', 'top 60%'));
    sombra(.62, .04, tramo('#variedades', 'top 92%', 'top 55%'));

    /* 04 · EL RITUAL — el disco visto desde arriba es la boca del mate. Y no es un
       dibujo decorativo: los cinco pasos lo mueven. */
    gsap.timeline({ defaults: { immediateRender: false }, scrollTrigger: tramo('#ritual', 'top 85%', 'top 45%') })
      .fromTo(dLuna, { opacity: 1 }, { opacity: 0, duration: .3 }, 0)
      .fromTo(dMate, { opacity: 0 }, { opacity: 1, duration: .4 }, .1)
      .fromTo(disco, { scale: .5, xPercent: -78, yPercent: -30, opacity: 0 },
                     { scale: .62, xPercent: -72, yPercent: 0, opacity: .55, duration: 1 }, 0);
    sombra(.62, .58, tramo('#ritual'));

    /* Cada paso mueve el diagrama. Es la parte del sitio donde el movimiento
       explica algo en vez de decorar. */
    var PASOS = [
      { yerba: { y: -52, rotation: 0 },   agua: 0, bombilla: 0 },   /* cargar 3/4 */
      { yerba: { y: -52, rotation: -21 }, agua: 0, bombilla: 0 },   /* inclinar */
      { yerba: { y: -52, rotation: -21 }, agua: 1, bombilla: 0 },   /* agua tibia */
      { yerba: { y: -52, rotation: -21 }, agua: .5, bombilla: 1 },  /* bombilla */
      { yerba: { y: -46, rotation: -18 }, agua: 1, bombilla: 1 }    /* cebar */
    ];
    $$('.paso').forEach(function (li, n) {
      ScrollTrigger.create({
        trigger: li, start: 'top 72%', end: 'bottom 40%',
        onEnter: function () { irAPaso(n); },
        onEnterBack: function () { irAPaso(n); }
      });
    });
    function irAPaso(n) {
      var P = PASOS[n];
      gsap.to(dYerba, { y: P.yerba.y, rotation: P.yerba.rotation, svgOrigin: '200 200',
        duration: .8, ease: 'power2.inOut', overwrite: 'auto' });
      gsap.to(dAgua, { opacity: P.agua, duration: .5, overwrite: 'auto' });
      gsap.to(dBombilla, { opacity: P.bombilla, x: P.bombilla ? 0 : -46, y: P.bombilla ? 0 : 46,
        duration: .7, ease: 'power3.out', overwrite: 'auto' });
    }

    /* 04 · POR QUE ELEGIRLA — el disco se retira: manda el texto. Y la sombra sube:
       la grilla de beneficios cruza todo el ancho y cae justo sobre los haces de luz,
       que es la zona mas clara del mundo. Medido con tools/contraste.cjs. */
    escalon(disco, 'opacity', .34, 0, tramo('#porque', 'top 85%', 'top 50%'));
    /* saliendo del claro el mundo se vuelve a cerrar */
    sombra(.04, .62, tramo('#porque', 'top 92%', 'top 45%'));

    /* 06 · CIERRE — el disco vuelve una ultima vez, ya como accion: oro lleno
       detras del bloque de compra. Cierra el recorrido que empezo con el sol. */
    gsap.timeline({ defaults: { immediateRender: false }, scrollTrigger: tramo('#comprar', 'top 85%', 'top 35%') })
      .fromTo(dMate, { opacity: 1 }, { opacity: 0, duration: .3 }, 0)
      .fromTo(dOro, { opacity: 0 }, { opacity: 1, duration: .4 }, .1)
      .fromTo(disco, { scale: .62, xPercent: -72, yPercent: 0, opacity: .55 },
                     { scale: 1.5, xPercent: 0, yPercent: 0, opacity: .10, duration: 1 }, 0);
    sombra(.58, .60, tramo('#comprar'));

    revelarCapitulos();
  }

  function escenaDom() {
    gsap.to('.mundo__capa[data-capa="frente"]', {
      yPercent: 12, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 }
    });
    gsap.to('.mundo__sol', {
      yPercent: -55, scale: 1.5, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 }
    });
    gsap.set(disco, { opacity: .34, scale: .42, xPercent: 92, yPercent: -46 });
    gsap.set([aroExt, aroInt], { strokeDashoffset: 0 });
    gsap.set(selloTexto, { opacity: 1 });
    gsap.to('.mundo__sombra', {
      opacity: .68, ease: 'none',
      scrollTrigger: { trigger: '#historia', start: 'top 88%', end: 'top 30%', scrub: .6 }
    });
    revelarCapitulos();
  }

  function revelarCapitulos() {
    $$('.manifiesto, .cap, .claro, .cierre').forEach(function (sec) {
      gsap.to($$('.reveal', sec), {
        opacity: 1, y: 0, duration: .85, stagger: .09, ease: 'power3.out',
        scrollTrigger: { trigger: sec, start: 'top 72%' }
      });
    });
  }

  /* ------------------------------------------------------------- cortina */
  var raiz = document.documentElement;
  var cortina = $('#cortina');
  var riel = $('#cortinaAvance');
  var anio = $('#cortinaAnio');
  var pct = $('#cortinaPct');
  var DESDE = 1918, HASTA = new Date().getFullYear();
  var carga = { v: 0 };

  function pintarCarga() {
    if (riel) riel.style.transform = 'scaleX(' + carga.v.toFixed(4) + ')';
    if (anio) anio.textContent = String(Math.round(DESDE + (HASTA - DESDE) * carga.v));
    if (pct) pct.textContent = String(Math.round(carga.v * 100));
  }
  pintarCarga();

  /* Progreso REAL: decodifica las capas del mundo y espera las fuentes. No es una
     barra falsa de 2 s — el punto del preloader es que el hero entre con todo listo. */
  function esperarTodo() {
    var recursos = $$('.mundo__capa');
    var logo = $('.cabecera__marca img');
    if (logo) recursos.push(logo);

    var tareas = recursos.map(function (img) {
      return (img.decode ? img.decode() : Promise.resolve()).catch(function () {});
    });
    /* Las fuentes se esperan, pero con tope: si Google Fonts esta lento no puede
       tener la cortina puesta a 1 s. El texto entra con la de respaldo y recompone. */
    tareas.push(document.fonts && document.fonts.ready
      ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })])
      : Promise.resolve());

    var total = tareas.length, hechas = 0;
    return new Promise(function (listo) {
      var cerrado = false;
      function fin() { if (!cerrado) { cerrado = true; listo(); } }
      /* plazo propio, mas corto que el del <head>: si una imagen se cuelga,
         entramos igual con lo que haya cargado */
      var plazo = setTimeout(fin, 5200);
      tareas.forEach(function (t) {
        t.then(function () {
          hechas++;
          gsap.to(carga, { v: hechas / total, duration: .5, ease: 'power2.out', onUpdate: pintarCarga });
          if (hechas === total) { clearTimeout(plazo); fin(); }
        });
      });
    });
  }

  function retirarCortina() {
    if (!cortina) { raiz.classList.remove('cargando'); entrada.play(); return; }
    if (quieto.matches) { raiz.classList.remove('cargando'); entrada.play(); return; }
    gsap.to(carga, { v: 1, duration: .3, ease: 'power2.out', onUpdate: pintarCarga });
    /* OJO: la clase .cargando se saca al FINAL. El CSS es `.cargando .cortina{display:flex}`,
       asi que sacarla antes hace desaparecer la cortina de golpe y el transform termina
       animando un elemento ya oculto: el telon no sube nunca. */
    gsap.timeline({ delay: .04 })
      .to(cortina, {
        yPercent: -101, duration: .9, ease: 'power3.inOut',
        onComplete: function () { raiz.classList.remove('cargando'); cortina.style.display = 'none'; }
      })
      /* La entrada arranca JUNTO con el telon, no despues: el texto pinta detras
         mientras sube (el LCP no mira oclusion, asi que cuenta igual) y arriba
         aparece un cuadro ya armado en vez de una segunda animacion. */
      .add(function () { entrada.play(); }, 0);
  }

  /* ---------------------------------------------------------------- init */
  var arranque = Date.now();
  esperarTodo().then(function () {
    arrancarMotor();
    /* piso de 420 ms: con todo cacheado la cortina pegaria un flash */
    var falta = Math.max(0, 420 - (Date.now() - arranque));
    setTimeout(retirarCortina, falta);
  });
  /* red de seguridad, por si la promesa nunca resuelve */
  setTimeout(function () {
    if (!iniciado) { arrancarMotor(); retirarCortina(); }
  }, 6500);

  var reajuste;
  window.addEventListener('resize', function () {
    clearTimeout(reajuste);
    reajuste = setTimeout(function () { ScrollTrigger.refresh(); }, 220);
  }, { passive: true });
})();
