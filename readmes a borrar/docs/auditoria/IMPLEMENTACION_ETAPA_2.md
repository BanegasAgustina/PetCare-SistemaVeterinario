# Implementación de mejoras · Etapa 2

**Fecha:** 22/10/2026 · **Alcance:** componentes compartidos y reutilización. Se implementó una consolidación pequeña en la selección de fotos de perfil. No se avanzó a la Etapa 3.

## Inventario de duplicaciones

| Área y archivos | Funcionalidad repetida | Componente reutilizado | Beneficio | Riesgo y verificaciones |
|---|---|---|---|---|
| `mobile/src/components/clinic/StaffHome.tsx` y `mobile/src/components/forms/ProfilePhotoInput.tsx` | Selección de imagen, permisos de galería/cámara, límites de tamaño y dimensiones, mensajes de error y vista previa. El inicio veterinario implementaba su propio flujo aunque ya existía un control común de foto. | `ProfilePhotoInput`, ampliado con cámara opcional y tamaño configurable; `mobile/src/utils/profile-photo.ts` centraliza la validación del asset. | Un solo flujo de selección y validación; se conserva la opción de cámara del inicio veterinario. | Bajo. La cámara es opt-in y no aparece en web; los valores por defecto mantienen las instancias existentes. Se verificaron límites con pruebas unitarias y se ejecutaron lint, typecheck y pruebas móviles. |
| Pacientes, turnos y agenda para roles clínicos/administrativos. Rutas `mobile/src/app/{vet,professional,secretary,admin}/` y `mobile/src/components/clinic/{PatientsScreen,AgendaScreen,AppointmentScreen,ReservationsScreen}.tsx`. | No se encontró una implementación repetida que requiriera una nueva extracción: las rutas reexportan pantallas comunes y estas ya aplican las diferencias de rol/permisos en la presentación. | Componentes existentes, sin cambios. | Evita duplicar listas, detalles y acciones que ya están centralizados. | Cambios innecesarios podrían alterar filtros o acciones autorizadas. Se conservaron rutas y alcance de datos. |
| Mascotas de cliente y pacientes clínicos. `mobile/src/app/client/(tabs)/pets.tsx`, `mobile/src/components/client/RecordCards.tsx`, `PetEditor.tsx` y pantallas clínicas compartidas. | Comparten `PetImage`, estados, tarjetas y controles visuales; sus fichas y datos mostrados tienen alcances y tareas diferentes. | Componentes visuales ya existentes (`PetImage`, `PetCard`, `PetCareEmptyState`, `QueryState`, `PetEditor`). | Reutilización presente sin mezclar la vista de mascotas propias con la lista clínica. | Sin cambios. No se expuso historia clínica a peluquería ni se modificó ownership. |
| Productos. `mobile/src/components/client/Storefront.tsx`, `mobile/src/app/admin/products.tsx`, `mobile/src/components/clinic/CatalogScreen.tsx`, `mobile/src/app/vet/products.tsx`. | La tienda, el inventario administrativo y las recomendaciones veterinarias usan el mismo catálogo/datos, pero realizan tareas distintas. No hay equivalencia suficiente para unificar sus tarjetas o flujos completos. | Controles visuales comunes (`PetImage`, `PetCareCard`, `AppInput`, `QueryState`, `money`) ya están compartidos. | Mantiene catálogo central y reutiliza UI básica sin juntar compra, stock y recomendación. | Sin cambios de carrito, checkout, precios, promociones, stock ni pedidos. |
| Perfil/foto, formularios y navegación. `ProfilePhotoInput.tsx`, `VeterinarianProfileScreen.tsx`, formularios de administración y `StaffHome.tsx`. | La selección de foto era la duplicación comprobada; identidad, datos personales y campos profesionales varían entre formularios y roles. | `ProfilePhotoInput` ya era compartido entre altas administrativas y perfil veterinario; ahora también es utilizado por el inicio veterinario. `AppInput` y `FormNotice` siguen compartidos. | Reutiliza la selección de foto y validación sin borrar opciones específicas del perfil. | No se unificaron campos profesionales ni lógica de guardado. |

## Componentes que ya estaban compartidos

- `PatientsScreen`, `PatientScreen`, `AgendaScreen`, `AppointmentScreen`, `ReservationsScreen` y `CatalogScreen` son consumidos por rutas de los roles correspondientes.
- `PetCareUI.tsx` centraliza tarjetas, imágenes, grillas, estados vacíos, errores/reintentos, encabezados y estilos del cliente que también se usan en pantallas clínicas y administrativas.
- `RecordCards.tsx` ofrece tarjetas de mascota, turno, registro clínico, recomendación, producto y pedido para la experiencia de cliente.
- `PetEditor.tsx` cubre alta y edición de mascotas del cliente; las fichas clínicas conservan sus acciones propias.
- `ProfilePhotoInput.tsx`, `AppInput`, `QueryState`, `FormNotice`, `SearchFilterBar`, `FilterDisclosure` y `CompactPagination` son controles compartidos existentes.
- El backend conserva los repositorios y servicios compartidos de clínica, clientes y catálogo; esta etapa no cambió sus contratos.

## Refactorización realizada

- `ProfilePhotoInput` acepta `allowCamera`, `removable` y `size`. La cámara solo se presenta cuando una pantalla la habilita y solo en plataforma móvil.
- El inicio veterinario en `StaffHome.tsx` ahora usa `ProfilePhotoInput`, mantiene tamaño de 84 px y conserva la toma de foto desde cámara. El guardado sigue usando el endpoint `/vet/profile/photo` y el mismo refresco de perfil.
- `mobile/src/utils/profile-photo.ts` valida base64, tamaño del archivo (5 MB) y dimensiones (25 megapíxeles) en un solo lugar.
- `mobile/tests/profile-photo-validation.test.ts` agrega seis pruebas de aceptación y límites.

## Funcionalidades y límites conservados

- Se mantuvieron los seis roles, sus permisos, la navegación y las acciones particulares existentes.
- No cambiaron endpoints, contratos de API, datos, turnos, transiciones, disponibilidad ni reglas del backend.
- No se alteró el acceso del cliente a sus mascotas, el alcance de pacientes clínicos ni los permisos de historia clínica.
- No se modificaron productos, precios, stock, promociones, carrito, checkout ni pedidos.
- La selección de foto mantiene vista previa, recorte cuadrado, permiso del sistema, acceso a ajustes y manejo de imágenes de hasta 5 MB y 25 MP.

## Archivos modificados en esta etapa

- `mobile/src/components/forms/ProfilePhotoInput.tsx`
- `mobile/src/components/clinic/StaffHome.tsx`
- `mobile/src/utils/profile-photo.ts`
- `mobile/tests/profile-photo-validation.test.ts`
- `docs/auditoria/IMPLEMENTACION_ETAPA_2.md`

## Pruebas y resultados

| Comando | Resultado |
|---|---|
| `mobile/npm test` | 18/18 pasaron: 12 existentes y 6 nuevas para validación de foto. |
| `mobile/npm run lint` | Pasó sin errores. |
| `mobile/npm run typecheck` | Pasó sin errores. |

Las pruebas cubren la función de validación; no se probó en dispositivos físicos ni se ejecutó una prueba end-to-end de galería/cámara.

## Pendientes

- La comprobación real de permisos y apertura de cámara/galería en iOS y Android requiere una sesión en dispositivos o emuladores; no se hizo en esta etapa.
- Los flujos administrativos de creación/edición de perfiles conservan validaciones particulares y podrían revisarse en una etapa futura solo si se demuestra lógica repetida adicional.
- Las tarjetas y los formularios clínicos muestran datos distintos por autorización. Mantener esa separación requiere pruebas de integración por rol antes de ampliar una abstracción.

## Recomendaciones para la Etapa 3

1. Priorizar pruebas de integración por rol para ownership de mascotas, asignación veterinaria, alcance de peluquería y grants administrativos.
2. Revisar de manera independiente los campos personales repetidos en formularios administrativos, conservando los campos y validaciones propios de cada profesión.
3. Evaluar en un entorno de prueba los flujos reales de cámara y galería en web, Android e iOS antes de cambiar permisos nativos.
4. Mantener tienda, inventario y recomendación como tareas diferentes mientras sus acciones y reglas de autorización sigan siendo distintas.
