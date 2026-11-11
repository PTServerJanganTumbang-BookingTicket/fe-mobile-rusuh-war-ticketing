/**
 * API Envelope Types
 *
 * Standard API response envelope for success and error responses.
 * Contract Evidence: docs/CONTRACT-BASELINE.md §6.2
 *
 * @module core/domain/api/envelope.types
 */

/**
 * Metadata for successful API responses.
 * server_time is authoritative for TTL/countdown calculations.
 */
export interface ApiSuccessMeta {
  /** Authoritative server timestamp (ISO 8601) */
  server_time?: string;
  [key: string]: unknown;
}

/**
 * Success envelope type with generic payload support.
 * R1-AC1: Includes data: T, meta?: object with optional server_time
 * R1-AC3: Generic over payload type T
 */
export interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: ApiSuccessMeta;
}

/**
 * Error metadata with required error_code and message.
 * R1-AC2: Includes error_code: string, message: string
 */
export interface ApiErrorMeta {
  error_code: string;
  message: string;
  [key: string]: unknown;
}

/**
 * Optional data in error responses (e.g., queue_state on 503).
 */
export interface ApiErrorData {
  queue_state?: string;
  [key: string]: unknown;
}

/**
 * Error envelope type for API error responses.
 * R1-AC2: Error envelope includes meta.error_code and meta.message
 */
export interface ApiErrorEnvelope {
  meta: ApiErrorMeta;
  data?: ApiErrorData;
}

/**
 * Type guard for success envelope.
 */
export function isSuccessEnvelope<T>(
  response: ApiSuccessEnvelope<T> | ApiErrorEnvelope
): response is ApiSuccessEnvelope<T> {
  if (!("meta" in response) || response.meta === undefined) {
    return "data" in response;
  }
  return "data" in response && !("error_code" in response.meta);
}

/**
 * Type guard for error envelope.
 */
export function isErrorEnvelope(
  response: ApiSuccessEnvelope<unknown> | ApiErrorEnvelope
): response is ApiErrorEnvelope {
  return (
    "meta" in response &&
    response.meta !== undefined &&
    "error_code" in response.meta
  );
}

/**
 * Extract server_time from a success envelope.
 * Returns undefined if not present.
 */
export function extractServerTime<T>(
  envelope: ApiSuccessEnvelope<T>
): string | undefined {
  return envelope.meta?.server_time;
}
