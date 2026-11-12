/**
 * Token Storage Service
 *
 * GH-6: Implementation of TokenStorage interface.
 *
 * SECURITY CONSTRAINTS:
 * - Access token: MEMORY ONLY (R8-AC1)
 * - Refresh token: expo-secure-store ONLY (R8-AC2)
 * - NO AsyncStorage fallback (R8-AC6)
 * - SecureStore failure → Result.err (R8-AC7)
 *
 * @module features/auth/data/storage
 */

import * as SecureStore from "expo-secure-store";
import type { AccessToken } from "@/core/domain";
import type { TokenStorage, StorageResult } from "./token-storage.port";
import { createStorageError } from "../mappers/error.mapper";

/** SecureStore key for refresh token */
const REFRESH_TOKEN_KEY = "auth_refresh_token";

/**
 * Token storage service implementing TokenStorage interface.
 *
 * CRITICAL: This implementation does NOT fallback to AsyncStorage.
 * SecureStore failure is surfaced as an error, not silently degraded.
 */
export class TokenStorageService implements TokenStorage {
  /**
   * In-memory access token storage.
   * R8-AC1: Access token stored in MEMORY ONLY
   */
  private accessToken: AccessToken | null = null;

  // =========================================================================
  // Access Token (memory-only, synchronous)
  // =========================================================================

  getAccessToken(): AccessToken | null {
    return this.accessToken;
  }

  setAccessToken(token: AccessToken): void {
    this.accessToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  // =========================================================================
  // Refresh Token (expo-secure-store, async)
  // =========================================================================

  async getRefreshToken(): Promise<StorageResult<string | null>> {
    try {
      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      return { ok: true, value: token };
    } catch (error) {
      // R8-AC7: SecureStore failure surfaced through error boundary
      return {
        ok: false,
        error: createStorageError(
          `Failed to read refresh token: ${error instanceof Error ? error.message : "Unknown error"}`
        ),
      };
    }
  }

  async setRefreshToken(token: string): Promise<StorageResult<void>> {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
      return { ok: true, value: undefined };
    } catch (error) {
      // R8-AC6, R8-AC7: NO fallback to AsyncStorage
      return {
        ok: false,
        error: createStorageError(
          `Failed to store refresh token: ${error instanceof Error ? error.message : "Unknown error"}`
        ),
      };
    }
  }

  async clearRefreshToken(): Promise<StorageResult<void>> {
    try {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      return { ok: true, value: undefined };
    } catch (error) {
      return {
        ok: false,
        error: createStorageError(
          `Failed to clear refresh token: ${error instanceof Error ? error.message : "Unknown error"}`
        ),
      };
    }
  }

  // =========================================================================
  // Combined Operations
  // =========================================================================

  async clearAll(): Promise<StorageResult<void>> {
    // Always clear access token (memory, can't fail)
    this.clearAccessToken();

    // Clear refresh token (may fail)
    const result = await this.clearRefreshToken();
    return result;
  }
}

/**
 * Create a new TokenStorageService instance.
 */
export function createTokenStorage(): TokenStorage {
  return new TokenStorageService();
}
