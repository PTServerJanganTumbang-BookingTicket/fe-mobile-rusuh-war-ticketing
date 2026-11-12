/**
 * API Error Types
 *
 * Discriminated union for API error codes with forward-compatibility.
 * Contract Evidence: docs/CONTRACT-BASELINE.md §6.3
 *
 * @module core/domain/api/error.types
 */

/**
 * Known API error codes.
 * R2-AC1: All known error codes listed
 */
export type KnownApiErrorCode =
  | "DEVICE_ID_REQUIRED" // Guest missing X-Device-Id
  | "CAPTCHA_REQUIRED" // Missing captcha_token
  | "QUEUE_FULL" // Queue capacity reached (503)
  | "FULL_BOOKED" // Inventory exhaustion (409)
  | "DEVICE_MISMATCH" // Device ID doesn't match
  | "GRANT_TOKEN_INVALID" // Invalid grant token
  | "NIK_ALREADY_USED" // NIK already used for this event
  | "DUKCAPIL_UNAVAILABLE"; // NIK validation service unavailable

/**
 * Forward-compatible API error code type.
 * R2-AC3: Unknown error codes are representable without type error
 *
 * Using intersection with empty object to enable autocompletion
 * for known codes while accepting any string.
 */
export type ApiErrorCode = KnownApiErrorCode | (string & {});

/**
 * HTTP status codes associated with API errors.
 */
export type ApiErrorStatus =
  400 | 401 | 403 | 404 | 409 | 410 | 429 | 500 | 503;

/**
 * Structured API error.
 * R2-AC2: Associates HTTP status with error code
 */
export interface ApiError {
  /** HTTP status code */
  status: ApiErrorStatus | number;
  /** Error code from response */
  code: ApiErrorCode;
  /** Human-readable error message */
  message: string;
  /** Optional additional data (e.g., queue_state on 503) */
  data?: Record<string, unknown>;
}

/**
 * Error code to HTTP status mapping for known codes.
 * Used for predictable error handling.
 */
export const ERROR_STATUS_MAP: Record<KnownApiErrorCode, ApiErrorStatus> = {
  DEVICE_ID_REQUIRED: 400,
  CAPTCHA_REQUIRED: 400,
  QUEUE_FULL: 503,
  FULL_BOOKED: 409,
  DEVICE_MISMATCH: 400,
  GRANT_TOKEN_INVALID: 401,
  NIK_ALREADY_USED: 409,
  DUKCAPIL_UNAVAILABLE: 503,
};

/**
 * All known error codes as array for validation.
 */
export const KNOWN_API_ERROR_CODES: readonly KnownApiErrorCode[] = [
  "DEVICE_ID_REQUIRED",
  "CAPTCHA_REQUIRED",
  "QUEUE_FULL",
  "FULL_BOOKED",
  "DEVICE_MISMATCH",
  "GRANT_TOKEN_INVALID",
  "NIK_ALREADY_USED",
  "DUKCAPIL_UNAVAILABLE",
];

/**
 * Check if error code is a known code.
 * R2-AC4: Error code is extractable with type safety
 */
export function isKnownErrorCode(code: string): code is KnownApiErrorCode {
  return KNOWN_API_ERROR_CODES.includes(code as KnownApiErrorCode);
}

/**
 * Create an ApiError from raw response data.
 */
export function createApiError(
  status: number,
  code: string,
  message: string,
  data?: Record<string, unknown>
): ApiError {
  return {
    status,
    code,
    message,
    data,
  };
}

/**
 * Check if error is a queue capacity error (retryable).
 */
export function isQueueFullError(error: ApiError): boolean {
  return error.code === "QUEUE_FULL";
}

/**
 * Check if error is an inventory exhaustion error.
 */
export function isFullBookedError(error: ApiError): boolean {
  return error.code === "FULL_BOOKED";
}

/**
 * Check if error is related to authentication.
 */
export function isAuthError(error: ApiError): boolean {
  return error.status === 401 || error.code === "GRANT_TOKEN_INVALID";
}

/**
 * Check if error is a guest device requirement error.
 */
export function isDeviceRequiredError(error: ApiError): boolean {
  return error.code === "DEVICE_ID_REQUIRED";
}
