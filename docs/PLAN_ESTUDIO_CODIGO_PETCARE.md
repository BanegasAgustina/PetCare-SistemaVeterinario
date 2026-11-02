# Plan de estudio del código PetCare

1. Leer README, Expo root layout, `app.ts` y `server.ts`.
2. Trazar rutas y layouts por rol; distinguir guard visual de autorización API.
3. Revisar componentes, forms, contextos, hooks y servicios del frontend.
4. Seguir route → middleware → controller → service → repository.
5. Comprender autenticación, refresh, roles, OAuth e invitaciones.
6. Leer SQL/repositorios y ubicar ownership, bloqueo y transacciones.
7. Seguir flujos: mascota, turno, clínica, tienda, pago y notificación.
8. Distinguir migración/seed mutante de auditoría readonly.
9. Repasar cada pendiente en `COBERTURA_DOCUMENTACION_PETCARE.md` antes de dar por completa la documentación.


## Etapa 26: solicitud de turno

**Leer:** `client/appointments/request.tsx`, `SlotSelectionCard`, `clinic.service.ts`, `clinic.repository.ts` y validadores asociados. Seguir selección de mascota/servicio/profesional/fecha hasta la validación final del slot.


## Etapa 27: administración de clínica y permisos

**Leer:** `admin/index.tsx`, `availability.tsx`, `general-information.tsx`, `permissions.tsx`, `permission.middleware.ts` y repositories administrativos. Comparar métricas filtradas, edición de configuración y catálogo de permisos.

## Etapa 28: perfiles y administración de la tienda

**Leer:** pantallas administrativas de usuarios/veterinarios, perfil compartido, servicios profesionales, banners, pedidos y configuración de retiro/envíos. Seguir permisos UI y las comprobaciones definitivas de la API.

## Etapa 29: catálogo clínico, agenda y pacientes

**Leer:** `CatalogScreen.tsx`, `PatientsScreen.tsx`, servicios de clínica, validadores y repositorios correspondientes. Trazar publicación de disponibilidad, bloqueos, alta idempotente de paciente y separación entre notas internas y contenido para el propietario.
