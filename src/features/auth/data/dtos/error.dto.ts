/**
 * Error DTOs
 *
 * GH-6: Error response DTOs matching API contract.
 * Field names match snake_case from API contract.
 *
 * Contract Evidence: api-contracts.md §1.3, §1.4, §1.5
 *
 * @module features/auth/data/dtos
 */

/**
 * Known API error codes from auth endpoints.
 */
export type AuthApiErrorCode =
  | "VALIDATION_ERROR"
  | "TOKEN_INVALID"
  | "TOKEN_EXPIRED"
  | "NIK_ALREADY_REGISTERED"
  | "CONSENT_REQUIRED";

/**
 * Generic error response envelope.
 * Used for 4xx/5xx responses.
 */
export interface AuthErrorResponseDto {
  meta: {
    code: number;
    message: string;
    error_code?: AuthApiErrorCode | string;
  };
  data: Record<string, unknown>;
}

/**
 * Rate limit error response.
 * R1-AC3, R4-AC6: Given 429 rate limit, retry_after is extractable
 */
export interface RateLimitErrorResponseDto {
  meta: {
    code: 429;
    message: string;
  };
  data: {
    /** Retry delay in seconds */
    retry_after: number;
  };
}

/**
 * Type guard for rate limit response.
 */
export function isRateLimitResponse(
  response: unknown
): response is RateLimitErrorResponseDto {
  if (!response || typeof response !== "object") return false;
  const obj = response as Record<string, unknown>;

  if (!obj.meta || typeof obj.meta !== "object") return false;
  const meta = obj.meta as Record<string, unknown>;

  if (meta.code !== 429) return false;

  if (!obj.data || typeof obj.data !== "object") return false;
  const data = obj.data as Record<string, unknown>;

  return typeof data.retry_after === "number";
}

/**
 * Type guard for error response with error_code.
 */
export function hasErrorCode(
  response: unknown
): response is AuthErrorResponseDto {
  if (!response || typeof response !== "object") return false;
  const obj = response as Record<string, unknown>;

  if (!obj.meta || typeof obj.meta !== "object") return false;
  const meta = obj.meta as Record<string, unknown>;

  return typeof meta.error_code === "string";
}
