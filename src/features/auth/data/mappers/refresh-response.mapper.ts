/**
 * Refresh Response Mapper
 *
 * GH-6: Maps refresh DTO to domain AuthSession.
 *
 * R5-AC8: DTO maps to domain Result<AuthSession, AuthError>
 * R10-AC2: DTOs are separate from domain models
 *
 * @module features/auth/data/mappers
 */

import { createAccessToken } from "@/core/domain";
import type { AuthSession, AuthUser } from "../../domain";
import type { RefreshResponseDto } from "../dtos";

/**
 * Map refresh response DTO to domain AuthSession.
 *
 * @param dto - Refresh response from API
 * @param existingUser - User info from previous session (refresh doesn't return user)
 * @returns Domain AuthSession
 */
export function mapRefreshResponse(
  dto: RefreshResponseDto,
  existingUser: AuthUser
): AuthSession {
  const expiresAt = new Date(Date.now() + dto.data.expires_in * 1000);

  return {
    accessToken: createAccessToken(dto.data.access_token),
    expiresAt,
    user: existingUser,
    // Redirect context not returned on refresh
  };
}

/**
 * Extract raw refresh token from refresh response.
 * Used by repository to store in SecureStore.
 *
 * R5-AC4, R5-AC5: NEW refresh token replaces OLD
 *
 * @param dto - Refresh response from API
 * @returns Raw refresh token string
 */
export function extractRefreshTokenFromRefresh(
  dto: RefreshResponseDto
): string {
  return dto.data.refresh_token;
}
