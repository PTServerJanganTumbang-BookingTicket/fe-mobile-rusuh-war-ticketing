/**
 * Payment Domain Rules
 *
 * GH-13: Business rules for payment retry and status transitions.
 * Domain layer imports ONLY TypeScript — no React, React Native, or external libs.
 *
 * @module features/payment/domain/payment.rules
 */

import { PaymentStatus } from "./payment-status.types";

/** Terminal statuses that cannot transition further */
export const TERMINAL_STATUSES: readonly PaymentStatus[] = [
  PaymentStatus.PAID,
  PaymentStatus.FAILED,
  PaymentStatus.EXPIRED,
] as const;

/** Maximum retry attempts allowed */
export const MAX_PAYMENT_ATTEMPTS = 5;

/** Minimum time remaining to allow retry (ms) */
export const MIN_RETRY_REMAINING_MS = 60_000; // 60 seconds

/**
 * Check if payment status is terminal (no further transitions).
 */
export function isTerminalStatus(status: PaymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

/**
 * Check if payment can be retried based on status and attempts.
 */
export function canRetryPayment(
  status: PaymentStatus,
  currentAttempt: number,
  maxAttempts: number = MAX_PAYMENT_ATTEMPTS
): boolean {
  if (isTerminalStatus(status)) return false;
  return currentAttempt < maxAttempts;
}

/**
 * Check if enough time remains for a retry.
 */
export function hasTimeForRetry(
  remainingMs: number,
  minRetryMs: number = MIN_RETRY_REMAINING_MS
): boolean {
  return remainingMs >= minRetryMs;
}
