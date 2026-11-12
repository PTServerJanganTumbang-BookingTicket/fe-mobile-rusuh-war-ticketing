/**
 * Auth Remote Data Source Implementation
 *
 * GH-6: HTTP adapter for auth API endpoints.
 *
 * Contract Evidence: api-contracts.md §1.1-§1.5
 *
 * CRITICAL CONSTRAINTS:
 * - NO automatic retry (single-use tokens, replay detection)
 * - R6-AC5: Base URL is configurable
 * - R6-AC3: HTTP errors mapped to AuthError
 * - R6-AC4: Network failures wrapped as NetworkError
 *
 * @module features/auth/data
 */

import type {
  AuthRemoteDataSource,
  DataSourceResult,
} from "./auth-remote.datasource.port";
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
import { mapErrorResponse, createNetworkError } from "./mappers";

/**
 * Configuration for AuthRemoteDataSourceImpl.
 */
export interface AuthRemoteDataSourceConfig {
  /** Base URL for API requests (e.g., "https://api.example.com") */
  baseUrl: string;
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number;
}

/**
 * HTTP data source for auth endpoints.
 *
 * R6-AC1: Implements all auth API methods
 * R6-AC2: Uses typed request/response DTOs
 * R6-AC6: No React/React Native imports
 */
export class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: AuthRemoteDataSourceConfig) {
    this.baseUrl = config.baseUrl;
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  // =========================================================================
  // Magic Link
  // =========================================================================

  async requestMagicLink(
    request: MagicLinkRequestDto
  ): Promise<DataSourceResult<MagicLinkResponseDto>> {
    return this.post<MagicLinkResponseDto>("/auth/magic-link", request);
  }

  async resendMagicLink(
    request: MagicLinkResendRequestDto
  ): Promise<DataSourceResult<MagicLinkResponseDto>> {
    return this.post<MagicLinkResponseDto>("/auth/magic-link/resend", request);
  }

  // =========================================================================
  // Verify
  // =========================================================================

  async verifyMagicLink(
    token: string
  ): Promise<DataSourceResult<VerifyResponseDto>> {
    const url = new URL("/auth/verify", this.baseUrl);
    url.searchParams.set("token", token);

    return this.get<VerifyResponseDto>(url.pathname + url.search);
  }

  // =========================================================================
  // Register
  // =========================================================================

  async register(
    request: RegisterRequestDto
  ): Promise<DataSourceResult<RegisterResponseDto>> {
    return this.post<RegisterResponseDto>("/auth/register", request);
  }

  // =========================================================================
  // Refresh
  // R5-AC1: Request sends refresh_token in body (not header)
  // =========================================================================

  async refreshSession(
    request: RefreshRequestDto
  ): Promise<DataSourceResult<RefreshResponseDto>> {
    // NOTE: NO automatic retry. Single-use tokens.
    return this.post<RefreshResponseDto>("/auth/refresh", request);
  }

  // =========================================================================
  // HTTP Helpers
  // =========================================================================

  private async post<T>(
    path: string,
    body: object
  ): Promise<DataSourceResult<T>> {
    const url = new URL(path, this.baseUrl).toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      return { ok: false, error: this.handleFetchError(error) };
    }
  }

  private async get<T>(path: string): Promise<DataSourceResult<T>> {
    const url = new URL(path, this.baseUrl).toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);
      return { ok: false, error: this.handleFetchError(error) };
    }
  }

  private async handleResponse<T>(
    response: Response
  ): Promise<DataSourceResult<T>> {
    const statusCode = response.status;

    // Try to parse JSON
    let json: unknown;
    try {
      json = await response.json();
    } catch {
      // JSON parse failed
      if (!response.ok) {
        return {
          ok: false,
          error: mapErrorResponse(null, statusCode),
        };
      }
      return {
        ok: false,
        error: createNetworkError("Failed to parse response JSON"),
      };
    }

    // Check for success
    if (response.ok) {
      return { ok: true, value: json as T };
    }

    // Map error response
    return {
      ok: false,
      error: mapErrorResponse(json, statusCode),
    };
  }

  private handleFetchError(error: unknown) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return createNetworkError(`Request timeout after ${this.timeoutMs}ms`);
      }
      return createNetworkError(`Network error: ${error.message}`);
    }
    return createNetworkError("Unknown network error");
  }
}

/**
 * Create a new AuthRemoteDataSource instance.
 */
export function createAuthRemoteDataSource(
  config: AuthRemoteDataSourceConfig
): AuthRemoteDataSource {
  return new AuthRemoteDataSourceImpl(config);
}
