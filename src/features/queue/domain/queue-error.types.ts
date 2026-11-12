/**
 * Queue Error Types
 *
 * GH-9 T1: Domain error types for Queue operations.
 * Pure TypeScript — no HTTP, SSE, or network imports.
 *
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.6, §2.7
 *
 * @module features/queue/domain/queue-error.types
 */

import type { QueueState } from "@/core/domain";

/**
 * Queue error codes covering transport and domain errors.
 *
 * Transport errors:
 * - NETWORK_ERROR: Network failure (timeout, DNS, connection refused)
 * - TIMEOUT_ERROR: Request timeout
 * - SSE_CONNECTION_ERROR: SSE connection failure
 * - UNKNOWN_ERROR: Unclassified error
 *
 * Domain errors (from CONTRACT-BASELINE.md):
 * - CAPTCHA_REQUIRED: 400, captcha token required for join (§2.6)
 * - CAPTCHA_FAILED: 400, captcha verification failed (§2.6)
 * - DEVICE_ID_REQUIRED: 400, X-Device-Id header required for guest (§2.7)
 * - QUEUE_FULL: 503, queue capacity reached (§2.3, maps to FULL_QUEUE)
 * - FULL_BOOKED: 409, inventory exhaustion (§2.3, maps to FULL_BOOKED)
 * - SALE_CLOSED: 410, sale has ended (§2.3, maps to CLOSED)
 * - UNAUTHORIZED: 401, authentication required
 * - TOKEN_INVALID: 401, queue token invalid or expired
 * - EVENT_NOT_FOUND: 404, event does not exist
 */
export type QueueErrorCode =
  // Transport errors
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "SSE_CONNECTION_ERROR"
  | "UNKNOWN_ERROR"
  // Domain errors from CONTRACT-BASELINE.md
  | "CAPTCHA_REQUIRED"
  | "CAPTCHA_FAILED"
  | "DEVICE_ID_REQUIRED"
  | "QUEUE_FULL"
  | "FULL_BOOKED"
  | "SALE_CLOSED"
  | "UNAUTHORIZED"
  | "TOKEN_INVALID"
  | "EVENT_NOT_FOUND";

/**
 * All valid queue error codes.
 */
export const QUEUE_ERROR_CODES = [
  "NETWORK_ERROR",
  "TIMEOUT_ERROR",
  "SSE_CONNECTION_ERROR",
  "UNKNOWN_ERROR",
  "CAPTCHA_REQUIRED",
  "CAPTCHA_FAILED",
  "DEVICE_ID_REQUIRED",
  "QUEUE_FULL",
  "FULL_BOOKED",
  "SALE_CLOSED",
  "UNAUTHORIZED",
  "TOKEN_INVALID",
  "EVENT_NOT_FOUND",
] as const satisfies readonly QueueErrorCode[];

/**
 * Retryable error codes — errors where retry may succeed.
 * - Transport errors are retryable
 * - QUEUE_FULL is retryable (temporary capacity)
 * - CAPTCHA errors may be retried with new token
 */
export const RETRYABLE_ERROR_CODES: readonly QueueErrorCode[] = [
  "NETWORK_ERROR",
  "TIMEOUT_ERROR",
  "SSE_CONNECTION_ERROR",
  "QUEUE_FULL",
  "CAPTCHA_REQUIRED",
  "CAPTCHA_FAILED",
];

/**
 * Terminal error codes — errors where no retry is possible.
 * - SALE_CLOSED: terminal
 * - EVENT_NOT_FOUND: terminal
 * - UNAUTHORIZED without refresh: terminal for session
 */
export const TERMINAL_ERROR_CODES: readonly QueueErrorCode[] = [
  "SALE_CLOSED",
  "EVENT_NOT_FOUND",
];

/**
 * Queue error domain type.
 *
 * R3-AC1 through R3-AC8: Maps HTTP errors to domain errors
 * R12-AC1 through R12-AC5: Maps transport errors distinctly
 */
export interface QueueError {
  /** Error code discriminator */
  readonly code: QueueErrorCode;
  /** Human-readable error message (no sensitive data) */
  readonly message: string;
  /** Whether this error is retryable */
  readonly retryable: boolean;
  /** HTTP status code if applicable */
  readonly httpStatus?: number;
  /** Queue state if error includes state transition (FULL_QUEUE, FULL_BOOKED, CLOSED) */
  readonly queueState?: QueueState;
}

/**
 * Type guard for valid QueueErrorCode.
 */
export function isValidQueueErrorCode(value: unknown): value is QueueErrorCode {
  return (
    typeof value === "string" &&
    QUEUE_ERROR_CODES.includes(value as QueueErrorCode)
  );
}

/**
 * Type guard for retryable errors.
 * R7-AC2: FULL_QUEUE is retryable (temporary, 503)
 */
export function isRetryableError(error: QueueError): boolean {
  return error.retryable;
}

/**
 * Type guard for terminal errors.
 * R7-AC4: CLOSED is terminal
 */
export function isTerminalError(error: QueueError): boolean {
  return TERMINAL_ERROR_CODES.includes(error.code);
}

/**
 * Type guard for transport errors (not domain errors).
 */
export function isTransportError(error: QueueError): boolean {
  return (
    error.code === "NETWORK_ERROR" ||
    error.code === "TIMEOUT_ERROR" ||
    error.code === "SSE_CONNECTION_ERROR"
  );
}

/**
 * Create a QueueError instance.
 * Ensures retryable flag is correctly set based on code.
 */
export function createQueueError(
  code: QueueErrorCode,
  message: string,
  options?: {
    httpStatus?: number;
    queueState?: QueueState;
  }
): QueueError {
  return {
    code,
    message,
    retryable: RETRYABLE_ERROR_CODES.includes(code),
    httpStatus: options?.httpStatus,
    queueState: options?.queueState,
  };
}

/**
 * Create a network error.
 */
export function createNetworkError(message: string): QueueError {
  return createQueueError("NETWORK_ERROR", message);
}

/**
 * Create a timeout error.
 */
export function createTimeoutError(message: string): QueueError {
  return createQueueError("TIMEOUT_ERROR", message);
}

/**
 * Create an SSE connection error.
 */
export function createSseConnectionError(message: string): QueueError {
  return createQueueError("SSE_CONNECTION_ERROR", message);
}

/**
 * Create an unknown error.
 */
export function createUnknownError(message: string): QueueError {
  return createQueueError("UNKNOWN_ERROR", message);
}
