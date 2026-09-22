/* Formularios de /vende-centenaria/ y /contacto/: arman un mensaje de WhatsApp
   con lo que se completo y lo abren en una pestana nueva. Sin servidor, sin
   clave, sin servicio que se caiga: el cliente ya atiende por WhatsApp
   (material/ARQUITECTURA-Y-SEO.md). El mismo texto va al link de email de al
   lado, que se actualiza mientras se escribe. Sin JS, el form manda por mailto
   (el action del form, con enctype text/plain), que abre el cliente de correo.
   Nada se guarda en ningun lado. */
(function () {
  var forms = document.querySelectorAll('form[data-whatsapp]');
  Array.prototype.forEach.call(forms, function (form) {
    var numero = form.getAttribute('data-whatsapp');
    var saludo = form.getAttribute('data-saludo') || 'Hola.';
    var mail = form.querySelector('[data-email]');
    var ok = form.querySelector('.formulario__ok');
    var okLink = ok ? ok.querySelector('a') : null;

    function armar() {
      var lineas = [saludo, ''];
      Array.prototype.forEach.call(form.querySelectorAll('[name]'), function (c) {
        if (c.type === 'submit' || c.type === 'button') return;
        var v = (c.value || '').trim();
        if (!v) return;
        lineas.push((c.getAttribute('data-etiqueta') || c.name) + ': ' + v);
      });
      return lineas.join('\n');
    }
    function whatsapp() { return 'https://wa.me/' + numero + '?text=' + encodeURIComponent(armar()); }
    function actualizarMail() {
      if (!mail) return;
      mail.href = 'mailto:' + mail.getAttribute('data-email') +
        '?subject=' + encodeURIComponent(mail.getAttribute('data-asunto') || '') +
        '&body=' + encodeURIComponent(armar());
    }

    form.addEventListener('input', actualizarMail);
    actualizarMail();
    /* el navegador valida antes (required, type=email): submit solo llega si esta bien */
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var url = whatsapp();
      var w = window.open(url, '_blank', 'noopener');
      if (!w) location.href = url;
      if (okLink) okLink.href = url;
      if (ok) ok.classList.remove('oculto');
    });
  });
})();
