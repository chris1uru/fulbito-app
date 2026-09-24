# Pruebas manuales en navegador — 24/09/2026

Origen: http://localhost:8081, API real local y base de desarrollo autorizada. Navegador integrado de Codex. Estos recorridos no se incluyen en las 193 comprobaciones del script.

| Flujo | Resultado observado |
|---|---|
| Login vacío | Mensaje “Ingresá tu correo y contraseña”. |
| Login administrador | Acceso a agenda y perfil de administrador. |
| Gestión de usuarios | Listado carga; buscar AUDIT filtra los dos dueños ficticios. |
| Nuevo dueño vacío | Errores de nombre, apellido, email, cédula y contraseña. |
| Gestión de complejos | Catálogo, ficha de gestión y lista de canchas accesibles. |
| Complejo inactivo | Muestra INACTIVE y aun así ofrece “Desactivar complejo”; inconsistencia de acción. |
| Nueva cancha sin precio | Nombre AUDIT precio vacío, estado Inactiva, precio sin completar; aparece “Cancha creada”. Se guardó precio 0 por conversión de cadena vacía. |
| Logout administrador | Diálogo de confirmación y regreso a login. |
| Login jugador | Abre onboarding al no haberlo completado. |
| Onboarding | Tres pasos consecutivos y acceso al buscador al completar. |
| Buscador | Filtrar AUDIT encuentra el complejo ficticio; calendario deshabilita días pasados. |
| Favorito | Se ejecutó la acción de agregar en la tarjeta; persistencia entre sesiones no certificada. |
| Ficha pública | Canchas, precio, horario, franjas y disponibilidad visibles. |
| Reserva | Diálogo muestra cancha, fecha, precio y política; tras confirmar, mensaje de éxito y turno ocupado. |
| Agenda jugador | Reserva aparece como próxima, con pago pendiente; el detalle muestra sus datos. |
| Agenda canceladas | Otras reservas futuras ya canceladas aparecen en “Más adelante”; tarjeta compacta usa un punto de color, sin etiqueta textual de estado. |
| Cancelación tardía | Aviso previo, confirmación, estado “Cancelada por el jugador” y “Cancelación tardía registrada”. |
| Buscar rival | Pantalla, estilos, filtros, publicaciones propias y formulario cargan. |
| Publicación sin franja | Mensaje “Agregá un horario”. |
| Preparar publicación | Agregar franja muestra día/horas y contador de comentario; publicación ficticia identificada AUDIT. |
| Publicar búsqueda | Mensaje “Búsqueda publicada”, aparece Abierta en publicaciones propias con el comentario de prueba. |
| Cerrar búsqueda | Diálogo previo y acción de cierre; verificación posterior por API confirma cero publicaciones abiertas del jugador. |

Reserva creada por UI: `233a6780-ca1f-432d-a16c-65c0173af465`, cancelada mediante UI. Complejo usado: `3172eacd-fe75-4825-83d5-fd1d03f9bba8`. No se modificaron complejos ajenos para estos recorridos.

Limitaciones: sin emulador/dispositivo Android/iOS; sin todas las resoluciones, lector de pantalla, teclado móvil, permisos de galería, modo offline ni todos los formularios recorridos exhaustivamente. API y revisión de código complementan estos recorridos pero no equivalen a pruebas de UI de esas variantes.
