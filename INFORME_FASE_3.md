# Informe de FASE 3 — PetCare

## Auditoría previa

Se revisaron configuración Expo/Router/TypeScript, arquitectura mobile/src, componentes/tema/logo, API Express, pool mysql2, esquema y ejecutores de migraciones/seeds. Faltaban backend/migrations y backend/tests: se restituyeron las dos migraciones del modelo existente y se añadieron pruebas ejecutables. Health conserva su respuesta original y readiness su contrato seguro. No fue necesario agregar tablas para autenticación.

## Implementación

- Registro: nombres/apellidos Unicode obligatorios sin números, email normalizado con unicidad SQL, teléfono opcional como texto y contraseña fuerte. Bcrypt con coste configurable 10–14 (12 predeterminado), límite explícito de 72 bytes y sin contraseña original almacenada.
- Backend: POST /api/auth/register, POST /api/auth/login y GET /api/auth/me protegido. Capas de validación, repositorio parametrizado, servicio, controller y middleware. Registro transaccional y rol CLIENT elegido exclusivamente en servidor.
- JWT: HS256, firma, issuer/audience, vencimiento y sujeto comprobados; usuario activo consultado en MySQL. Access Token de 15 minutos por defecto. Sin refresh ni OAuth.
- Respuestas: DTO explícito sin hash/secretos; errores seguros y Cache-Control: no-store. Login inválido, usuario inexistente e inactivo comparten error. Límite por IP independiente para login/registro y CORS explícito para web.
- Mobile: Login, Registro, AuthContext, services, loading/errores, confirmación local sin transmitirla, rutas protegidas y perfil mínimo para verificar /me/cerrar sesión. Logo original idéntico por hash, sin modificar imagenes.
- Sesión: token/vencimiento en SecureStore nativo; web solo memoria. Restauración con /me, reintento ante red fallida y cierre al vencer. Contraseñas no persistidas.
- Formularios: claro/oscuro, ancho adaptable limitado en pantallas grandes, inputs accesibles, mostrar/ocultar contraseña, foco al error, scroll, KeyboardAvoidingView y resize Android.
- README principal/mobile/backend actualizados con instalación, .env, preparación MySQL, autenticación, ejemplos y códigos públicos. Código importante comentado en español.

## Comprobaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| Backend lint, TypeScript y build | Correctos |
| Arranque npm run dev / MySQL detenido | Health 200 y readiness 503 seguro |
| Backend npm test | 5 pruebas aprobadas |
| MySQL 8.0.39 real, instancia temporal aislada | 13 casos aprobados; 14 tests contando contenedor |
| Mobile lint, TypeScript y npm test | Correctos; 3 pruebas aprobadas |
| Expo install --check | Dependencias compatibles |
| Expo Doctor | 21/21 comprobaciones aprobadas |
| Expo export | Bundles Android, iOS y web generados |
| Backend npm audit --omit=dev | 0 vulnerabilidades |
| Mobile npm audit | 13 avisos moderados transitivos de Expo, ya presentes |
| Logo / originales | Copia idéntica y originales sin cambios |

Casos MySQL: readiness seguro, registro válido y hash bcrypt, email repetido, email inválido, contraseña inválida, rechazo de rol enviado, registros concurrentes con email único, login válido, contraseña incorrecta/usuario inexistente, /me sin token, /me con token, configuración JWT ausente segura y token alterado/usuario desactivado. Migraciones y seeds se ejecutaron repetidamente sin duplicar catálogo.

Las pruebas adicionales verifican validaciones Unicode/UTF-8, firma/algoritmo/audiencia/expiración JWT, límite de intentos, regresión health/JSON/404 y payload frontend sin confirmación/rol. La instancia MySQL temporal se detuvo y eliminó; no se accedió a bases habituales ni se añadieron cuentas ficticias a seeds.

## Límites de la verificación y puesta en marcha

La herramienta de navegador falló al iniciar su proceso: no se pudo realizar inspección visual automatizada. No hubo dispositivo físico/emulador disponible para comprobar teclado, SecureStore y tamaños reales; los bundles y el análisis del layout no sustituyen esa revisión. No se declara esa prueba realizada.

Para usar el proyecto, completar backend/.env con MySQL y clave JWT aleatoria, preparar la base según backend/README.md y completar mobile/.env con EXPO_PUBLIC_API_URL accesible desde el dispositivo. Nunca agregar secretos a EXPO_PUBLIC_* ni a Git.

Logout es local; un JWT ya emitido sigue siendo válido hasta expirar salvo desactivación del usuario. El contador de intentos es en memoria por instancia. Los avisos de Expo no se corrigieron con npm audit fix --force porque propone versiones incompatibles.

No se implementó OAuth, recuperación de contraseña, gestión de mascotas, turnos, tienda ni ninguna función de FASE 4. No se realizaron commits ni push.
