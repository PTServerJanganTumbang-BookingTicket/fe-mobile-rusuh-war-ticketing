/**
 * Auth Feature Module
 *
 * GH-6: Public API for Auth feature.
 * All external imports should come through this barrel.
 *
 * Architecture:
 * - Domain: AuthSession, AuthError, AuthRepositoryPort
 * - Data: TokenStorageService, AuthRemoteDataSourceImpl, AuthRepository
 *
 * Boundary Rule: DTOs stay in data layer; only domain types are exported.
 *
 * R11-AC1: Only public API is exported
 * R12-AC3: All public types explicitly exported
 *
 * @module features/auth
 */

// ============================================================================
// Domain Exports (types only, pure TypeScript)
// ============================================================================
export type {
  // Session types
  AuthSession,
  AuthUser,
  RedirectContext,
  // Registration types
  RegisterParams,
  RegisterConsent,
  RegisterResult,
  // Error types
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
  // Repository port
  AuthResult,
  AuthRepositoryPort,
} from "./domain";

// Error type guards
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
} from "./domain";

// ============================================================================
// Data Exports (interfaces + implementations)
// ============================================================================

// Data source interface and factory
export type { AuthRemoteDataSource, DataSourceResult } from "./data";
export type { AuthRemoteDataSourceConfig } from "./data";
export { createAuthRemoteDataSource } from "./data";

// Storage interface and factory
export type { TokenStorage, StorageResult } from "./data";
export { createTokenStorage } from "./data";

// Repository factory
export { createAuthRepository } from "./data";
