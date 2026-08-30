/* ═══════════════════════════════════════════════════════════
   Seleme Centenaria — motion
   GSAP + ScrollTrigger. Reglas de material/SISTEMA-DISENO.md §6:
   · prefers-reduced-motion con gsap.matchMedia(), no un if suelto
   · el respaldo de los reveals vive en el <head>, no acá
   · nada de end:'bottom top' en el último elemento de la página
   · sin loops decorativos corriendo todo el tiempo

   Dos cosas que parecen detalle y no lo son:
   1) El CSS oculta con opacity:0, así que TODO va con fromTo. Un
      gsap.from() leería el 0 del CSS como estado final y animaría
      de 0 a 0: invisible para siempre.
   2) Sin type="module", para que ande también con doble clic (file://).
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var raiz = document.documentElement;

  /* ── nav: anda siempre, con GSAP o sin GSAP ───────────── */
  function navegacion() {
    var nav = document.getElementById('nav');
    var burger = document.getElementById('burger');
    var menu = document.getElementById('menu-movil');
    if (!nav) return;

    var solido = function () { nav.classList.toggle('nav--solido', window.scrollY > 40); };
    solido();
    window.addEventListener('scroll', solido, { passive: true });

    if (burger && menu) {
      burger.addEventListener('click', function () {
        var abierto = burger.getAttribute('aria-expanded') === 'true';
        burger.setAttribute('aria-expanded', String(!abierto));
        menu.hidden = abierto;
        if (!abierto) nav.classList.add('nav--solido');
      });
      menu.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
          burger.setAttribute('aria-expanded', 'false');
          menu.hidden = true;
        }
      });
    }
  }

  /* ── partidores de texto ──────────────────────────────── */

  function partirPalabras(el) {
    if (el.dataset.partido) return Array.prototype.slice.call(el.querySelectorAll('.pal'));
    var texto = el.textContent.replace(/\s+/g, ' ').trim();
    el.textContent = '';
    var spans = texto.split(' ').map(function (p, i, arr) {
      var s = document.createElement('span');
      s.className = 'pal';
      s.textContent = p + (i < arr.length - 1 ? ' ' : '');
      el.appendChild(s);
      return s;
    });
    el.dataset.partido = '1';
    return spans;
  }

  /* agrupa las palabras en las líneas que el navegador realmente armó
     (por offsetTop) y mete cada una en una caja con overflow hidden:
     así el revelado del hero es enmascarado y no un fundido. */
  function partirLineas(el) {
    var palabras = partirPalabras(el);
    var lineas = [], actual = null, topPrevio = null;
    palabras.forEach(function (p) {
      var top = p.offsetTop;
      if (topPrevio === null || Math.abs(top - topPrevio) > 4) {
        actual = []; lineas.push(actual); topPrevio = top;
      }
      actual.push(p.textContent);
    });
    el.textContent = '';
    delete el.dataset.partido;
    return lineas.map(function (grupo) {
      var caja = document.createElement('span'); caja.className = 'lin-caja';
      var linea = document.createElement('span'); linea.className = 'lin';
      linea.textContent = grupo.join('');
      caja.appendChild(linea);
      el.appendChild(caja);
      return linea;
    });
  }

  /* ── arranque ─────────────────────────────────────────── */

  navegacion();

  if (!window.gsap || !window.ScrollTrigger) {
    // GSAP no cargó (CDN caído, sin red, file:// offline).
    // El respaldo del <head> destapa todo solo. No tocamos nada más.
    return;
  }

  clearTimeout(window.__respaldoReveal);
  gsap.registerPlugin(ScrollTrigger);
  raiz.classList.add('anim-ok');

  var HERO = document.querySelector('.hero');
  var mm = gsap.matchMedia();

  /* ── sin movimiento: visible y quieto ─────────────────── */
  mm.add('(prefers-reduced-motion: reduce)', function () {
    document.querySelectorAll('[data-palabras]').forEach(partirPalabras);
    gsap.set('[data-reveal], [data-viaje], [data-paso], .pal, .lin', { opacity: 1, y: 0 });
  });

  /* ── con movimiento ───────────────────────────────────── */
  mm.add('(prefers-reduced-motion: no-preference)', function () {

    var esc = 'power3.out';

    /* ---- hero ---- */
    var lineas = [];
    document.querySelectorAll('[data-lineas]').forEach(function (el) {
      lineas = lineas.concat(partirLineas(el));
    });

    var tl = gsap.timeline({ defaults: { ease: esc } });
    tl.fromTo('.hero .volanta', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .7 }, .15)
      .fromTo(lineas, { yPercent: 116, opacity: 1 },
                      { yPercent: 0, duration: 1.1, stagger: .085, ease: 'expo.out' }, .22)
      .fromTo('.hero__bajada', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .85 }, '-=.6')
      .fromTo('.hero__acciones', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: .85 }, '-=.65')
      .fromTo('.hero__cue', { opacity: 0 }, { opacity: 1, duration: .8 }, '-=.45');

    /* la nervadura del hero se dibuja una vez, al entrar */
    document.querySelectorAll('.hero__nerv path').forEach(function (p) {
      var largo = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: largo, strokeDashoffset: largo },
                     { strokeDashoffset: 0, duration: 2.8, ease: 'power2.inOut', delay: .4 });
    });

    /* ---- parallax de las fotos grandes ---- */
    gsap.to('[data-parallax="hero"]', {
      yPercent: 10, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('[data-parallax="monte"]', {
      yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: '.origen__banda', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    /* ---- reveals genéricos (el hero ya lo maneja su timeline) ---- */
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      if (HERO && HERO.contains(el)) return;
      gsap.fromTo(el, { opacity: 0, y: 26 }, {
        opacity: 1, y: 0, duration: .9, ease: esc,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    /* ---- títulos palabra por palabra ---- */
    gsap.utils.toArray('[data-palabras]').forEach(function (el) {
      gsap.fromTo(partirPalabras(el), { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: .8, ease: esc, stagger: .04,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* ---- el 1918 crece mientras pasan los hitos ---- */
    gsap.fromTo('.dato', { scale: .93, opacity: .5 }, {
      scale: 1, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '.historia', start: 'top 75%', end: 'center center', scrub: .6 }
    });

    /* ---- la tira del viaje ---- */
    gsap.fromTo('[data-viaje]', { opacity: 0, y: 44 }, {
      opacity: 1, y: 0, duration: .9, ease: esc, stagger: .1,
      scrollTrigger: { trigger: '.viaje__tira', start: 'top 92%', once: true }
    });

    /* ---- los 5 pasos, encadenados con scrub ---- */
    gsap.fromTo('[data-paso]', { opacity: 0, y: 34 }, {
      opacity: 1, y: 0, ease: 'power2.out', stagger: .4,
      scrollTrigger: { trigger: '.pasos', start: 'top 85%', end: 'center 60%', scrub: .8 }
    });

    /* ---- la escala de sabor se dibuja ----
       El eje va por stroke-dashoffset y las marcas sólo con opacity + y.
       Nada de scaleX sobre un <line>: su caja de relleno tiene alto cero y
       el transform-origin sale mal según el motor. */
    var ejeEsc = document.querySelector('.escala__eje');
    if (ejeEsc && ejeEsc.getTotalLength) {
      var lEje = ejeEsc.getTotalLength();
      gsap.timeline({ scrollTrigger: { trigger: '.escala', start: 'top 85%', once: true } })
        .fromTo(ejeEsc, { strokeDasharray: lEje, strokeDashoffset: lEje },
                        { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' })
        .fromTo('.escala__marca', { opacity: 0, y: 14 },
                { opacity: 1, y: 0, duration: .55, stagger: .15, ease: 'power3.out' }, '-=.5');
    }

    /* ---- la nervadura del bloque mayorista barre al entrar ---- */
    document.querySelectorAll('.distribui__nerv path').forEach(function (p, i) {
      var largo = p.getTotalLength();
      gsap.fromTo(p, { strokeDasharray: largo, strokeDashoffset: largo },
        { strokeDashoffset: 0, duration: 1.9, ease: 'power2.out', delay: i * .06,
          scrollTrigger: { trigger: '.distribui', start: 'top 82%', once: true } });
    });
  });

  /* ── riel horizontal de variedades ────────────────────── */
  /* Se pinnea sólo en pantallas anchas. En el celular el riel queda
     como carrusel nativo con scroll-snap: se maneja mejor con el dedo
     y no pelea con el scroll vertical. */
  mm.add('(min-width: 1000px) and (prefers-reduced-motion: no-preference)', function () {
    var seccion = document.querySelector('.variedades');
    var riel = document.getElementById('riel');
    var pista = document.getElementById('riel-pista');
    if (!seccion || !riel || !pista) return;

    seccion.classList.add('variedades--pin');
    var fichas = Array.prototype.slice.call(pista.querySelectorAll('.ficha'));
    var tintes = fichas.map(function (f) { return f.getAttribute('data-tinte'); });
    var recorrido = function () { return Math.max(0, pista.scrollWidth - riel.clientWidth); };
    var activa = -1;

    var st = ScrollTrigger.create({
      trigger: '.variedades',
      start: 'top top',
      end: function () { return '+=' + (recorrido() + window.innerHeight * 0.5); },
      pin: '.variedades',
      pinSpacing: true,
      scrub: .7,
      invalidateOnRefresh: true,
      animation: gsap.to(pista, { x: function () { return -recorrido(); }, ease: 'none' }),
      onUpdate: function (self) {
        // el piso de la sección vira al tinte de la variedad activa
        var i = Math.round(self.progress * (fichas.length - 1));
        if (i === activa) return;
        activa = i;
        gsap.to(riel, { backgroundColor: tintes[i], duration: .5, ease: 'power2.out', overwrite: 'auto' });
        fichas.forEach(function (f, j) {
          gsap.to(f, { opacity: j === i ? 1 : .55, duration: .45, ease: 'power2.out', overwrite: 'auto' });
        });
      }
    });

    return function () {
      st.kill();
      seccion.classList.remove('variedades--pin');
      gsap.set(pista, { clearProps: 'x' });
      gsap.set(riel, { clearProps: 'backgroundColor' });
      gsap.set(fichas, { clearProps: 'opacity' });
    };
  });

  /* Recalcular cuando terminan de cargar fuentes e imágenes: sin esto los
     start/end quedan medidos contra un layout que después cambió de alto. */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
