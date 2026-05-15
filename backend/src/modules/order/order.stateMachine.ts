import { OrderStatus } from '@prisma/client';
import { AppError } from '@/middlewares/errorHandler';

/**
 * ORDER STATE MACHINE
 * 
 * Valid transitions:
 * PENDING       → SEARCHING | CANCELLED
 * SEARCHING     → WAITING_ACCEPT | FAILED | CANCELLED
 * WAITING_ACCEPT → MECHANIC_ACCEPTED | SEARCHING | CANCELLED
 * MECHANIC_ACCEPTED → OTW | CANCELLED
 * OTW           → ARRIVED
 * ARRIVED       → IN_PROGRESS
 * IN_PROGRESS   → COMPLETED
 * COMPLETED     → (terminal)
 * CANCELLED     → (terminal)
 * FAILED        → (terminal)
 */

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:           ['SEARCHING', 'CANCELLED'],
  SEARCHING:         ['WAITING_ACCEPT', 'FAILED', 'CANCELLED'],
  WAITING_ACCEPT:    ['MECHANIC_ACCEPTED', 'SEARCHING', 'CANCELLED'],
  MECHANIC_ACCEPTED: ['OTW', 'CANCELLED'],
  OTW:               ['ARRIVED'],
  ARRIVED:           ['IN_PROGRESS'],
  IN_PROGRESS:       ['COMPLETED'],
  COMPLETED:         [],
  CANCELLED:         [],
  FAILED:            [],
};

export const validateTransition = (
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): void => {
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(
      `Transisi status tidak valid: ${currentStatus} → ${nextStatus}`,
      400
    );
  }
};

export const getTimestampField = (status: OrderStatus): string | null => {
  const map: Partial<Record<OrderStatus, string>> = {
    MECHANIC_ACCEPTED: 'acceptedAt',
    ARRIVED:           'arrivedAt',
    IN_PROGRESS:       'startedAt',
    COMPLETED:         'completedAt',
    CANCELLED:         'cancelledAt',
  };
  return map[status] ?? null;
};
