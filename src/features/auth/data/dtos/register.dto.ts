/**
 * Register DTOs
 *
 * GH-6: Request/response DTOs for registration endpoint.
 * Field names match snake_case from API contract.
 *
 * Contract Evidence: api-contracts.md §1.5
 *
 * @module features/auth/data/dtos
 */

/**
 * Consent data in register request.
 * R4-AC1: consent: { accepted: boolean, policy_version: string }
 */
export interface RegisterConsentDto {
  accepted: boolean;
  policy_version: string;
}

/**
 * POST /auth/register request body.
 * R4-AC1: Request DTO contains email, nik, consent
 */
export interface RegisterRequestDto {
  email: string;
  /** NIK must be 16 digits (non-digits stripped) */
  nik: string;
  consent: RegisterConsentDto;
}

/**
 * POST /auth/register success response.
 * R4-AC3: Given valid registration, Then user_id is returned
 */
export interface RegisterResponseDto {
  meta: {
    code: 200 | 201;
    message: string;
  };
  data: {
    user_id: string;
  };
}
