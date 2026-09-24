# Plan de salida de Fulbito — octubre de 2026

Actualizado: 19 de setiembre de 2026.

## Objetivo

Tener una beta pública utilizable en Maldonado entre el **1 y el 7 de octubre**. La salida mínima
debe permitir registrarse, encontrar complejos, reservar/cancelar y usar Buscar rival contra una API
HTTPS estable.

La publicación abierta en Google Play depende de que la cuenta de Play Console esté verificada y
habilitada para producción. Si la tienda impone una espera, la fecha se mantiene como beta mediante
testing interno/cerrado o un APK de preview; la ficha pública se habilita apenas Google la apruebe.

## Estado al 19/9

- App: lint limpio, 21 tests verdes, exportación Android/iOS/web correcta y Expo Doctor 21/21.
- API: 24 tests verdes, migraciones de Neon validadas y health check listo.
- Flujo jugador validado contra la API real: registro, onboarding, login/logout, listado y detalle de
  complejos, reserva, cancelación, publicación de búsqueda, interés de un segundo jugador y contacto.
- Prefijo telefónico: ya comparte el mismo selector en registro, perfil y administración.
- Contraseñas: control de mostrar/ocultar unificado en login, registro, cambio de contraseña y alta de
  dueños; los dos campos del registro ahora son independientes.
- Pendiente: flujos completos de ADMIN y OWNER, despliegue HTTPS, EAS/Play Console y prueba en Android
  físico.

## Fechas y entregables

### 19–21 de setiembre — cerrar base técnica

- [x] Recorrido real de jugador y correcciones de consistencia.
- [x] Actualizar los patches recomendados de Expo SDK 57.
- [x] Preparar la API para contenedor y health check.
- [ ] Confirmar estado y antigüedad de la cuenta de Google Play Console.
- [ ] Crear/iniciar sesión en una cuenta de Expo y confirmar que `com.fulbito.app` será el identificador definitivo.
- [ ] Recibir credenciales temporales de ADMIN y OWNER para probar esos roles.

**Gate:** no seguir agregando funciones. Sólo corregir bloqueantes o inconsistencias visibles.

### 22–24 de setiembre — staging real

- Desplegar la API en Render con Docker. Empezar con staging; para demos usar instancia siempre activa
  si el presupuesto lo permite, porque el plan gratuito puede tener arranque en frío.
- Crear una base/branch de Neon para staging, separada de desarrollo.
- Configurar secretos, CORS exacto, `REQUIRE_HTTPS=true` y health check `/api/public/health`.
- Configurar `EXPO_PUBLIC_API_URL` en EAS para que el build apunte a HTTPS.
- Repetir smoke test de jugador y ejecutar ADMIN/OWNER de punta a punta.

**Gate:** ningún error crítico; la app nunca depende de una PC encendida ni de una IP local.

### 24–27 de setiembre — beta instalable

- Crear un build Android de preview con EAS e instalarlo en al menos dos teléfonos físicos.
- Probar cámara/galería, Secure Store, enlaces a teléfono/WhatsApp/mapas y distintas resoluciones.
- Invitar entre 5 y 10 testers y darles un guion de 15 minutos.
- Corregir solamente P0/P1: crash, bloqueo de registro/login/reserva, datos expuestos o acciones de otro
  usuario.

**Gate:** dos recorridos completos en Android real sin intervención técnica.

### 22–30 de setiembre — canchas y contenido

- Contactar **5 canchas por día hábil**. Registrar contacto, respuesta, próximo paso y fecha de
  seguimiento.
- Meta: 20–25 contactos, 5 conversaciones y al menos 2 complejos reales cargados para el piloto.
- Crear Instagram/Facebook con nombre, logo, propuesta breve y “próximamente”. No pagar anuncios aún.
- Preparar fotos, horarios, precios, teléfonos y política de cancelación de cada cancha que acepte.

**Gate:** no lanzar una experiencia vacía; mínimo dos complejos reales o una comunicación explícita de
piloto limitado.

### 28 de setiembre–1 de octubre — tienda y confianza

- Crear la app en Play Console y completar verificación, ficha, clasificación, seguridad de datos,
  política de privacidad, icono y capturas.
- Subir el primer `.aab` al track interno/cerrado y entregar credenciales de revisión válidas.
- Confirmar si la cuenta está exenta del requisito de 12 testers durante 14 días. Google lo aplica a
  cuentas personales creadas después del 13/11/2023.

**Gate:** si Google exige los 14 días, la beta sale igual en la semana objetivo, pero no se promete la
ficha pública hasta completar ese plazo y su revisión.

### 1–4 de octubre — congelamiento y regresión

- Congelar funcionalidades.
- Repetir registro/login, perfil, complejos, disponibilidad, reserva/cancelación, Buscar rival,
  ADMIN/OWNER, imágenes y autorizaciones.
- Verificar logs, respaldo/recuperación de Neon, CORS, HTTPS, secretos y monitoreo.
- Cargar los complejos confirmados y hacer una revisión con cada responsable.

### 5–7 de octubre — salida controlada

- Publicar/promover el build disponible y anunciar primero a testers, canchas y contactos locales.
- Monitorear altas, errores, reservas y tiempos de respuesta dos veces al día.
- Responder incidencias críticas el mismo día; agrupar mejoras no críticas para la semana siguiente.

## Rutina diaria mínima

Una hora útil alcanza para no volver a quedar trabado:

1. 20 min: contactar 5 canchas nuevas.
2. 15 min: responder y hacer seguimiento.
3. 20 min: una sola tarea técnica o de tienda con criterio de terminado.
4. 5 min: actualizar este plan y elegir la primera tarea del día siguiente.

## Fuera de alcance para esta salida

- Cobros dentro de la app, formalización de empresa y monetización.
- Campañas pagas antes de validar que las canchas y usuarios completan el flujo.
- iOS público si retrasa Android; puede quedar como build técnico.
- Funciones nuevas que no desbloqueen registro, reserva, operación de canchas o Buscar rival.

## Próximas decisiones del dueño

1. Revisar Play Console y confirmar fecha/tipo/estado de la cuenta.
2. Crear o recuperar la cuenta de Expo.
3. Elegir Render para staging y definir si el lanzamiento puede pagar una instancia siempre activa.
4. Entregar credenciales temporales de ADMIN y OWNER por un canal seguro; cambiarlas al terminar QA.

Referencias oficiales: [requisito de pruebas de Google Play](https://support.google.com/googleplay/android-developer/answer/14151465),
[primer build con EAS](https://docs.expo.dev/build/setup/),
[variables de entorno EAS](https://docs.expo.dev/eas/environment-variables/) y
[servicios web de Render](https://render.com/docs/web-services).
