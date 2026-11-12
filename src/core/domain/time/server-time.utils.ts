/**
 * Server Time Utilities
 *
 * Pure functions for server-authoritative time offset calculation.
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.1, _handoff/B-web-lessons.md §2
 *
 * @module core/domain/time/server-time.utils
 */

import type { ExpiryInfo, ParsedServerTime } from "./server-time.types";

/**
 * Calculate offset between server and client time.
 *
 * R5-AC1: serverOffsetMs(serverTimeMs, clientNowMs) calculates offset
 * R5-AC3: Pure function with no side effects
 * R5-AC4: When server is ahead, offset is positive
 *
 * @param serverTimeMs - Server timestamp in milliseconds since epoch
 * @param clientNowMs - Client timestamp in milliseconds since epoch
 * @returns Offset in milliseconds (positive = server ahead, negative = server behind)
 */
export function serverOffsetMs(
  serverTimeMs: number,
  clientNowMs: number
): number {
  return serverTimeMs - clientNowMs;
}

/**
 * Calculate remaining time until expiry, accounting for server-client offset.
 *
 * R5-AC2: remainingMs(expiresAt, clientNowMs, offsetMs) calculates remaining time
 * R5-AC3: Pure function with no side effects
 * R5-AC4: Accounts for drift via offsetMs
 * R5-AC5: Returns 0 (not negative) when expired
 *
 * @param expiresAt - ISO 8601 expiry timestamp string
 * @param clientNowMs - Current client time in milliseconds
 * @param offsetMs - Server-client offset from serverOffsetMs()
 * @returns Remaining milliseconds (0 if expired, never negative)
 */
export function remainingMs(
  expiresAt: string,
  clientNowMs: number,
  offsetMs: number
): number {
  const expiresAtMs = Date.parse(expiresAt);

  // Handle invalid date string
  if (Number.isNaN(expiresAtMs)) {
    return 0;
  }

  // Adjust client time by offset to get server-equivalent time
  const serverEquivalentNowMs = clientNowMs + offsetMs;
  const remaining = expiresAtMs - serverEquivalentNowMs;

  // R5-AC5: Return 0, not negative
  return Math.max(0, remaining);
}

/**
 * Parse server_time string and calculate offset against client time.
 *
 * @param serverTimeStr - ISO 8601 server timestamp string
 * @param clientNowMs - Client timestamp when server time was received
 * @returns Parsed server time with offset, or null if parsing fails
 */
export function parseServerTime(
  serverTimeStr: string,
  clientNowMs: number
): ParsedServerTime | null {
  const serverTimeMs = Date.parse(serverTimeStr);

  if (Number.isNaN(serverTimeMs)) {
    return null;
  }

  return {
    serverTimeMs,
    clientReceivedMs: clientNowMs,
    offsetMs: serverOffsetMs(serverTimeMs, clientNowMs),
  };
}

/**
 * Calculate expiry info with remaining time and expired status.
 *
 * @param expiresAt - ISO 8601 expiry timestamp string
 * @param clientNowMs - Current client time in milliseconds
 * @param offsetMs - Server-client offset
 * @returns Expiry info with remainingMs and isExpired flag
 */
export function getExpiryInfo(
  expiresAt: string,
  clientNowMs: number,
  offsetMs: number
): ExpiryInfo {
  const remaining = remainingMs(expiresAt, clientNowMs, offsetMs);
  return {
    remainingMs: remaining,
    isExpired: remaining === 0,
  };
}
