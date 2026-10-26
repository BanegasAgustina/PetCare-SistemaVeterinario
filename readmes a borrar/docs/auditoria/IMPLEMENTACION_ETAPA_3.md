# Implementación de mejoras · Etapa 3

**Fecha:** 22/10/2026 · **Alcance:** validaciones de formularios, errores por campo y prevención de envíos duplicados. No se avanzó a otra etapa.

## Formularios revisados

La revisión estática cubrió los formularios y controles compartidos de estos grupos:

| Grupo | Fuentes revisadas | Nivel de verificación |
|---|---|---|
| Inicio de sesión, registro, recuperación, activación y contraseñas | `mobile/src/components/forms/AuthForm.tsx`, `ActivationForm.tsx`, `mobile/src/utils/auth-validation.ts` y rutas de autenticación. | Revisión estática de validaciones, mensajes, carga y uso de inputs. Sin prueba end-to-end de correo o autenticación. |
| Perfil, usuarios y profesionales | `account.tsx`, perfiles cliente/veterinario, `admin/users`, `admin/veterinarians` y `ProfilePhotoInput.tsx`. | Revisión estática. Se conservaron las validaciones propias de cada rol; sin prueba de UI en dispositivo. |
| Mascotas, pacientes y turnos | `PetEditor.tsx`, `PatientsScreen.tsx`, `AppointmentScreen.tsx`, solicitud de turnos y componentes de agenda. | Revisión estática de errores locales, carga y acciones por rol. Sin prueba de integración con servicios o datos reales. |
| Catálogos, servicios, especialidades, horarios, roles y permisos | `CatalogScreen.tsx`, `AvailabilityScreen.tsx`, `SpecialtiesScreen.tsx`, pantallas de roles/permisos y formularios administrativos. | Revisión estática. No se cambiaron grants ni transiciones de turnos. |
| Productos, banners, carrito, direcciones, checkout y pagos | `admin/products.tsx`, `store-banners.tsx`, `Storefront.tsx`, tienda cliente, `cart.tsx`, `checkout.tsx`, validadores de checkout y configuración de retiro/envío. | Revisión estática; se añadieron pruebas unitarias a validaciones y pruebas backend sin base real para los defectos corregidos. |
| Inputs, modales, teclado y acciones asíncronas | `AppInput.tsx`, `AppModal.tsx`, `LoginLayout.tsx`, `PetCareUI.tsx` y `useAsyncAction.ts`. | Revisión de código. No se emuló Android, teclado físico/virtual ni interacción visual en dispositivos. |

## Problemas confirmados

1. Se podía guardar el retiro habilitado sin dirección. Checkout del cliente ya impedía confirmar el pedido en ese estado y el backend rechazaba la compra más tarde. La configuración ahora valida la dirección al habilitar retiro.
2. La configuración de zonas dejaba escribir prefijos postales más largos o con caracteres que el backend no acepta; el usuario recibía el rechazo al guardar. El formulario ahora valida las mismas reglas del backend y limita el input a 16 caracteres.
3. El checkout agrupaba datos incompletos de entrega y transferencia en avisos generales, aunque podía identificar cada campo. Ahora muestra el error debajo del campo correspondiente y destaca el input.
4. El backend del checkout usaba errores generales para campos individuales de dirección y datos del comprador. Ahora responde con errores asociados al campo para esas entradas; el cliente conserva los mensajes del backend y los muestra junto al input.
5. El guardado de configuración de retiro/envío tenía deshabilitación visual durante carga, pero no una protección síncrona contra una segunda invocación. Se agregó un gate de envío con prueba de concurrencia. El checkout conserva su clave de idempotencia y la protección del backend.

## Validaciones y mensajes corregidos

- Dirección de retiro obligatoria únicamente cuando `pickupEnabled` está activo. El backend valida con autoridad y responde en `pickupAddress`; el frontend hace la misma comprobación antes del envío.
- Prefijo postal opcional con hasta 16 caracteres y letras, números, espacios o guiones, compatible con el validador existente.
- Envío: destinatario, teléfono, calle, número, ciudad, provincia y código postal obligatorios; límites de longitud alineados con el backend. Piso/departamento y referencias siguen siendo opcionales.
- Transferencia: nombre y apellido, correo válido y DNI de 7 a 9 números, con errores en los campos correspondientes. El DNI se sigue descartando antes de persistir.
- Los errores estructurados del backend para estos formularios conservan su mensaje y se asignan al input por su nombre de campo; los errores generales siguen mostrándose en el formulario.
- Los límites visibles de longitud se alinearon con el backend en los datos configurables de zonas e importes.

No se agregó un teléfono del local ni se exigió un formato de cuatro dígitos para códigos postales: el formulario de configuración no tiene un teléfono del establecimiento y el contrato actual acepta códigos postales de hasta 16 caracteres. Los horarios de retiro permanecen opcionales en el backend y en la interfaz.

## Componentes y archivos modificados en esta etapa

- `mobile/src/app/admin/store-settings.tsx` — validación por campo, límites y protección de envío único.
- `mobile/src/utils/store-fulfillment-validation.ts` — regla compatible de prefijo postal y dirección requerida al habilitar retiro.
- `mobile/src/utils/submission-gate.ts` — protección síncrona de operaciones en curso.
- `mobile/src/app/client/(tabs)/store/checkout.tsx` — errores debajo de los inputs de dirección y transferencia; envío único al guardar una dirección.
- `mobile/src/utils/checkout-validation.ts` — reglas de dirección y datos del comprador, más asignación de errores estructurados.
- `backend/src/repositories/storefront.repository.ts` — dirección de retiro requerida al habilitar el retiro.
- `backend/src/validators/store-checkout.validator.ts` — errores de validación de checkout asociados al campo.
- `mobile/tests/store-fulfillment-validation.test.ts` y `mobile/tests/checkout-validation.test.ts` — pruebas de datos válidos, campos faltantes, valores inválidos, límites, asignación de errores y envío simultáneo.
- `backend/tests/storefront.routes.test.ts` y `backend/tests/store-checkout.test.ts` — respuestas por campo y rechazo de configuraciones inválidas sin abrir una base de datos.

## Funcionalidades conservadas

- Se conservaron métodos de retiro/envío, tarifas, zonas, banco, transferencias, tarjeta de demostración, direcciones guardadas y clave de idempotencia.
- No cambiaron autenticación, roles, permisos, navegación, pedidos existentes, precios ni stock.
- No se agregaron campos a base de datos ni se modificaron contratos fuera de la estructura de error de validación ya admitida por la API.
- Se mantuvieron `AppInput`, `AppModal`, la estética PetCare y los controles de carga existentes.

## Pruebas ejecutadas

| Comando | Resultado |
|---|---|
| `mobile/npm test` | 26/26 pasaron. Incluye pruebas nuevas para validación de dirección, datos de transferencia, prefijo postal, configuración válida, errores por campo y bloqueo de envíos simultáneos. |
| `mobile/npm run lint` | Pasó sin errores. |
| `mobile/npm run typecheck` | Pasó sin errores. |
| `backend/npm test` | 37/37 pasaron. Las pruebas agregadas verifican errores por campo y validación de retiro sin acceso a DB. |
| `backend/npm run lint` | Pasó sin errores. |
| `backend/npm run typecheck` | Pasó sin errores. |

No se ejecutaron pruebas que requieran base de datos ni se conectó a datos reales.

## Limitaciones y problemas pendientes

- Los formularios fuera de checkout y configuración de retiro/envío se revisaron estáticamente; no se ejercitaron todos sus recorridos y validaciones en una sesión de interfaz.
- No se probaron teclados, scroll de modales, cámara ni selectores en dispositivos físicos o emuladores Android/iOS. Tampoco se hizo una sesión manual de navegador web.
- No se validaron servicios externos de correo, OAuth, almacenamiento de imágenes ni pagos reales.
- Otros endpoints que solo devuelven un error general no exponen una clave de campo; permanecen como errores de formulario completo hasta que sus validadores de backend puedan identificar el campo de manera segura.
- No se ejecutaron migraciones, pruebas con DB, APK, despliegue ni cambios de configuración externa.
