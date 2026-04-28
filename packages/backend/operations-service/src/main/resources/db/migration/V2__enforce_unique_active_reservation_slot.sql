CREATE UNIQUE INDEX uk_reservations_active_slot
  ON reservations (branch_id, scheduled_at, depth_level)
  WHERE status <> 'CANCELLED';
