/**
 * Verify DTOs
 *
 * GH-6: Response DTO for magic link verification endpoint.
 * Field names match snake_case from API contract.
 *
 * Contract Evidence: api-contracts.md §1.3
 *
 * @module features/auth/data/dtos
 */

/**
 * User data in verify response.
 * R3-AC2: Response DTO user includes id, email, nik? (masked)
 */
export interface VerifyUserDto {
  id: string;
  email: string;
  /** Masked NIK, optional if user hasn't registered NIK yet */
  nik?: string;
}

/**
 * Redirect context in verify response.
 * R3-AC3: Response DTO optionally includes redirect_context for booking recovery
 */
export interface VerifyRedirectContextDto {
  type: "booking" | "queue";
  event_id: string;
  booking_id?: string;
  message?: string;
}

/**
 * GET /auth/verify?token={token} success response.
 * R3-AC1: Response DTO includes access_token, refresh_token, expires_in, user
 */
export interface VerifyResponseDto {
  meta: {
    code: 200;
    message: string;
    server_time?: string;
  };
  data: {
    access_token: string;
    refresh_token: string;
    /** Token TTL in seconds (22740 = 6h 19m) */
    expires_in: number;
    user: VerifyUserDto;
    /** Optional booking/queue context to restore */
    redirect_context?: VerifyRedirectContextDto;
  };
}
