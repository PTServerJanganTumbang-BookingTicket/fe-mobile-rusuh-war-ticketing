/**
 * Payment Status Types
 *
 * GH-13: Domain types for payment status.
 * Domain layer imports ONLY TypeScript — no React, React Native, or external libs.
 *
 * @module features/payment/domain/payment-status.types
 */

/**
 * Payment status values.
 * Derived from backend state machine:
 * - PENDING: Payment initiated, awaiting user action
 * - PAID: Payment confirmed
 * - FAILED: Payment attempt failed
 * - EXPIRED: Payment window closed
 */
export const PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/**
 * All valid payment statuses for validation.
 */
export const VALID_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  PaymentStatus.PENDING,
  PaymentStatus.PAID,
  PaymentStatus.FAILED,
  PaymentStatus.EXPIRED,
];

/**
 * Terminal payment statuses (cannot transition further).
 */
export const TERMINAL_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  PaymentStatus.PAID,
  PaymentStatus.EXPIRED,
];

/**
 * Type guard for valid PaymentStatus.
 */
export function isValidPaymentStatus(value: unknown): value is PaymentStatus {
  return VALID_PAYMENT_STATUSES.includes(value as PaymentStatus);
}

/**
 * Check if payment status is terminal (no further transitions).
 */
export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return TERMINAL_PAYMENT_STATUSES.includes(status);
}

/**
 * Retry information for failed payments.
 */
export interface RetryInfo {
  /** Number of retries remaining */
  retriesRemaining: number;
  /** ISO 8601 timestamp when next retry is allowed */
  nextRetryAt?: string;
}

/**
 * Payment status result from status poll.
 */
export interface PaymentStatusResult {
  /** Current payment status */
  status: PaymentStatus;
  /** Whether retry is allowed (only for FAILED status) */
  canRetry: boolean;
  /** Retry information when canRetry is true */
  retryInfo?: RetryInfo;
  /** ISO 8601 timestamp when payment was initiated */
  initiatedAt: string;
  /** ISO 8601 timestamp when payment expires */
  expiresAt: string;
  /** ISO 8601 timestamp when status was last updated */
  updatedAt: string;
  /** Server time for TTL calculation */
  serverTime: string;
}

/**
 * Type guard for valid PaymentStatusResult.
 */
export function isValidPaymentStatusResult(
  value: unknown
): value is PaymentStatusResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    isValidPaymentStatus(result.status) &&
    typeof result.canRetry === "boolean" &&
    typeof result.initiatedAt === "string" &&
    typeof result.expiresAt === "string" &&
    typeof result.updatedAt === "string" &&
    typeof result.serverTime === "string"
  );
}
