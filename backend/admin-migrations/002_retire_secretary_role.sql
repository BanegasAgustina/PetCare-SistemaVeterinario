-- PETCARE — retiro manual del rol SECRETARY.
-- No automatizar ni ejecutar en producción sin autorización expresa.
-- Esta operación mueve TODAS las cuentas SECRETARY, incluidas las inactivas, a ADMIN.
-- Esto amplía sus privilegios al alcance del rol ADMIN por decisión del responsable.
-- Invalida sesiones al incrementar users.session_version y conserva el resto del historial.
-- Prerrequisitos: probar en una copia; confirmar un único rol ADMIN y SECRETARY;
-- confirmar que admin_sensitive_action_audit tiene las columnas usadas aquí;
-- revisar el conteo de cuentas en la consulta previa antes de ejecutar la transacción.

-- PREVUELO SOLO LECTURA: ejecutar por separado y revisar sus resultados.
-- SELECT code, COUNT(*) AS total FROM roles WHERE code IN ('ADMIN','SECRETARY') GROUP BY code;
-- SELECT COUNT(*) AS accounts_to_reassign FROM users u JOIN roles r ON r.id=u.role_id WHERE r.code='SECRETARY';
-- SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
-- FROM information_schema.COLUMNS
-- WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='admin_sensitive_action_audit'
--   AND COLUMN_NAME IN ('actor_user_id','action_code','entity_type','entity_id','entity_label','result_code');
-- No continuar si falta uno de los roles, el conteo es inesperado o la estructura no coincide.

START TRANSACTION;

SET @petcare_admin_role_id := (SELECT id FROM roles WHERE code='ADMIN' LIMIT 1);
SET @petcare_secretary_role_id := (SELECT id FROM roles WHERE code='SECRETARY' LIMIT 1);
SELECT @petcare_admin_role_id IS NOT NULL AS admin_role_found,
       @petcare_secretary_role_id IS NOT NULL AS legacy_secretary_role_found;

CREATE TEMPORARY TABLE petcare_secretary_users_to_migrate AS
SELECT id, first_name, last_name, session_version
FROM users
WHERE role_id=@petcare_secretary_role_id;

-- Auditoría de la reasignación por cuenta. actor_user_id NULL indica una migración
-- operativa sin actor humano individual; no se inventa una identidad de operador.
INSERT INTO admin_sensitive_action_audit
  (actor_user_id, action_code, entity_type, entity_id, entity_label, result_code)
SELECT NULL, 'ROLE_MIGRATED', 'USER', CAST(id AS CHAR),
       CONCAT(first_name, ' ', last_name, ' (SECRETARY -> ADMIN)'), 'SUCCESS'
FROM petcare_secretary_users_to_migrate
WHERE @petcare_admin_role_id IS NOT NULL;

UPDATE users u
JOIN petcare_secretary_users_to_migrate m ON m.id=u.id
SET u.role_id=@petcare_admin_role_id,
    u.session_version=u.session_version+1
WHERE @petcare_admin_role_id IS NOT NULL;

DELETE FROM role_permissions
WHERE role_id=@petcare_secretary_role_id AND @petcare_admin_role_id IS NOT NULL;
DELETE FROM roles
WHERE id=@petcare_secretary_role_id AND code='SECRETARY'
  AND @petcare_admin_role_id IS NOT NULL;

-- COMPROBACIONES DENTRO DE LA TRANSACCIÓN: deben dar 0 cuentas y 0 roles SECRETARY,
-- y las cuentas reasignadas deben coincidir con las auditorías ROLE_MIGRATED.
SELECT COUNT(*) AS remaining_secretary_accounts
FROM users u JOIN roles r ON r.id=u.role_id WHERE r.code='SECRETARY';
SELECT COUNT(*) AS remaining_secretary_roles FROM roles WHERE code='SECRETARY';
SELECT COUNT(*) AS migrated_accounts FROM petcare_secretary_users_to_migrate;
SELECT COUNT(*) AS migration_audit_events
FROM admin_sensitive_action_audit
WHERE action_code='ROLE_MIGRATED' AND entity_type='USER'
  AND entity_label LIKE '%(SECRETARY -> ADMIN)';

-- Revisar resultados antes de confirmar. Ejecutar COMMIT solo si coinciden todos;
-- ante cualquier diferencia, ejecutar ROLLBACK. No aplicar desde la aplicación.
