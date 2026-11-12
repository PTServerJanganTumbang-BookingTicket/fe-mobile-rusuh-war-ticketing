/**
 * Error Mapper
 *
 * GH-6: Maps API error responses to domain AuthError types.
 *
 * R9-AC1: Maps all known error codes
 * R9-AC4: Unknown codes captured in UNKNOWN variant
 *
 * @module features/auth/data/mappers
 */

import type { AuthError } from "../../domain";
import type { AuthErrorResponseDto, RateLimitErrorResponseDto } from "../dtos";
import { isRateLimitResponse, hasErrorCode } from "../dtos";

/**
 * Map raw API error response to domain AuthError.
 *
 * @param response - Raw response object from API
 * @param statusCode - HTTP status code
 * @returns Mapped AuthError
 */
export function mapErrorResponse(
  response: unknown,
  statusCode: number
): AuthError {
  // Handle rate limiting
  if (isRateLimitResponse(response)) {
    return mapRateLimitError(response);
  }

  // Handle errors with explicit error_code
  if (hasErrorCode(response)) {
    return mapErrorCodeResponse(response);
  }

  // Handle based on status code
  return mapHttpStatusError(statusCode, response);
}

/**
 * Map rate limit response.
 * R1-AC3, R4-AC6: retry_after is extractable
 * R9-AC2: Rate limit error includes retry_after_ms
 */
function mapRateLimitError(response: RateLimitErrorResponseDto): AuthError {
  return {
    code: "RATE_LIMITED",
    // API returns seconds, convert to milliseconds
    retryAfterMs: response.data.retry_after * 1000,
  };
}

/**
 * Map response with explicit error_code.
 */
function mapErrorCodeResponse(response: AuthErrorResponseDto): AuthError {
  const errorCode = response.meta.error_code;
  const message = response.meta.message;

  switch (errorCode) {
    case "VALIDATION_ERROR":
      return { code: "VALIDATION_ERROR", message };

    case "TOKEN_INVALID":
      return { code: "TOKEN_INVALID", message };

    case "TOKEN_EXPIRED":
      return { code: "TOKEN_EXPIRED", message };

    case "NIK_ALREADY_REGISTERED":
      return { code: "NIK_ALREADY_REGISTERED", message };

    case "CONSENT_REQUIRED":
      return { code: "CONSENT_REQUIRED", message };

    default:
      // R9-AC4: Unknown codes preserved for debugging
      return {
        code: "UNKNOWN",
        message,
        originalCode: errorCode,
      };
  }
}

/**
 * Map HTTP status code to error when no explicit error_code.
 */
function mapHttpStatusError(statusCode: number, response: unknown): AuthError {
  const message = extractMessage(response) ?? `HTTP error ${statusCode}`;

  switch (statusCode) {
    case 400:
      return { code: "VALIDATION_ERROR", message };

    case 401:
      // Default to TOKEN_INVALID for 401 without explicit code
      return { code: "TOKEN_INVALID", message };

    case 409:
      // Conflict - likely NIK_ALREADY_REGISTERED
      return { code: "NIK_ALREADY_REGISTERED", message };

    case 422:
      // Unprocessable - likely CONSENT_REQUIRED
      return { code: "CONSENT_REQUIRED", message };

    default:
      return { code: "UNKNOWN", message };
  }
}

/**
 * Create network error.
 * R6-AC4: Network failures wrapped as NetworkError
 */
export function createNetworkError(message: string): AuthError {
  return { code: "NETWORK_ERROR", message };
}

/**
 * Create storage error.
 * R8-AC7: SecureStore failure surfaced through error boundary
 */
export function createStorageError(message: string): AuthError {
  return { code: "STORAGE_ERROR", message };
}

/**
 * Extract message from response object.
 */
function extractMessage(response: unknown): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  const obj = response as Record<string, unknown>;

  if (obj.meta && typeof obj.meta === "object") {
    const meta = obj.meta as Record<string, unknown>;
    if (typeof meta.message === "string") {
      return meta.message;
    }
  }

  return undefined;
}
