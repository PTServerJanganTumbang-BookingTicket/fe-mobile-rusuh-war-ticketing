/**
 * Refresh DTOs
 *
 * GH-6: Request/response DTOs for session refresh endpoint.
 * Field names match snake_case from API contract.
 *
 * Contract Evidence: api-contracts.md §1.4
 *
 * @module features/auth/data/dtos
 */

/**
 * POST /auth/refresh request body.
 * R5-AC1: Request sends refresh_token in body (not header)
 */
export interface RefreshRequestDto {
  refresh_token: string;
}

/**
 * POST /auth/refresh success response.
 * R5-AC2: Response DTO includes access_token, refresh_token, expires_in
 */
export interface RefreshResponseDto {
  meta: {
    code: 200;
    message: string;
  };
  data: {
    access_token: string;
    refresh_token: string;
    /** Token TTL in seconds (22740 = 6h 19m) */
    expires_in: number;
  };
}
