# Smoke E2E

Este flujo verifica que una compilacion nativa limpia abre el login y permite navegar al registro.
No crea datos ni necesita credenciales.

1. Generar e instalar una build de desarrollo con el identificador `com.fulbito.app`.
2. Iniciar la API local si se van a probar flujos autenticados.
3. Ejecutar `maestro test .maestro/smoke.yaml` con el emulador o dispositivo conectado.

Los flujos por rol y las comprobaciones de VoiceOver/TalkBack siguen requiriendo cuentas de prueba,
datos controlados y un dispositivo o emulador; deben ejecutarse antes de cada publicacion.
