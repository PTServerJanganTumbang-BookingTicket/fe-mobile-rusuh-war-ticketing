/**
 * Magic Link DTOs
 *
 * GH-6: Request/response DTOs for magic link endpoints.
 * Field names match snake_case from API contract.
 *
 * Contract Evidence: api-contracts.md §1.1, §1.2
 *
 * @module features/auth/data/dtos
 */

/**
 * POST /auth/magic-link request body.
 * R1-AC1: Request DTO contains email: string
 */
export interface MagicLinkRequestDto {
  email: string;
}

/**
 * POST /auth/magic-link/resend request body.
 * R2-AC1: Request DTO contains email: string
 */
export interface MagicLinkResendRequestDto {
  email: string;
}

/**
 * Success response envelope for magic link endpoints.
 * R1-AC2, R2-AC2: Response contains 200 status
 */
export interface MagicLinkResponseDto {
  meta: {
    code: 200;
    message: string;
  };
  data: Record<string, never>;
}

/**
 * Rate limited response for magic link endpoints.
 * R1-AC3: Given 429 rate limit, retry_after is extractable
 */
export interface MagicLinkRateLimitedDto {
  meta: {
    code: 429;
    message: string;
  };
  data: {
    retry_after: number;
  };
}
