/**
 * Auth Feature Domain Layer
 *
 * GH-6: Barrel export for auth domain types.
 * Pure TypeScript - no React/React Native imports.
 *
 * @module features/auth/domain
 */

// Session types
export type {
  AuthSession,
  AuthUser,
  RedirectContext,
} from "./auth-session.types";

// Registration types
export type {
  RegisterParams,
  RegisterConsent,
  RegisterResult,
} from "./auth-user.types";

// Error types
export type {
  AuthError,
  AuthErrorCode,
  ValidationError,
  TokenInvalidError,
  TokenExpiredError,
  NikAlreadyRegisteredError,
  ConsentRequiredError,
  RateLimitedError,
  NetworkError,
  StorageError,
  UnknownError,
} from "./auth-error.types";

export {
  isValidationError,
  isTokenInvalidError,
  isTokenExpiredError,
  isNikAlreadyRegisteredError,
  isConsentRequiredError,
  isRateLimitedError,
  isNetworkError,
  isStorageError,
  requiresSessionClearance,
} from "./auth-error.types";

// Repository port
export type { AuthResult, AuthRepositoryPort } from "./auth-repository.port";
