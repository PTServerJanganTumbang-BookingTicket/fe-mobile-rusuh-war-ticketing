/**
 * Auth User Domain Types
 *
 * GH-6: Domain models for user data and registration.
 * Pure TypeScript - no React/React Native imports.
 *
 * Contract Evidence: api-contracts.md §1.5
 * @module features/auth/domain
 */

/**
 * Registration parameters.
 *
 * R4-AC1: Request DTO contains email, nik, consent
 */
export interface RegisterParams {
  /** User email */
  readonly email: string;
  /** NIK (16 digits, non-digits stripped before sending) */
  readonly nik: string;
  /** Consent acceptance */
  readonly consent: RegisterConsent;
}

/**
 * Consent acceptance for registration.
 *
 * R4-AC1: consent: { accepted: boolean, policy_version: string }
 */
export interface RegisterConsent {
  /** User accepted the policy */
  readonly accepted: boolean;
  /** Policy version being accepted */
  readonly policyVersion: string;
}

/**
 * Registration result.
 *
 * R4-AC3: Given valid registration, When successful, Then user_id is returned
 */
export interface RegisterResult {
  /** Created user ID */
  readonly userId: string;
}
