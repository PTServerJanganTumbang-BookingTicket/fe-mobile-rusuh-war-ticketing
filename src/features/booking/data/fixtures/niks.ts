/**
 * NIK Fixtures
 *
 * GH-12 T5: Deterministic NIK fixtures for testing.
 * All NIKs are fake test data - never use real NIKs.
 *
 * @module features/booking/data/fixtures/niks
 */

import type { SavedNik, NikValidationResponse } from "../../domain";

/**
 * Test NIK that is valid and not used.
 */
export const NIK_VALID_1 = "3201020304050001";
export const NIK_VALID_1_MASKED = "3201****0001";
export const NIK_VALID_1_NAME = "John Doe";

export const NIK_VALID_2 = "3201020304050002";
export const NIK_VALID_2_MASKED = "3201****0002";
export const NIK_VALID_2_NAME = "Jane Doe";

export const NIK_VALID_3 = "3201020304050003";
export const NIK_VALID_3_MASKED = "3201****0003";
export const NIK_VALID_3_NAME = "Bob Smith";

/**
 * Test NIK that is not found in registry.
 */
export const NIK_NOT_FOUND = "0000000000000000";

/**
 * Test NIK that is inactive.
 */
export const NIK_INACTIVE = "9999999999999999";

/**
 * Test NIK that is already used for this event.
 */
export const NIK_ALREADY_USED = "1111111111111111";
export const NIK_ALREADY_USED_NAME = "Already Booked";

/**
 * NIK validation result directory for testing.
 */
export interface NikDirectoryEntry {
  nik: string;
  valid: boolean;
  reason?: "NIK_NOT_FOUND" | "NIK_INACTIVE" | "NIK_ALREADY_USED";
  holderName?: string;
  alreadyUsed?: boolean;
  masked: string;
}

export const NIK_DIRECTORY: Record<string, NikDirectoryEntry> = {
  [NIK_VALID_1]: {
    nik: NIK_VALID_1,
    valid: true,
    holderName: NIK_VALID_1_NAME,
    masked: NIK_VALID_1_MASKED,
  },
  [NIK_VALID_2]: {
    nik: NIK_VALID_2,
    valid: true,
    holderName: NIK_VALID_2_NAME,
    masked: NIK_VALID_2_MASKED,
  },
  [NIK_VALID_3]: {
    nik: NIK_VALID_3,
    valid: true,
    holderName: NIK_VALID_3_NAME,
    masked: NIK_VALID_3_MASKED,
  },
  [NIK_NOT_FOUND]: {
    nik: NIK_NOT_FOUND,
    valid: false,
    reason: "NIK_NOT_FOUND",
    masked: "0000****0000",
  },
  [NIK_INACTIVE]: {
    nik: NIK_INACTIVE,
    valid: false,
    reason: "NIK_INACTIVE",
    masked: "9999****9999",
  },
  [NIK_ALREADY_USED]: {
    nik: NIK_ALREADY_USED,
    valid: false,
    reason: "NIK_ALREADY_USED",
    holderName: NIK_ALREADY_USED_NAME,
    alreadyUsed: true,
    masked: "1111****1111",
  },
};

/**
 * Lookup NIK in directory and return validation response.
 */
export function lookupNik(nik: string): NikValidationResponse {
  const entry = NIK_DIRECTORY[nik];

  if (!entry) {
    // Unknown NIK defaults to not found
    return {
      nik,
      valid: false,
      reason: "NIK_NOT_FOUND",
    };
  }

  if (entry.valid) {
    return { nik, valid: true };
  }

  return {
    nik,
    valid: false,
    reason: entry.reason,
    alreadyUsed: entry.alreadyUsed,
  };
}

/**
 * Saved NIK fixtures for logged-in user.
 */
export const SAVED_NIK_1: SavedNik = {
  id: "snik_001",
  nikMasked: NIK_VALID_2_MASKED,
  label: "Adik",
};

export const SAVED_NIK_2: SavedNik = {
  id: "snik_002",
  nikMasked: NIK_VALID_3_MASKED,
  label: "Kakak",
};

/**
 * Default saved NIKs list.
 */
export const SAVED_NIKS: SavedNik[] = [SAVED_NIK_1, SAVED_NIK_2];

/**
 * Account NIK fixture (user's own registered NIK).
 */
export const ACCOUNT_NIK_MASKED = NIK_VALID_1_MASKED;
export const ACCOUNT_EMAIL = "user@example.com";
