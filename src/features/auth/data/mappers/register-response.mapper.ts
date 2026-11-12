/**
 * Register Response Mapper
 *
 * GH-6: Maps register DTO to domain RegisterResult.
 *
 * R4-AC7: DTO maps to domain Result<RegisterResult, AuthError>
 * R10-AC2: DTOs are separate from domain models
 *
 * @module features/auth/data/mappers
 */

import type { RegisterResult } from "../../domain";
import type { RegisterResponseDto } from "../dtos";

/**
 * Map register response DTO to domain RegisterResult.
 *
 * @param dto - Register response from API
 * @returns Domain RegisterResult
 */
export function mapRegisterResponse(dto: RegisterResponseDto): RegisterResult {
  return {
    userId: dto.data.user_id,
  };
}
