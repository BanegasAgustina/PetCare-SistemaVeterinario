-- Agrega datos bancarios a la configuración comercial singleton ya existente.
ALTER TABLE client_store_fulfillment_settings
  ADD COLUMN IF NOT EXISTS bank_name VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(160) NULL,
  ADD COLUMN IF NOT EXISTS bank_cbu_cvu VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS bank_alias VARCHAR(80) NULL;
-- petcare:statement
ALTER TABLE client_orders
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(120) NULL;
