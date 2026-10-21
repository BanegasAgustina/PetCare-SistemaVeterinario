-- Registra niveles mínimos y movimientos explícitos de inventario; conserva el stock y los productos existentes.
ALTER TABLE client_products
  ADD COLUMN IF NOT EXISTS stock_minimum INT UNSIGNED NOT NULL DEFAULT 0;
-- petcare:statement
CREATE TABLE IF NOT EXISTS client_product_stock_movements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NOT NULL,
  quantity_before INT UNSIGNED NOT NULL,
  quantity_after INT UNSIGNED NOT NULL,
  quantity_delta BIGINT NOT NULL,
  reason VARCHAR(250) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_product_stock_history (product_id,created_at,id),
  CONSTRAINT fk_product_stock_movement_product FOREIGN KEY (product_id) REFERENCES client_products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_product_stock_movement_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
