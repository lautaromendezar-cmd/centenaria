/* Buscador de puntos de venta (/donde-comprar/). Portado del de LaTiNa
   (latina/src/components/donde-comprar/Buscador.tsx) con su mismo razonamiento,
   porque los datos son los mismos: pocos puntos, pocas provincias, sin
   coordenadas y casi sin direcciones de calle. De ahi:
     1. No hay geolocalizacion ni "los mas cercanos": sin coordenadas no hay
        distancia, y pedir permiso de ubicacion para no poder usarlo es peor.
     2. El estado "todavia no llegamos a tu zona" es el CAMINO PRINCIPAL, no el
        borde: tiene el mismo peso que el de exito y dos salidas escritas
        (comprar online, o traerla vos). Una busqueda fallida es un lead mayorista.
     3. La cobertura se dice sin inflarla, y solo cuando hay datos.
   Los datos vienen de js/puntos.js (window.PUNTOS). Sin JS, la pagina igual
   ofrece las dos salidas mas abajo; el formulario no manda a ningun lado. */
(function () {
  var PROVINCIAS = [
    'Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'Catamarca', 'Chaco', 'Chubut',
    'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
    'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
  ];
  var form = document.getElementById('buscador');
  if (!form) return;
  var puntos = Array.isArray(window.PUNTOS) ? window.PUNTOS : [];
  var selProv = document.getElementById('provincia');
  var inpLoc = document.getElementById('localidad');
  var cobertura = document.getElementById('cobertura');
  var estado = document.getElementById('estado');
  var lista = document.getElementById('puntos');
  var vacio = document.getElementById('vacio');
  var vacioTitulo = document.getElementById('vacioTitulo');
  if (!selProv || !inpLoc || !estado || !lista || !vacio || !vacioTitulo) return;

  function plano(t) {
    return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
  function mostrar(el, si) { el.classList.toggle('oculto', !si); }
  function texto(el, t) { el.textContent = t; }

  /* cuantos puntos por provincia, para el select y la cobertura */
  var porProvincia = {};
  puntos.forEach(function (p) { porProvincia[p.provincia] = (porProvincia[p.provincia] || 0) + 1; });
  var conPuntos = Object.keys(porProvincia).length;

  /* el select se llena aca (el HTML trae solo la opcion vacia): las provincias
     con puntos van primero y con la cantidad, como los chips de LaTiNa */
  var orden = PROVINCIAS.slice().sort(function (a, b) {
    var na = porProvincia[a] || 0, nb = porProvincia[b] || 0;
    if ((na > 0) !== (nb > 0)) return na > 0 ? -1 : 1;
    return a.localeCompare(b, 'es');
  });
  orden.forEach(function (nombre) {
    var op = document.createElement('option');
    op.value = nombre;
    op.textContent = porProvincia[nombre] ? nombre + ' (' + porProvincia[nombre] + ')' : nombre;
    selProv.appendChild(op);
  });

  if (cobertura) {
    if (puntos.length) {
      cobertura.innerHTML = '';
      cobertura.appendChild(document.createTextNode(puntos.length + (puntos.length === 1 ? ' punto de venta' : ' puntos de venta')));
      var chico = document.createElement('small');
      chico.textContent = 'En ' + conPuntos + ' de ' + PROVINCIAS.length + ' provincias';
      cobertura.appendChild(chico);
      mostrar(cobertura, true);
    } else {
      mostrar(cobertura, false);
    }
  }

  function buscar() {
    var prov = selProv.value, loc = plano(inpLoc.value);
    var filtrando = !!prov || loc.length > 0;
    var res = puntos.filter(function (p) {
      if (prov && p.provincia !== prov) return false;
      if (loc && plano(p.localidad).indexOf(loc) < 0 && plano(p.nombre).indexOf(loc) < 0) return false;
      return true;
    });
    /* sin filtro y con datos: se ve todo. Sin filtro y sin datos: nada que
       decir todavia, el vacio aparece recien cuando la persona elige. */
    if (!filtrando && !puntos.length) {
      mostrar(estado, false); mostrar(lista, false); mostrar(vacio, false);
      return;
    }
    if (res.length) {
      lista.innerHTML = '';
      res.forEach(function (p) {
        var li = document.createElement('li'); li.className = 'punto';
        var zona = document.createElement('span'); zona.className = 'punto__zona';
        zona.textContent = p.localidad + ' · ' + p.provincia;
        var nombre = document.createElement('span'); nombre.className = 'punto__nombre';
        nombre.textContent = p.nombre;
        li.appendChild(zona); li.appendChild(nombre);
        if (p.direccion) {
          var dir = document.createElement('span'); dir.className = 'punto__dato';
          dir.textContent = p.direccion; li.appendChild(dir);
        }
        if (p.telefono) {
          var tel = document.createElement('a'); tel.className = 'punto__dato';
          tel.href = 'tel:' + String(p.telefono).replace(/[^\d+]/g, '');
          tel.textContent = p.telefono; li.appendChild(tel);
        }
        if (p.instagram) {
          var ig = document.createElement('a'); ig.className = 'punto__dato';
          ig.href = 'https://www.instagram.com/' + String(p.instagram).replace(/^@/, '') + '/';
          ig.target = '_blank'; ig.rel = 'noopener';
          ig.textContent = '@' + String(p.instagram).replace(/^@/, ''); li.appendChild(ig);
        }
        lista.appendChild(li);
      });
      texto(estado, filtrando
        ? (res.length === 1 ? '1 punto de venta' : res.length + ' puntos de venta') + (prov ? ' en ' + prov : '')
        : 'Todos los puntos de venta');
      mostrar(estado, true); mostrar(lista, true); mostrar(vacio, false);
    } else {
      texto(vacioTitulo, prov ? 'Todavía no llegamos a ' + prov + '.' : 'Todavía no llegamos a tu zona.');
      mostrar(estado, false); mostrar(lista, false); mostrar(vacio, true);
    }
  }

  /* la URL trae la provincia si el formulario se mando sin JS (GET) o si
     alguien comparte el link */
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('provincia')) selProv.value = q.get('provincia');
    if (q.get('localidad')) inpLoc.value = q.get('localidad');
  } catch (e) { /* URLSearchParams no esta: sin preseleccion, nada mas */ }

  selProv.addEventListener('change', buscar);
  inpLoc.addEventListener('input', buscar);
  form.addEventListener('submit', function (ev) { ev.preventDefault(); buscar(); });
  buscar();
})();
