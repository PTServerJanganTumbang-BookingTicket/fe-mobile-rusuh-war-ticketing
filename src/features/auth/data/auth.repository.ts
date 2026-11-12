/**
 * Auth Repository Implementation
 *
 * GH-6: Repository connecting data source, mappers, and token storage.
 *
 * R7-AC1: Implements AuthRepositoryPort
 * R7-AC2: Consumes AuthRemoteDataSource
 * R7-AC3: Manages token storage lifecycle
 *
 * CRITICAL CONSTRAINTS:
 * - NO automatic retry on refresh (R5 security constraint)
 * - Token rotation: OLD token replaced by NEW (R5-AC5)
 * - Session clearance on TOKEN_INVALID/TOKEN_EXPIRED (R5-AC6, R5-AC7)
 *
 * @module features/auth/data
 */

import type {
  AuthRepositoryPort,
  AuthResult,
  AuthSession,
  RegisterParams,
  RegisterResult,
} from "../domain";
import { requiresSessionClearance as checkSessionClearance } from "../domain";
import type { AuthRemoteDataSource } from "./auth-remote.datasource.port";
import type { TokenStorage } from "./storage/token-storage.port";
import {
  mapVerifyResponse,
  extractRefreshToken,
  mapRefreshResponse,
  extractRefreshTokenFromRefresh,
  mapRegisterResponse,
} from "./mappers";
import type { RegisterRequestDto } from "./dtos";

/**
 * Auth repository implementation.
 */
export class AuthRepository implements AuthRepositoryPort {
  private currentSession: AuthSession | null = null;

  constructor(
    private readonly dataSource: AuthRemoteDataSource,
    private readonly tokenStorage: TokenStorage
  ) {}

  // =========================================================================
  // Magic Link
  // =========================================================================

  async requestMagicLink(email: string): Promise<AuthResult<void>> {
    const result = await this.dataSource.requestMagicLink({ email });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return { ok: true, value: undefined };
  }

  async resendMagicLink(email: string): Promise<AuthResult<void>> {
    const result = await this.dataSource.resendMagicLink({ email });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return { ok: true, value: undefined };
  }

  // =========================================================================
  // Verify
  // R3-AC4: Access token stored in memory
  // R3-AC5: Refresh token stored in expo-secure-store
  // =========================================================================

  async verifyMagicLink(token: string): Promise<AuthResult<AuthSession>> {
    const result = await this.dataSource.verifyMagicLink(token);

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    // Map DTO to domain
    const session = mapVerifyResponse(result.value);

    // Store access token in memory (R8-AC1)
    this.tokenStorage.setAccessToken(session.accessToken);

    // Store refresh token in SecureStore (R8-AC2)
    const refreshToken = extractRefreshToken(result.value);
    const storageResult = await this.tokenStorage.setRefreshToken(refreshToken);

    if (!storageResult.ok) {
      // R8-AC7: SecureStore failure surfaced as error
      // Clear access token since we couldn't complete storage
      this.tokenStorage.clearAccessToken();
      return { ok: false, error: storageResult.error };
    }

    // Set current session
    this.currentSession = session;

    return { ok: true, value: session };
  }

  // =========================================================================
  // Register
  // =========================================================================

  async register(params: RegisterParams): Promise<AuthResult<RegisterResult>> {
    // R4-AC2: NIK is 16 digits; non-digits stripped before sending
    const cleanNik = params.nik.replace(/\D/g, "");

    const request: RegisterRequestDto = {
      email: params.email,
      nik: cleanNik,
      consent: {
        accepted: params.consent.accepted,
        policy_version: params.consent.policyVersion,
      },
    };

    const result = await this.dataSource.register(request);

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return { ok: true, value: mapRegisterResponse(result.value) };
  }

  // =========================================================================
  // Refresh
  // R5-AC3: NEW access token stored in memory
  // R5-AC4: NEW refresh token stored in SecureStore
  // R5-AC5: Old refresh token is replaced (token rotation)
  // R5-AC6: TOKEN_INVALID → session cleared
  // R5-AC7: TOKEN_EXPIRED → session cleared
  // CRITICAL: NO automatic retry
  // =========================================================================

  async refreshSession(): Promise<AuthResult<AuthSession>> {
    // Get stored refresh token
    const tokenResult = await this.tokenStorage.getRefreshToken();

    if (!tokenResult.ok) {
      return { ok: false, error: tokenResult.error };
    }

    if (!tokenResult.value) {
      // No refresh token stored
      return {
        ok: false,
        error: { code: "TOKEN_INVALID", message: "No refresh token available" },
      };
    }

    // Get existing user info (needed for mapping, refresh doesn't return user)
    const existingUser = this.currentSession?.user;
    if (!existingUser) {
      return {
        ok: false,
        error: { code: "TOKEN_INVALID", message: "No active session" },
      };
    }

    // Call API (NO retry)
    const result = await this.dataSource.refreshSession({
      refresh_token: tokenResult.value,
    });

    if (!result.ok) {
      // R5-AC6, R5-AC7: Clear session on auth errors
      if (checkSessionClearance(result.error)) {
        await this.clearSession();
      }
      return { ok: false, error: result.error };
    }

    // Map DTO to domain
    const session = mapRefreshResponse(result.value, existingUser);

    // R5-AC3: Store NEW access token in memory
    this.tokenStorage.setAccessToken(session.accessToken);

    // R5-AC4, R5-AC5: Store NEW refresh token (replaces old)
    const newRefreshToken = extractRefreshTokenFromRefresh(result.value);
    const storageResult =
      await this.tokenStorage.setRefreshToken(newRefreshToken);

    if (!storageResult.ok) {
      // Storage failed after getting new tokens - session is in invalid state
      // Clear everything
      await this.clearSession();
      return { ok: false, error: storageResult.error };
    }

    // Update current session
    this.currentSession = session;

    return { ok: true, value: session };
  }

  // =========================================================================
  // Session Management
  // =========================================================================

  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  async clearSession(): Promise<void> {
    // Clear in-memory session
    this.currentSession = null;

    // Clear all tokens (memory + SecureStore)
    await this.tokenStorage.clearAll();
  }

  async hasStoredRefreshToken(): Promise<boolean> {
    const result = await this.tokenStorage.getRefreshToken();

    if (!result.ok) {
      return false;
    }

    return result.value !== null;
  }
}

/**
 * Create a new AuthRepository instance.
 */
export function createAuthRepository(
  dataSource: AuthRemoteDataSource,
  tokenStorage: TokenStorage
): AuthRepositoryPort {
  return new AuthRepository(dataSource, tokenStorage);
}
