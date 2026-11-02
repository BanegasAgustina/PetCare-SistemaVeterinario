# Inventario y orden de documentación de PetCare

## Alcance del inventario

El repositorio está dividido en dos aplicaciones principales y documentación de proyecto:

| Zona | Contenido observado | Papel dentro del sistema |
|---|---|---|
| `mobile/` | Aplicación Expo, React Native, TypeScript y Expo Router; pantallas, componentes, contextos, hooks, servicios, utilidades y configuración web/Android. | Interfaz para clientes y personal de la clínica, ejecutable como web y Android. |
| `backend/` | API Express en TypeScript, configuración, rutas, controladores, servicios, repositorios, validadores, middleware y herramientas de base de datos. | Reglas de servidor, autorización, integración con servicios externos y persistencia SQL. |
| Raíz | `README.md`, `.gitignore` y directorios de las dos aplicaciones. | Orientación inicial del proyecto y límites del repositorio. |
| `docs/` | Se crea en este trabajo para las guías académicas. | Material de arquitectura, estudio y defensa, separado del código ejecutable. |

En el inventario inicial, `rg --files` encontró 397 archivos fuera de dependencias, carpetas generadas y `.git`; 369 tienen extensión de código JavaScript/TypeScript. Es un conteo de archivos visibles para esa herramienta, no una declaración de que cada uno deba comentarse. Los archivos `package-lock.json` forman parte del conteo de configuración, aunque no se documentarán línea por línea.

## Mapa inicial por módulo

### Frontend (`mobile/src`)

| Carpeta | Archivos observados | Qué agrupa |
|---|---:|---|
| `app/` | 88 | Rutas Expo Router, layouts y pantallas por rol/función. |
| `components/` | 81 | Piezas visuales compartidas y pantallas compuestas para administración, clínica, cliente, formularios, navegación y UI. |
| `utils/` | 30 | Reglas auxiliares, validación y decisiones de presentación/acceso del cliente. |
| `services/` | 13 | Acceso HTTP, autenticación/sesión, OAuth, clínicas, clientes y notificaciones. |
| `hooks/` | 10 | Lógica reutilizable conectada al ciclo de vida de React y a servicios/contextos. |
| `contexts/` | 4 | Estado compartido de autenticación, tema, feedback y checkout. |
| `types/` | 5 | Tipos TypeScript del dominio que usa el frontend. |
| `constants/` | 3 | Valores compartidos de presentación y diseño adaptable. |
| `assets/` | 7 | Imágenes usadas por la interfaz. Se describirán por su uso, no como código fuente. |

Configuración móvil relevante fuera de `src/`: `package.json`, `app.json`, `eas.json`, `vercel.json`, `tsconfig.json`, `eslint.config.js` y `.env.example`. Los valores de archivos `.env` locales quedan fuera de la documentación.

### Backend (`backend/src`)

| Carpeta/archivo | Archivos observados | Qué agrupa |
|---|---:|---|
| `database/` | 35 | Herramientas de conexión/migración/auditoría y utilidades de preparación de datos. Requiere distinguir scripts de lectura de los mutantes. |
| `utils/` | 21 | Reglas auxiliares compartidas por el servidor. |
| `services/` | 20 | Casos de uso, coordinación de reglas de negocio e integraciones. |
| `repositories/` | 18 | Consultas y operaciones de persistencia por dominio. |
| `routes/` | 10 | Mapa de endpoints y composición de routers. |
| `validators/` | 6 | Validación de entradas en endpoints. |
| `config/` | 5 | Configuración de entorno, conexión, correo y OAuth. |
| `middlewares/` | 5 | Capas transversales de autenticación, autorización, límites y errores. |
| `types/` | 4 | Contratos TypeScript del backend. |
| `controllers/` | 7 | Adaptación entre solicitudes HTTP, servicios y respuestas. |
| `app.ts`, `server.ts` | 2 | Construcción de Express y arranque HTTP local. |

Configuración backend relevante: `package.json`, `tsconfig.json`, `tsconfig.check.json`, `eslint.config.mjs`, `vercel.json`, `eas.json` y `.env.example`. Hay informes JSON de auditoría y un seed JSON; se describirán por su propósito y fecha/contexto disponible, sin tratarlos como prueba del estado actual de producción.

## Orden propuesto de documentación

El orden va de los conceptos necesarios para orientarse a los recorridos funcionales y operaciones de despliegue:

1. **Estructura del repositorio y arranque**: raíz, paquetes, ruta raíz de Expo, layout y creación de Express. Es el módulo trabajado en esta primera entrega.
2. **Navegación y áreas por rol**: grupos de rutas, layouts de cliente/profesional/veterinario/admin y guardas.
3. **Componentes y diseño de pantallas**: UI común, formularios, componentes de dominio y estados de pantalla.
4. **Estado del frontend**: contextos, hooks, sesión y estado de checkout/feedback/tema.
5. **Validaciones y utilidades del frontend**: límites entre presentación, validación local y control de acceso a rutas.
6. **Servicios y transporte HTTP**: resolución de URL, llamadas API, sesión y errores de red.
7. **Mapa de rutas y contratos HTTP**: montaje, autenticación, validación, controladores y códigos de respuesta.
8. **Servicios y reglas del backend**: casos de uso por dominio y dependencias entre servicios.
9. **Repositorios y persistencia**: consultas SQL, pool, tablas inferibles desde consultas y límites de lo que los archivos acreditan.
10. **Identidad, roles y permisos**: registro, login, tokens, middleware, permisos efectivos y ownership.
11. **Procesos de negocio completos**: mascotas, turnos, fichas, profesionales, tienda/pedidos, administración y notificaciones, solo cuando estén implementados.
12. **Integraciones y operaciones**: OAuth, correo, almacenamiento de imágenes, Vercel, EAS/APK, variables de entorno y herramientas SQL.

## Avance de documentación

La primera etapa cubrió el camino inicial de ejecución:

```text
Expo Router → mobile/src/app/_layout.tsx → mobile/src/app/index.tsx
                                   ↘ proveedores, guardas y rutas

Vercel/backend importa app.ts ─┐
                               ├→ Express app → /api → routes/index.ts
server.ts → app.listen(...) ───┘
```

La guía de arquitectura explica este recorrido. En la continuación se añadieron cabeceras estructuradas en los 369 archivos de código fuente elegibles. La tabla de cobertura distingue esas cabeceras del trabajo de explicación funcional: los archivos con funciones permanecen parciales o pendientes hasta revisar sus parámetros, resultados, conexiones y errores.

Las guías de arquitectura, archivos, defensa oral y plan de estudio ya están creadas. La documentación profunda de autenticación, alta de mascota y solicitud de turnos sirve como primer conjunto de recorridos reales. La cobertura restante continúa en el orden propuesto y se registra en `docs/COBERTURA_DOCUMENTACION_PETCARE.md`.

## Exclusiones del análisis/documentación

- `node_modules/`, `mobile/.expo/`, `backend/dist/`, builds, caches y `.git/`: dependencias instaladas o artefactos generados.
- Binarios e imágenes: no admiten comentarios de código; cuando aporten a una función, se describirán desde su referencia en la interfaz.
- Secretos y archivos `.env` locales: no se leerán ni reproducirán; solo se explicarán nombres y finalidad a partir de plantillas seguras o código.
- Lockfiles: necesarios para reproducibilidad, pero su contenido generado no se comentará archivo por archivo.
- `.patch` y reportes de auditoría: se revisarán en su módulo si afectan una explicación; no son entradas de ejecución normales de la aplicación.

## Estado inicial del árbol de trabajo

Antes de editar este módulo, Git ya mostraba cambios locales: `backend/eas.json` agregado, `mobile/app.json` modificado y eliminaciones bajo `guia-estudio-petcare/`. No se restauraron, borraron ni modificaron como parte de esta documentación.


### Registro de avance continuo

La documentación funcional de `backend/src/services/` se completó para los 20 archivos del directorio. El lote cubrió perfil/cuenta, autenticación y sesiones, OAuth, invitaciones, códigos, recuperación, consultas de compatibilidad DB, notificaciones y carga/presentación de imágenes. La cobertura se refleja por ruta en `docs/COBERTURA_DOCUMENTACION_PETCARE.md`. El siguiente lote del orden es `backend/src/repositories/`, donde se documentarán consultas, transacciones, tablas y límites de ownership observables en SQL.


El siguiente lote del recorrido previsto se concentra en `backend/src/database/`: bootstrap, migraciones, seeds, auditorías y CLI. Se revisará con especial cuidado para distinguir operaciones de solo lectura de cambios de esquema/datos y dejar claro qué comandos ejecutan cada flujo.


Las 35 fuentes elegibles de `backend/src/database/` ya tienen documentación funcional. El siguiente grupo pendiente de backend se seleccionará mediante la tabla de cobertura; luego quedan principalmente pantallas/rutas de `mobile/src/app/` y componentes complejos, más scripts/configuración que no hayan completado revisión funcional. Se mantiene la revisión del inventario real en lugar de asumir un límite por carpeta.


Se completó el grupo de rutas raíz/autenticación de Expo y el layout global; cobertura y validaciones se registran por archivo. Continúa la revisión de pantallas por rol dentro de `mobile/src/app/admin/`, `client/`, `professional/` y `vet/`.


Nueve rutas administrativas livianas que reexportan componentes compartidos quedaron revisadas funcionalmente. Cobertura a este avance: 299/369 (81.03 %); quedan 70 archivos pendientes según tabla.


También quedaron documentadas 14 rutas alias de los espacios profesional y veterinario. Cobertura: 313/369 (84.82 %), con 56 pendientes.


Se completaron ocho layouts/hubs de rutas administrativas y profesionales. Cobertura actual: 321/369 (86.99 %), 48 pendientes.


Se documentaron seis archivos de navegación/cliente y lint móvil. Cobertura: 327/369 (88.62 %); pendientes: 42.


Se completaron tres rutas del perfil cliente. Cobertura: 330/369 (89.43 %); faltan 39.


Se documentaron seis rutas del checkout de tienda y se validaron con ESLint. Cobertura: 336/369 (91.06 %), 33 pendientes.


Se documentaron cuatro rutas de mascotas y se verificó el lote con ESLint. Cobertura: 340/369 (92.14 %), pendientes: 29.
