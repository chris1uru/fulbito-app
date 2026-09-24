# Auditoría de seguridad, funcionalidad y mantenimiento de Fulbito

Fecha: 24/09/2026. App y API ejecutadas localmente; base Neon de desarrollo autorizada por el usuario. No se evaluó ni penalizó la falta de despliegue.

**Resultado: la app funciona en numerosos flujos, pero todavía tiene fallas de seguridad e integridad que impiden considerarla completamente confiable.** Pasar las pruebas actuales no detecta esas fallas. Esta entrega contiene diagnóstico, evidencias y plan; no modifica la lógica del producto.

## Alcance y resultados verificables

Se revisaron rutas, controladores, servicios, DTO, autorización, sesiones, repositorios, esquema/migraciones, imágenes, pantallas, almacenamiento local, dependencias y CI. Se ejecutó la API real con la base de desarrollo, pruebas automatizadas existentes y recorridos en el navegador.

| Verificación | Resultado |
|---|---|
| Jest frontend | 6 suites, 21 pruebas aprobadas |
| JUnit backend | 10 clases, 24 pruebas aprobadas |
| Baterías HTTP y comprobaciones auxiliares nuevas | 193 comprobaciones: 169 conformes y 24 discrepancias |
| ESLint limitado al código `app src` | Correcto, sin salida de errores |
| Exportación Expo web/Android/iOS | Correcta en las tres plataformas |
| Empaquetado JAR Spring Boot | Correcto |
| Dependencias npm, consulta al registro | 950 nombres consultados, sin avisos devueltos en esa consulta |
| Dependencias Maven, consulta OSV | 11 avisos en 7 artefactos presentes también en el JAR ejecutable |
| Cloudinary | Subida real de PNG sintético mínimo, registro, portada, reordenado, rechazo de duplicado y eliminación correctos |

Las 193 comprobaciones incluyen preparación, limpieza, repeticiones y mediciones: no son 193 funcionalidades independientes. Las 24 discrepancias se agrupan en menos problemas; algunas señalan decisiones de producto pendientes, no vulnerabilidades. No se suman los recorridos manuales al total automatizado.

Además se ejecutó una reproducción aislada del cliente HTTP con respuestas simuladas: un 401 atrasado elimina una sesión nueva. Es **una comprobación adicional fallida**, fuera del consolidado HTTP de 193; evidencia en `E:\fulbito-api\audit-2026-09-24\frontend-race-result.json`.

Cobertura Jest: **37,64% de líneas, 36% de ramas y 21,83% de funciones**, únicamente dentro del alcance configurado de servicios y utilidades. Se excluyen `session.js`, `preferences.js`, pantallas y proveedor de autenticación de esa medición. No representa cobertura del 37,64% de toda la app. El backend no genera una medición JaCoCo.

Fuentes de evidencia: [matriz CSV](../fulbito-api/audit-2026-09-24/test-matrix.csv), [primera batería](../fulbito-api/audit-2026-09-24/results.json), [batería adicional](../fulbito-api/audit-2026-09-24/extended-results.json), [concurrencia](../fulbito-api/audit-2026-09-24/final-results.json), [metadatos reales de la base](../fulbito-api/audit-2026-09-24/database-review.txt). Las instrucciones de repetición están en [README de auditoría](../fulbito-api/audit-2026-09-24/README.md).

Los recorridos de navegador y sus límites están en [verificación de UI](audit-2026-09-24/ui-verification.md). Incluyen login ADMIN/PLAYER, validación de formularios, onboarding, búsqueda, ficha, reserva, agenda, cancelación tardía y publicación/cierre de Buscar rival.

## Hallazgos que requieren prioridad inmediata

### S01 — Alta: cerrar sesión no revoca los permisos administrativos

**Reproducido por HTTP, lectura y escritura.** Login administrador → logout 204 → reutilizar ese mismo JWT. `/api/users/me` responde 401, pero `GET /api/admin/users`, `GET /api/admin/venues` y `PATCH /api/admin/venues/{id}/status` responden 200. La escritura se comprobó asignando a nuestro complejo ficticio el mismo estado INACTIVE.

Los controladores administrativos usan `@PreAuthorize` contra el rol contenido en el JWT, pero no ejecutan `CurrentUserService.require`. La comprobación de revocación, versión y estado de cuenta no está centralizada. Un token administrativo obtenido previamente conserva capacidades hasta su expiración aunque su dueño cierre sesión.

Ubicación: `E:\fulbito-api\src\main\java\uy\com\fulbito\controller\AdminUserController.java:16`, `AdminVenueController.java:14`, `security\CurrentUserService.java` y `SecurityConfig.java`.

**Corrección:** validar estado de cuenta, versión y revocación en la cadena de seguridad para cada petición autenticada, antes de evaluar permisos. Mantener además la comprobación de propiedad. Probar la misma matriz para ADMIN, OWNER y PLAYER, incluyendo JWT vencido, manipulado, revocado, cambio de contraseña y cuenta inactiva. OWASP recomienda comprobar la autorización en cada petición: [Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

### S02 — Alta: se puede eludir el límite de intentos de login

**Reproducido.** Once intentos sobre un correo ficticio: el undécimo responde 429. Repetir con `X-Forwarded-For: 192.0.2.123` responde 401 y vuelve a procesar el intento. `server.forward-headers-strategy=framework` confía en la cabecera recibida directamente; el limitador utiliza `getRemoteAddr()`.

Además, el límite está asociado a IP+email, no hay límites globales por IP/cuenta y `MAX_TRACKED_KEYS` no impone realmente un máximo: solamente elimina entradas vencidas. Cambiar correos puede seguir creando entradas válidas. Este último riesgo se deduce del código; no se ejecutó una prueba de agotamiento de memoria.

Ubicación: `application.properties:3`, `AuthController.java:31`, `RateLimitService.java:13`.

**Corrección local:** no aceptar cabeceras reenviadas de clientes directos; aplicar límites separados por IP y por cuenta, memoria acotada con caducidad y respuestas 429 consistentes. Cuando exista un proxy, definir explícitamente cuáles son confiables. Agregar límite a cambio de contraseña, creación de reservas y publicaciones para evitar abuso. La configuración distribuida puede esperar a que haya más de una instancia.

### D01 — Alta: la base real no tiene conectado el validador de reservas

**Verificado con metadatos PostgreSQL y dos reproducciones HTTP.** Flyway registra versiones 1–10 exitosas. Existe la función `validate_reservation`, pero ningún trigger de `reservations` la invoca en esta base. El baseline B4 sí declara `tr_reservations_validate`; actualizar una función en V6 no crea el trigger ausente en una base antigua.

Se aceptaron con 201 una reserva de 11:00:30 a 12:00:30 y otra de 15:00:00 a 16:00:30 para canchas configuradas con turnos de 60 minutos. La validación Java usa `Duration.toMinutes()`, que trunca segundos tanto para duración como para alineación con la apertura.

Ubicación: `ReservationService.java:103–110`, migraciones `B4__baseline_schema.sql` y `V6__allow_admin_payment_confirmation.sql`; evidencia real en `database-review.txt`.

**Corrección:** nueva migración incremental que reconcilie triggers/constraints en bases antiguas y nuevas, con comprobaciones previas de datos incompatibles. No reescribir migraciones aplicadas. En Java comparar duración exacta y rechazar segundos/nanosegundos cuando el negocio usa minutos exactos. Probar creación desde base vacía y actualización desde el esquema anterior. La validación de Hibernate/Flyway por sí sola no prueba la existencia efectiva de todas las defensas de negocio.

### D02 — Alta: carreras entre pago y cancelación pierden cambios

**Reproducido tres veces.** Para la misma reserva se enviaron simultáneamente `mark-paid` y `cancel-owner`. Las dos peticiones devolvieron 200 en las tres ejecuciones. Dos terminaron canceladas y pendientes después de que el pago hubiera informado éxito; otra terminó confirmada y pagada después de que la cancelación hubiera informado éxito.

No hay `@Version`, bloqueo de fila ni actualización condicional en estas transiciones. Cada transacción valida un estado anterior y puede sobrescribir el resultado de la otra. D01 debilita además la defensa SQL.

Ubicación: `ReservationService.java:78–99`, entidad `Reservation`, repositorio `ReservationRepository`; respuestas y estados finales en `final-results.json`.

**Corrección:** operaciones de transición atómicas, mediante bloqueo pesimista o UPDATE condicionado al estado esperado, y/o versión optimista con conflicto 409. Garantizar un único ganador y que la respuesta describa el estado persistido. Conservar un historial de cambios de pago. Probar también doble cancelación, doble cobro y actualización simultánea de tarifa/estado de cancha.

### P01 — Alta: eliminación incompleta de datos personales

**Reproducido.** Un jugador se postuló a una búsqueda. Se eliminó su cuenta con 204. El creador de la búsqueda todavía pudo consultar su nombre anterior y teléfono en `/interests`.

`UserService.deleteAccount` anonimiza reservas y usuario, pero no `match_interests.player_name_snapshot` ni `player_phone_snapshot`. Las búsquedas propias y sus notas también necesitan una política explícita al eliminar la cuenta. El texto de ayuda promete una anonimización más amplia que la implementada.

**Corrección:** anonimizar o eliminar las copias en postulaciones, cerrar búsquedas abiertas y aplicar una política consistente al texto libre. El teléfono actualmente es NOT NULL en `match_interests`: ajustar esquema y DTO, no reemplazarlo por un teléfono inventado. Prueba integral: una cuenta borrada no aparece con datos identificables en ningún endpoint accesible a terceros.

### S03 — Alta como exposición del entorno: la API usa un rol de base demasiado poderoso

**Verificado, sin modificar permisos.** La conexión usa `neondb_owner`, con `rolcreatedb=true`, `rolcreaterole=true`, `rolbypassrls=true`, además de permisos de TRUNCATE/TRIGGER/UPDATE/DELETE sobre tablas, incluida auditoría. Esto amplía el impacto de un eventual compromiso de la API; no demuestra que exista inyección SQL.

**Corrección:** separar rol migrador y rol de ejecución, también en desarrollo. El archivo `database/grant-runtime-role.sql` existe pero concede DML global: ajustarlo para que el runtime no pueda borrar/reescribir auditoría ni historial de migraciones. Revisar permisos necesarios para funciones y secuencias. Probar arranque y todos los flujos con el rol restringido antes de cambiar credenciales definitivas.

## Errores funcionales y de validación confirmados

| ID / prioridad | Evidencia e impacto | Corrección propuesta |
|---|---|---|
| V01 / P1 | Un PLAYER intentando una ruta administrativa, crear cancha, marcar pago o firmar imagen recibe **500** en lugar de 403. No obtiene el permiso, pero el error está mal clasificado. | Manejar `AccessDeniedException` fuera del catch genérico, conservando 403 y formato JSON uniforme. |
| V02 / P1 | Búsqueda administrativa con 101 caracteres devuelve 500; el límite declarado es 100. | Manejar `ConstraintViolationException` derivada de `@Validated`; unificar validación de parámetros y bodies. |
| V03 / P1 | `availabilities:[null]` genera 500. | Añadir `@NotNull` al elemento de lista y validar antes de ordenar/acceder a sus campos. |
| V04 / P1 | Contraseña de 40 caracteres `é` supera 72 bytes UTF-8 y provoca 500 durante BCrypt. | Definir límite en bytes coherente con BCrypt o migrar con compatibilidad a otro algoritmo; presentar el mismo criterio en UI/API, nunca truncar silenciosamente. |
| V05 / P2 | Precio enorme da 409 genérico de integridad. | `@Digits` y máximo coherente con `numeric(12,2)`, validación de decimales y error de campo 400. |
| F01 / P1 | En navegador, completar solo el nombre y dejar precio vacío crea una cancha correctamente a **$0**. | Rechazar cadena vacía antes de `Number()`. Si se permite gratis, requerir que el usuario ingrese 0 explícitamente. |
| F02 / P1 | Se puede borrar la franja horaria que sostiene reservas futuras: DELETE 204. | Definir cambio con vigencia futura o impedirlo mientras afecte reservas; mostrar cuántas quedan afectadas y ofrecer reprogramación/cancelación explícita. Es una decisión de consistencia del producto. |
| F03 / P2 | Consulta de bloqueos con fin anterior al inicio responde 200 vacío. | Validar orden y máximo de rango, como ya hace la agenda. |
| S04 / P1 | Suspender OWNER bloquea correctamente, pero al reactivarlo el JWT anterior vuelve a funcionar. | Incrementar `authVersion` cuando se suspende/desactiva. Reactivar debe requerir login nuevo si se busca revocación definitiva. |
| P02 / P2 | Un complejo INACTIVE devuelve 404 en detalle pero 200 con sus horarios y listado de imágenes. | Aplicar política de publicación uniforme en endpoints públicos. Se confirmó exposición de horarios; el listado de imágenes de prueba estaba vacío, no se afirma haber visto una foto privada. |
| F04 / P2 | Un complejo inactivo sigue mostrando “Desactivar complejo” en su gestión. | Acción coherente con el estado actual: ocultar/deshabilitar o permitir “Activar”; mantener restricciones de responsable. |
| F05 / P2 | La agenda de jugador muestra reservas futuras canceladas bajo “Más adelante”, sin etiqueta textual de estado en sus tarjetas compactas. Observado en el navegador con reservas canceladas de auditoría. | Separar activas de canceladas o mostrar claramente el estado; filtrar por estado además de fecha. |

El formulario de precio está en `E:\fulbito-app\src\features\venues\screens\CourtFormScreen.jsx:132`. El manejo global de errores está en `E:\fulbito-api\src\main\java\uy\com\fulbito\error\GlobalExceptionHandler.java`. Los estados administrativos están en `AdminUserService.java:67`; horarios y bloques en `ScheduleService.java:30–41`.

## Riesgos adicionales y revisión de código

- **Sesión y desconexión (P1):** `AuthProvider.jsx:47` hace logout ante cualquier error al restaurar sesión, incluido un corte de red. Separar error de conexión de token inválido; ofrecer reintento sin borrar credenciales válidas.
- **Respuesta 401 atrasada (P1, reproducida adicionalmente):** `api.js:65` limpia el token global sin comprobar que sigue siendo el de esa petición. El script `frontend-race.mjs` inició una petición con token antiguo, instaló uno nuevo y liberó el 401 anterior: se invocó el cierre y la siguiente petición quedó sin Authorization. Asociar respuestas a una generación de sesión. Esta reproducción usa respuestas simuladas sobre el módulo real, no una carrera observada casualmente en navegador.
- **Timeout incompleto (P2):** `api.js:59` cancela el temporizador cuando llegan headers; la lectura de `response.json()` queda fuera del plazo. Cubrir headers y body con el mismo timeout, y manejar éxito con JSON ilegible como error de protocolo.
- **Buscar rival pierde resultados (P1):** `MatchRequestService.java:54–62` obtiene los primeros 100 y después filtra por estilo/formato/fecha. Una búsqueda compatible fuera de esos primeros 100 queda invisible. Llevar filtros a SQL y paginar; probar con más de 100 publicaciones variadas.
- **Recuperación de cuenta ausente (P1 funcional):** “Olvidé mi contraseña” abre ayuda; no hay endpoints de recuperación o verificación de email. Implementar token aleatorio de un uso, expiración, respuesta no enumerativa y pruebas con servidor de correo local. La IA puede implementar todo el flujo local; proveedor de correo y políticas definitivas son decisiones posteriores.
- **Favoritos compartidos entre cuentas del dispositivo (P2):** `preferences.js` usa claves globales. Separarlas por usuario y limpiar/gestionar migración al cambiar sesión. No se demostró fuga de datos del servidor por este mecanismo.
- **Privacidad explicada incorrectamente (P2):** la ayuda dice que el teléfono “sólo” se comparte en Buscar rival, pero también se guarda en la reserva y se entrega al gestor autorizado. Corregir el texto según el comportamiento real.
- **Imágenes y fallas parciales (P1/P2):** operaciones externas de Cloudinary ocurren dentro de transacciones SQL. Un éxito externo seguido de rollback puede dejar referencias rotas; una carga que nunca se confirma puede quedar huérfana. En dos registros concurrentes del mismo archivo, la compensación genérica puede borrar un recurso ya utilizado por el ganador. Usar estados temporales, claves únicas, outbox y limpieza/reintentos idempotentes; verificar con fallas inyectadas. No se provocó deliberadamente la caída de Cloudinary.
- **Sin cuotas globales de negocio (P2):** reservas y publicaciones tienen validaciones, pero no límites por cuenta/horizonte de reserva suficientes para abuso sostenido. Definir cuotas, evitar acaparamiento y agregar idempotencia en escrituras. No se realizó una prueba de denegación de servicio.

## Dependencias: exposición detectada frente a explotación comprobada

Los siete artefactos se verificaron dentro de `target/fulbito-api-0.0.1-SNAPSHOT.jar`, construido durante esta auditoría. OSV devolvió los siguientes avisos. **Un aviso de dependencia no significa que se haya explotado la app.**

| Artefacto instalado | Avisos / versión corregida publicada en los avisos | Aplicabilidad observada |
|---|---|---|
| `tomcat-embed-core 10.1.55` | GHSA-9xv2-5v5q-p794, GHSA-gcx9-497g-6cp6, GHSA-h3x4-894j-xpx5; rama 10.1.58 | Avisos clasificados críticos por la fuente. Requieren mecanismos DIGEST/FORM o restricciones del contenedor; la app usa Spring Security JWT. No se confirmó un bypass por estos CVE. |
| `jackson-databind 2.21.4` | GHSA-5gvw-p9qm-jgwh, GHSA-5jmj-h7xm-6q6v, GHSA-mhm7-754m-9p8w; rama 2.21.5 | Casos específicos de vistas/deserialización. No se encontraron esas anotaciones/configuraciones en el código propio revisado. |
| `log4j-api 2.24.3` | GHSA-qv9r-c865-cp47; 2.25.5 o 2.26.1 | Caso MapMessage JSON y valores no finitos; no se encontró ese uso en código propio. |
| `commons-lang3 3.17.0` | GHSA-j288-q9x7-2f5v; 3.18.0 | Recursión por entrada larga; no se confirmó una ruta de entrada controlada por el usuario. |
| `httpclient5 5.5.2` | GHSA-hjcp-jmpx-g3qm; 5.6.3 | Fuga de conexiones ante Content-Encoding inválido en cliente clásico; relevante para resiliencia de integraciones. |
| `httpcore5-h2 5.3.6` | GHSA-v3jc-474w-2wm6; 5.4.3 | Consumo de memoria HTTP/2, condicionado al uso real del transporte. |
| `httpcore5 5.3.6` | GHSA-hf6x-8p5f-cgmf; 5.4.3 | Consumo de memoria por headers remotos. No explotado. |

Prioridad P1: actualizar de manera compatible mediante BOM/patches y alinear HttpComponents; no introducir overrides indiscriminados. Repetir empaquetado, escaneo y pruebas de Cloudinary. Los avisos completos y enlaces originales están en `advisory-details.json`; por ejemplo [Tomcat](https://github.com/advisories/GHSA-9xv2-5v5q-p794), [Jackson](https://github.com/advisories/GHSA-5gvw-p9qm-jgwh) y [HttpClient](https://github.com/advisories/GHSA-hjcp-jmpx-g3qm).

npm no devolvió avisos para el inventario consultado; eso no descarta vulnerabilidades desconocidas. No se ejecutó `npm audit` literalmente porque el entorno expone Node sin npm: se consultó su endpoint oficial de avisos. `expo install --check` online encontró un bloqueo de escritura de caché fuera del workspace; la variante offline pasó, con la advertencia de Expo sobre confiabilidad limitada. El bundle sí se construyó para las tres plataformas. El `dependency:tree` de Maven falló por permisos de caché; se sustituyó por inventario del classpath y comprobación del JAR.

## Flujos que sí respondieron correctamente

- Login válido, login vacío, JWT malformado, acceso anónimo denegado y logout/contraseña nueva en rutas que consultan `CurrentUserService`.
- Registro público fija PLAYER aunque el body intente inyectar ADMIN. Alta administrativa de ADMIN rechazada. Duplicado de correo rechazado.
- Alta de dueños/jugadores de prueba, complejo, canchas y horarios; validación de precio negativo, turnos no múltiplos de 15 y horarios invertidos/superpuestos.
- OWNER ajeno no modifica complejo/cancha/bloqueo ni cobra reservas ajenas. Jugador ajeno no lee reservas o postulaciones privadas.
- Precio, jugador y estado del pago se calculan en el servidor; el body no logra cambiarlos arbitrariamente.
- Solapamiento de cancha, solapamiento del mismo jugador entre canchas y choque con bloqueos rechazados. Dos reservas concurrentes sobre el mismo turno producen un solo ganador.
- Reserva manual requiere nombre; pago repetido es idempotente secuencialmente; cancelación de reserva ya pagada se rechaza secuencialmente. La falla aparece en concurrencia.
- Buscar rival admite búsqueda por reserva o franjas, rechaza duplicado por reserva, postulación propia y doble postulación; comprueba privacidad de postulaciones. Cancelar reserva cierra la búsqueda vinculada.
- Perfil válido se guarda; teléfono inválido y nombre vacío se rechazan. Cambiar contraseña invalida el JWT del jugador anterior.
- CORS rechaza un origen ajeno. Confirmaciones de imágenes falsificadas y orden negativo se rechazan.

## Rendimiento y funcionamiento sostenido

La muestra de las primeras dos baterías comprende 152 peticiones HTTP, incluyendo errores baratos: mediana 298 ms, p95 600 ms y máximo 1299 ms. Diez lecturas consecutivas de catálogo dieron 225–237 ms. Estas cifras incluyen Neon remoto y no representan una prueba de carga ni una capacidad garantizada.

1. **Paginar en SQL.** Catálogos y agendas no deben crecer sin límite. Para reservas e historial de rivales, usar cursor/fecha+id; evitar topes silenciosos de 50/100 sin opción de continuar. Aplicar filtros antes de limitar resultados.
2. **Medir consultas reales antes de agregar índices.** `Reservation` tiene relaciones LAZY y el mapper accede a cancha/complejo/jugador: hay riesgo N+1. Usar proyecciones o entity graphs acotados y pruebas de número de consultas; comprobar con `EXPLAIN (ANALYZE, BUFFERS)` en datos sintéticos representativos.
3. **Resumen de agenda en servidor.** La pantalla inicial trae reservas completas para contar por complejo. Un agregado `count(*) group by venue_id` reduce bytes, datos personales transferidos y trabajo en móvil.
4. **Lecturas sin escrituras globales.** Buscar rival actualiza vencimientos en cada discover/mine. Filtrar expiración al leer y ejecutar mantenimiento periódico por lotes evita que lecturas frecuentes generen escrituras y bloqueos.
5. **Mantener transacciones cortas.** Sacar llamadas remotas a imágenes del tiempo de ocupación de conexiones JDBC. El pool actual es 5: aumentarlo sin medición puede empeorar el límite de la base. Añadir timeouts y medir espera de pool.
6. **Frontend:** cachear catálogos y disponibilidad brevemente, deduplicar peticiones e invalidar al reservar/cancelar; la confirmación siempre se revalida en API. Usar listas virtualizadas para catálogos/historial grandes. Preservar el manejo existente de respuestas antiguas en agenda y extenderlo a sesión y formularios.
7. **Imágenes:** variantes pequeñas para tarjetas, tamaños explícitos, compresión y caché; conservar el flujo de firma y verificación de servidor. Medir bytes y fallas, no solo cantidad de fotos.
8. **Auditoría y operación:** registrar actor, recurso, resultado y transición relevante con request-id; conservar integridad del historial. La tabla actual crece sin retención definida y se escribe sincrónicamente. Definir retención/archivo, limpieza de tokens vencidos y métricas de errores/latencia. No registrar contraseñas, tokens ni cuerpos sensibles.
9. **Prueba de carga reproducible posterior:** base sintética separada, 10/25/50 usuarios virtuales, tráfico mixto, reserva caliente concurrente y dependencias lentas. Definir objetivos acordados de p95, porcentaje de errores y cero doble reserva; no deducir esos objetivos de esta muestra pequeña.

## Plan de mitigación realizable con IA

| Orden | Trabajo concreto | Condición verificable para cerrarlo |
|---|---|---|
| 1 — P0 | Centralizar validación de JWT/usuario y corregir confianza en forwarded headers. | Token revocado incapaz de leer/escribir cualquiera de las rutas; cambiar X-Forwarded-For no reinicia límites. |
| 2 — P0 | Migración reparadora de triggers, precisión temporal y transiciones atómicas pago/cancelación. | Base nueva y base antigua equivalentes; segundos rechazados; 50 carreras controladas con un único ganador y sin pagos perdidos. |
| 3 — P1 | Anonimización completa y revocación definitiva al suspender; rol SQL restringido. | Ningún dato ficticio eliminado visible a terceros; token antiguo sigue inválido tras reactivar; runtime sin DDL/TRUNCATE ni edición del historial de auditoría. |
| 4 — P1 | Unificar errores 400/401/403/404/409/429; corregir nulls, bytes de contraseña, precio vacío y límites numéricos. | Casos negativos devuelven errores accionables; ningún 500 en la matriz de validación; no aparece una cancha gratis por omisión. |
| 5 — P1 | Resolver cambios de horario con reservas, paginación/filtros de rival, recuperación de cuenta local, sesión sin red y respuesta 401 atrasada. | Tests de más de 100 publicaciones, corte de red y cambio de sesión; restablecimiento de contraseña con expiración y uso único; reservas preservadas al editar agenda. |
| 6 — P1/P2 | Actualizar dependencias; robustecer consistencia de imágenes, cuotas e idempotencia. | Escaneo actualizado y excepciones documentadas por aplicabilidad; falla de Cloudinary no pierde imágenes válidas ni duplica operaciones. |
| 7 — P2 | Optimización de consultas, resumen de agenda, cache/listas, observabilidad y mantenimiento de datos. | Comparación antes/después con dataset reproducible, menos consultas/bytes, objetivos de latencia cumplidos. |
| 8 — Cierre | Automatizar regresiones de API y E2E por rol y ejecutar móviles reales/emulados. | Toda falla reproducida aquí convertida en prueba permanente; matriz de flujos aprobada en plataformas objetivo y pendientes explícitos. |

La IA puede escribir las migraciones, cambios de backend/frontend, pruebas, scripts de datos, correo local simulado, escaneos y mediciones. Requieren definición de producto: cancelación tardía, tratamiento de reservas pagadas/reversiones, cambios de horarios con compromisos existentes, plazo máximo para reservar, retención de historial y cuotas. Se pueden proponer valores y probarlos localmente sin contratar servicios ni desplegar.

No conviene intentar arreglar todo en un único cambio: separar seguridad/sesión, integridad de reservas, privacidad, validaciones, flujos y rendimiento, cada uno con su regresión y criterio de aceptación. Una vez corregidos, repetir esta matriz sobre una copia preparada y agregar los casos que faltan.

## Límites y trabajo todavía no certificado

- No se ejecutó Android/iOS en un dispositivo o emulador. Exportar sus bundles no prueba teclado, navegación nativa, permisos de galería, selección/manipulación de imágenes, mapas nativos, SecureStore ni cambios de orientación/tamaño.
- No se probaron exhaustivamente todas las pantallas y combinaciones de entrada mediante UI. Los flujos HTTP cubren gran parte de la lógica, pero no sustituyen E2E de todos los formularios. La matriz distingue evidencias de código, HTTP y navegador.
- No se hizo carga prolongada, agotamiento de memoria, pentest de infraestructura, recuperación desde backup, simulación completa de caídas, ni migración real desde cero en PostgreSQL aislado. Son tareas de cierre local, no requisitos de despliegue.
- No se ensayaron todos los límites de imágenes con archivos grandes ni todas las carreras de registros/portadas; hay pruebas unitarias y una integración real pequeña.
- JWT vencido, audience/claims anómalos, redes móviles intermitentes, múltiples pestañas y accesibilidad con lector de pantalla necesitan ampliar automatización. Se comprobó token malformado y revocado.
- No hay evidencia suficiente para prometer “100% seguro” o “100% de escenarios probados”. El objetivo verificable es cerrar los hallazgos, cubrir todas las reglas/roles acordados y conservar regresiones que fallen si vuelven a aparecer.

Se conservaron los cambios de trabajo previos del usuario. No se hicieron commits ni se cambió la lógica de aplicación. La credencial del administrador no se incluyó en artefactos. Se generaron usuarios/complejo con marca AUDIT; se desactivan al terminar. Los pagos probados son marcas internas de reservas ficticias: no se efectuó ningún cobro real. La imagen sintética subida a Cloudinary se eliminó. El historial de reservas de prueba permanece, incluidas las pagadas que el producto no permite cancelar.

Estado final verificado en `E:\fulbito-api\audit-2026-09-24\cleanup-state.json`: complejo INACTIVE, cuatro usuarios iniciales INACTIVE, registro público adicional eliminado, cero imágenes, cero búsquedas abiertas y cero reservas CONFIRMED/PENDING. Se conservan dos reservas ficticias CONFIRMED/PAID. La cancha creada desde UI sin precio quedó inactiva, con precio 0, dentro del complejo inactivo. Los servidores lanzados para esta auditoría se detuvieron al terminar.

