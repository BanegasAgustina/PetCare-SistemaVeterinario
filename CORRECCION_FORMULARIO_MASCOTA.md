# Formulario de mascotas

Agregar y Editar comparten `mobile/src/components/client/PetEditor.tsx`. Se reemplazaron la URL manual y la fecha manual por galería y calendario. La foto tiene preview circular, cambio y eliminación antes de guardar. Las especies siguen viniendo de MySQL y ahora se muestran como selección única accesible. La raza es texto opcional de hasta 100 caracteres; se conserva `breed_id` cuando la relación existente no fue cambiada. Peso y microchip mantienen validación; los opcionales vacíos se envían como NULL. Safe Area, cards, ThemeContext, errores inline y toast existentes se reutilizan.

## Fotos y configuración de Railway

El almacenamiento se migró a un Storage Bucket privado compatible con S3. Consultar [ALMACENAMIENTO_FOTOS_BUCKET.md](ALMACENAMIENTO_FOTOS_BUCKET.md) para la configuración vigente, seguridad y pruebas. MySQL conserva una clave estable; las URLs firmadas se generan al consultar y nunca se persisten. No se usa almacenamiento local.

## Fecha, raza y endpoints

`pet-date.ts` convierte los componentes locales año/mes/día del calendario a YYYY-MM-DD y formatea la presentación como DD/MM/AAAA. No usa `toISOString()` para convertir la fecha seleccionada. El calendario nativo limita a hoy; hay calendario web independiente y validación adicional en frontend/backend.

Se inspeccionaron las tablas reales `pets`, `species`, `breeds` y `client_pet_details`: `pets.breed_id` ya permite NULL. Se agregó únicamente `client_pet_details.breed_name VARCHAR(100) NULL`, mediante `002_pet_breed_name.sql`, sin seeds ni modificaciones de mascotas. La lectura usa `COALESCE(breed_name, breeds.name)` para mantener los datos anteriores. La migración se aplicó en la base configurada y queda registrada en `client_schema_migrations`.

El comando `npm run db:migrate:pet-form` aplica/verifica solo esa extensión. No restaura `001_client_experience.sql`, que ya estaba eliminado del checkout antes de este trabajo. El runner general seguirá necesitando sus archivos históricos para otras migraciones.

Endpoints modificados: `POST /api/client/pets`, `PUT /api/client/pets/:id`; lecturas de `GET /api/client/pets` y `GET /api/client/pets/:id` incorporan la raza libre. Lectura privada vigente: `GET /media/pets/:id`, autenticada y autorizada por ownership. No se creó un endpoint de subida separado. El backend consulta la fila guardada dentro de la transacción y la ficha/listado vuelven a consultar la API al recibir foco.

## Archivos y dependencias

- Mobile: `PetEditor.tsx`, `PetBirthDate.tsx`, `PetBirthDate.web.tsx`, `pet-date.ts`, `SelectionRow.tsx`, `client.service.ts`, `api.ts`, `types/client.ts`, `app.json`, `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `tests/pet-date.test.ts`.
- Backend: `app.ts`, `client.service.ts`, `client.repository.ts`, `client.validator.ts`, `pet-photo.service.ts`, `pet-form-migrate.ts`, `002_pet_breed_name.sql`, `.env.example`, `package.json`, `package-lock.json`, `tests/pet-form.test.ts`.
- Dependencias: `expo-image-picker` y `@react-native-community/datetimepicker`, instalados con `expo install` para SDK 57; `sharp` en backend. Los módulos móviles figuran incluidos en Expo Go en la documentación versionada de Expo 57.
- TypeScript y lint ahora excluyen `src-backups`, que contiene copias anteriores incompatibles; esos archivos se conservaron.

## Verificación

Pasaron TypeScript/lint en ambos proyectos, 3 tests de backend y 2 de mobile. Se verificaron fechas, opcionales, validación de datos, rechazo de rutas locales, almacenamiento no configurado, normalización de imagen y URL pública. Los tests móviles también pasaron con TZ=Pacific/Auckland y TZ=America/Los_Angeles. Compilaron los bundles de Expo para Android y web. Los tests generan una imagen técnica en una carpeta temporal y no insertan mascotas ni datos de negocio en MySQL. Se verificó el esquema real y se aplicó la extensión de raza.

La prueba completa de crear/editar con foto, reiniciar Railway y recuperar la foto desde otro dispositivo requiere configurar el bucket privado y desplegar. La interacción física en Android/Expo Go y la revisión visual en claro/oscuro quedan pendientes: la compilación de bundles no equivale a esas pruebas.

Se revisaron globalmente mock/fake/sample/demo/dummy/placeholderData/testData y los arrays introducidos: solamente fixtures exclusivos de tests, etiquetas de interfaz y mecanismos de seguridad existentes. No se agregaron datos funcionales de demostración ni alerts.

