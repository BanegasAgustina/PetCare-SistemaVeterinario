# Historial del estado de mascotas

La funcionalidad agrega una tabla aditiva: `pet_lifecycle_history`. Cada transición activo/inactivo almacena la mascota, estado anterior y nuevo, usuario responsable, rol, motivo y fecha. Las claves foráneas usan `ON DELETE RESTRICT` para preservar trazabilidad.

## Aplicación

La migración está preparada en `pet-lifecycle-migrations/001_pet_lifecycle_history.sql` y **no fue ejecutada**. Antes de aplicarla, el operador debe confirmar en la base de destino que `pets.id` y `users.id` sean `BIGINT UNSIGNED`, que ambas tablas existan y que no exista ya una tabla homónima con una definición diferente. Después de aplicar el SQL, desplegar el backend y el cliente en una ventana coordinada. No modifica ni cancela turnos, mascotas, ni registros clínicos existentes.

El checkout no incluye la secuencia histórica completa de migraciones del proveedor; por eso este archivo queda como migración explícita y separada, sin alterar checksums históricos ni ejecutar el runner general.
