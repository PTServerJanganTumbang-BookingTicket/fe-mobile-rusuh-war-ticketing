/**
 * Token Storage Interface
 *
 * GH-6: Abstraction for token persistence.
 *
 * SECURITY CONSTRAINTS (R8):
 * - Access token: MEMORY ONLY (R8-AC1)
 * - Refresh token: expo-secure-store ONLY (R8-AC2)
 * - NO AsyncStorage fallback (R8-AC6)
 * - NO filesystem fallback (R8-AC6)
 * - Failure surfaced through error boundary (R8-AC7)
 *
 * @module features/auth/data/storage
 */

import type { AccessToken } from "@/core/domain";
import type { AuthError } from "../../domain";

/**
 * Result type for storage operations that can fail.
 *
 * ADR-3: Result<T, E> pattern for typed error handling.
 */
export type StorageResult<T> =
  { ok: true; value: T } | { ok: false; error: AuthError };

/**
 * Token storage interface.
 *
 * R8-AC3: TokenStorage interface abstracts storage mechanism.
 *
 * @remarks
 * IMPLEMENTATION REQUIREMENTS:
 * - Access token methods are synchronous (memory-only)
 * - Refresh token methods are async (expo-secure-store)
 * - SecureStore failure MUST return StorageResult error, NOT fallback to insecure storage
 * - NO AsyncStorage, NO filesystem, NO any other persistent mechanism for access token
 */
export interface TokenStorage {
  // =========================================================================
  // Access Token (memory-only, synchronous)
  // R8-AC1: Access token stored in MEMORY ONLY
  // =========================================================================

  /**
   * Get the current access token from memory.
   * @returns Access token or null if not set
   */
  getAccessToken(): AccessToken | null;

  /**
   * Store access token in memory.
   * @param token - Access token to store
   */
  setAccessToken(token: AccessToken): void;

  /**
   * Clear access token from memory.
   */
  clearAccessToken(): void;

  // =========================================================================
  // Refresh Token (expo-secure-store, async)
  // R8-AC2: Refresh token stored in expo-secure-store ONLY
  // =========================================================================

  /**
   * Get refresh token from secure storage.
   *
   * @returns Promise resolving to token or null
   * @remarks
   * Returns null if not set.
   * Returns StorageResult error on SecureStore failure.
   * MUST NOT return AsyncStorage fallback value.
   */
  getRefreshToken(): Promise<StorageResult<string | null>>;

  /**
   * Store refresh token in secure storage.
   *
   * @param token - Refresh token to store
   * @returns Promise resolving to void on success
   * @remarks
   * Returns StorageResult error on SecureStore failure.
   * MUST NOT fallback to AsyncStorage.
   */
  setRefreshToken(token: string): Promise<StorageResult<void>>;

  /**
   * Clear refresh token from secure storage.
   *
   * @returns Promise resolving to void on success
   * @remarks
   * Returns StorageResult error on SecureStore failure.
   */
  clearRefreshToken(): Promise<StorageResult<void>>;

  // =========================================================================
  // Combined Operations
  // R8-AC4: Storage is clearable on logout/session end
  // =========================================================================

  /**
   * Clear all tokens (access + refresh).
   *
   * @returns Promise resolving to void on success
   * @remarks
   * Clears access token from memory (always succeeds).
   * Clears refresh token from SecureStore (may fail).
   * On SecureStore failure, access token is still cleared.
   */
  clearAll(): Promise<StorageResult<void>>;
}
