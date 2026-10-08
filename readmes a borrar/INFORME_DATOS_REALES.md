# Auditoría de datos reales de PetCare

Informe histórico anterior al desarrollo Cliente. El estado actual, nuevas tablas/endpoints y la carga del catálogo estructural existente se documentan en [IMPLEMENTACION_CLIENTE.md](IMPLEMENTACION_CLIENTE.md).

## Alcance

Se revisaron `mobile/src`, `backend/src`, seeds, rutas, consultas SQL y la búsqueda global de mock, fake, sample, demo, dummy, placeholderData y testData. También se revisaron arrays/objetos de pantallas, saludos, contadores y ejemplos de nombres/productos. No se encontraron registros de negocio ficticios en las pantallas de producción existentes. Los fixtures de tests se conservan.

## Fuentes actuales

| Información | Fuente |
| --- | --- |
| Usuario autenticado y saludo | `/auth/me`, repositorio de usuarios y MySQL; identidad validada por JWT |
| Veterinarios, total y paginación | `/admin/veterinarians`, consultas SELECT y COUNT de MySQL |
| Perfil, especialidades, permisos y estado de invitación | `/admin/veterinarians/:id`, repositorios de veterinarios y autorización |
| Catálogo de especialidades y permisos | `/admin/veterinarians/catalog` y `/admin/specialties`, MySQL |
| Módulos del panel profesional | `/vet/home`, módulos de MySQL filtrados por permisos efectivos |

Los filtros Todos/Activos/Inactivos, etiquetas de interfaz, configuración de formularios y nombres técnicos de permisos no son registros ficticios. Los formularios vacíos representan entradas del operador, no veterinarios almacenados. Los assets de autenticación son decoración de marca; no representan mascotas del usuario.

## Correcciones

- Regla permanente de cero datos de demostración en `AGENTS.md`.
- Especialidades diferencia catálogo sin consultar (`null`), carga, error y consulta exitosa sin registros. El editor explica la falta de especialidades necesarias.
- El reenvío de invitaciones vuelve a consultar el detalle persistido; no deduce el estado de la invitación en mobile.
- `/vet/home` omite `nextAppointment` y `patientsToday`: no existe una consulta clínica implementada que justifique devolver métricas. Mantiene `clinicalAvailable:false` y mensajes explícitos de funcionalidad pendiente.

## Funciones pendientes y límites

No existen pantallas funcionales ni endpoints de cliente para mascotas, turnos, historial, vacunas, recetas, recomendaciones, tienda, pedidos o notificaciones en el código actual. No se agregaron secciones ni CTA hacia rutas inexistentes. Estos módulos requieren esquema comprobado, repository/service/controller/route, identidad desde JWT y autorización de recursos antes de mostrar registros o contadores. Pendiente no equivale a vacío.

`backend/migrations` no está presente en este checkout, aunque el ejecutor y los README lo referencian. No se reconstruyó el esquema por inferencia ni se ejecutaron migraciones. La auditoría verifica el código SQL de los repositorios, no el esquema desplegado ni los registros reales de Railway. No se abrió una conexión de producción para esta auditoría.

El seed existente incluye roles y especies DOG/CAT como catálogo estructural previo. Se conserva por formar parte del diseño existente; no se agregó ni ejecutó ningún seed. El inicio HTTP no ejecuta seeds ni migraciones. `dummyHash` en autenticación reduce diferencias de tiempo al validar credenciales de una cuenta inexistente: es un mecanismo de seguridad, no un dato mostrado ni un usuario ficticio.

No se ejecutaron INSERT ni se modificó MySQL. La validación automatizada usa lint, TypeScript y tests unitarios; no prueba visualmente una instancia conectada a una base vacía.

## Verificación

- Mobile: `npm run lint`, `npm run typecheck` y `npm test` correctos; 7 tests aprobados.
- Backend: `npm run lint`, `npm run typecheck` y `npm test` correctos; 14 tests aprobados.
- Búsqueda global completada, incluidos archivos ocultos fuera de dependencias/compilaciones. Las coincidencias de producción corresponden a `VerificationCodeModal` y al hash de seguridad documentado.
- No se ejecutó `test:db`, porque requiere preparar y escribir en una base de integración y este checkout no contiene las migraciones.
