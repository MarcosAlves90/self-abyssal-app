CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email_hash VARCHAR(64) NOT NULL UNIQUE,
  email_encrypted TEXT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  phone_encrypted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_addresses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(40) NOT NULL,
  postal_code_encrypted TEXT NOT NULL,
  street_encrypted TEXT NOT NULL,
  number_encrypted TEXT NOT NULL,
  complement_encrypted TEXT,
  neighborhood_encrypted TEXT NOT NULL,
  city_encrypted TEXT NOT NULL,
  state_encrypted TEXT NOT NULL,
  summary_encrypted TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_addresses_user_id ON user_addresses (user_id);
