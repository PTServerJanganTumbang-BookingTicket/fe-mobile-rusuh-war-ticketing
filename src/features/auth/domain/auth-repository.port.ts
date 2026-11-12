/**
 * Auth Repository Port
 *
 * GH-6: Repository interface contract in domain layer.
 * Pure TypeScript - no React/React Native imports.
 *
 * R7-AC1: AuthRepository interface matches domain port definition
 * R7-AC6: No React/React Native imports
 *
 * @module features/auth/domain
 */

import type {
  AuthSession,
  AuthError,
  RegisterParams,
  RegisterResult,
} from "./index";

/**
 * Result type for repository operations.
 *
 * ADR-3: Result<T, E> pattern for typed error handling.
 */
export type AuthResult<T> =
  { ok: true; value: T } | { ok: false; error: AuthError };

/**
 * Auth repository port (interface).
 *
 * R7-AC1: Matches domain port definition
 * R7-AC3: Manages token storage lifecycle
 * R7-AC4: Exposes getCurrentSession
 * R7-AC5: Exposes clearSession
 *
 * @remarks
 * IMPLEMENTATION REQUIREMENTS:
 * - Bridge data source and domain (R7-AC2)
 * - Manage token storage lifecycle (R7-AC3)
 * - Access token in memory only (R8-AC1)
 * - Refresh token in SecureStore only (R8-AC2)
 * - NO automatic retry on refresh (security constraint)
 */
export interface AuthRepositoryPort {
  /**
   * Request magic link login email.
   *
   * @param email - User email address
   * @returns Result indicating success or AuthError
   */
  requestMagicLink(email: string): Promise<AuthResult<void>>;

  /**
   * Resend magic link to same email.
   *
   * @param email - User email address
   * @returns Result indicating success or AuthError
   */
  resendMagicLink(email: string): Promise<AuthResult<void>>;

  /**
   * Verify magic link token and establish session.
   *
   * On success:
   * - Stores access token in memory (R8-AC1)
   * - Stores refresh token in SecureStore (R8-AC2)
   * - Returns AuthSession
   *
   * @param token - Magic link token from email
   * @returns Result with AuthSession or AuthError
   */
  verifyMagicLink(token: string): Promise<AuthResult<AuthSession>>;

  /**
   * Register new account with NIK.
   *
   * @param params - Registration parameters
   * @returns Result with RegisterResult or AuthError
   */
  register(params: RegisterParams): Promise<AuthResult<RegisterResult>>;

  /**
   * Refresh session using stored refresh token.
   *
   * On success:
   * - Replaces access token in memory (R5-AC3)
   * - Replaces refresh token in SecureStore (R5-AC4, R5-AC5)
   *
   * On TOKEN_INVALID/TOKEN_EXPIRED:
   * - Clears all stored tokens (R5-AC6, R5-AC7)
   *
   * @remarks
   * NO automatic retry. Single-use tokens with rotation.
   * Replay detection triggers full session revocation.
   *
   * @returns Result with AuthSession or AuthError
   */
  refreshSession(): Promise<AuthResult<AuthSession>>;

  /**
   * Get current session from memory.
   *
   * R7-AC4: Exposes getCurrentSession
   *
   * @returns Current AuthSession or null if not authenticated
   */
  getCurrentSession(): AuthSession | null;

  /**
   * Clear all tokens and session state.
   *
   * R7-AC5: Exposes clearSession
   * R8-AC4: Storage is clearable on logout/session end
   *
   * @returns Promise resolving when cleared
   */
  clearSession(): Promise<void>;

  /**
   * Check if user has a stored refresh token.
   *
   * Used for determining if session restoration is possible on cold start.
   *
   * @returns Promise resolving to true if refresh token exists in SecureStore
   */
  hasStoredRefreshToken(): Promise<boolean>;
}
