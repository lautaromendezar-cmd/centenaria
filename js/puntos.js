/* Puntos de venta de Centenaria: los lee js/buscador.js en /donde-comprar/.
   VACIO A PROPOSITO hasta que el cliente mande o confirme la lista: los 29
   distribuidores relevados del sitio de LaTiNa son telefonos de personas reales
   y no se publican por deduccion (CONTINUAR.md). Cuando llegue la lista va una
   fila por punto, asi:

     { provincia: 'Entre Ríos', localidad: 'Gualeguaychú', nombre: 'Almacén Tal',
       direccion: 'Calle 123', telefono: '3446 12-3456', instagram: 'usuario' }

   direccion, telefono e instagram son opcionales. La provincia tiene que ir
   escrita como en PROVINCIAS de js/buscador.js ("Ciudad Autónoma de Buenos
   Aires" para CABA). El archivo se sirve sin cache larga (/js/ no es immutable
   en vercel.json), asi que se puede actualizar sin cambiarle el nombre. */
window.PUNTOS = [];
