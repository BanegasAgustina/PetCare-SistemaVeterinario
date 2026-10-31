# 2. Tecnologías y vocabulario

Las dependencias instaladas o declaradas no demuestran por sí solas que una función esté activa. Esta tabla separa presencia y uso comprobable.

| Tecnología / concepto | Qué significa y qué hace | Uso observado en PetCare | Cómo decirlo en la defensa |
|---|---|---|---|
| JavaScript (JS) | Lenguaje que ejecutan navegadores y Node.js | Runtime de la salida TS compilada | “Es el lenguaje que finalmente ejecuta la app.” |
| TypeScript (TS) | JavaScript con tipos comprobados antes de ejecutar | `.ts` y `.tsx` en móvil y backend | “Me ayuda a detectar inconsistencias de datos antes de correr.” |
| JSX / TSX | Sintaxis para describir interfaz dentro de JavaScript/TypeScript | Pantallas y componentes | “Es una forma declarativa de escribir qué interfaz renderiza React.” |
| React | Biblioteca de interfaz por componentes | Dependencia del móvil; hooks y estado | “La pantalla se divide en piezas que se actualizan cuando cambia su estado.” |
| React Native | Componentes multiplataforma que se adaptan a móvil y web mediante RN Web | `View`, `Text`, plataforma | “Comparto componentes y lógica para Android y navegador.” |
| Expo | Herramientas alrededor de React Native | SDK 58, módulos y comandos `expo` | “Simplifica desarrollo y configuración de builds nativos.” |
| Expo Router | Enrutador basado en archivos sobre navegación Expo | `mobile/src/app`, layouts y rutas protegidas | “Los archivos de `app` corresponden a destinos de navegación.” |
| Node.js | Entorno para ejecutar JS fuera del navegador | Servidor backend | “Permite ejecutar la API en el servidor.” |
| Express 5 | Framework HTTP de Node | `backend/src/app.ts` y routers | “Mapea solicitudes HTTP a middleware y controladores.” |
| API REST | Estilo de endpoints sobre recursos usando HTTP | La API tiene recursos `/auth`, `/client`, `/clinic` | “Es el contrato para que móvil y servidor intercambien operaciones.” |
| HTTP / HTTPS | Protocolo petición-respuesta; HTTPS lo protege con TLS | Cliente API y Vercel | “HTTPS cifra el tránsito entre app y servidor.” |
| JSON | Formato de datos texto con objetos/arrays | Cuerpos de solicitudes y respuestas | “Es el formato usado para enviar formularios y recibir datos.” |
| SQL | Lenguaje de consulta relacional | Consultas MySQL parametrizadas | “Consulta y modifica tablas relacionadas.” |
| MariaDB / MySQL | Motores relacionales | `mysql2/promise`, pool y SQL | “Almacena registros en tablas; el pool reutiliza conexiones.” |
| Layerbase | Proveedor de base descrito por documentación/config | `DB_*`, TLS requerido cuando corresponde | “Es el host de producción indicado; el código usa protocolo MySQL.” |
| JWT | JSON Web Token; token firmado con claims | `jsonwebtoken`, access token HS256 | “Prueba posesión de sesión; el servidor vuelve a comprobar el estado actual.” |
| bcrypt | Función de hashing de contraseñas con costo | `password.service.ts` y login | “Guarda un hash difícil de invertir, no la contraseña original.” |
| OAuth 2.0 | Protocolo de autorización delegada | Flujos server-side para Google, Facebook y X | “El proveedor acredita identidad y el backend intercambia códigos.” |
| SMTP | Simple Mail Transfer Protocol | Nodemailer en `mail.service.ts` | “Protocolo que entrega correo al servidor de correo configurado.” |
| Vercel | Plataforma de hosting/deploy declarada en configs | Dos `vercel.json`; backend y web por proyecto | “Publica build web y función/API del backend si el proyecto está asociado.” |
| EAS Build | Expo Application Services Build | Perfiles `mobile/eas.json` | “Compila binarios Android en la infraestructura de Expo.” |
| APK | Android Package Kit | Perfiles internos/buildType APK | “Es un paquete instalable de Android.” |
| Git | Control de versiones distribuido | `.git` presente | “Registra cambios como commits y ramas.” GitHub remoto no se verificó desde este checkout. |
| CORS | Cross-Origin Resource Sharing | `cors` y allowlist backend | “El navegador consulta al servidor si permite ese origen.” |
| Middleware | Función intermedia en cadena HTTP | auth, permisos, errores, CORS, Helmet | “Puede verificar o enriquecer una solicitud antes del controlador.” |
| Hook / estado / props | Hook conecta lógica de React; estado cambia con interacción; props son entradas | `useState`, `useEffect`, componentes | “El estado determina qué datos ve la pantalla; props configuran componentes.” |
| Context | Estado/acciones compartidas en un subárbol de interfaz | Auth, tema, feedback, checkout | “Evita pasar sesión y acciones manualmente por muchas pantallas.” |
| REST endpoint | Dirección + método HTTP para una operación | `POST /api/client/appointments` | “Es el punto de entrada de una acción concreta.” |
| EAS / Expo Go | Herramientas/app contenedora de Expo | `expo-dev-client`, scheme `petcare` | OAuth con callback propio exige development build, no solo Expo Go. |
| Cloudinary / S3 | Almacenamiento/servicios de objetos | Dependencias y servicio de carga condicional | Hay soporte configurado; el proveedor activo depende de variables de entorno remotas. |

## HTTP, verbos y códigos

`GET` suele leer; `POST` crea o consulta con filtros complejos en el body; `PUT` reemplaza/guarda; `PATCH` modifica parcialmente; `DELETE` elimina o desactiva. En PetCare se migraron muchas lecturas privadas a `POST` para enviar filtros JSON. Códigos típicos: `200` operación correcta, `201` creación, `400` datos inválidos, `401` falta sesión válida, `403` rol/permisos insuficientes, `404` recurso no hallado, `409` conflicto de estado y `5xx` fallo del servidor/servicio.

## Desarrollo web y móvil

React Native comparte componentes y lógica; `Platform` y archivos como `*.web.tsx` permiten adaptar diferencias. Responsive significa que la distribución se ajusta a ancho/entorno, no que cada pantalla sea idéntica. El proyecto usa estilos y componentes propios además de `react-native-web`.

### Preguntas de defensa

- **Básica — ¿Qué aporta TypeScript?** Tipos explícitos y chequeo estático. **Ejemplo:** el tipo de rol solo admite cinco códigos. **Corta:** “Reduce errores de forma de datos antes de ejecución.” **Repregunta:** ¿Evita todos los errores?
- **Intermedia — ¿Qué hacen Express y middleware?** Express recibe HTTP; middleware aplica reglas antes del controlador. **Ejemplo:** authenticate antes de permisos de `/api/clinic`. **Corta:** “La solicitud atraviesa una cadena de verificaciones.” **Repregunta:** ¿En qué orden?
- **Avanzada — ¿JWT es una sesión guardada en el navegador?** No: token firmado, con vigencia; PetCare además persiste refresh/sesión y revalida versión/estado. **Corta:** “El access token acredita la sesión, el servidor consulta autorización actual.” **Repregunta:** ¿Qué revoca sesiones antes del vencimiento?
