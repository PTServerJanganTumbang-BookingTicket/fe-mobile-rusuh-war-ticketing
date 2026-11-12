/**
 * Server Time Types
 *
 * Types for server-authoritative time handling.
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.1
 *
 * @module core/domain/time/server-time.types
 */

/**
 * Parsed server time with calculated offset.
 */
export interface ParsedServerTime {
  /** Server timestamp in milliseconds since epoch */
  serverTimeMs: number;
  /** Client timestamp when server time was received */
  clientReceivedMs: number;
  /** Calculated offset: serverTimeMs - clientReceivedMs */
  offsetMs: number;
}

/**
 * Expiry calculation result.
 */
export interface ExpiryInfo {
  /** Remaining time in milliseconds (0 if expired) */
  remainingMs: number;
  /** Whether the expiry has passed */
  isExpired: boolean;
}
