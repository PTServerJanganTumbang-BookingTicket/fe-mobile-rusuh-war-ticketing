/**
 * Queue Error Mapper
 *
 * GH-9 T3: Maps HTTP status codes and error bodies to QueueError domain types.
 * Covers all CONTRACT-BASELINE.md error codes.
 *
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.6, §2.7
 *
 * @module features/queue/data/mappers/queue-error.mapper
 */

import type { QueueState } from "@/core/domain";
import {
  type QueueError,
  type QueueErrorCode,
  createQueueError,
  createNetworkError,
  createTimeoutError,
} from "@/features/queue/domain";
import type { QueueErrorResponseDto } from "@/features/queue/data/dtos";

/**
 * Backend error codes from CONTRACT-BASELINE.md.
 */
type BackendErrorCode =
  | "CAPTCHA_REQUIRED"
  | "CAPTCHA_FAILED"
  | "DEVICE_ID_REQUIRED"
  | "QUEUE_FULL"
  | "FULL_BOOKED"
  | "UNAUTHORIZED"
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED";

/**
 * Map backend error code to domain error code.
 */
function mapBackendCodeToDomainCode(
  backendCode: string
): QueueErrorCode | null {
  const mapping: Record<BackendErrorCode, QueueErrorCode> = {
    CAPTCHA_REQUIRED: "CAPTCHA_REQUIRED",
    CAPTCHA_FAILED: "CAPTCHA_FAILED",
    DEVICE_ID_REQUIRED: "DEVICE_ID_REQUIRED",
    QUEUE_FULL: "QUEUE_FULL",
    FULL_BOOKED: "FULL_BOOKED",
    UNAUTHORIZED: "UNAUTHORIZED",
    TOKEN_INVALID: "TOKEN_INVALID",
    TOKEN_EXPIRED: "TOKEN_INVALID", // Treat TOKEN_EXPIRED as TOKEN_INVALID
  };

  return mapping[backendCode as BackendErrorCode] ?? null;
}

/**
 * Extract queue state from error response data.
 * Returns FULL_QUEUE or FULL_BOOKED if present.
 */
function extractQueueState(
  errorDto: QueueErrorResponseDto
): QueueState | undefined {
  const state = errorDto.data?.queue_state;
  if (state === "FULL_QUEUE" || state === "FULL_BOOKED") {
    return state;
  }
  return undefined;
}

/**
 * Map HTTP error response to QueueError.
 *
 * @param httpStatus - HTTP status code
 * @param errorDto - Error response body (may be undefined for network errors)
 * @returns QueueError domain type
 */
export function mapHttpError(
  httpStatus: number,
  errorDto?: QueueErrorResponseDto
): QueueError {
  // Handle specific HTTP status codes first
  switch (httpStatus) {
    case 400: {
      // Bad Request - use error_code from body
      const code = errorDto?.error_code
        ? mapBackendCodeToDomainCode(errorDto.error_code)
        : null;

      if (code) {
        return createQueueError(code, errorDto?.message ?? `${code} error`, {
          httpStatus,
        });
      }

      // Fallback for unknown 400 errors
      return createQueueError(
        "UNKNOWN_ERROR",
        errorDto?.message ?? "Bad request",
        { httpStatus }
      );
    }

    case 401: {
      // Unauthorized - check error_code for TOKEN_INVALID vs UNAUTHORIZED
      const backendCode = errorDto?.error_code;

      if (backendCode === "TOKEN_INVALID" || backendCode === "TOKEN_EXPIRED") {
        return createQueueError(
          "TOKEN_INVALID",
          errorDto?.message ?? "Queue token invalid or expired",
          { httpStatus }
        );
      }

      return createQueueError(
        "UNAUTHORIZED",
        errorDto?.message ?? "Authentication required",
        { httpStatus }
      );
    }

    case 404:
      // Not Found - EVENT_NOT_FOUND
      return createQueueError(
        "EVENT_NOT_FOUND",
        errorDto?.message ?? "Event not found",
        { httpStatus }
      );

    case 409: {
      // Conflict - FULL_BOOKED (inventory exhausted)
      const queueState = extractQueueState(errorDto ?? { error_code: "" });
      return createQueueError(
        "FULL_BOOKED",
        errorDto?.message ?? "Tickets fully booked",
        {
          httpStatus,
          queueState: queueState ?? "FULL_BOOKED",
        }
      );
    }

    case 410:
      // Gone - SALE_CLOSED (sale ended)
      return createQueueError(
        "SALE_CLOSED",
        errorDto?.message ?? "Sale has ended",
        {
          httpStatus,
          queueState: "CLOSED",
        }
      );

    case 503: {
      // Service Unavailable - QUEUE_FULL (temporary capacity)
      const queueState = extractQueueState(errorDto ?? { error_code: "" });
      return createQueueError(
        "QUEUE_FULL",
        errorDto?.message ?? "Queue is at capacity",
        {
          httpStatus,
          queueState: queueState ?? "FULL_QUEUE",
        }
      );
    }

    default:
      // Unknown HTTP status
      return createQueueError(
        "UNKNOWN_ERROR",
        errorDto?.message ?? `HTTP ${httpStatus} error`,
        { httpStatus }
      );
  }
}

/**
 * Map network error (connection failure, DNS, etc.) to QueueError.
 *
 * @param error - Original error (Error or unknown)
 * @returns QueueError with NETWORK_ERROR code
 */
export function mapNetworkError(error?: unknown): QueueError {
  const message =
    error instanceof Error ? error.message : "Network connection failed";
  return createNetworkError(message);
}

/**
 * Map timeout error to QueueError.
 *
 * @param timeoutMs - Timeout duration in milliseconds (optional)
 * @returns QueueError with TIMEOUT_ERROR code
 */
export function mapTimeoutError(timeoutMs?: number): QueueError {
  const message = timeoutMs
    ? `Request timed out after ${timeoutMs}ms`
    : "Request timed out";
  return createTimeoutError(message);
}

/**
 * Determine if an error response indicates a queue state transition.
 * Used to update queue state in UI even when an error occurs.
 */
export function hasQueueStateTransition(error: QueueError): boolean {
  return error.queueState !== undefined;
}

/**
 * Extract queue state from error if present.
 */
export function getErrorQueueState(error: QueueError): QueueState | undefined {
  return error.queueState;
}
