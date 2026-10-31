# 3. Frontend: pantallas, estado y navegación

## Cómo se monta la interfaz

`mobile/src/app/_layout.tsx` es la raíz de Expo Router. Compone `SafeAreaProvider`, tema, feedback y `AuthProvider`, y después un `Stack`. Safe area evita que contenido quede debajo de muescas/barras del sistema; provider hace disponible el estado de autenticación/tema a descendientes. `Stack.Protected` limita rutas visibles según el usuario conocido. Eso organiza navegación y experiencia; no sustituye el control del backend.

Los archivos de `mobile/src/app` reflejan rutas: `login.tsx` es login, `client/(tabs)/pets.tsx` mascotas, `professional/agenda.tsx` agenda de peluquería, y `admin/users/index.tsx` administración de usuarios. Carpetas con `_layout.tsx` definen navegación compartida de esa zona. Rutas `[id].tsx` reciben identificador dinámico.

## Componentes, hooks y contexto

Un componente es una función que devuelve interfaz. Sus `props` son entradas; `useState` mantiene datos cambiantes; `useEffect` sincroniza con algo externo como API o ciclo de vida; hooks propios empaquetan lógica repetida. En el proyecto, `useAuth`, `useClient`, `useClinic`, `useAdmin` y `useAsyncAction` centralizan operaciones; `AuthContext` evita duplicar sesión en cada pantalla.

Ejemplo de concepto (simplificado): `const [loading,setLoading] = useState(false)` mantiene indicador; al comenzar una llamada se usa `setLoading(true)`, y al terminar se revierte. En pantalla real, revisar el archivo citado antes de afirmar que una operación concreta tiene una UX específica.

## Solicitudes y errores

`mobile/src/services/api.ts` construye URL base, serializa objeto a JSON, añade `Accept`, `Content-Type` y opcionalmente Bearer, cancela con `AbortController` a los 12 segundos, interpreta la envoltura de API y produce `ApiError`. Si el body es `Blob`, `ArrayBuffer` o una vista tipada, se envía crudo, caso necesario para comprobantes. Los logs de desarrollo reducen endpoint/estado/código; no imprimen token ni contenido completo.

El servicio de dominio convierte esa capa genérica a funciones con nombres como `requestAppointment`, `cancelAppointment`, `orders`, `notifications`. La pantalla usa datos devueltos para renovar estado/lista; el backend siempre vuelve a validar los valores.

## Formularios, controles e imágenes

La carpeta `components/forms` contiene campos de texto/selección, fecha, hora, carga de imagen, códigos de verificación y OAuth. Las utilidades bajo `mobile/src/utils` verifican reglas de autenticación, checkout, fechas, navegación y etiquetas. La validación local sirve para orientar al usuario y reducir solicitudes inválidas; no es una barrera de seguridad. Los validadores backend repiten controles confiables.

Imágenes se eligen con Expo Image Picker/Document Picker, a veces se comprimen con Image Manipulator y se envían a rutas restringidas. El backend valida tamaño/formato y delega almacenamiento; el cliente no debe decidir una referencia ajena. `ProfilePhotoInput`, `ImageUploadField`, `PetEditor` son piezas compartidas. Los archivos `.web.tsx` adaptan controles de fecha/hora al navegador.

## Acceso por rol y personalización

`utils/role-home.ts`, `admin-route-access.ts`, `personal-route-access.ts`, `navigation-tabs.ts` y layouts definen destinos y pestañas. El rol `CLIENT` abre área personal; `VETERINARIAN`, `GROOMER` y personal administrador tienen sus áreas. Módulos administrativos adicionales dependen de permisos efectivos. El servidor puede denegar una acción aunque el botón exista o la ruta haya sido abierta manualmente.

## Pantallas principales

| Área | Rutas representativas | Componentes/lógica relacionada |
|---|---|---|
| Acceso | `login`, `register`, `reset-password`, `activate-account`, `activate-vet`, `oauth` | `AuthForm`, verificación y `AuthContext` |
| Cliente | `client/(tabs)/index`, `pets`, `appointments`, `profile` | `PetEditor`, `SlotSelectionCard`, `Storefront`, ClinicalScreen |
| Profesional | `professional/*` y compatibilidad `vet/*` | `AgendaScreen`, `PatientsScreen`, `AppointmentScreen`, clinical |
| Administración | `admin/*`, `admin/users/*`, `admin/veterinarians/*` | `AdminDataTable`, formularios, catálogos y controles de permisos |
| Notificaciones | `/notifications`, `/client/notifications` | NotificationBridge y centro persistido del servidor |
| Cuenta | `account`, `client/profile/*` | perfil, apariencia, seguridad |

Hay archivos `vet/*` y `professional/*` en el mismo checkout; representan compatibilidad/áreas por tipo profesional. Esta guía no supone que cada pantalla esté enlazada para todos los roles: se comprueba en `_layout` y `role-home`.

## Sesión al abrir la app

`AuthProvider.restoreSession()` lee el almacenamiento específico de plataforma, renueva si expiró y aún hay refresh token, y llama a `/auth/me`. La función compara una generación interna para ignorar respuestas tardías después de logout. Si llega 401, limpia sesión; 403 puede refrescar perfil/permisos. El acceso token se guarda en SecureStore en Android y `sessionStorage` en web (`session-store.ts` y `web-session-store.ts`).

### Preguntas de defensa

- **Básica — ¿Qué es un componente?** Pieza reutilizable de interfaz. **Ejemplo:** `AppButton` representa un botón con estilo común. **Corta:** “Una pantalla compone componentes.” **Repregunta:** ¿Qué son props?
- **Intermedia — ¿Cómo se comparte sesión?** `AuthProvider` mantiene usuario y acciones; `useAuth` lo expone. **Corta:** “El contexto evita duplicar la sesión en cada ruta.” **Repregunta:** ¿Dónde se persiste?
- **Avanzada — ¿Una ruta protegida hace segura la operación?** No; el backend aplica JWT, rol, permiso y ownership. **Corta:** “La UI oculta; el servidor decide.” **Repregunta:** ¿Qué ataque se evita verificando owner en servidor?
