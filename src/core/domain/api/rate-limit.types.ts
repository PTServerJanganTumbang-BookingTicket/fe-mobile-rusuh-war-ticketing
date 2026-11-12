/**
 * Rate Limit Types
 *
 * Rate limit response primitives for client handling.
 * Contract Evidence: Standard API rate limiting headers
 *
 * @module core/domain/api/rate-limit.types
 */

/**
 * Rate limit info extracted from 429 responses.
 * R12-AC1: Includes retry_after_ms?
 * R12-AC3: Supports forward-compatible extension
 */
export interface RateLimitInfo {
  /** Milliseconds to wait before retrying */
  retry_after_ms?: number;
  /** Remaining requests in current window (if available) */
  remaining?: number;
  /** Rate limit window reset timestamp (if available) */
  reset_at?: string;
}

/**
 * Default retry delay when retry_after_ms not provided.
 * 5 seconds is a reasonable backoff for rate-limited requests.
 */
export const DEFAULT_RETRY_AFTER_MS = 5_000;

/**
 * Parse rate limit info from response headers.
 * R12-AC2: Rate limit info extractable from 429 responses
 *
 * @param headers - Response headers object
 * @returns Rate limit info if available
 */
export function parseRateLimitHeaders(
  headers: Record<string, string | undefined>
): RateLimitInfo {
  const info: RateLimitInfo = {};

  // Retry-After header (seconds)
  const retryAfter = headers["retry-after"] || headers["Retry-After"];
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds)) {
      info.retry_after_ms = seconds * 1000;
    }
  }

  // X-RateLimit-Remaining header
  const remaining =
    headers["x-ratelimit-remaining"] || headers["X-RateLimit-Remaining"];
  if (remaining) {
    const count = parseInt(remaining, 10);
    if (!Number.isNaN(count)) {
      info.remaining = count;
    }
  }

  // X-RateLimit-Reset header
  const resetAt = headers["x-ratelimit-reset"] || headers["X-RateLimit-Reset"];
  if (resetAt) {
    info.reset_at = resetAt;
  }

  return info;
}

/**
 * Get retry delay in milliseconds.
 *
 * @param info - Rate limit info from response
 * @returns Delay in milliseconds
 */
export function getRetryDelayMs(info: RateLimitInfo): number {
  return info.retry_after_ms ?? DEFAULT_RETRY_AFTER_MS;
}

/**
 * Check if rate limited (429 status).
 */
export function isRateLimited(status: number): boolean {
  return status === 429;
}
