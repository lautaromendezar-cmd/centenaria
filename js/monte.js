/* =========================================================================
   MONTE — motor WebGL del fondo. Escrito a mano, sin libreria.
   No es three.js a proposito: lo unico que hace falta es dibujar 5 quads con
   profundidad, niebla y una luz que sigue al puntero. Un grafo de escena
   completo serian ~450 KB para no usar el 98%.

   Expone window.Monte. Si algo falla devuelve null y la pagina se queda con
   las capas <img>, que ya estan pintadas: nunca hay pantalla negra.
   ========================================================================= */
(function () {
  'use strict';

  var VS =
    'attribute vec2 a;varying vec2 v;' +
    'void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}';

  /* Capa: cover-fit + dolly + niebla + linterna.
     La linterna multiplica por la luminancia para que encienda los TRAZOS del
     grabado y no el relleno: es lo que hace que se lea como tinta iluminada. */
  var FS_CAPA =
    'precision mediump float;varying vec2 v;' +
    'uniform sampler2D uTex;uniform vec2 uRes;uniform float uAsp,uEsc,uNieblaC,uLamp,uBrillo,uSat,uCA,uRayos,uT,uOp,uCorte,uEntra;' +
    'uniform vec2 uOff,uPtr;uniform vec3 uNiebla;' +
    'float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}' +
    'void main(){' +
    ' float ca=uRes.x/uRes.y;' +
    ' vec2 k=(ca>uAsp)?vec2(1.,uAsp/ca):vec2(ca/uAsp,1.);' +
    ' vec2 uv=(v-.5)*k+.5;' +
    ' uv=(uv-vec2(.5,.44))/uEsc+vec2(.5,.44)+uOff;' +
    ' vec4 c=texture2D(uTex,uv);' +
    /* Aberracion cromatica: los canales se separan hacia los bordes, como una optica
       de verdad. Sutil y radial — de frente no se ve, en las esquinas si. */
    ' if(uCA>.0001){vec2 d=uv-vec2(.5,.44);float k2=uCA*dot(d,d);' +
    '  c.r=texture2D(uTex,uv+d*k2).r;c.b=texture2D(uTex,uv-d*k2).b;}' +
    ' if(c.a<.004){discard;}' +
    ' c.rgb*=uBrillo;' +
    /* Grado partido, como un LUT de cine: sombras al verde-azulado, luces al ambar.
       Es lo que separa el cuadro en planos de color en vez de dejar todo olivo. */
    ' float l0=luma(c.rgb);' +
    ' c.rgb=mix(c.rgb*vec3(.84,1.03,1.08),c.rgb*vec3(1.12,1.00,.80),smoothstep(.10,.60,l0));' +
    ' c.rgb=clamp(mix(vec3(luma(c.rgb)),c.rgb,uSat),0.,1.);' +
    /* Los rayos RESPIRAN. Dos ondas lentas a lo ancho de la direccion de los haces,
       aplicadas solo donde la foto ya es luminosa: se lee como hojas moviendose
       arriba del dosel, no como un filtro encima. Es el efecto que mas vida da y
       no cuesta ni una textura. */
    ' if(uRayos>.0001){' +
    '  float q=v.x*.58-v.y*.81;' +
    '  float sh=sin(q*31.+uT*.40)*.5+sin(q*12.7-uT*.26)*.5;' +
    '  c.rgb+=c.rgb*sh*uRayos*smoothstep(.20,.70,luma(c.rgb));}' +
    ' float banda=smoothstep(.10,.55,v.y)*(1.-smoothstep(.55,.98,v.y));' +
    ' c.rgb=mix(c.rgb,uNiebla,clamp(uNieblaC*(.40+.60*banda),0.,1.));' +
    ' vec2 p=(v-uPtr)*vec2(ca,1.);' +
    ' float lamp=exp(-dot(p,p)*6.5)*uLamp;' +
    ' c.rgb+=lamp*vec3(1.,.86,.32)*(.18+1.25*luma(c.rgb));' +
    /* EL CRUCE ENTRE ESCENAS NO ES UN FUNDIDO PLANO.
       Cruzar dos fotos al 50% da gris: dos imagenes promediadas pierden las dos su
       contraste y el cuadro del medio queda un pure marron. Era el peor fotograma
       de toda la pagina (se veia en tools/_cruces.cjs).
       En vez de eso, un BARRIDO con borde suave: la escena nueva entra por arriba
       y baja, como una luz que gana el cuadro. En cada pixel manda una sola de las
       dos, asi que ninguna pierde contraste; lo que las une es un frente ancho y
       ondulado, no una regla. La direccion refuerza el viaje vertical de la pagina. */
    ' float wp=1.;' +
    ' if(uCorte>.0005&&uCorte<.9995){' +
    '  float m=clamp(dot(v-.5,vec2(-.3219,.9468))+.5,0.,1.);' +
    '  m+=sin(v.x*7.3+v.y*4.1)*.045;' +                 /* frente ondulado, no una regla */
    '  float bd=.24;' +                                  /* ancho del borde suave */
    '  float f=uCorte*(1.+2.*bd)-bd;' +
    '  float w=1.-smoothstep(f-bd,f+bd,m);' +
    '  wp=mix(1.-w,w,uEntra);' +
    ' } else { wp=uEntra>.5?uCorte:1.-uCorte; }' +
    ' float aa=c.a*uOp*wp;' +
    ' gl_FragColor=vec4(c.rgb*aa,aa);}';   /* premultiplicado */

  /* Sol. Se dibuja DESPUES del cielo y ANTES de las crestas: por eso la loma
     lo tapa de verdad mientras sale, sin mascaras ni trucos. */
  var FS_SOL =
    'precision mediump float;varying vec2 v;' +
    'uniform vec2 uRes,uPos;uniform float uR,uOp,uT,uFrio,uVida;' +
    'void main(){' +
    ' float ca=uRes.x/uRes.y;' +
    ' vec2 p=(v-uPos)*vec2(ca,1.);' +
    ' float d=length(p);' +
    /* al enfriarse el borde se endurece: de sol difuso a disco impreso */
    ' float suav=mix(.68,.985,uFrio);' +
    ' float nucleo=1.-smoothstep(uR*suav,uR,d);' +
    ' float halo=exp(-pow(d/(uR*4.8),1.12))*(1.-uFrio*.92);' +
    /* al enfriar aparece el filo dorado: es donde despues aterriza el aro del sello */
    ' float filo=(1.-smoothstep(uR*.965,uR*1.03,d))*smoothstep(uR*.885,uR*.965,d)*uFrio;' +
    ' float palp=.97+.03*sin(uT*.9)*(1.-uFrio);' +
    ' vec3 caliente=mix(vec3(1.,.78,.08),vec3(1.,.965,.74),pow(nucleo,1.9));' +
    ' vec3 col=mix(caliente,vec3(.024,.220,.110),uFrio);' +   /* --verde-hondo */
    ' col+=vec3(.973,.867,0.)*filo*1.5;' +
    ' float a=(nucleo*mix(.93,1.,uFrio)+halo*.52+filo)*uOp*palp;' +
    /* Destello anamorfico: la raya horizontal de las opticas de cine. Se apaga al
       enfriarse — un sello impreso no tiene flare. */
    ' float est=exp(-abs(p.y)*62.)*exp(-abs(p.x)/(uR*5.5))*(1.-uFrio)*uOp*uVida;' +
    ' vec3 pre=col*a+vec3(1.,.88,.55)*est*.60;' +
    ' gl_FragColor=vec4(pre,a+est*.34);}';

  /* Motas: polen a contraluz. Derivan hacia arriba y se acercan al puntero. */
  var VS_MOTA =
    'attribute vec3 s;varying float o;' +
    'uniform vec2 uRes,uPtr;uniform float uT,uAmt,uEsc;' +
    'void main(){' +
    ' float sp=.35+s.z*.65;' +
    ' float x=fract(s.x+sin(uT*.19+s.y*11.)*.035+uT*.0035*sp);' +
    ' float y=fract(s.y+uT*.0075*sp);' +
    ' vec2 p=vec2(x,y);' +
    ' vec2 d=uPtr-p;float dd=length(d*vec2(uRes.x/uRes.y,1.));' +
    ' p+=d*exp(-dd*dd*9.)*.22;' +
    ' p=(p-vec2(.5,.44))*uEsc+vec2(.5,.44);' +
    ' o=uAmt*(.30+.70*abs(sin(uT*.55+s.z*19.)))*smoothstep(.02,.16,y)*(1.-smoothstep(.72,.98,y));' +
    ' gl_PointSize=(1.6+3.4*s.z)*uEsc;' +
    ' gl_Position=vec4(p*2.-1.,0.,1.);}';

  var FS_MOTA =
    'precision mediump float;varying float o;' +
    'void main(){' +
    ' vec2 q=gl_PointCoord-.5;' +
    ' float a=(1.-smoothstep(.16,.5,length(q)))*o;' +
    ' gl_FragColor=vec4(vec3(1.,.93,.62)*a,a);}';

  function compilar(gl, tipo, src) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[monte] shader:', gl.getShaderInfoLog(s)); return null;
    }
    return s;
  }

  function programa(gl, vs, fs) {
    var v = compilar(gl, gl.VERTEX_SHADER, vs), f = compilar(gl, gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('[monte] link:', gl.getProgramInfoLog(p)); return null;
    }
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p: p, u: u };
  }

  function textura(gl, img) {
    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return t;
  }

  /* Profundidad de cada capa. De aca sale todo el paralaje: cuanto se agranda
     con el avance, cuanto la corre el puntero y cuanta niebla se le come. */
  /* Con foto real la niebla del shader va MUY baja: la imagen ya trae su propia
     perspectiva atmosferica y encimarle bruma sintetica la ensucia. Lo que aporta
     el shader aca es la profundidad entre capas, las motas y la linterna. */
  var PLAN = [
    { n: 'cielo',  z: .12, esc0: 1.03, off0: [0, .010], esc: .26, lamp: .22, niebla: .05, rayos: .17, ca: .013, viento: .5 },
    { n: 'cerca',  z: .58, esc0: 1.00, off0: [0, .004], esc: .62, lamp: .70, niebla: .03, rayos: .06, ca: .005, viento: 1.4 },
    { n: 'frente', z: 1.0, esc0: 1.00, off0: [0, .006], esc: 1.05, lamp: 1.0, niebla: .02, rayos: 0, ca: .007, viento: 2.6 }
  ];

  function iniciar(op) {
    var lienzo = op.lienzo;
    var gl = null;
    try {
      gl = lienzo.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'high-performance' })
        || lienzo.getContext('experimental-webgl');
    } catch (e) { gl = null; }
    if (!gl) return null;

    var progCapa = programa(gl, VS, FS_CAPA);
    var progSol = programa(gl, VS, FS_SOL);
    var progMota = programa(gl, VS_MOTA, FS_MOTA);
    if (!progCapa || !progSol || !progMota) return null;

    /* quad */
    var quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    /* motas */
    var N = 150, semillas = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      semillas[i * 3] = Math.random();
      semillas[i * 3 + 1] = Math.random();
      semillas[i * 3 + 2] = Math.random();
    }
    var bufMota = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufMota);
    gl.bufferData(gl.ARRAY_BUFFER, semillas, gl.STATIC_DRAW);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    var capas = [];
    for (var k = 0; k < PLAN.length; k++) {
      var img = op.capas[PLAN[k].n];
      if (!img || !img.naturalWidth) return null;
      capas.push({
        cfg: PLAN[k],
        tex: textura(gl, img),
        asp: img.naturalWidth / img.naturalHeight
      });
    }

    /* Estado publico: lo mueve GSAP desde main.js. */
    var e = {
      avance: 0,        /* 0..1  la camara entra al monte */
      sol: 0,           /* 0..1  el sol sube detras de la loma */
      solOpacidad: 1,
      solX: .74, solY: .46, solRadio: .06, solFrio: 0,
      solSobre: 0,      /* 0 = el sol va detras de la vegetacion; 1 = pasa al frente */
      motas: 0,
      saturacion: 1.26, /* el grado del shader; 1 = la foto cruda */
      /* 0 = el mundo del hero. 1 = la primera escena. 2,4 = 40% de camino entre la
         segunda y la tercera. Es un solo numero continuo, asi que el cruce entre
         escenas lo maneja el scroll sin que haya que coordinar estados. */
      escena: 0,
      /* UNA CAMARA POR ESCENA. El hero se siente vivo porque la camara nunca para
         (e.avance); en los capitulos estaba clavada y por eso el mundo se moria en
         cuanto salias del hero. Ahora cada escena tiene su propio empuje lento, que
         corre durante TODO el capitulo, no solo en el cruce.
         Efecto lateral y buscado: en el cruce la que se va esta cerrada (z alto) y
         la que llega entra abierta (z bajo), asi que las dos NO viajan pegadas y el
         cambio se lee como profundidad en vez de como un fundido. */
      camaras: [],      /* [{z, dy}] por indice de escena; las llena main.js */
      frenteOp: 1,      /* el primer plano del hero se retira cuando cambia el mundo */
      vida: 1,          /* 0 apaga viento, respiracion de los rayos y destello */
      linterna: 1,      /* 0 apaga la linterna (reduced motion / touch) */
      ptr: [.62, .52],
      quieto: false     /* true = no anima solo, dibuja un frame y para */
    };
    for (var ci = 0; ci < 12; ci++) e.camaras.push({ z: 1.04, dy: 0 });

    var ptrSuave = [.62, .52];

    var W = 0, H = 0, dpr = 1;
    function medir() {
      /* 1.6 y no 2: el fondo es ilustracion plana con niebla encima, el detalle
         extra no se ve y son ~40% menos pixeles por frame en 5 pasadas. */
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      W = Math.round(lienzo.clientWidth * dpr);
      H = Math.round(lienzo.clientHeight * dpr);
      if (lienzo.width !== W || lienzo.height !== H) { lienzo.width = W; lienzo.height = H; }
    }

    function atributo(prog, nombre, buf, tam) {
      var loc = gl.getAttribLocation(prog, nombre);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, tam, gl.FLOAT, false, 0, 0);
    }

    var t0 = performance.now();

    function dibujar(ahora) {
      var t = (ahora - t0) / 1000;
      medir();
      gl.viewport(0, 0, W, H);
      gl.clearColor(.039, .043, .043, 1);          /* --fondo, neutro */
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); /* todo premultiplicado */

      var s = e.linterna ? .12 : 0;
      ptrSuave[0] += (e.ptr[0] - ptrSuave[0]) * (s ? .07 : 1);
      ptrSuave[1] += (e.ptr[1] - ptrSuave[1]) * (s ? .07 : 1);

      var a = e.avance;

      /* --- cielo --- */
      dibujarCapa(0, t);
      /* --- sol DETRAS de la vegetacion: la rama del frente le pasa por delante,
             que es lo que evita que se lea como un disco pegado encima --- */
      dibujarSol(t, 1 - e.solSobre);
      /* --- las escenas de los capitulos, cruzandose entre si --- */
      var idx = Math.max(0, e.escena);
      var iA = Math.floor(idx), mez = idx - iA, iB = iA + 1;
      if (iA >= 1) dibujarEscena(iA - 1, 1 - mez, mez, t, true);
      if (iB >= 1) dibujarEscena(iB - 1, mez, mez, t, false);

      /* --- vegetacion media --- */
      dibujarCapa(1, t);
      /* --- motas de polen entre los planos --- */
      if (e.motas > .002) {
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(progMota.p);
        atributo(progMota.p, 's', bufMota, 3);
        gl.uniform2f(progMota.u.uRes, W, H);
        gl.uniform2f(progMota.u.uPtr, ptrSuave[0], 1 - ptrSuave[1]);
        gl.uniform1f(progMota.u.uT, t);
        gl.uniform1f(progMota.u.uAmt, e.motas);
        gl.uniform1f(progMota.u.uEsc, 1 + a * .35);
        gl.drawArrays(gl.POINTS, 0, N);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      }
      /* --- la rama de yerba en primerisimo plano --- */
      dibujarCapa(2, t);
      /* --- sol YA al frente: solo cuando empieza a enfriarse pasa delante de
             todo, para poder volverse sello a la vista. --- */
      dibujarSol(t, e.solSobre);

      if (!e.quieto) raf = requestAnimationFrame(dibujar);
    }

    /* Una escena es una foto entera, sin capas: la profundidad de tres planos vale
       para el hero, donde la camara entra al monte. En un aereo o en un interior
       seria falsa. Lo que la mantiene viva es el avance de camara, el grado, el
       grano y la linterna — las mismas herramientas, no una estetica distinta. */
    function dibujarEscena(i, op, mez, t, saliendo) {
      var esc = escenas[i];
      if (!esc || op < .004) return;
      gl.useProgram(progCapa.p);
      atributo(progCapa.p, 'a', quad, 2);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, esc.tex);
      gl.uniform1i(progCapa.u.uTex, 0);
      gl.uniform2f(progCapa.u.uRes, W, H);
      gl.uniform1f(progCapa.u.uAsp, esc.asp);
      /* La camara de ESTA escena, que viene corriendo desde que el capitulo entro.
         A la que se va se le suma un envion extra durante el cruce: acelera y se
         aleja mientras la nueva recién empieza su propio empuje. Es lo que separa
         un cruce con camara de un fundido. */
      var cam = e.camaras[i] || { z: 1.04, dy: 0 };
      gl.uniform1f(progCapa.u.uEsc, cam.z + (saliendo ? mez * .07 : 0));
      var px = (ptrSuave[0] - .5) * -.016;
      var py = (ptrSuave[1] - .5) * .011 + cam.dy;
      gl.uniform2f(progCapa.u.uOff, px, py);
      gl.uniform3f(progCapa.u.uNiebla, .38, .35, .30);
      gl.uniform1f(progCapa.u.uNieblaC, 0);
      gl.uniform2f(progCapa.u.uPtr, ptrSuave[0], 1 - ptrSuave[1]);
      gl.uniform1f(progCapa.u.uLamp, .34 * e.linterna);
      gl.uniform1f(progCapa.u.uBrillo, 1);
      gl.uniform1f(progCapa.u.uSat, e.saturacion);
      gl.uniform1f(progCapa.u.uCA, .010);
      gl.uniform1f(progCapa.u.uRayos, .07 * e.vida);
      gl.uniform1f(progCapa.u.uT, t);
      /* la opacidad la resuelve el barrido pixel a pixel, no un alfa global */
      gl.uniform1f(progCapa.u.uCorte, mez);
      gl.uniform1f(progCapa.u.uEntra, saliendo ? 0 : 1);
      gl.uniform1f(progCapa.u.uOp, 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function dibujarSol(t, mezcla) {
      var op = e.solOpacidad * mezcla;
      if (op < .002) return;
      gl.useProgram(progSol.p);
      atributo(progSol.p, 'a', quad, 2);
      gl.uniform2f(progSol.u.uRes, W, H);
      gl.uniform2f(progSol.u.uPos, e.solX, e.solY);
      gl.uniform1f(progSol.u.uR, e.solRadio);
      gl.uniform1f(progSol.u.uOp, op);
      gl.uniform1f(progSol.u.uT, t);
      gl.uniform1f(progSol.u.uFrio, e.solFrio);
      gl.uniform1f(progSol.u.uVida, e.vida);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function dibujarCapa(i, t) {
      var c = capas[i], cf = c.cfg, a = e.avance;
      gl.useProgram(progCapa.p);
      atributo(progCapa.p, 'a', quad, 2);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, c.tex);
      gl.uniform1i(progCapa.u.uTex, 0);
      gl.uniform2f(progCapa.u.uRes, W, H);
      gl.uniform1f(progCapa.u.uAsp, c.asp);
      gl.uniform1f(progCapa.u.uEsc, cf.esc0 + a * cf.esc);

      /* deriva del puntero: la capa cercana se corre mucho mas que el cielo */
      var px = (ptrSuave[0] - .5) * -.030 * cf.z;
      var py = (ptrSuave[1] - .5) * .020 * cf.z;
      /* al avanzar, el frente baja y el cielo se abre */
      var ay = a * (cf.z > .5 ? .055 * cf.z : -.020);
      /* Viento: dos senos que no encajan entre si, con fase distinta por capa. Que
         no coincidan es lo que evita que se lea como un vaiven mecanico. */
      var w = cf.viento * e.vida * .00085;
      var vx = (Math.sin(t * .23 + i * 1.9) + .55 * Math.sin(t * .58 + i * 3.1)) * w;
      var vy = (Math.cos(t * .19 + i * 2.7) + .45 * Math.sin(t * .47 + i)) * w * .7;
      gl.uniform2f(progCapa.u.uOff, cf.off0[0] + px + vx, cf.off0[1] + py + ay + vy);

      gl.uniform3f(progCapa.u.uNiebla, .38, .35, .30);   /* bruma calida, casi neutra */
      gl.uniform1f(progCapa.u.uNieblaC, cf.niebla * (1 - a * .55));
      gl.uniform2f(progCapa.u.uPtr, ptrSuave[0], 1 - ptrSuave[1]);
      gl.uniform1f(progCapa.u.uLamp, cf.lamp * .42 * e.linterna);
      gl.uniform1f(progCapa.u.uBrillo, i === 0 ? .96 + e.sol * .18 : 1);
      gl.uniform1f(progCapa.u.uSat, e.saturacion);
      gl.uniform1f(progCapa.u.uCA, cf.ca);
      gl.uniform1f(progCapa.u.uRayos, cf.rayos * e.vida);
      gl.uniform1f(progCapa.u.uT, t);
      /* el cielo base se queda de piso siempre; la vegetacion del hero se retira
         cuando entra la primera escena, porque pertenece a ESE punto de vista */
      /* comparte programa con las escenas: si no se apaga, hereda SU barrido */
      gl.uniform1f(progCapa.u.uCorte, 0);
      gl.uniform1f(progCapa.u.uEntra, 0);
      gl.uniform1f(progCapa.u.uOp, i === 0 ? 1 : e.frenteOp);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    var raf = requestAnimationFrame(dibujar);

    /* Las escenas se cargan DESPUES, por JS y sin pasar por el DOM: no pueden
       demorar la cortina ni pelear por el LCP. Cada una se dibuja recien cuando
       llego; hasta entonces se ve el mundo de abajo. */
    var escenas = [];
    function cargarEscenas(nombres) {
      var ancho = window.innerWidth * (window.devicePixelRatio || 1);
      var w = ancho <= 1100 ? 1100 : (ancho <= 1600 ? 1600 : 2200);
      nombres.forEach(function (n, i) {
        var img = new Image();
        img.decoding = 'async';
        img.onload = function () {
          escenas[i] = { tex: textura(gl, img), asp: img.naturalWidth / img.naturalHeight };
        };
        /* la version va en el NOMBRE: /img/ se sirve immutable un anio y los
           archivos no llevan hash (ver tools/escenas.cjs) */
        img.src = 'img/esc-' + n + '-v2-' + w + '.webp';
      });
    }

    return {
      estado: e,
      cargarEscenas: cargarEscenas,
      frame: function () { dibujar(performance.now()); },
      parar: function () { e.quieto = true; cancelAnimationFrame(raf); },
      seguir: function () { if (e.quieto) { e.quieto = false; raf = requestAnimationFrame(dibujar); } }
    };
  }

  window.Monte = { iniciar: iniciar };
})();
