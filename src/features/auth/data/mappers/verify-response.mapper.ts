/**
 * Verify Response Mapper
 *
 * GH-6: Maps verify DTO to domain AuthSession.
 *
 * R3-AC6: DTO maps to domain AuthSession with typed tokens
 * R10-AC2: DTOs are separate from domain models
 *
 * @module features/auth/data/mappers
 */

import { createAccessToken } from "@/core/domain";
import type { AuthSession, AuthUser, RedirectContext } from "../../domain";
import type { VerifyResponseDto, VerifyRedirectContextDto } from "../dtos";

/**
 * Map verify response DTO to domain AuthSession.
 *
 * @param dto - Verify response from API
 * @returns Domain AuthSession
 */
export function mapVerifyResponse(dto: VerifyResponseDto): AuthSession {
  const expiresAt = new Date(Date.now() + dto.data.expires_in * 1000);

  return {
    accessToken: createAccessToken(dto.data.access_token),
    expiresAt,
    user: mapUser(dto.data.user),
    redirectContext: dto.data.redirect_context
      ? mapRedirectContext(dto.data.redirect_context)
      : undefined,
  };
}

/**
 * Map user DTO to domain AuthUser.
 */
function mapUser(user: VerifyResponseDto["data"]["user"]): AuthUser {
  return {
    id: user.id,
    email: user.email,
    nikMasked: user.nik ?? null,
  };
}

/**
 * Map redirect context DTO to domain RedirectContext.
 */
function mapRedirectContext(dto: VerifyRedirectContextDto): RedirectContext {
  return {
    type: dto.type,
    eventId: dto.event_id,
    bookingId: dto.booking_id,
    message: dto.message,
  };
}

/**
 * Extract raw refresh token from verify response.
 * Used by repository to store in SecureStore.
 *
 * @param dto - Verify response from API
 * @returns Raw refresh token string
 */
export function extractRefreshToken(dto: VerifyResponseDto): string {
  return dto.data.refresh_token;
}
