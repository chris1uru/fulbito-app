# Arquitectura del frontend

El proyecto utiliza una estructura **feature-first** para que cada funcionalidad pueda crecer sin mezclar responsabilidades.

## Carpetas

- `app/`: rutas y layouts de Expo Router. Los archivos de ruta sólo reexportan una pantalla.
- `src/features/`: funcionalidades de negocio. Cada feature puede tener `screens/`, `components/`, `hooks/` o `utils/` cuando realmente los necesite.
- `src/components/`: componentes visuales compartidos por más de una feature.
- `src/providers/`: contextos y proveedores globales.
- `src/services/`: acceso a API, sesión y otras integraciones externas.

## Reglas de crecimiento

1. Una nueva pantalla se implementa dentro de su feature y se expone mediante un archivo pequeño en `app/`.
2. Un componente usado por una sola feature permanece dentro de esa feature.
3. Un componente pasa a `src/components/` únicamente cuando es compartido.
4. Las llamadas HTTP se centralizan en `src/services/api.js`; las pantallas no construyen URLs manualmente.
5. No se crean carpetas o archivos genéricos hasta que exista una responsabilidad concreta para ellos.
