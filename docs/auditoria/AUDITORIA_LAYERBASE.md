# Auditoría de Layerbase

## Alcance y conexión

Se confirmó primero que el `backend/.env` local indica `NODE_ENV=development`, tiene host configurado que coincide con Layerbase y solicita `DB_SSL_MODE=verify_identity`. El nombre del host y las credenciales no se publican en este informe. La conexión exitosa corresponde al entorno definido por ese `.env`; no se verificó que sea distinto de producción, porque `PETCARE_EXPECTED_DB_HOST` y `PETCARE_EXPECTED_DB_NAME` no estaban configurados. La auditoría se limitó a `SELECT` e `information_schema`; no ejecutó DDL, DML, migraciones, seeds ni consultas de filas de negocio.

Resultado de `npm run db:check`: conexión disponible. La auditoría de esquema produjo `auditComplete=true`, sin secciones omitidas, errores ni warnings:

| Metadato | Resultado |
|---|---:|
| Motor/versión | MariaDB 11.8.9 |
| Base seleccionada | `petcare` |
| Tablas | 53 |
| Columnas | 433 |
| Constraints | 203 |
| Constraints CHECK | 31 |
| Índices | 199 |

## Inventario de tablas

| Área | Tablas observadas |
|---|---|
| Identidad, roles y permisos | `users`, `roles`, `permissions`, `permission_modules`, `role_permissions`, `user_permissions`, `professional_types` |
| OAuth, sesión y verificación | `oauth_accounts`, `oauth_attempts`, `refresh_tokens`, `email_verifications`, `password_resets`, `auth_schema_migrations`, `password_reset_schema_migrations`, `employee_password_schema_migrations` |
| Mascotas y clínica | `pets`, `species`, `breeds`, `client_pet_details`, `veterinarians`, `veterinarian_patients`, `veterinarian_specialties`, `veterinarian_invitations`, `specialties`, `professional_services`, `professional_blocks`, `client_services`, `client_appointments`, `client_appointment_slots`, `client_clinical_records`, `client_grooming_records`, `clinic_schema_migrations` |
| Tienda, reservas y pagos | `client_products`, `client_product_categories`, `client_product_change_history`, `client_product_stock_movements`, `client_promotions`, `client_cart_items`, `client_orders`, `client_order_items`, `client_order_status_history`, `client_delivery_addresses`, `client_store_delivery_zones`, `client_store_fulfillment_settings`, `client_store_payment_intents`, `client_store_banners`, `client_general_information` |
| Notificaciones | `client_notifications`, `client_notification_email_deliveries`, `client_notification_preferences`, `client_notification_push_deliveries`, `client_push_tokens` |
| Migración cliente | `client_schema_migrations` |

El inventario de tablas procede de `information_schema.TABLES` en la conexión actual. Las cinco tablas push/preferencias siguen existiendo como esquema histórico, pero el código actual no consulta ni altera tokens/envíos push. No se eliminaron tablas ni filas.

## Relaciones e integridad

La metadata mostró claves foráneas para las entidades centrales, entre ellas:

- `users` ↔ `roles`, `professional_types`, `refresh_tokens`, permisos directos y cuentas OAuth.
- `pets` → `users`, `species`, `breeds`; `breeds` → `species`.
- `client_appointments` → propietario, mascota y turno; `client_appointment_slots` → servicio y profesional.
- Registros clínicos y de peluquería → mascota, veterinario/profesional y turno; el vínculo opcional con turno usa `SET NULL`.
- Tablas puente `role_permissions`, `user_permissions`, `professional_services`, `veterinarian_specialties` y `veterinarian_patients` relacionan entidades con clave foránea.
- Pedidos, ítems, cambios de estado, comprobantes y direcciones mantienen relaciones explícitas con propietarios, pedidos, productos, mascotas y actores administrativos.
- Notificaciones → usuario; entregas de correo → notificación. Las tablas push históricas tienen FKs a tokens/notificaciones.

Se observaron reglas `RESTRICT`, `CASCADE` y `SET NULL` según el ciclo de vida; no se detectó una base carente de relaciones. El snapshot de auditoría consultó 203 constraints y 31 checks. Esto no prueba por sí mismo que todas las reglas funcionales sean correctas; exige revisar las decisiones de borrado y las transacciones por entidad.

## Normalización

### 1FN

La metadata usa columnas SQL tipadas, claves primarias y relaciones; no se observaron tablas multivaluadas a nivel de constraints. Esto es evidencia favorable, pero no certifica que cada valor sea atómico ni que no existan columnas de texto que empaqueten varias entidades. Se debe revisar cada tipo y significado de columna y los formatos libres de campos clínicos.

**Resultado: CUMPLE PARCIALMENTE / no certificable de forma formal con metadata solamente.**

### 2FN

Las tablas puente y tablas de historial indican separación de relaciones. Para demostrar 2FN hay que conocer cada clave candidata compuesta y verificar que todo atributo no clave dependa de la clave completa. Los metadatos acreditan índices/constraints, pero no determinan dependencias funcionales; faltan los SQL canónicos que permitían revisar la intención del diseño.

**Resultado: NO VERIFICADO formalmente.**

### 3FN

Las entidades separadas (`species`/`breeds`, `roles`/`permissions`, `products`/`categories`, `orders`/`order_items`) y las tablas de enlace son compatibles con una estructura normalizada. En pedidos y cambios históricos puede ser intencional guardar descripciones/importes snapshot para conservar el estado histórico; eso debe documentarse como desnormalización deliberada y no inferirse solo del nombre de la tabla. Sin DDL completo ni dependencias funcionales, no se afirma 3FN.

**Resultado: NO VERIFICADO formalmente.**

## Migraciones y deriva

En Layerbase se consultaron cinco ledgers, todos con registros en estado `applied`:

- `auth_schema_migrations`: `001_oauth_sessions.sql`.
- `client_schema_migrations`: versiones `001` a `016`, incluyendo `007_notification_push_schema.sql`, `015_notification_preferences_and_visibility.sql` y `016_notification_email_deliveries.sql`.
- `clinic_schema_migrations`: `002_adopt_existing_clinic_schema.sql`.
- `employee_password_schema_migrations`: `001_must_change_password.sql`.
- `password_reset_schema_migrations`: `001_password_resets.sql`.

El responsable del proyecto confirma que la gestión de migraciones ocurre fuera de este repositorio y que ya verificó las migraciones remotas. Por decisión arquitectónica, la ausencia de `backend/migrations/` y `backend/client-migrations/` no es incumplimiento y no se recuperarán ni crearán SQL locales en esta etapa. Los scripts `migration-runner.ts`, `migration-files.ts` y `client-migrate.ts` sí esperan esas rutas si se invocan; se documenta la dependencia para que no se ejecuten accidentalmente desde este checkout. No se ejecutaron scripts de migración, no se intentó comparar checksums locales inexistentes y no se alteró Layerbase. La auditoría estructural de solo lectura sigue siendo evidencia sobre el esquema observado, independiente de la gestión externa de migraciones. El inventario heurístico de referencias SQL devolvió falsos positivos y no se usó para declarar tablas faltantes.

### Recomendaciones para esquema

1. Mantener documentado el procedimiento externo de migraciones y evitar invocar comandos locales que esperan fuentes SQL no presentes.
2. Documentar explícitamente snapshots de pedido y cualquier desnormalización histórica.
3. Mantener la autenticación DB con permisos mínimos, TLS verificado y copias restaurables probadas. Esta auditoría no evaluó grants de la cuenta ni backups.
4. No borrar las tablas push históricas hasta tener un cambio de esquema aprobado, backup verificable y comprobación de referencias; no son necesarias para el centro interno pero su ciclo de vida productivo queda fuera del cambio solicitado.
