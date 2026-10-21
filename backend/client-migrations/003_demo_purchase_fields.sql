-- Los registros históricos se conservan como reservas. El pedido de demostración no implica pago ni retención de stock.
ALTER TABLE client_orders
  ADD COLUMN IF NOT EXISTS order_type ENUM('RESERVATION','DEMO_PURCHASE') NOT NULL DEFAULT 'RESERVATION',
  ADD COLUMN IF NOT EXISTS payment_status ENUM('NOT_APPLICABLE','DEMO_NOT_PAID','PAID') NOT NULL DEFAULT 'NOT_APPLICABLE';
