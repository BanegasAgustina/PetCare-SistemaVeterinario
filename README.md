# PetCare

Experiencia CLIENT implementada con cinco pestañas, mascotas, turnos, clínica, tienda/carrito/pedidos, notificaciones y perfil. Ver [implementación, endpoints, rutas y pruebas](IMPLEMENTACION_CLIENTE.md).

Aplicación móvil para la gestión integral de una veterinaria. Busca conectar clientes, veterinarios y administradores mediante una experiencia accesible, con prioridad en celulares Android.

## Estado: autenticación, experiencia Cliente y gestión de veterinarios

Resultados y límites de verificación en [INFORME_FASE_3.md](INFORME_FASE_3.md).

Implementado: Login con logo original, temas claro/oscuro con Context API, Expo Router desde mobile/src/app, API REST con health, pool MySQL 8, comprobación de conexión, cuatro migraciones SQL y seeds mínimos idempotentes. Se conservaron la interfaz de autenticación y el contrato health.

Autenticación tradicional implementada: registro, login, perfil protegido, bcrypt, JWT Access Token y sesión nativa con SecureStore. El registro asigna CLIENT desde backend; no acepta roles enviados por la app. Super Admin puede gestionar veterinarios, especialidades, permisos e invitaciones. Existe un único panel veterinario dinámico. La clínica completa, turnos, tienda, OAuth y refresh tokens todavía están pendientes.

## AUTORIZACIÓN Y PERMISOS

RBAC con permisos base de `role_permissions` y excepciones de `user_permissions`: sin excepción se hereda, `allowed=1` concede y `allowed=0` deniega incluso un permiso base. Los códigos, etiquetas, especialidades y accesos efectivos vienen de MySQL/API; React Native no mantiene catálogos ni listas por email/ID. Los códigos de rol usados para seleccionar layouts son contratos de la API, no asignaciones de usuarios.

Super Admin → Gestión → Veterinarios permite buscar, filtrar, paginar, crear y editar una cuenta real. El backend fija `VETERINARIAN`, crea su perfil y relaciona sus especialidades en una transacción. Los permisos se muestran por módulo, distinguiendo herencia y excepciones; los administrativos críticos están bloqueados. No hay rutas públicas para cambiar el rol o autopromoverse.

La invitación SMTP contiene un token aleatorio de un solo uso, guardado como hash, que vence en 24 horas. El profesional abre `/activate-vet`, configura su propia contraseña y verifica su correo mediante la posesión del enlace. El administrador no recibe tokens ni contraseñas. Registro/Login conservan `VerificationCodeModal` para la verificación por código; la invitación es un flujo de credenciales independiente. El envío requiere SMTP y `VETERINARIAN_INVITATION_URL`; si SMTP falla después de crear la cuenta, esta se conserva y se informa para reenviar. También se puede iniciar un restablecimiento por el mismo mecanismo.

Login común devuelve rol, nombre del rol, permisos y perfil; `/auth/me` los vuelve a consultar. Mobile elige `/account`, `/vet` o `/admin`; la home y los módulos veterinarios se generan con el catálogo recibido. `opens_module` distingue acceso al módulo de acciones internas: negar los permisos de visualización oculta y bloquea el módulo aunque conserve una acción. Esto es UX; cada solicitud protegida revalida usuario activo, versión de sesión, rol y permisos desde MySQL. Las rutas administrativas exigen además `SUPER_ADMIN`; sin permiso responden 403. `requirePatientScope` está preparado para comprobar asignaciones reales antes de futuras operaciones clínicas.

Desactivar cambia `users.is_active` y revoca sesiones e invitaciones. No hay DELETE HTTP de profesionales; perfil, especialidades y asignaciones se preservan con FKs restrictivas. Las futuras tablas clínicas deberán referenciar el mismo `veterinarians.id` con `ON DELETE RESTRICT`, conservando la autoría histórica. Cambiar correo exige una nueva invitación y revoca credenciales anteriores. Cambiar permisos se refleja inmediatamente en las siguientes solicitudes del backend y en la UI al consultar `/auth/me`, regresar al panel, reabrir la app o refrescar.

Para instalar, configurar `backend/.env`, ejecutar `npm run db:migrate` y `npm run db:seed`. El operador de confianza puede preparar su primera cuenta Super Admin con `npm run admin:promote -- <ID_REAL>` después de crear y verificar una cuenta real; este comando solo existe en consola, no contiene cuentas predeterminadas y revoca la sesión anterior. No promover ADMIN automáticamente.

Contrato completo, normalización, PK/FK/UNIQUE/índices y ejemplos de cuerpos: [backend/README.md](backend/README.md). Implementación, archivos, pruebas y pendientes de esta etapa: [INFORME_GESTION_VETERINARIOS.md](INFORME_GESTION_VETERINARIOS.md).

Regla del proyecto: roles, permisos, especialidades, servicios, usuarios y veterinarios, cuando son datos del sistema, provienen de MySQL/API. Nuevos catálogos se cargan con migraciones/seeds versionados o gestión autorizada, nunca duplicándolos en React Native. Los valores de referencia de la migración son catálogo inicial de MySQL; no son permisos por veterinario.

## Tecnologías y estructura

React Native, Expo SDK 57, TypeScript, Expo Router y Context API en mobile. Node.js, Express 5, TypeScript, dotenv y mysql2 en backend. Base prevista: MySQL 8 relacional.

```text
PetCare-SistemaVeterinario/
├── mobile/
│   └── src/
│       ├── app/                 # Rutas y layout
│       ├── components/ui/       # Texto, botón, avisos y loading
│       ├── components/forms/    # Formularios e inputs reutilizados
│       ├── components/layout/   # Contenedor seguro y desplazable
│       ├── contexts/            # Tema y autenticación
│       ├── hooks/               # Tema, auth y acciones asíncronas
│       ├── services/            # HTTP, auth y almacenamiento
│       ├── types/               # Contratos públicos
│       ├── utils/               # Validación de formularios
│       ├── constants/           # Paleta centralizada
│       └── assets/              # Copias de recursos originales
├── backend/
│   ├── src/config/          # Entorno y pool MySQL
│   ├── src/database/        # Comandos y ejecutores de migraciones/seeds
│   ├── src/services/        # Conexión, autenticación y JWT
│   ├── src/repositories/    # Consultas de usuarios
│   ├── src/validators/      # Validación de autenticación
│   ├── src/controllers/     # Health y autenticación
│   ├── src/routes/          # Endpoints
│   ├── src/middlewares/     # Errores
│   ├── src/types/           # Contratos públicos
│   ├── src/utils/           # Errores DB seguros
│   ├── migrations/          # SQL versionado
│   ├── seeds/               # Catálogos reales, sin usuarios ficticios
│   └── tests/               # Pruebas HTTP, unitarias e integración MySQL
├── imagenes/                # Originales conservados
└── README.md
```

Mobile incorpora components/forms, services, types y utils; backend incorpora repositories y validators para autenticación. Todo el código y assets mobile están en src; configuración y documentación permanecen en mobile.

## Instalación y ejecución

Requiere Node.js >= 22.13 (recomendado Node 24 LTS), npm, Expo Go compatible con SDK 57 y MySQL 8.0.16+ o MySQL 8.4. El health original sigue funcionando sin conexión a la base.

Frontend, en una terminal:

```bash
cd mobile
npm install
npx expo start
```

Escanear el QR desde Expo Go Android, con teléfono y computadora en la misma red.

Backend, en otra terminal:

```bash
cd backend
npm install
```

Copiar backend/.env.example a backend/.env (PowerShell, dentro de backend: `Copy-Item .env.example .env`), completar las credenciales locales de un usuario MySQL con permisos sobre la base y preparar persistencia:

```bash
npm run db:create
npm run db:migrate
npm run db:seed
npm run db:check
```

Estos comandos no se ejecutan automáticamente al iniciar la API. Ver permisos y alternativa de creación desde Workbench en backend/README.md. Después ejecutar:

```bash
npm run dev
```

Más detalles en [mobile/README.md](mobile/README.md) y [backend/README.md](backend/README.md).

## Entorno, base de datos y API

Backend usa las variables DB_* y JWT_ACCESS_SECRET, JWT_ACCESS_TTL_SECONDS, JWT_ISSUER, JWT_AUDIENCE, BCRYPT_SALT_ROUNDS y CORS_ALLOWED_ORIGINS. Configurar una clave aleatoria local de al menos 32 bytes. Copiar mobile/.env.example a mobile/.env y completar EXPO_PUBLIC_API_URL con la URL de la API accesible desde el teléfono, terminada en /api. Reiniciar Expo tras cambiarla. Los ejemplos y el flujo completo están en los README específicos.

`GET http://localhost:3000/api/health`:

```json
{ "success": true, "data": { "status": "ok", "message": "PetCare API funcionando" } }
```

Health comprueba HTTP. `GET /api/health/database` comprueba conexión y versión MySQL; devuelve 200 con estado disponible o un error seguro (503 cuando no hay conexión), sin credenciales ni configuración.

Las tablas roles, users, species, breeds y pets forman el modelo inicial normalizado; schema_migrations registra versiones, checksum y estado de aplicación. El seed original carga tres roles y las especies DOG/CAT; la migración 004 agrega SUPER_ADMIN, perfiles, especialidades y permisos, sin usuarios ni registros clínicos ficticios. PK/FK, relaciones y explicación de 1FN/2FN/3FN están en backend/README.md. No se utiliza PostgreSQL, Supabase ni MongoDB.

## Seguridad y calidad

`.env` está excluido de Git; los ejemplos no contienen secretos. JSON está limitado a 100 KB, las consultas usan placeholders y los errores públicos omiten SQL, hashes y secretos. Bcrypt almacena solo hashes; el servidor determina el rol. Login y registro tienen límite independiente de intentos por IP. El Access Token vence por defecto en 15 minutos; después se requiere otro login. Los seeds no crean cuentas.

Backend: `npm run lint`, `npm run typecheck` (incluye tests), `npm test`, `npm run build`. La suite MySQL real usa `npm run test:db`, exclusivamente con NODE_ENV=test, host local y una base cuyo nombre termine en _test; ver backend/README.md.

Mobile: `npm run lint`, `npm run typecheck`, `npm test`, `npx expo install --check`, `npx expo-doctor`, `npx expo export --platform android`.

Auditoría inicial de fase 3: no estaban presentes migrations y tests del backend. Se restituyeron las dos migraciones del modelo y se incorporaron pruebas de regresión/autenticación. En la corrección posterior se agrega la migración 003 para verificación de email. Se conserva health y mobile/src.

Revisar con Expo Go celulares Android pequeños, medianos y grandes, ambos temas, texto ampliado, notch y barra inferior. Una compilación no sustituye la revisión visual en dispositivos.

Referencias: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) e [instalación de Expo Router](https://docs.expo.dev/router/installation/).

## Verificación de email y convención global de UX

PetCare no utiliza alerts nativos. Errores de input → inline; confirmaciones importantes y acciones destructivas → ConfirmModal; feedback breve → toast propio; verificación de email → VerificationCodeModal. AppModal comparte tema, Safe Area y estética. AGENTS.md establece esta regla y el lint mobile impide importar Alert o utilizar sus equivalentes del navegador.

Registro → usuario pendiente → envío SMTP → modal sobre Registro → código de seis dígitos → correo verificado → Continuar → Login. Verificar el email no inicia sesión ni emite JWT. Login de una cuenta pendiente responde EMAIL_NOT_VERIFIED y permite abrir el mismo modal desde «Verificar ahora».

Configurar EMAIL_CODE_SECRET (independiente de JWT) y SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_REQUIRE_TLS, SMTP_USER, SMTP_PASSWORD, MAIL_FROM en backend/.env. Sin configuración válida se rechaza el registro con error seguro. Si SMTP falla, la cuenta queda pendiente y el modal permite reenviar; no se simula entrega ni acceso.

Ejecutar `npm run db:migrate` desde backend para aplicar 003_email_verification.sql. Usuarios anteriores también deben verificar: no se inventan fechas de verificación. Esquema, preparación y endpoints están en backend/README.md. Informe de esta corrección: [INFORME_VERIFICACION_EMAIL.md](INFORME_VERIFICACION_EMAIL.md).

