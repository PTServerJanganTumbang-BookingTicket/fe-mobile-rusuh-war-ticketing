/**
 * Payment TTL Calculation Utilities
 *
 * GH-13 R7: TTL countdown utilities for payment expiration.
 * Re-exports core time utilities for payment-specific use.
 * Recalculates from timestamp (not decrement) to survive app backgrounding.
 *
 * @module features/payment/domain/payment-ttl.utils
 */

// Re-export core time utilities for payment domain use
export {
  remainingMs,
  serverOffsetMs,
  getExpiryInfo,
  parseServerTime,
} from "@/core/domain/time/server-time.utils";

export type {
  ExpiryInfo,
  ParsedServerTime,
} from "@/core/domain/time/server-time.types";

/** Default payment TTL in seconds (10 minutes) */
export const PAYMENT_TTL_SECONDS = 600;

/** Default payment TTL in milliseconds */
export const PAYMENT_TTL_MS = PAYMENT_TTL_SECONDS * 1000;
