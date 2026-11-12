/**
 * NIK Types
 *
 * Discriminated union and validation for NIK exactly-one-of constraint.
 * Contract Evidence: docs/CONTRACT-BASELINE.md §4.1
 *
 * @module core/domain/booking/nik.types
 */

/**
 * NIK input with raw NIK string.
 * Server normalizes: strips non-digits, requires exactly 16 digits.
 * R8-AC5: NIK normalization rule documented
 */
export interface NikInputRaw {
  type: "raw";
  /** Raw NIK string (will be normalized by server) */
  nik: string;
}

/**
 * NIK input referencing a saved NIK by ID.
 */
export interface NikInputSaved {
  type: "saved";
  /** ID of saved NIK from user's account */
  savedNikId: string;
}

/**
 * NIK input using the account's registered NIK.
 */
export interface NikInputAccount {
  type: "account";
  /** Flag to use account's registered NIK */
  useAccountNik: true;
}

/**
 * NIK Input Discriminated Union.
 *
 * R8-AC1: Three variants: raw_nik, saved_nik_id, use_account_nik
 * Contract requires exactly ONE of these fields per ticket.
 */
export type NikInput = NikInputRaw | NikInputSaved | NikInputAccount;

/**
 * NIK validation error types.
 */
export type NikValidationError =
  | "NIK_MISSING" // R8-AC2: Zero NIK fields
  | "NIK_MULTIPLE" // R8-AC3: Multiple NIK fields present
  | "NIK_INVALID"; // Invalid NIK format (not exactly 16 digits after normalization)

/**
 * NIK validation result.
 */
export type NikValidationResult =
  | { valid: true; input: NikInput }
  | { valid: false; error: NikValidationError };

/**
 * Normalize NIK string according to server rules.
 * R8-AC5: Strips non-digits, requires exactly 16 digits.
 *
 * @param nik - Raw NIK input
 * @returns Normalized NIK string (digits only)
 */
export function normalizeNik(nik: string): string {
  return nik.replace(/\D/g, "");
}

/**
 * Check if NIK is valid after normalization.
 *
 * @param nik - Raw or normalized NIK
 * @returns true if exactly 16 digits after normalization
 */
export function isValidNikFormat(nik: string): boolean {
  const normalized = normalizeNik(nik);
  return normalized.length === 16;
}

/**
 * Validate NIK input enforcing exactly-one-of constraint.
 *
 * R8-AC2: Zero NIK fields -> error
 * R8-AC3: Multiple NIK fields -> error
 * R8-AC4: Exactly one NIK field -> valid
 *
 * @param input - Object with optional NIK fields (API request shape)
 * @returns Validation result with typed NikInput or error
 */
export function validateNikInput(input: {
  nik?: string;
  savedNikId?: string;
  useAccountNik?: boolean;
}): NikValidationResult {
  const hasNik = input.nik !== undefined && input.nik !== "";
  const hasSavedNikId =
    input.savedNikId !== undefined && input.savedNikId !== "";
  const hasUseAccountNik = input.useAccountNik === true;

  const fieldCount = [hasNik, hasSavedNikId, hasUseAccountNik].filter(
    Boolean
  ).length;

  // R8-AC2: Zero fields
  if (fieldCount === 0) {
    return { valid: false, error: "NIK_MISSING" };
  }

  // R8-AC3: Multiple fields
  if (fieldCount > 1) {
    return { valid: false, error: "NIK_MULTIPLE" };
  }

  // R8-AC4: Exactly one field
  if (hasNik) {
    return { valid: true, input: { type: "raw", nik: input.nik! } };
  }

  if (hasSavedNikId) {
    return {
      valid: true,
      input: { type: "saved", savedNikId: input.savedNikId! },
    };
  }

  // hasUseAccountNik must be true
  return { valid: true, input: { type: "account", useAccountNik: true } };
}

/**
 * Convert NikInput to API request fields.
 *
 * @param nikInput - Validated NikInput
 * @returns Object with exactly one NIK field set
 */
export function nikInputToRequest(nikInput: NikInput): {
  nik?: string;
  saved_nik_id?: string;
  use_account_nik?: true;
} {
  switch (nikInput.type) {
    case "raw":
      return { nik: nikInput.nik };
    case "saved":
      return { saved_nik_id: nikInput.savedNikId };
    case "account":
      return { use_account_nik: true };
  }
}
