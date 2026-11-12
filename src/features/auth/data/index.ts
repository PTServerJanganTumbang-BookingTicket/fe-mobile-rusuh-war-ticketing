/**
 * Auth Feature Data Layer
 *
 * GH-6: Data layer exports for Auth feature.
 * Data layer can import from domain layer.
 *
 * @module features/auth/data
 */

// ============================================================================
// DTOs (internal - not re-exported from feature index)
// ============================================================================
export type {
  MagicLinkRequestDto,
  MagicLinkResendRequestDto,
  MagicLinkResponseDto,
  MagicLinkRateLimitedDto,
  VerifyUserDto,
  VerifyRedirectContextDto,
  VerifyResponseDto,
  RegisterConsentDto,
  RegisterRequestDto,
  RegisterResponseDto,
  RefreshRequestDto,
  RefreshResponseDto,
  AuthApiErrorCode,
  AuthErrorResponseDto,
  RateLimitErrorResponseDto,
} from "./dtos";

export { isRateLimitResponse, hasErrorCode } from "./dtos";

// ============================================================================
// Mappers
// ============================================================================
export {
  mapVerifyResponse,
  extractRefreshToken,
  mapRefreshResponse,
  extractRefreshTokenFromRefresh,
  mapRegisterResponse,
  mapErrorResponse,
  createNetworkError,
  createStorageError,
} from "./mappers";

// ============================================================================
// Data Source Interface and Implementation
// ============================================================================
export type {
  DataSourceResult,
  AuthRemoteDataSource,
} from "./auth-remote.datasource.port";

export {
  AuthRemoteDataSourceImpl,
  createAuthRemoteDataSource,
} from "./auth-remote.datasource";
export type { AuthRemoteDataSourceConfig } from "./auth-remote.datasource";

// ============================================================================
// Storage Interface and Implementation
// ============================================================================
export type { StorageResult, TokenStorage } from "./storage/token-storage.port";
export { TokenStorageService, createTokenStorage } from "./storage";

// ============================================================================
// Repository Implementation
// ============================================================================
export { AuthRepository, createAuthRepository } from "./auth.repository";
