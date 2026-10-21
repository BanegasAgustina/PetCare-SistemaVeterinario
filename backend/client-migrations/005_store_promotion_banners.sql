-- Agrega contenido visual opcional a la promoción existente. Los banners siguen vinculados a una promoción de producto real.
ALTER TABLE client_promotions
  ADD COLUMN IF NOT EXISTS banner_image_url VARCHAR(2048) NULL,
  ADD COLUMN IF NOT EXISTS banner_subtitle VARCHAR(250) NULL,
  ADD COLUMN IF NOT EXISTS banner_cta_text VARCHAR(40) NOT NULL DEFAULT 'Ver producto';
