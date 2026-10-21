-- Permite banners de imagen pura sin exigir un título de texto.
ALTER TABLE client_store_banners
  MODIFY COLUMN title VARCHAR(160) NULL;
