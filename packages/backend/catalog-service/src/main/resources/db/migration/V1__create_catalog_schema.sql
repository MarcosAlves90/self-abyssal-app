CREATE TABLE branches (
  id UUID PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  city VARCHAR(80) NOT NULL,
  neighborhood VARCHAR(80) NOT NULL,
  address_line VARCHAR(120) NOT NULL,
  open_hours VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branch_reservation_depths (
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  depth_level VARCHAR(40) NOT NULL
);

CREATE TABLE menu_items (
  id UUID PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(300) NOT NULL,
  category VARCHAR(20) NOT NULL,
  price_cents INTEGER NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  image_hint VARCHAR(80),
  available_for_delivery BOOLEAN NOT NULL DEFAULT TRUE,
  available_for_dine_in BOOLEAN NOT NULL DEFAULT TRUE,
  accent_color VARCHAR(20) NOT NULL DEFAULT '#31e7ff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_branches_city ON branches (city);
CREATE INDEX idx_menu_items_category ON menu_items (category);
