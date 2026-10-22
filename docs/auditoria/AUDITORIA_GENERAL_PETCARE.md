# Auditoría general de PetCare

**Fecha:** 22/10/2026 · **Alcance:** lectura estática del checkout actual y comprobaciones locales automatizadas. **Modo:** solo auditoría; no se modificó código funcional, configuración, base de datos ni variables de entorno.

## Resumen ejecutivo

PetCare es una aplicación React Native/Expo con salida web y un backend Node.js/Express conectado a MySQL/MariaDB. La arquitectura separa rutas, controladores, servicios, repositorios, validadores y middleware. La autenticación tradicional, verificación de correo, recuperación de contraseña, OAuth Google/Facebook/X, access/refresh tokens, permisos efectivos y varios flujos de tienda están implementados en el código. Las conclusiones de funcionamiento externo no se deducen de la existencia de código.

**Estado general: CUMPLE PARCIALMENTE.** Hay una base estructural consistente y 40 comprobaciones unitarias locales pasaron (12 mobile, 28 backend), pero no se verificaron proveedor OAuth, correo SMTP, push Android, UI en dispositivos, build APK ni acceso actual a la base. No aparece MFA/2FA. El esquema fuente completo y sus migraciones base no están en este checkout; hay SQL de extensiones y una captura de metadatos Layerbase fechada 21/10/2026. Por ello no se certifica el estado actual remoto ni los grants efectivos por rol.

## Hallazgos prioritarios

| Prioridad | Hallazgo | Estado / evidencia |
|---|---|---|
| ALTO | No se encontró autenticación multifactor (TOTP/OTP como segundo factor). Verificación de email y recuperación de contraseña no equivalen a MFA. | Confirmado en flujos y rutas revisados; véase [autenticación](AUDITORIA_AUTENTICACION.md). |
| ALTO | No se pudo verificar configuración ni login real con Google, Facebook o X. Google está presente en el flujo, pero los secretos/redirects externos no son comprobables en el repositorio. | Implementación estática; estado externo NO VERIFICABLE. |
| ALTO | No se pudo conectar a Layerbase desde esta auditoría. La captura de metadatos completa del 21/10 indica MariaDB 11.8.9, 46 tablas, 342 columnas y 4 historiales; no incluye permisos ni datos de usuarios. | Snapshot de [layerbase-sql-audit.json](../../backend/layerbase-sql-audit.json), no conexión en vivo hoy. |
| ALTO | Los runners buscan archivos en `backend/migrations` y `backend/bootstrap`, directorios ausentes del checkout. No se puede afirmar que `db:migrate` o `db:bootstrap` funcionen en este estado. | `backend/src/database/{migration-files,bootstrap}.ts` y el inventario de archivos. |
| MEDIO | El conjunto de códigos de rol también está cerrado en tipos y rutas (`RoleCode`); el panel administra grants y excepciones, pero no se confirma creación dinámica de roles nuevos. | `backend/src/types/auth.ts`, `admin.routes.ts`; véase [roles y permisos](AUDITORIA_ROLES_PERMISOS.md). |
| MEDIO | La API está documentada en README, pero no se halló OpenAPI/Swagger ni un contrato central exhaustivo que pruebe equivalencia entre todos los endpoints y la documentación. | Lectura de `backend/README.md`; véase [API](AUDITORIA_BACKEND_API.md). |
| MEDIO | Existen SQL de extensiones del cliente 008–013 que no aparecen como aplicados en el snapshot. La propia documentación declara 013 preparada pero no aplicada y advierte que falta la secuencia histórica necesaria para el migrador estándar. | Informe de base de datos y `backend/README.md`; debe verificarse con el operador de DB antes de una corrección. |
| BAJO | Hay deriva documental: el README raíz aún refiere Expo SDK 57 mientras `mobile/package.json` fija Expo SDK 58. | README raíz vs manifiesto vigente. |

## Cobertura y verificación

- **Estructura:** `mobile/src/app` usa Expo Router; UI común en `mobile/src/components`; estado en cuatro contexts; API Express con `routes/controllers/services/repositories/middlewares/validators`.
- **Dependencias identificadas:** Expo 58, React Native 0.88, React Native Web, TypeScript, Express 5, mysql2, MariaDB/MySQL, bcrypt, jsonwebtoken, nodemailer, Helmet y CORS.
- **Pruebas locales:** `mobile`: typecheck, lint y tests, 12/12; `backend`: typecheck, lint y tests, 28/28. Ejecutadas desde los paquetes locales, sin pruebas DB.
- **No ejecutado:** build/export Android, Expo Doctor, `npm run test:db`, `db:check`, consultas remotas, aplicación de migraciones, pruebas visuales/táctiles, OAuth con proveedores, SMTP, FCM/push real o Vercel.
- **Estado del árbol:** el checkout ya tenía modificaciones sin commit y archivos nuevos antes de esta auditoría; se preservaron. Los informes son los únicos archivos agregados por esta etapa.

## Resultado por requisito

Resumen de cumplimiento agrupado (el detalle evaluable está en [matriz](MATRIZ_CUMPLIMIENTO_REQUISITOS.md)): autenticación tradicional CUMPLE PARCIALMENTE; OAuth en código CUMPLE PARCIALMENTE / configuración NO VERIFICABLE; MFA NO IMPLEMENTADO; 3+ experiencias de rol CUMPLE; permisos backend CUMPLE PARCIALMENTE por falta de snapshot de grants; arquitectura compartida CUMPLE PARCIALMENTE; persistencia y refresh CUMPLE PARCIALMENTE; REST/errores CUMPLE PARCIALMENTE; base/esquema NO VERIFICABLE para estado actual remoto; UI responsive NO VERIFICABLE visualmente; API documental CUMPLE PARCIALMENTE; APK NO VERIFICABLE.

## Informes

- [Roles y permisos](AUDITORIA_ROLES_PERMISOS.md)
- [Componentes compartidos](AUDITORIA_COMPONENTES_COMPARTIDOS.md)
- [Autenticación](AUDITORIA_AUTENTICACION.md)
- [Frontend y UX](AUDITORIA_FRONTEND_UX.md)
- [Backend y API](AUDITORIA_BACKEND_API.md)
- [Base de datos](AUDITORIA_BASE_DATOS.md)
- [Matriz de requisitos](MATRIZ_CUMPLIMIENTO_REQUISITOS.md)
- [Plan de mejoras](PLAN_MEJORAS_PETCARE.md)

## Restricciones observadas

No se cambió el producto ni el esquema, no se leyó ni imprimió ningún archivo `.env`, no se consultaron filas reales de negocio, no se hicieron compras ni se enviaron mensajes, y no se ejecutaron migraciones, builds APK, commit, push o despliegue.
