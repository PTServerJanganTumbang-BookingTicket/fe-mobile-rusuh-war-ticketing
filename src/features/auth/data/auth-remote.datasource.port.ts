/**
 * Auth Remote Data Source Interface
 *
 * GH-6: Contract for HTTP adapter communicating with auth endpoints.
 *
 * Contract Evidence: api-contracts.md §1.1-§1.5
 *
 * R6-AC1: AuthRemoteDataSource interface defines all auth API methods
 * R6-AC6: No React/React Native imports
 *
 * @module features/auth/data
 */

import type {
  MagicLinkRequestDto,
  MagicLinkResendRequestDto,
  MagicLinkResponseDto,
  VerifyResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
  RefreshRequestDto,
  RefreshResponseDto,
} from "./dtos";
import type { AuthError } from "../domain";

/**
 * Result type for data source operations.
 *
 * ADR-3: Result<T, E> pattern for typed error handling.
 */
export type DataSourceResult<T> =
  { ok: true; value: T } | { ok: false; error: AuthError };

/**
 * Auth remote data source interface.
 *
 * R6-AC1: Defines all auth API methods
 * R6-AC2: Uses typed request/response DTOs
 *
 * @remarks
 * IMPLEMENTATION REQUIREMENTS:
 * - HTTP errors mapped to AuthError union (R6-AC3)
 * - Network failures wrapped as NetworkError (R6-AC4)
 * - Base URL configurable (R6-AC5)
 * - NO automatic retry (GH-6 security constraint)
 */
export interface AuthRemoteDataSource {
  /**
   * Request magic link email.
   *
   * Contract: POST /auth/magic-link
   * R1-AC1: Request DTO contains email
   * R1-AC2: Success returns 200
   * R1-AC3: Rate limit (429) returns retry_after
   *
   * @param request - Magic link request DTO
   * @returns Result with success DTO or AuthError
   */
  requestMagicLink(
    request: MagicLinkRequestDto
  ): Promise<DataSourceResult<MagicLinkResponseDto>>;

  /**
   * Resend magic link email.
   *
   * Contract: POST /auth/magic-link/resend
   * R2-AC1: Request DTO contains email
   * R2-AC2: Success returns 200
   *
   * @param request - Resend request DTO
   * @returns Result with success DTO or AuthError
   */
  resendMagicLink(
    request: MagicLinkResendRequestDto
  ): Promise<DataSourceResult<MagicLinkResponseDto>>;

  /**
   * Verify magic link token.
   *
   * Contract: GET /auth/verify?token={token}
   * R3-AC1: Response includes access_token, refresh_token, expires_in, user
   * R3-AC7: Invalid/expired token returns TOKEN_INVALID error
   *
   * @param token - Magic link token from email
   * @returns Result with verify response DTO or AuthError
   */
  verifyMagicLink(token: string): Promise<DataSourceResult<VerifyResponseDto>>;

  /**
   * Register new account.
   *
   * Contract: POST /auth/register
   * R4-AC1: Request contains email, nik, consent
   * R4-AC3: Success returns user_id
   * R4-AC4: NIK_ALREADY_REGISTERED on 409
   * R4-AC5: CONSENT_REQUIRED on 422
   * R4-AC6: Rate limit (429) returns retry_after
   *
   * @param request - Register request DTO
   * @returns Result with register response DTO or AuthError
   */
  register(
    request: RegisterRequestDto
  ): Promise<DataSourceResult<RegisterResponseDto>>;

  /**
   * Refresh session tokens.
   *
   * Contract: POST /auth/refresh
   * R5-AC1: Request sends refresh_token in body
   * R5-AC2: Response includes new access_token, refresh_token, expires_in
   * R5-AC6: TOKEN_INVALID on replay detection (401)
   * R5-AC7: TOKEN_EXPIRED on expired refresh token (401)
   *
   * @remarks
   * NO automatic retry. Refresh tokens are single-use.
   * Replay triggers full session revocation.
   *
   * @param request - Refresh request DTO
   * @returns Result with refresh response DTO or AuthError
   */
  refreshSession(
    request: RefreshRequestDto
  ): Promise<DataSourceResult<RefreshResponseDto>>;
}
