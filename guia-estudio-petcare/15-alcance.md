# 15. Alcance verificado y puntos que requieren más estudio

## Qué se revisó

- Estructura y nombres de archivos de `backend/src` y `mobile/src` (371 archivos combinados según el checkout revisado), más READMEs, manifests, dependencias y configs de Expo/EAS/Vercel.
- Entrada Express, routers principales, controladores y middleware de auth/permisos.
- Flujos base de registro/login, JWT/refresh, invitación, verificación, reset, SMTP, notificaciones/cron.
- Rutas de mascotas/turnos/tienda/clínica/administración; ejemplo de SQL, configuraciones de pool y migraciones relevantes.
- Navegación móvil raíz/contexto auth/cliente HTTP y mapa de pantallas por carpetas.

## Qué no se pudo confirmar

1. **Esquema exacto remoto:** DB de producción no se interrogó. No hay SQL canónico completo para instalar base vacía; varios comandos de migración pueden ser mutantes. Por eso las entidades y relaciones se describen a partir de consultas actuales, no como dump de producción.
2. **Secretos/credenciales y salud de proveedor:** no se expusieron ni se probaron SMTP, JWT, OAuth, Cloudinary/S3, Layerbase o Vercel. La presencia de configuración no demuestra credenciales válidas.
3. **Despliegue vivo:** no se verificó el dashboard/proyecto Vercel, dominio, build publicado, variables de entorno ni repositorio GitHub remoto.
4. **Scheduler en producción:** `backend/vercel.json` no programa cron. Endpoint existe y requiere `CRON_SECRET`; falta confirmar scheduler externo operativo.
5. **Cobertura minuciosa por cada pantalla/función privada:** se inspeccionó inventario y áreas, y se siguieron flujos principales; la lista de cientos de helpers no se convirtió en una explicación línea a línea de cada símbolo. Para defender cualquier operación secundaria, abrir ruta y seguir referencias antes de la exposición.

## Discrepancias/cautelas frente a documentación

- READMEs describen resumen de capacidades, no evidencia de que servicios externos estén activos.
- Notificaciones push del sistema operativo no están implementadas; el sistema sí tiene inbox y correo.
- Tarjeta de tienda está en modo demo, no procesa cobros reales; transferencia requiere revisión.
- `backend/vercel.json` vacío: no demuestra scheduling automático.
- `SECRETARY` aparece en lenguaje histórico, pero no en los cinco roles de aplicación actuales.
- Algunas rutas de lectura usan POST; no concluir método solo por intuición REST.
- `schema-audit.json` e informes de auditoría son artefactos; no sustituyen lectura remota actual.

## Qué conviene revisar antes de la defensa

- Elegir dos pantallas concretas y seguir cada llamada real con el editor: botón → hook → service → route → controller/service/repository.
- Pedir al responsable una auditoría read-only del esquema vigente y un ERD actual, sin ejecutar migraciones en producción.
- Confirmar en consola del operador si cron está programado y qué frecuencia usa.
- Preparar evidencia segura de configuración de proveedores (valores redactados); nunca presentar tokens o secretos.
- Para cada módulo que el profesor pregunte, diferenciar “código implementado”, “configuración preparada” y “servicio remoto probado”.

## Criterio honesto de finalización

Esta entrega es una guía amplia de estudio basada en el código fuente inspeccionado; no afirma revisión línea a línea de los 394 archivos ni verificación de producción. Los apartados anteriores delimitan lo pendiente para responder con precisión sobre estado remoto o funciones de borde.
