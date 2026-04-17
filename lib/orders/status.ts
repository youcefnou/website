export type AdminOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'cancelled';

export type DbOrderStatus = 'pending' | 'confirmed' | 'delivered' | 'canceled';

/**
 * Normalize database or admin status values to admin-facing statuses.
 * Accepts DbOrderStatus to maintain compatibility with existing persisted values.
 */
export function normalizeStatus(
  status: AdminOrderStatus | DbOrderStatus
): AdminOrderStatus {
  if (status === 'delivered') return 'shipped';
  if (status === 'canceled') return 'cancelled';
  return status as AdminOrderStatus;
}

export function toDbStatus(status: AdminOrderStatus | DbOrderStatus): DbOrderStatus {
  if (status === 'shipped') return 'delivered';
  if (status === 'cancelled') return 'canceled';
  if (status === 'delivered' || status === 'canceled') return status;
  return status as DbOrderStatus;
}

export function isAllowedAdminStatus(value: string): value is AdminOrderStatus {
  return ['pending', 'confirmed', 'shipped', 'cancelled'].includes(value);
}
