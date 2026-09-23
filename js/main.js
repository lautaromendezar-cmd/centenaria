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
  /* En el celular la barra del navegador aparece y se esconde con el scroll y
     dispara resize con el MISMO ancho. Refrescar ahi es rehacer todos los
     triggers y el pin del hero en pleno scroll: en el iPhone la pagina se
     sentia pesada y llego a colgarse (23-sep). Ver tambien el resize de abajo. */
  ScrollTrigger.config({ ignoreMobileResize: true });
  window.__cortina = true;   /* le avisa al script del <head> que la cortina la manejo yo */

  /* Ocultar lo que el JS va a revelar se hace ACA, no en el CSS: si este archivo
     no carga, .reveal ya vale opacity:1 y la pagina se lee entera. */
  /* Los titulos grandes NO van en el paquete de reveals: entran por lineas, con
     la misma mascara que el titulo del hero (ver revelarCapitulos). */
  var TITULOS = '.manifiesto__titulo, .cap__titulo, .claro__titulo, .remate__titulo';
  var reveals = $$('.reveal').filter(function (el) { return !el.matches(TITULOS); });
  var lineas = $$('.hero__titulo .linea > span');
  gsap.set(reveals, { opacity: 0, y: 18 });
  gsap.set(lineas, { yPercent: 108 });

  /* "yerba mate" en el hero: arranca crema, como el resto del titulo, y en la
     entrada se enciende a dorado (ver .hero__acento en el CSS, que es el
     estado final por si esto no corre). Los colores salen de los tokens, no
     hardcodeados: si --crema u --oro cambian, esto los sigue. */
  var acento = $('.hero__acento');
  var tokens = getComputedStyle(document.documentElement);
  var CREMA = tokens.getPropertyValue('--crema').trim();
  var ORO = tokens.getPropertyValue('--oro').trim();
  if (acento) gsap.set(acento, { color: CREMA });

  var lienzo = $('#lienzo');
  var mundo = $('.mundo');
  var disco = $('#disco');
  var sello = $('.sello');
  var aroExt = $('.sello__aro--ext');
  var aroInt = $('.sello__aro--int');
  var selloTexto = $('.sello__texto');

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
      if (chico.matches || tocable) monte.estado.linterna = 0;
      if (quieto.matches) { monte.estado.linterna = 0; }
      escena();
    } else {
      /* Sin WebGL el paralaje lo hace el DOM: mas pobre, pero el sitio funciona. */
      escenaDom();
    }
  }

  /* Las escenas de los capitulos (fondo + primer plano de cada una) se piden
     recien cuando la cortina ya salio: por JS, sin pasar por el DOM, y de a una
     textura por cuadro (ver cargarEscenas en monte.js). Antes se pedian al
     arrancar el motor y las doce subidas caian justo sobre la salida de la
     cortina y la entrada del hero. El primer capitulo esta a mas de tres
     pantallas de scroll: sobra tiempo. */
  var escenasPedidas = false;
  function pedirEscenas() {
    if (escenasPedidas || !monte || !monte.cargarEscenas) return;
    escenasPedidas = true;
    /* el segundo argumento es el anclaje del PRIMER PLANO de cada escena
       (x: 0 izq / 1 der, y: 0 abajo / 1 arriba). Ver tools/frentes.cjs. */
    /* historia NO lleva frente desde el 22-sep: su fondo dejo de ser una escena
       generada y paso a ser la foto real de la ervateira, que ya trae su propio
       primer plano (el porton, la garita, los arboles pelados). La rama colgando
       caia sobre el galpon y el sol, y eran dos primeros planos peleando: el mismo
       motivo por el que .rama--historia se habia sacado el 20-sep. */
    /* El tercer argumento es el punto del ANCHO de cada foto que el encuadre tiene
       que cuidar cuando la pantalla es angosta (ver FS_CAPA en monte.js). Historia
       lo necesita: el cartel de la ervateira vive cerca del 65% del ancho y en
       celular —donde entra como un 20% de la textura— quedaba al borde del cuadro,
       que es justo lo que el cliente quiere que se vea. En escritorio no cambia
       nada: con mas de medio ancho a la vista el corrimiento es cero. */
    monte.cargarEscenas(['historia', 'origen', 'variedades', 'porque', 'ritual', 'cierre'], {
      origen: [1, 0], variedades: [0, .5],
      porque: [1, 0], ritual: [0, 1], cierre: [1, 0]
    }, {
      historia: .65
    });
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
  /* el acento se enciende cuando la segunda linea ya esta asentada (arranca en
     .07, dura .95: llega quieta cerca de 1.0), no mientras todavia se mueve.
     clearProps al final: que la vuelva a gobernar el CSS, no un color que
     quedo fijado por JS, para el dia que cambie el token. */
  if (acento) entrada.fromTo(acento, { color: CREMA }, {
    color: ORO, duration: .6, ease: 'power2.out',
    onComplete: function () { gsap.set(acento, { clearProps: 'color' }); }
  }, 1.0);

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
  }
  prepararSello();

  function escena() {
    var e = monte.estado;

    if (quieto.matches) {
      /* Sin movimiento: el mundo ya esta abierto, el sol ya salio, el sello puesto. */
      gsap.set(e, { avance: .5, sol: 1, motas: .5, linterna: 0, vida: 0 });
      e.quieto = true;
      monte.frame();
      /* sin scroll-animacion el sello no puede retirarse solo: se lo ancla al hero
         (absolute en vez de fixed) y se va scrolleando con el, como corresponde.
         En pantalla angosta directamente no va: le cae encima al titulo. */
      if (!chico.matches) gsap.set(disco, { opacity: 1, scale: 1, rotate: 0, position: 'absolute', top: '50vh' });
      gsap.set([aroExt, aroInt], { strokeDashoffset: 0 });
      gsap.set(selloTexto, { opacity: 1 });
      gsap.set(reveals, { opacity: 1, y: 0 });
      gsap.set(lineas, { yPercent: 0 });
      entrada.progress(1).pause();
      /* El "donde estoy" SI va con reduced-motion: es orientacion, no movimiento.
         Sus ScrollTrigger no animan nada, solo disparan callbacks que ponen un
         atributo. Quien pidio menos movimiento no pidio perderse en el menu. */
      dondeEstoy();
      return;
    }

    /* los pasajes entre capitulos solo existen con el motor andando y con scroll
       animado: sin eso serian agujeros vacios (el CSS los deja en alto 0) */
    document.documentElement.classList.add('con-pasajes');

    /* DOS REGLAS que costaron un bug real (la bajada y los botones no volvian al
       scrollear de vuelta al hero, y a veces quedaba el sello como circulo verde
       sin tinta):
       1. El fade del scroll NO toca los elementos que anima la entrada: actua
          sobre las CAJAS (.hero__caja, .hero__pistaCaja). Al retroceder un tween
          mas atras de su inicio, GSAP restaura los estilos inline que capturo en
          el primer render — y para los .reveal eso era "oculto". Las cajas no
          tienen estilos inline nunca, asi que su restore siempre es visible.
       2. El disco tiene un solo dueño visible por tramo, y el trigger del hero
          lo clampa a 0 antes de su aparicion (.74): el tween del manifiesto le
          restauraba opacity 1 al volver, con la tinta y los aros aun sin dibujar.
       Ademas todo va con fromTo + immediateRender:false, como los tramos de los
       capitulos (ver nota mas abajo). */
    var tl = gsap.timeline({
      defaults: { immediateRender: false },
      /* el clampeo va en el onUpdate del TIMELINE, no del ScrollTrigger: el scrub
         sigue easing despues del ultimo evento de scroll, y el trigger ya no avisa */
      onUpdate: function () {
        if (tl.progress() < .74) gsap.set(disco, { opacity: 0 });
      },
      scrollTrigger: {
        trigger: '.hero', start: 'top top', end: '+=190%',
        pin: true, pinSpacing: true, scrub: .65, anticipatePin: 1
      }
    });

    /* 1. la camara entra al monte: las capas se separan y la niebla se abre.
          El sol sube DETRAS de la loma hasta despegarse del filo. */
    tl.fromTo(e, { avance: 0 }, { avance: 1, ease: 'none', duration: .54 }, 0)
      .fromTo(e, { sol: 0 }, { sol: 1, ease: 'power1.inOut', duration: .46 }, 0)
      /* el sol trepa hasta el punto de fuga de los rayos que ya trae la foto:
         si apareciera en otro lado se leeria como un disco pegado encima */
      .fromTo(e, { solY: .46, solRadio: .06 }, { solY: .70, solRadio: .10, ease: 'power1.inOut', duration: .46 }, 0)
      .fromTo(e, { motas: 0 }, { motas: 1, ease: 'power1.out', duration: .3 }, .10)

      /* 2. el texto del hero se va antes de que el sol quede solo en cuadro
            (las cajas, no los elementos: regla 1 de arriba) */
      .fromTo([$('.hero__caja'), $('.hero__pistaCaja')],
        { opacity: 1, y: 0 },
        { opacity: 0, y: -50, ease: 'power2.in', duration: .2, stagger: .03 }, .14)

      /* 3. limpio de la cresta, pasa al frente, se centra y crece.
            Se lo deja respirar solo en cuadro: es el unico momento quieto del hero. */
      .fromTo(e, { solX: .74 }, { solX: .5, ease: 'power2.inOut', duration: .26 }, .42)
      .fromTo(e, { solRadio: .10 }, { solRadio: .215, ease: 'power2.inOut', duration: .26 }, .42)
      .fromTo(e, { motas: 1 }, { motas: .3, ease: 'none', duration: .3 }, .5)

      /* 4. SE ENFRIA. El disco no se cambia por otro: pierde el halo, se le endurece
            el borde y vira al verde del envase. Recien sobre eso entra la tinta.
            Que sea el mismo objeto es lo que hace que se lea como reconocimiento
            —"ah, era el sello del paquete"— y no como un efecto de transicion. */
      .fromTo(e, { solSobre: 0 }, { solSobre: 1, ease: 'none', duration: .01 }, .60)
      .fromTo(e, { solFrio: 0 }, { solFrio: 1, ease: 'power2.inOut', duration: .16 }, .62)
      .fromTo(e, { solY: .70 }, { solY: .5, ease: 'power2.inOut', duration: .20 }, .60)
      .fromTo(disco, { opacity: 0, scale: .82, rotate: -16 },
                     { opacity: 1, scale: 1, rotate: 0, ease: 'power2.out', duration: .14 }, .74)
      .fromTo(e, { solOpacidad: 1 }, { solOpacidad: 0, ease: 'none', duration: .1 }, .76)
      .fromTo([aroExt, aroInt],
        { strokeDashoffset: function (i, el) { return 2 * Math.PI * el.r.baseVal.value; } },
        { strokeDashoffset: 0, ease: 'power2.inOut', duration: .2, stagger: .04 }, .76)
      .fromTo(selloTexto, { opacity: 0 }, { opacity: 1, ease: 'power1.out', duration: .16 }, .84);

    /* ---------------------------------------------------------------------
       5. DE ACA EN ADELANTE: el disco ya cumplio — nacio sol, se enfrio en
       sello, y se retira con el manifiesto. Lo que une los capitulos es el
       fondo continuo (e.escena + la sombra), no el disco: arrastrarlo por
       toda la pagina lo convertia en un circulo pegado que sobraba.
       ⚠️ NINGUN OTRO TIMELINE FIJADO PUEDE TOCAR EL DISCO. Del 21 al 23-sep
       el ritual lo traia de vuelta como boca del mate dentro de un pin, y el
       refresh de ScrollTrigger renderiza la animacion de un trigger con pin
       en su fin y en su inicio para medir el pin (aunque los tweens lleven
       immediateRender:false): sus valores de partida (xPercent 92,
       yPercent -46, scale .4) quedaban escritos sobre el disco al cargar, el
       hero solo anima opacidad/escala/giro, y el sello aparecia arriba a la
       derecha hasta que el tween del manifiesto escribia xPercent 0. Medido
       con Chrome interceptando style.transform.
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
       Cada pasaje mueve ese numero un paso y el motor resuelve el cruce solo.
       Al ser un unico valor no hay estados que coordinar entre secciones.

       LOS PASAJES (20-sep). Hasta aca el cruce entre escenas pasaba DEBAJO del
       texto: la escena cambiaba mientras el lector leia el titulo nuevo, y nadie
       lo veia. Por eso el hero se sentia vivo y los capitulos eran fotos que
       cambian. Ahora entre capitulo y capitulo hay un tramo vacio (.pasaje, solo
       existe con el motor andando) donde el texto ya se fue, el velo se levanta,
       y el cruce y el empuje de camara pasan A LA VISTA. Despues el velo vuelve
       a cerrarse y recien entra el titulo siguiente. Es la gramatica del hero
       —el texto se va, el mundo actua— repetida en cada cambio de mundo.
       Cada pasaje es UN timeline: la apertura y el cierre del velo son dos tweens
       sobre la misma propiedad, pero en secuencia dentro del mismo timeline, asi
       que no se pisan (la trampa de abajo es entre scrollTriggers distintos). */
    var ESCENAS = ['#historia', '#origen', '#variedades', '#porque', '#ritual', '#comprar'];
    /* el velo con que se lee cada capitulo: se fija al cerrar su pasaje y no se
       toca hasta el siguiente. Variedades va mas abierto porque los envases se
       paran dentro del yerbal y la escena tiene que leerse. */
    /* el amanecer va a .64 (21-sep): con .60 el texto de los pasos de
       distribui caia a 4.46:1 sobre la franja clara del horizonte */
    var VELO = [.58, .62, .52, .64, .58, .64];
    var pasajes = $$('.pasaje');
    ESCENAS.forEach(function (sec, i) {
      var p = pasajes[i];
      if (!p) return;
      var tlP = gsap.timeline({
        defaults: { ease: 'none', immediateRender: false },
        /* arranca cuando el ultimo texto del capitulo anterior ya paso debajo de
           la cabecera, y termina antes de que asome el titulo del siguiente
           (que se revela a 'top 72%' de su seccion). Medido con
           tools/cruce-contraste.cjs, que busca los cruces por e.escena. */
        scrollTrigger: { trigger: p, start: 'top 22%', end: 'bottom 84%', scrub: .6 }
      });
      tlP.fromTo('.mundo__sombra', { opacity: i ? VELO[i - 1] : .58 }, { opacity: .12, duration: .42 }, 0)
         .fromTo('.mundo__sombra', { opacity: .12 }, { opacity: VELO[i], duration: .42 }, .58)
         .fromTo(e, { escena: i }, { escena: i + 1, duration: .66 }, .17);
      /* la vegetacion del hero pertenece a ESE punto de vista: se retira en el
         primer cambio de mundo, no se arrastra al galpon ni al aereo */
      if (i === 0) tlP.fromTo(e, { frenteOp: 1 }, { frenteOp: 0, duration: .45 }, 0);
      /* EL SOL SALE DE NUEVO. El cierre amanece sobre el monte y cierra el
         circulo contra el hero ("El dia empieza con yerba mate"). Es el mismo
         FS_SOL del hero, dibujado DELANTE de la escena con su halo (la foto no
         tiene alfa en el cielo para taparlo con el monte, y no hace falta: sube
         desde la bruma apareciendo, y eso ya se lee como amanecer). Vuelve
         caliente —lo contrario del viaje del hero, donde se enfriaba en sello—
         y arriba a la derecha, que es de donde viene la luz en toda la pelicula.
         Entra recien cuando la escena del amanecer ya gano el cuadro (.45). */
      if (i === 5) {
        tlP.fromTo(e, { solFrio: 1, solX: .5, solRadio: .215 },
                      { solFrio: 0, solX: .74, solRadio: .07, duration: .001 }, .40)
           .fromTo(e, { solOpacidad: 0, solY: .30 },
                      { solOpacidad: 1, solY: .62, duration: .52, ease: 'power1.out' }, .45)
           .fromTo(e, { solRadio: .07 }, { solRadio: .09, duration: .52 }, .45);
      }
    });

    /* LA CAMARA NO PARA. Antes `e.avance` movia la camara solo en el hero y los
       capitulos quedaban con el encuadre clavado: por eso el mundo se sentia vivo
       arriba y se volvia un pase de diapositivas abajo.
       Cada escena tiene su propio empuje lento, que corre durante toda su vida
       en pantalla — desde que asoma en su pasaje hasta que la reemplaza la
       siguiente al final del pasaje que viene— no solo durante el cruce.
       Como cada una anima SU objeto (e.camaras[i]) no hay dos tweens peleando por
       la misma propiedad, que es la trampa que ya nos comimos con la sombra. */
    ESCENAS.forEach(function (sec, i) {
      var cam = e.camaras[i];
      if (!cam) return;
      var desde = pasajes[i] || sec, sig = pasajes[i + 1];
      var cfg = { trigger: desde, start: 'top bottom', scrub: .8 };
      if (sig) { cfg.endTrigger = sig; cfg.end = 'bottom 84%'; }
      /* la ultima escena (el amanecer) dura tres secciones: donde comprar,
         distribui y el remate. La camara corre hasta el final del remate, no
         hasta el final de #comprar, o quedaria clavada dos capitulos. */
      else { cfg.endTrigger = $('#remate') || sec; cfg.end = 'bottom bottom'; }
      gsap.fromTo(cam,
        { z: 1.04, dy: .012 },
        { z: 1.15, dy: -.012, ease: 'none', immediateRender: false, scrollTrigger: cfg });
    });

    /* El sol que salio en el pasaje 6 no se congela ni tapa el texto. Apenas
       cierra el velo se vela detras de la bruma (opacidad .30: con .38 el texto
       de los pasos daba 4.43:1 a mitad de #distribuir) mientras se leen donde
       comprar y distribui: a opacidad 1 era un disco claro bajo el velo y la
       entrada de #comprar, que va corrida a la derecha, le caia encima con
       4.4:1 en escritorio y 1.5:1 en el celular. Sigue subiendo despacio, y
       en el remate termina de salir entero,
       para el ultimo plano. Tres scrubs sobre solOpacidad/solY en tramos que
       no se superponen (el pasaje termina en #comprar 'top 84%'). */
    if ($('#remate')) {
      gsap.fromTo(e, { solOpacidad: 1 }, {
        solOpacidad: .30, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: '#comprar', start: 'top 80%', end: 'top 30%', scrub: .8 }
      });
      gsap.fromTo(e, { solY: .62, solRadio: .09 }, {
        solY: .70, solRadio: .10, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: '#comprar', start: 'top 80%', endTrigger: '#remate', end: 'top 80%', scrub: .8 }
      });
      gsap.fromTo(e, { solOpacidad: .30, solY: .70, solRadio: .10 }, {
        solOpacidad: 1, solY: .78, solRadio: .115, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: '#remate', start: 'top 80%', end: 'bottom bottom', scrub: .8 }
      });
    }

    /* MANIFIESTO — el sello se corre, se achica y se VA: despues del hero no
       vuelve a aparecer. Dejarlo de marca de agua lo convertia en un circulo
       que sobraba en cada capitulo. */
    gsap.fromTo(disco,
      { scale: 1, xPercent: 0, yPercent: 0, opacity: 1 },
      { scale: .40, xPercent: 92, yPercent: -46, opacity: 0, ease: 'none',
        immediateRender: false, scrollTrigger: tramo('#manifiesto', 'top 92%', 'top 45%') });
    sombra(0, .58, tramo('#manifiesto', 'top 88%', 'top 30%'));

    /* Del velo de cada capitulo se encargan los pasajes (VELO, arriba). Antes
       habia un tramo por seccion, y en variedades iba en dos tiempos porque la
       escena del yerbal entraba detras del texto de #origen y `.cadena__sentis`
       caia a 4.07:1. Con el cruce movido al pasaje —sin texto en pantalla— ese
       problema ya no existe. Nada de tocar la saturacion por capitulo: el uniform
       lo comparten el mundo base y las escenas. */

    contarHistoria();
    revelarCapitulos();
    dondeEstoy();
  }

  /* HISTORIA: el 1918 de la cortina vuelve y cuenta hasta hoy mientras se lee
     la cabeza del capitulo. Es el mismo gesto de la entrada —los cien anios se
     cuentan, no se escriben— puesto donde se cuenta la historia. Con scrub, asi
     que al volver arriba descuenta.
     El disparador es el NUMERO, no los hitos: en escritorio el numero vive
     arriba a la derecha y los hitos entran cuando ya salio de pantalla (con el
     disparador en los hitos, al tope de la seccion ya decia 1941 y llegaba a
     hoy sin nadie mirando; medido el 21-sep). Asi cuenta entero a la vista:
     arranca al asomar por abajo y termina cerca del borde de arriba. */
  function contarHistoria() {
    var el = $('#historiaAnio');
    if (!el) return;
    var n = { v: DESDE };
    gsap.fromTo(n, { v: DESDE }, {
      v: HASTA, ease: 'none', immediateRender: false, snap: { v: 1 },
      scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 10%', scrub: .5 },
      onUpdate: function () { el.textContent = String(Math.round(n.v)); }
    });
  }

  /* ---------------------------------------------------------------------
     DONDE ESTOY (22-sep). El menu marca la seccion que se esta mirando. La
     semantica ya existia del otro lado: las tres paginas internas traen
     aria-current="page" escrito en el HTML desde el 21-sep —lo que faltaba era
     el CSS que lo mostrara—. Aca se hace lo mismo para las secciones de la home,
     con aria-current="true", y el CSS pinta los dos igual.

     El mapa es EXPLICITO, no por href, y la razon es esta: dos items del menu
     NOMBRAN una seccion de la home pero LINKEAN a la pagina que la profundiza.
     Estando en «06 · Donde comprar», el item que dice «Donde comprar» tiene que
     estar encendido aunque al clickearlo te lleve a /donde-comprar/: apagado
     dejaba todo el tercio final de la home con el menu muerto.

     ⚠️ Las secciones que NO estan en el mapa (#hero, #manifiesto, #porque,
     #remate) no encienden nada. Es a proposito: preferimos el hueco antes que
     encender el item equivocado. #porque es el unico capitulo entero sin item,
     y no lo tiene porque en la cabecera no entra un septimo a 761 px (21-sep). */
  var DONDE = {
    historia:   '#historia',
    origen:     '#origen',
    variedades: '#variedades',
    /* #porque solo existe en el menu de pantalla completa: en la cabecera no entra
       (7 items entran desde 827 px, 8 recien desde 951 — tools/cabecera.cjs). Asi
       que en escritorio esta seccion sigue sin encender nada. */
    porque:     '#porque',
    ritual:     '#ritual',
    comprar:    '/donde-comprar/',
    distribuir: '/vende-centenaria/'
  };

  function dondeEstoy() {
    var navs = $$('.cabecera__nav a, .menu__nav a');
    /* `main section[id]`, NO `main > section`: cuando una seccion se fija,
       GSAP la envuelve en un .pin-spacer y deja de ser hija directa de main
       (paso con el ritual mientras estuvo fijado, 21 al 23-sep). */
    var secciones = $$('main section[id]');
    if (!navs.length || !secciones.length) return;

    function marcar(destino) {
      navs.forEach(function (a) {
        /* aria-current="page" lo escribio el HTML de una pagina interna: es un
           hecho, no un estado de scroll. El spy no lo toca. */
        if (a.getAttribute('aria-current') === 'page') return;
        if (destino && a.getAttribute('href') === destino) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }

    /* Cada seccion manda desde que su tope cruza el 55% del viewport hasta que
       lo cruza la siguiente. Asi el estado NO parpadea en los pasajes, que son
       130vh sin ninguna seccion en pantalla: el ultimo que mando sigue mandando
       hasta que el proximo toma el relevo. */
    secciones.forEach(function (s, i) {
      var sig = secciones[i + 1];
      ScrollTrigger.create({
        trigger: s,
        start: 'top 35%',
        endTrigger: sig || s,
        end: sig ? 'top 35%' : 'bottom bottom',
        onEnter:     function () { marcar(DONDE[s.id]); },
        onEnterBack: function () { marcar(DONDE[s.id]); },
        /* arriba de la primera seccion no hay donde estar: se apaga todo */
        onLeaveBack: function () { if (!i) marcar(null); }
      });
    });
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
    /* sin motor el disco no aparece: sin el viaje sol->sello seria un adorno pegado */
    gsap.to('.mundo__sombra', {
      opacity: .68, ease: 'none',
      scrollTrigger: { trigger: '#historia', start: 'top 88%', end: 'top 30%', scrub: .6 }
    });
    contarHistoria();
    revelarCapitulos();
    dondeEstoy();
  }

  /* Separa el titulo por <br> y envuelve cada linea en la mascara del hero: un
     span exterior con overflow:hidden y uno interior que sube. Corre solo con
     GSAP andando, asi que sin JS el titulo queda plano y legible. */
  function partirTitulo(t) {
    var partes = [[]];
    Array.prototype.slice.call(t.childNodes).forEach(function (n) {
      if (n.nodeName === 'BR') partes.push([]);
      else partes[partes.length - 1].push(n);
    });
    t.innerHTML = '';
    return partes.map(function (nodos) {
      var linea = document.createElement('span'); linea.className = 'linea';
      var interno = document.createElement('span');
      nodos.forEach(function (n) { interno.appendChild(n); });
      linea.appendChild(interno); t.appendChild(linea);
      return interno;
    });
  }

  /* Sin GSAP los iconos quedan enteros: el dasharray lo pone SOLO este codigo,
     y solo con scroll animado (con reduced-motion no se llama, como el resto).
     Vale para las seis razones de #origen y, desde el 23-sep, para los seis
     beneficios de #porque: mismo dibujo del trazo, mismo escalonado. */
  function revelarIconos() {
    $$('.razones, .beneficios').forEach(function (caja) {
      var titulo = $('.razones__titulo', caja);
      var items = $$('.razon, .beneficio', caja);
      var trazos = $$('.trazo', caja).filter(function (t) {
        return typeof t.getTotalLength === 'function' && t.getTotalLength() > 0;
      });
      trazos.forEach(function (t) {
        var l = t.getTotalLength();
        gsap.set(t, { strokeDasharray: l, strokeDashoffset: l });
      });
      gsap.set([titulo].concat(items).filter(Boolean), { opacity: 0, y: 16 });
      var tl = gsap.timeline({ scrollTrigger: { trigger: caja, start: 'top 84%' } });
      if (titulo) tl.to(titulo, { opacity: 1, y: 0, duration: .6, ease: 'power3.out' }, 0);
      tl.to(items, { opacity: 1, y: 0, duration: .8, stagger: .1, ease: 'power3.out' }, .08);
      tl.to(trazos, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', stagger: .045 }, .2);
    });
  }

  function revelarCapitulos() {
    $$('.manifiesto, .cap, .claro, .remate').forEach(function (sec) {
      var titulo = $(TITULOS, sec);
      var lineasSec = titulo ? partirTitulo(titulo) : [];
      if (lineasSec.length) gsap.set(lineasSec, { yPercent: 108 });
      var piezas = $$('.reveal', sec).filter(function (el) { return !el.matches(TITULOS); });
      var tlSec = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 72%' } });
      if (lineasSec.length) tlSec.to(lineasSec, { yPercent: 0, duration: .9, stagger: .11, ease: 'power3.out' }, 0);
      tlSec.to(piezas, { opacity: 1, y: 0, duration: .85, stagger: .09, ease: 'power3.out' }, lineasSec.length ? .15 : 0);
    });

    /* LAS SEIS RAZONES de #origen y LOS SEIS BENEFICIOS de #porque (23-sep):
       entran escalonados y el icono de cada uno se DIBUJA (el trazo corre con
       stroke-dashoffset). Van con su propio disparador y no en el paquete de
       la seccion: viven abajo de la cabeza, asi que con el disparador de la
       seccion ('top 72%') se revelarian fuera de la vista. */
    revelarIconos();

    /* La rama en primer plano cruza el capitulo a OTRA velocidad que el fondo:
       esa diferencia es la profundidad. Es la gramatica del hero (mundo atras,
       hoja adelante) llevada a los capitulos. */
    $$('.rama').forEach(function (r) {
      gsap.fromTo(r, { yPercent: 15 }, {
        yPercent: -15, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: r.parentNode, start: 'top bottom', end: 'bottom top', scrub: .8 }
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
    if (!cortina) { raiz.classList.remove('cargando'); entrada.play(); pedirEscenas(); return; }
    if (quieto.matches) { raiz.classList.remove('cargando'); entrada.play(); pedirEscenas(); return; }
    gsap.to(carga, { v: 1, duration: .3, ease: 'power2.out', onUpdate: pintarCarga });
    /* OJO: la clase .cargando se saca al FINAL. El CSS es `.cargando .cortina{display:flex}`,
       asi que sacarla antes hace desaparecer la cortina de golpe y el transform termina
       animando un elemento ya oculto: el telon no sube nunca. */
    gsap.timeline({ delay: .04 })
      .to(cortina, {
        yPercent: -101, duration: .9, ease: 'power3.inOut',
        onComplete: function () { raiz.classList.remove('cargando'); cortina.style.display = 'none'; pedirEscenas(); }
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

  /* Solo se refresca si cambio el ANCHO. En el celular la barra del navegador
     dispara resize al mostrarse y esconderse (mismo ancho, otro alto), y
     refrescar ahi rehace todos los triggers y el pin del hero en pleno scroll.
     ignoreMobileResize (arriba) cubre el listener interno de ScrollTrigger;
     este es el nuestro. Rotar el telefono si cambia el ancho y si refresca. */
  var reajuste, anchoPrevio = window.innerWidth;
  window.addEventListener('resize', function () {
    if (tocable && window.innerWidth === anchoPrevio) return;
    anchoPrevio = window.innerWidth;
    clearTimeout(reajuste);
    reajuste = setTimeout(function () { ScrollTrigger.refresh(); }, 220);
  }, { passive: true });
})();
