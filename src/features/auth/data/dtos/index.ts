/**
 * Auth DTOs Barrel Export
 *
 * GH-6: Data transfer objects for auth API endpoints.
 *
 * @module features/auth/data/dtos
 */

// Magic link DTOs
export type {
  MagicLinkRequestDto,
  MagicLinkResendRequestDto,
  MagicLinkResponseDto,
  MagicLinkRateLimitedDto,
} from "./magic-link.dto";

// Verify DTOs
export type {
  VerifyUserDto,
  VerifyRedirectContextDto,
  VerifyResponseDto,
} from "./verify.dto";

// Register DTOs
export type {
  RegisterConsentDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from "./register.dto";

// Refresh DTOs
export type { RefreshRequestDto, RefreshResponseDto } from "./refresh.dto";

// Error DTOs
export type {
  AuthApiErrorCode,
  AuthErrorResponseDto,
  RateLimitErrorResponseDto,
} from "./error.dto";

export { isRateLimitResponse, hasErrorCode } from "./error.dto";
