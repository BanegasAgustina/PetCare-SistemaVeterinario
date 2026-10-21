-- Persistencia técnica de identidad, intentos OAuth y renovación; no contiene datos de negocio.
CREATE TABLE oauth_accounts (
  provider VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  subject VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (provider, subject),
  UNIQUE KEY uq_oauth_user_provider (user_id, provider),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
-- petcare:statement
CREATE TABLE refresh_tokens (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  family_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  session_version INT UNSIGNED NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  consumed_at DATETIME(3) NULL,
  revoked_at DATETIME(3) NULL,
  INDEX refresh_user (user_id), INDEX refresh_family (family_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
-- petcare:statement
CREATE TABLE oauth_attempts (
  state_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  provider VARCHAR(16) NOT NULL,
  proof_challenge CHAR(43) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  provider_verifier VARCHAR(128) NOT NULL,
  return_url VARCHAR(512) NOT NULL,
  link_user_id BIGINT UNSIGNED NULL,
  link_session_version INT UNSIGNED NULL,
  link_family_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  expires_at DATETIME(3) NOT NULL,
  callback_used_at DATETIME(3) NULL,
  ticket_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL UNIQUE,
  identity_json JSON NULL,
  consumed_at DATETIME(3) NULL,
  FOREIGN KEY (link_user_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
