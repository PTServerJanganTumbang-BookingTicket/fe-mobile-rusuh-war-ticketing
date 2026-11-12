/**
 * Auth Error Types
 *
 * GH-6: Discriminated union for auth-related errors.
 * Pure TypeScript - no React/React Native imports.
 *
 * Contract Evidence: api-contracts.md §1.3, §1.4, §1.5
 *
 * R9-AC1: AuthError union includes documented error codes
 * R9-AC3: Errors are discriminated by `code` field
 * R9-AC4: Unknown server errors are representable without type error
 *
 * @module features/auth/domain
 */

/**
 * Validation error from invalid request payload.
 */
export interface ValidationError {
  readonly code: "VALIDATION_ERROR";
  readonly message: string;
}

/**
 * Token is invalid (malformed or unknown).
 */
export interface TokenInvalidError {
  readonly code: "TOKEN_INVALID";
  readonly message: string;
}

/**
 * Token has expired.
 */
export interface TokenExpiredError {
  readonly code: "TOKEN_EXPIRED";
  readonly message: string;
}

/**
 * NIK is already registered to another account.
 * R4-AC4: Given 409 NIK_ALREADY_REGISTERED
 */
export interface NikAlreadyRegisteredError {
  readonly code: "NIK_ALREADY_REGISTERED";
  readonly message: string;
}

/**
 * Consent is required but not provided or invalid.
 * R4-AC5: Given 422 CONSENT_REQUIRED
 */
export interface ConsentRequiredError {
  readonly code: "CONSENT_REQUIRED";
  readonly message: string;
}

/**
 * Request rate limited.
 * R1-AC3, R4-AC6: Given 429 rate limit, retry_after is extractable
 * R9-AC2: Rate limit error includes retry_after_ms
 */
export interface RateLimitedError {
  readonly code: "RATE_LIMITED";
  readonly retryAfterMs: number;
}

/**
 * Network error (timeout, connectivity issue).
 * R6-AC4: Network failures are caught and wrapped as NetworkError
 */
export interface NetworkError {
  readonly code: "NETWORK_ERROR";
  readonly message: string;
}

/**
 * Secure storage failure (expo-secure-store).
 *
 * GH-6 R8-AC7: SecureStore unavailability is surfaced through error boundary.
 * Following GH-17 pattern of feature-local error codes.
 */
export interface StorageError {
  readonly code: "STORAGE_ERROR";
  readonly message: string;
}

/**
 * Unknown or unexpected error.
 * R9-AC4: Unknown codes captured with original preserved for debugging.
 */
export interface UnknownError {
  readonly code: "UNKNOWN";
  readonly message: string;
  readonly originalCode?: string;
}

/**
 * Discriminated union of all auth errors.
 *
 * R9-AC1: Union includes all documented error codes
 * R9-AC5: Feature-local codes (STORAGE_ERROR) added per GH-17 pattern
 */
export type AuthError =
  | ValidationError
  | TokenInvalidError
  | TokenExpiredError
  | NikAlreadyRegisteredError
  | ConsentRequiredError
  | RateLimitedError
  | NetworkError
  | StorageError
  | UnknownError;

/**
 * All known auth error codes.
 */
export type AuthErrorCode = AuthError["code"];

/**
 * Type guard for validation error.
 */
export function isValidationError(error: AuthError): error is ValidationError {
  return error.code === "VALIDATION_ERROR";
}

/**
 * Type guard for token invalid error.
 */
export function isTokenInvalidError(
  error: AuthError
): error is TokenInvalidError {
  return error.code === "TOKEN_INVALID";
}

/**
 * Type guard for token expired error.
 */
export function isTokenExpiredError(
  error: AuthError
): error is TokenExpiredError {
  return error.code === "TOKEN_EXPIRED";
}

/**
 * Type guard for NIK already registered error.
 */
export function isNikAlreadyRegisteredError(
  error: AuthError
): error is NikAlreadyRegisteredError {
  return error.code === "NIK_ALREADY_REGISTERED";
}

/**
 * Type guard for consent required error.
 */
export function isConsentRequiredError(
  error: AuthError
): error is ConsentRequiredError {
  return error.code === "CONSENT_REQUIRED";
}

/**
 * Type guard for rate limited error.
 */
export function isRateLimitedError(
  error: AuthError
): error is RateLimitedError {
  return error.code === "RATE_LIMITED";
}

/**
 * Type guard for network error.
 */
export function isNetworkError(error: AuthError): error is NetworkError {
  return error.code === "NETWORK_ERROR";
}

/**
 * Type guard for storage error.
 */
export function isStorageError(error: AuthError): error is StorageError {
  return error.code === "STORAGE_ERROR";
}

/**
 * Check if error requires session clearance.
 * R5-AC6, R5-AC7: TOKEN_INVALID or TOKEN_EXPIRED → session cleared
 */
export function requiresSessionClearance(error: AuthError): boolean {
  return error.code === "TOKEN_INVALID" || error.code === "TOKEN_EXPIRED";
}
