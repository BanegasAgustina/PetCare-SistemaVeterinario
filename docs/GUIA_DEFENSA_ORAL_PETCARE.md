# Guía para defender PetCare en una presentación oral

Esta guía está basada en el código y los README del repositorio. Las preguntas que dependen del entorno productivo deben responderse con la configuración verificada del operador, no con secretos ni con datos asumidos. El avance de documentación por archivo se controla en [COBERTURA_DOCUMENTACION_PETCARE.md](COBERTURA_DOCUMENTACION_PETCARE.md).

## Presentación breve sugerida

> PetCare es un sistema web y móvil para organizar la atención de una clínica veterinaria. La interfaz está construida con React Native, Expo y Expo Router para compartir gran parte de las pantallas entre web y Android. Un backend en Node.js, Express y TypeScript expone una API REST y concentra validaciones, reglas de negocio y permisos. La persistencia se realiza en MariaDB/MySQL mediante repositorios. El sistema contempla clientes, profesionales veterinarios, peluquería y administración, y organiza funciones como mascotas, turnos, fichas, notificaciones y tienda. La autorización final la aplica el backend, aunque el frontend también adapta la navegación al rol.

## Cómo explicar la arquitectura en dos minutos

1. La aplicación inicia en `mobile/src/app/_layout.tsx`, que instala los proveedores globales y declara las rutas; `index.tsx` resuelve el destino inicial.
2. Las pantallas llaman servicios del frontend. Por ejemplo, `PetEditor` usa `useClient` para consultar catálogo y guardar los datos.
3. `api.ts` crea la solicitud HTTP y el contexto añade el token de sesión cuando corresponde.
4. En backend, `app.ts` aplica middleware y monta `/api`; `routes/index.ts` deriva al router del dominio.
5. Middleware autentica y autoriza. Controladores traducen HTTP a operaciones; servicios coordinan reglas; repositorios hacen consultas SQL.
6. La respuesta JSON vuelve al servicio móvil. La pantalla actualiza su estado o presenta un error controlado.

## Preguntas posibles y respuestas

### Proyecto y arquitectura

1. **¿Qué problema busca resolver PetCare?**  
   Coordinar información y tareas de una clínica veterinaria, como clientes y mascotas, turnos, atención profesional, administración y compras, desde una aplicación compartida.

2. **¿Qué partes principales tiene el repositorio?**  
   `mobile/` contiene la interfaz Expo para web y Android; `backend/` contiene la API Express; `docs/` contiene material de arquitectura y estudio.

3. **¿Por qué el directorio se llama `mobile` si también hay web?**  
   Es el nombre del paquete de interfaz. Expo y React Native permiten compilar nativo Android y exportar web desde gran parte del mismo código.

4. **¿Qué hace Expo Router?**  
   Convierte archivos y directorios de `mobile/src/app/` en rutas y layouts de navegación.

5. **¿Qué hace el layout raíz?**  
   En `mobile/src/app/_layout.tsx` monta proveedores globales, declara pantallas y guardas, y agrega navegación y componentes globales.

6. **¿Qué hace la ruta `/`?**  
   `mobile/src/app/index.tsx` lee la sesión desde `useAuth` y delega en `EntryRedirect` la selección del destino inicial.

7. **¿Qué función cumple el backend?**  
   Centraliza la API, las validaciones del servidor, la autorización, las reglas de negocio, las integraciones y el acceso a la base.

8. **¿Cómo se organiza el backend?**  
   Por capas: rutas, middleware, controladores, servicios, repositorios, validadores y configuración. No todos los endpoints tienen necesariamente una clase o archivo exclusivo por operación.

9. **¿Cuál es el punto de entrada de Express?**  
   `backend/src/app.ts` construye la aplicación y monta middleware y rutas; `server.ts` abre el listener para ejecución local.

10. **¿Por qué separar `app.ts` de `server.ts`?**  
    Permite exportar la app Express sin abrir un listener propio, lo que facilita pruebas HTTP y el uso por una plataforma como Vercel.

### Tecnologías y comunicación

11. **¿Por qué se usa TypeScript?**  
    Aporta tipos a las entidades, parámetros y respuestas, y permite detectar inconsistencias durante compilación. No reemplaza la validación de datos externos.

12. **¿Qué aporta React Native?**  
    Permite construir interfaces móviles con componentes React y compartir lógica y pantallas entre plataformas, con diferencias cuando una API depende del sistema operativo.

13. **¿Qué aporta Express?**  
    Organiza solicitudes HTTP con routers, middlewares y handlers.

14. **¿Cómo se comunican frontend y backend?**  
    Mediante HTTP y JSON a través de servicios en `mobile/src/services/`; `api.ts` centraliza el transporte y el backend monta rutas bajo `/api`.

15. **¿Todas las lecturas usan GET?**  
    No. Las lecturas internas migradas usan POST con filtros JSON en el body; hay GET específicos como health y callbacks OAuth.

16. **¿Qué ocurre cuando falla una solicitud?**  
    El backend propaga errores al middleware de error y devuelve una respuesta normalizada. `api.ts` los convierte en `ApiError` para que la interfaz pueda mostrarlos.

17. **¿Cómo sabe el frontend a qué API conectarse?**  
    `mobile/src/services/api.ts` resuelve la URL a partir de variables de entorno y del modo de ejecución; la URL de producción se configura para el build.

18. **¿Qué diferencia hay entre validación de frontend y backend?**  
    La local guía al usuario y evita envíos claramente incorrectos. La del servidor es obligatoria porque la solicitud se puede crear fuera de la interfaz.

### Datos, mascotas y turnos

19. **¿Qué base de datos utiliza PetCare?**  
    MariaDB/MySQL con `mysql2/promise`, según la configuración en `backend/src/config/database.ts`.

20. **¿Qué hace un repository?**  
    Encapsula consultas y operaciones SQL de un dominio y entrega resultados a los servicios.

21. **¿Qué es una transacción?**  
    Un grupo de operaciones que se confirma junto o se revierte si falla; el código la usa para preservar consistencia en operaciones relacionadas.

22. **¿Cómo se registra una mascota?**  
    La pantalla `new.tsx` usa `PetEditor`; `useClient` conecta con `client.service.ts`; la ruta protegida `/client/pets` llama al controlador y servicio. `petInput` valida y el repositorio comprueba catálogos y guarda en una transacción.

23. **¿Cómo se determina el dueño de una mascota?**  
    El backend toma el ID de la identidad autenticada, no de un `ownerId` enviado por el cliente. El repositorio filtra por ese owner.

24. **¿Cómo se registra la foto de una mascota?**  
    El componente de carga prepara/sube la imagen a almacenamiento y el formulario envía una referencia que el backend valida; no se debe asumir que una URL temporal es la clave persistida.

25. **¿Cómo se solicita un turno?**  
    `appointments/request.tsx` carga mascotas y catálogo, consulta slots y envía `petId` y `slotId`. El backend deriva dueño y profesional/servicio del slot almacenado.

26. **¿Cómo se evitan dos turnos en el mismo horario?**  
    El repositorio vuelve a consultar disponibilidad dentro de una transacción y serializa la operación bloqueando al profesional; si el slot ya no está libre, devuelve `SLOT_UNAVAILABLE`.

27. **¿Qué estado inicial tiene una solicitud de turno?**  
    El código inserta la solicitud con estado `REQUESTED` y genera notificaciones internas para las partes correspondientes.

28. **¿Se envían notificaciones push?**  
    No según README y código documentado: hay un centro de notificaciones interno persistido en API; no se registran tokens push del sistema operativo.

### Autenticación y seguridad

29. **¿Qué sucede al registrarse?**  
    El frontend envía datos públicos sin rol. Backend valida, comprueba duplicado, guarda hash de contraseña y genera verificación por email; no emite sesión hasta verificar.

30. **¿Cómo se guarda la contraseña?**  
    El backend usa bcrypt. La contraseña no se devuelve al cliente; el login compara el valor ingresado con el hash.

31. **¿Qué datos contiene la sesión del frontend?**  
    Guarda access token, refresh token y vencimiento. Luego solicita `/auth/me` para recuperar del servidor el perfil y permisos actuales.

32. **¿Dónde se almacena la sesión?**  
    SecureStore en plataforma nativa y `sessionStorage` en web, mediante implementaciones de sesión específicas.

33. **¿El rol que ve la aplicación es suficiente para autorizar una operación?**  
    No. Es una ayuda de navegación; el middleware backend verifica usuario, rol, permisos y alcance de datos en cada operación protegida.

34. **¿Qué hace `authenticate`?**  
    Verifica JWT, recarga cuenta/estado de sesión, verifica cuenta activa y correo, aplica políticas de contraseña inicial y carga permisos efectivos.

35. **¿Qué diferencia hay entre `requirePermission` y `requireAnyPermission`?**  
    El primero exige todos los códigos declarados; el segundo permite continuar si el usuario tiene al menos uno.

36. **¿Cómo se protege la información personal?**  
    El servidor deriva el usuario autenticado y los repositorios filtran por ownership o alcance profesional. Las rutas clínicas además combinan rol y permisos.

37. **¿Cómo se evita revelar si un email existe durante el login?**  
    El servicio también ejecuta una comparación bcrypt con un hash de respaldo cuando no encuentra usuario, y presenta el mismo error de credenciales inválidas.

38. **¿Cómo se manejan intentos excesivos?**  
    Las rutas sensibles conectan middleware rate limit; los parámetros se definen en las llamadas a `createAuthRateLimiter`.

39. **¿Qué ocurre al desactivar una cuenta?**  
    La documentación del backend describe baja lógica, incremento de versión de sesión y auditoría; no se borra el historial asociado.

### Roles y módulos

40. **¿Qué roles existen?**  
    `CLIENT`, `VETERINARIAN`, `GROOMER`, `ADMIN` y `SUPER_ADMIN`, según los tipos y README actuales.

41. **¿Qué representa GROOMER?**  
    El rol profesional de peluquería; sus funciones dependen también de permisos efectivos y asignaciones.

42. **¿La secretaría es un rol actual?**  
    No aparece como rol reconocido por el código actual descrito en los README; algunas capacidades administrativas se habilitan mediante permisos.

43. **¿Qué controla el área de administración?**  
    El código presenta módulos de usuarios/roles/permisos, clínica, profesionales, catálogos, disponibilidad y tienda. Cada operación debe confirmarse en sus rutas y grants concretos.

44. **¿Qué información clínica puede ver un cliente?**  
    El cliente consulta registros disponibles para sus propias mascotas; el backend limita columnas y alcance. Los datos internos profesionales no se devuelven a cliente.

### Tienda e integraciones

45. **¿El checkout con tarjeta procesa dinero real?**  
    No. El checkout con tarjeta es de demostración y solo funciona cuando `STORE_DEMO_MODE` lo habilita; no representa un cobro.

46. **¿Cómo se gestiona una transferencia?**  
    Es un flujo separado: checkout bancario, intención de pago y carga de comprobante, con revisión administrativa. Un comprobante enviado no equivale automáticamente a pago confirmado.

47. **¿Qué proveedores OAuth están contemplados?**  
    Google, Facebook y X. La política y el intercambio se gestionan en backend; callbacks y credenciales deben coincidir con la configuración externa.

48. **¿Qué integra el correo electrónico?**  
    SMTP se usa para verificación, invitaciones y recuperación de contraseña según servicios de correo/verificación.

### Plataformas y entrega

49. **¿Qué diferencia importante hay entre web y Android?**  
    Comparten gran parte de pantallas, pero web usa APIs de navegador y sessionStorage; Android incorpora SecureStore, scheme `petcare`, plugins y build nativo. OAuth con callback propio requiere development build.

50. **¿Cómo se despliega?**  
    El repositorio documenta dos proyectos Vercel, uno para web (`mobile/`) y otro para API (`backend/`); EAS produce APKs según perfiles de `mobile/eas.json`.

51. **¿El build garantiza que todo está conectado?**  
    No. Solo confirma que se generó el artefacto; no comprueba por sí solo SQL, SMTP, OAuth ni almacenamiento externo.

52. **¿Se migran automáticamente las bases al iniciar?**  
    No. `server.ts` inicia el servidor; no lanza migraciones. Los scripts de base se ejecutan de forma explícita y algunos son mutantes.

53. **¿Qué pruebas automatizadas trae el checkout actual?**  
    Los scripts están declarados en package.json, pero en este árbol no se encontraron archivos de test; las ejecuciones informaron cero pruebas. No se debe afirmar cobertura de tests.

## Referencias para preparar la exposición

- Arranque: `mobile/src/app/_layout.tsx`, `mobile/src/app/index.tsx`, `backend/src/app.ts`, `backend/src/server.ts`.
- Sesión: `mobile/src/contexts/AuthContext.tsx`, `mobile/src/services/auth.service.ts`, `backend/src/routes/auth.routes.ts`, `backend/src/services/auth.service.ts`, `backend/src/middlewares/auth.middleware.ts`.
- Mascotas: `mobile/src/components/client/PetEditor.tsx`, `mobile/src/services/client.service.ts`, `backend/src/routes/client.routes.ts`, `backend/src/services/client.service.ts`, `backend/src/repositories/client.repository.ts`.
- Turnos: `mobile/src/app/client/appointments/request.tsx`, `backend/src/repositories/clinic.repository.ts`.
- Arquitectura: [GUIA_ARQUITECTURA_PETCARE.md](GUIA_ARQUITECTURA_PETCARE.md), [GUIA_ARCHIVOS_PETCARE.md](GUIA_ARCHIVOS_PETCARE.md).

## ¿Cómo se valida OAuth antes de aceptar una sesión?

La app genera una prueba criptográfica y envía su desafío al backend. El proveedor vuelve a la URL prevista con un ticket temporal; `mobile/src/services/oauth-flow.ts` valida origen, ruta y formato, y `oauth.service.ts` canjea ticket y prueba. Solo la sesión devuelta por el backend se valida con `readAccessSession` y llega a `AuthContext`.

## ¿Dónde se decide si un cliente puede acceder a un registro?

El frontend solo escoge una ruta y envía el identificador. `client.service.ts` no manda `ownerId`; las rutas, middleware, servicios y repositorios del backend derivan el usuario de la sesión y comprueban propiedad y permisos. El límite autoritativo está en backend.


## Servicios del backend y procesos asincrónicos

**¿Qué aporta la capa de servicios?**

Coordina reglas de dominio y dependencias. El controlador adapta HTTP; el servicio valida el flujo y llama repositories/integraciones; el repositorio concentra persistencia. Ejemplos: `client.controller.ts` → `client.service.ts` → `client.repository.ts`, y `clinic.controller.ts` → `clinic.service.ts` → repositories de clínica y catálogo.

**¿Cómo se evita duplicar recordatorios si se solapan dos tareas?**

`notifications.service.ts` vuelve a comprobar cada turno dentro de una transacción y construye una clave de evento con turno, slot y ventana. La clave idempotente y la restricción de base evitan emitir dos recordatorios iguales. Para emails, el job reclama filas con lease y `SKIP LOCKED`, registra éxito o programa un nuevo intento.

**¿Cómo se confía en una cuenta OAuth?**

`oauth-provider.service.ts` valida el intercambio y normaliza el identificador externo; `oauth-policy.ts` decide si se vincula, autentica, registra o rechaza por conflicto. El correo solo se considera sugerencia y no vincula cuentas por coincidencia. Luego PetCare verifica el correo y emite su propio token/sesión.


### Base de datos, ownership y checkout

**¿Dónde se comprueba que una mascota pertenece al cliente?**

En las consultas de `client.repository.ts` y las reglas coordinadas por `client.service.ts`: el ID del titular proviene de la sesión y se incorpora a la consulta. Un ID recibido por el cliente no basta para leer o modificar un recurso ajeno.

**¿Quién calcula el importe final de la tienda?**

`store-checkout.repository.ts` vuelve a leer artículos, precios, disponibilidad y fulfillment del servidor dentro de una transacción. A partir de esos datos calcula importes, reserva stock y crea pedido; el precio enviado desde la interfaz no es fuente de verdad.

**¿Qué diferencia hay entre repository y service?**

El repository ejecuta SQL y proyecta filas; el service organiza el caso de uso, combina validación/autorización y delega en uno o varios repositories/integraciones. Por ejemplo, checkout valida dirección y carrito en el servicio y crea el pedido mediante el repository transaccional.


### Migraciones, seeds y auditorías

**¿Cómo se actualiza la estructura de la base?**

Con herramientas operativas en `backend/src/database/`, no durante cada petición HTTP. El runner verifica archivos versionados/checksum e historial antes de aplicar pasos. Los seeds cargan catálogos aparte.

**¿Qué hace una herramienta de solo lectura?**

`migration-preflight-readonly.ts` o `sql-audit-readonly.ts` observan esquema y referencias y reportan hallazgos sin alterar tablas. Un preview de limpieza sirve para evaluar relaciones y conteos; no equivale a ejecutar una eliminación. Para confirmar producción se necesita evidencia de la ejecución y su base objetivo.

**¿Por qué usar un lock?**

`lock.ts` serializa tareas de migración/bootstrap con un lock de MySQL para que dos operadores o procesos no preparen el esquema en paralelo.


### Entrada, invitaciones y autenticación móvil

**¿Qué hace la ruta raíz?**

El layout monta proveedores globales; `index.tsx` lee el usuario de AuthContext y `EntryRedirect` decide el destino. La pantalla no determina la autorización de las operaciones.

**¿Qué diferencia hay entre activar una invitación y entrar con OAuth?**

La activación verifica una prueba de invitación y establece contraseña. OAuth retorna identidad de un proveedor y la intercambia por una sesión propia de PetCare. Ambos flujos terminan en el backend y no confían en una ruta móvil como prueba de permisos.


**¿La app cliente decide el costo del envío?**

No. La pantalla pide una cotización, pero el backend calcula cobertura y tarifa con sus zonas/configuración; al crear el pedido vuelve a validar el subtotal, el stock y los datos.


**¿Qué ocurre al desactivar una mascota con turnos futuros?**

La pantalla informa el conflicto y ofrece ir a turnos; el backend impide la transición incompatible y preserva el historial. La propiedad se valida por el titular de sesión.
