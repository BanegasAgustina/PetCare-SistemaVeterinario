# 13. Simulacro de defensa: 50 preguntas

Respondé primero sin mirar. Después abrí la ruta indicada y confirmá tu explicación. Las respuestas cortas son modelos, no frases para memorizar.

1. **¿Qué es PetCare?** Aplicación de coordinación veterinaria web/Android conectada a API y DB. **Ejemplo:** turnos y mascotas. **Corta:** “Conecta clientes, clínica y personal en un sistema.” **Repregunta:** ¿Qué problema resuelve?
2. **¿Cuáles son los roles vigentes?** CLIENT, VETERINARIAN, GROOMER, ADMIN, SUPER_ADMIN. **Ejemplo:** groomer usa agenda y servicios según permisos. **Corta:** “Hay cinco roles reconocidos.” **Repregunta:** ¿Existe SECRETARY?
3. **¿Qué es frontend?** Interfaz del navegador/celular. **Ejemplo:** `mobile/src/app/client`. **Corta:** “Es la parte con la que interactúa la persona.” **Repregunta:** ¿Hace la autorización final?
4. **¿Qué es backend?** Servidor con API, reglas y acceso a DB. **Ejemplo:** `backend/src/app.ts`. **Corta:** “Recibe operaciones y decide si son válidas.” **Repregunta:** ¿Qué es Express?
5. **¿Cómo se comunican?** HTTP/HTTPS y JSON; Bearer para sesión. **Ejemplo:** POST crear turno. **Corta:** “Móvil solicita y API responde datos o error.” **Repregunta:** ¿Dónde se fija URL?
6. **¿Qué es React?** Biblioteca por componentes. **Ejemplo:** `PetEditor`. **Corta:** “Compone interfaz que reacciona a estado.” **Repregunta:** ¿Qué es props?
7. **¿Qué aporta Expo Router?** Rutas desde archivos. **Ejemplo:** `client/pets/new.tsx`. **Corta:** “Cada ruta representa un destino.” **Repregunta:** ¿Qué hace `_layout`?
8. **¿Qué es estado?** Dato que cambia y causa render actualizado. **Ejemplo:** loading/lista. **Corta:** “Es la memoria dinámica de una pantalla.” **Repregunta:** ¿Cómo comparte sesión?
9. **¿Qué es hook?** Función React para estado/efectos o lógica reutilizable. **Ejemplo:** `useAuth`. **Corta:** “Empaqueta comportamiento de componentes.” **Repregunta:** ¿Qué hace useEffect?
10. **¿Qué es TypeScript?** JavaScript con chequeo de tipos. **Ejemplo:** `RoleCode`. **Corta:** “Detecta inconsistencias en desarrollo.” **Repregunta:** ¿Reemplaza validación backend?
11. **¿Qué hace `apiRequest`?** Construye URL/cuerpo, hace fetch con timeout, parsea respuesta. **Ejemplo:** `client.service`. **Corta:** “Es el cliente HTTP común.” **Repregunta:** ¿Cómo representa fallo?
12. **¿Qué es API?** Contrato de comunicación entre programas. **Ejemplo:** `/api/auth/login`. **Corta:** “Define rutas, métodos, entradas y respuestas.” **Repregunta:** ¿Qué es endpoint?
13. **¿Qué es REST?** Organización de operaciones HTTP alrededor de recursos. **Ejemplo:** `/pets`. **Corta:** “Un estilo para exponer recursos por HTTP.” **Repregunta:** ¿Por qué hay POST para leer?
14. **¿Qué hace middleware?** Verificación/transformación en cadena antes o después de handler. **Ejemplo:** authenticate. **Corta:** “Control previo compartido.” **Repregunta:** ¿Qué pasa con error?
15. **¿Qué hace controlador?** Conecta HTTP con lógica de dominio. **Ejemplo:** `login`. **Corta:** “Recibe petición y traduce resultado a HTTP.” **Repregunta:** ¿Qué hace service?
16. **¿Qué es repositorio?** Módulo que consulta persistencia. **Ejemplo:** `user.repository`. **Corta:** “Encapsula SQL de una entidad/área.” **Repregunta:** ¿Qué previene placeholder?
17. **¿Qué es SQL?** Lenguaje para consultar/modificar tablas. **Ejemplo:** SELECT turno. **Corta:** “Es el idioma de la base relacional.” **Repregunta:** ¿Qué es JOIN?
18. **¿Qué es clave primaria?** Identificador único de fila. **Ejemplo:** `users.id`. **Corta:** “Distingue un registro.” **Repregunta:** ¿Y clave foránea?
19. **¿Qué es FK?** Columna que referencia otra tabla. **Ejemplo:** `appointments.pet_id`. **Corta:** “Conecta registros y protege relación.” **Repregunta:** ¿Qué es integridad?
20. **¿Qué es JOIN?** Une filas según columnas relacionadas. **Ejemplo:** turno con mascota/slot. **Corta:** “Permite leer datos enlazados.” **Repregunta:** ¿Qué pasa si no hay coincidencia?
21. **¿Qué significa CRUD?** Crear, leer, actualizar, borrar. **Ejemplo:** editar perfil. **Corta:** “Las cuatro operaciones usuales de datos.” **Repregunta:** ¿Borrado puede ser lógico?
22. **¿Qué es transacción?** Grupo de cambios atómicos. **Ejemplo:** aceptar invitación. **Corta:** “Todo se confirma o revierte.” **Repregunta:** ¿Qué es rollback?
23. **¿Qué es migración?** Cambio versionado de esquema. **Ejemplo:** agregar columna perfil foto. **Corta:** “Actualiza estructura de DB paso a paso.” **Repregunta:** ¿La ejecutaste aquí?
24. **¿Qué es JWT?** Token firmado con identidad/claims y expiración. **Ejemplo:** access Bearer. **Corta:** “Una credencial firmada que el backend verifica.” **Repregunta:** ¿Dónde están permisos actuales?
25. **¿Qué es bcrypt?** Hashing de password con costo y salt. **Ejemplo:** `hashPassword`. **Corta:** “Guarda una huella, no password reversible.” **Repregunta:** ¿Por qué no SHA-256 simple?
26. **¿Diferencia authn/authz?** Probar identidad vs decidir acciones. **Ejemplo:** login y permiso `pets.update`. **Corta:** “Quién sos y qué podés hacer.” **Repregunta:** ¿Qué middleware las aplica?
27. **¿JWT hace todo el control de sesión?** No; servidor consulta cuenta/version/familia y grants. **Ejemplo:** `authenticate`. **Corta:** “La firma no sustituye revalidación.” **Repregunta:** ¿Cómo revocás?
28. **¿Por qué rate-limit?** Limita repetición/abuso. **Ejemplo:** login/envío de códigos. **Corta:** “Reduce fuerza bruta y spam.” **Repregunta:** ¿Tiene límite OTP?
29. **¿Por qué ocultar errores SQL?** No filtrar arquitectura/datos sensibles. **Ejemplo:** error middleware. **Corta:** “Cliente recibe explicación segura, detalle queda interno.” **Repregunta:** ¿Qué es PII?
30. **¿Qué hace SMTP?** Entrega mensajes a servidor de correo. **Ejemplo:** código verificación. **Corta:** “Transporta email.” **Repregunta:** ¿Confirma inbox?
31. **¿Qué es TLS?** Cifrado de conexión en tránsito. **Ejemplo:** DB remota/SMTP seguro. **Corta:** “Protege comunicación entre extremos.” **Repregunta:** ¿TLS es lo mismo que token?
32. **¿Cómo se verifica email?** Código 6 dígitos, hash HMAC, caducidad y límites. **Ejemplo:** `/verify-email`. **Corta:** “El código prueba acceso al correo por tiempo limitado.” **Repregunta:** ¿Qué pasa al fallar SMTP?
33. **¿Cómo funciona invitación?** Token aleatorio con hash y vencimiento; un uso activa cuenta. **Ejemplo:** veterinario. **Corta:** “La persona recibe link y define su contraseña.” **Repregunta:** ¿Qué invalida al reenviar?
34. **¿Qué es OAuth?** Flujo para delegar identidad/autorización a proveedor. **Ejemplo:** Google server-side. **Corta:** “El backend verifica al proveedor y emite sesión PetCare.” **Repregunta:** ¿Dónde están secretos?
35. **¿Dónde se guarda token móvil?** SecureStore nativo; sessionStorage web. **Corta:** “El mecanismo depende de plataforma.” **Repregunta:** ¿Qué hace logout?
36. **¿Qué roles tiene veterinario?** Veterinario trata; Groomer peluquería; grants concretos varían. **Corta:** “Rol y permisos juntos definen alcance.” **Repregunta:** ¿Puede groomer crear ficha médica?
37. **¿Qué es ownership?** Confirmar que el dato pertenece al usuario. **Ejemplo:** mascota de cliente. **Corta:** “El servidor filtra por usuario autenticado.” **Repregunta:** ¿Qué evita IDOR?
38. **¿Qué es baja lógica?** Marcar inactivo sin borrar fila. **Ejemplo:** cuenta admin. **Corta:** “Revoca acceso y conserva historial.” **Repregunta:** ¿Qué versión aumenta?
39. **¿Qué es migración vs seed?** Migración cambia esquema; seed carga datos iniciales. **Ejemplo:** catálogo de referencia. **Corta:** “Una cambia estructura; otra inicializa contenido.” **Repregunta:** ¿Son siempre inocuos?
40. **¿Qué diferencia notificación/email/push?** DB inbox, email SMTP, push SO. **Ejemplo:** recordatorio inbox y cola correo. **Corta:** “Son tres canales; push no está activo.” **Repregunta:** ¿Cómo lee?
41. **¿Qué hace cron?** Ejecuta tarea repetida por scheduler. **Ejemplo:** recordatorios. **Corta:** “Busca trabajo vencido y lo procesa.” **Repregunta:** ¿Qué programa el cron del repo?
42. **¿Cómo evita recordatorio duplicado?** event key determinista y bloqueo. **Corta:** “Cada turno y ventana tiene clave única.” **Repregunta:** ¿Qué es idempotencia?
43. **¿Cómo reintenta correo?** Cola y backoff creciente; máximo ocho. **Corta:** “Fallo se reprograma hasta límite.” **Repregunta:** ¿Cuánto espera máximo?
44. **¿Cómo evita doble reserva?** Revalidación/locks/transacción al crear turno. **Corta:** “El servidor confirma disponibilidad al escribir.” **Repregunta:** ¿Por qué no confiar en slots listados antes?
45. **¿Tarjeta cobra dinero?** No; demo apagada por defecto. **Corta:** “No hay cobro real integrado.” **Repregunta:** ¿Qué requiere transferencia?
46. **¿Comprobante significa pago confirmado?** No; admin principal revisa. **Corta:** “Es evidencia a revisar, no confirmación automática.” **Repregunta:** ¿Quién decide?
47. **¿Qué es Vercel?** Hosting/build web y funciones. **Corta:** “Publica aplicación/API si proyecto está configurado.” **Repregunta:** ¿Este JSON prueba despliegue?
48. **¿Qué hace EAS?** Servicio build de Expo. **Ejemplo:** perfil APK interno. **Corta:** “Compila binario instalable.” **Repregunta:** ¿Cambio de scheme requiere rebuild?
49. **¿Qué es variable de entorno?** Configuración entregada al proceso. **Ejemplo:** SMTP/JWT backend. **Corta:** “Permite separar secretos por entorno.” **Repregunta:** ¿`EXPO_PUBLIC_*` es privado?
50. **¿Qué parte necesitás verificar antes de afirmar producción?** Estado remoto de DB, proveedores, cron y deploy. **Ejemplo:** `backend/vercel.json` no define programación cron. **Corta:** “El código está presente; operación remota requiere evidencia.” **Repregunta:** ¿Cómo lo comprobarías sin revelar secreto?
