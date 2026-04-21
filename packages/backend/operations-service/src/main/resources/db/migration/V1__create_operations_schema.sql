CREATE TABLE reservations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  branch_id UUID NOT NULL,
  branch_name_snapshot VARCHAR(80) NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  guests INTEGER NOT NULL,
  depth_level VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL,
  special_request_encrypted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  branch_id UUID,
  branch_name_snapshot VARCHAR(80),
  reservation_id UUID,
  fulfillment_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  payment_status VARCHAR(20) NOT NULL,
  delivery_address_encrypted TEXT,
  contact_name_encrypted TEXT,
  total_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL,
  name_snapshot VARCHAR(80) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  note_encrypted TEXT
);

CREATE INDEX idx_reservations_user_id ON reservations (user_id);
CREATE INDEX idx_reservations_status ON reservations (status);
CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_orders_status ON orders (status);
