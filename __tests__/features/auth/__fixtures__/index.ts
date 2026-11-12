/**
 * Auth Test Fixtures
 *
 * GH-6: Deterministic synthetic test fixtures.
 * All values are unmistakably synthetic - no real credentials, NIK, or PII.
 *
 * @module __tests__/features/auth/__fixtures__
 */

import type {
  VerifyResponseDto,
  RefreshResponseDto,
  RegisterResponseDto,
  MagicLinkResponseDto,
} from "@/features/auth/data";
import type { AuthUser } from "@/features/auth";

// =============================================================================
// Synthetic Values (unmistakably fake)
// =============================================================================

/** Fake NIK — clearly synthetic 16-digit all-zeros value */
export const FAKE_NIK = "0000000000000000";

/** Fake masked NIK */
export const FAKE_NIK_MASKED = "0000********0000";

/** Synthetic user ID */
export const FAKE_USER_ID = "usr_test_00000000";

/** Synthetic email — example.com domain per RFC 2606 */
export const FAKE_EMAIL = "test@example.com";

/** Synthetic access token — clearly labeled not real */
export const FAKE_ACCESS_TOKEN = "test_access_token_not_real_00000000";

/** Synthetic refresh token — clearly labeled not real */
export const FAKE_REFRESH_TOKEN = "test_refresh_token_not_real_00000000";

/** Synthetic new refresh token for rotation tests */
export const FAKE_NEW_REFRESH_TOKEN =
  "test_new_refresh_token_not_real_00000000";

/** Synthetic policy version */
export const FAKE_POLICY_VERSION = "0000-00-00";

/** Synthetic event ID */
export const FAKE_EVENT_ID = "evt_test_00000000";

/** Synthetic booking ID */
export const FAKE_BOOKING_ID = "bkg_test_00000000";

/** Standard expires_in value (6h 19m in seconds) */
export const STANDARD_EXPIRES_IN = 22740;

// =============================================================================
// Mock Domain Objects
// =============================================================================

export const mockAuthUser: AuthUser = {
  id: FAKE_USER_ID,
  email: FAKE_EMAIL,
  nikMasked: FAKE_NIK_MASKED,
};

export const mockAuthUserWithoutNik: AuthUser = {
  id: FAKE_USER_ID,
  email: FAKE_EMAIL,
  nikMasked: null,
};

// =============================================================================
// Mock DTOs
// =============================================================================

export const mockMagicLinkResponse: MagicLinkResponseDto = {
  meta: { code: 200, message: "Magic link sent" },
  data: {},
};

export const mockVerifyResponse: VerifyResponseDto = {
  meta: { code: 200, message: "Login successful" },
  data: {
    access_token: FAKE_ACCESS_TOKEN,
    refresh_token: FAKE_REFRESH_TOKEN,
    expires_in: STANDARD_EXPIRES_IN,
    user: {
      id: FAKE_USER_ID,
      email: FAKE_EMAIL,
      nik: FAKE_NIK_MASKED,
    },
  },
};

export const mockVerifyResponseWithRedirect: VerifyResponseDto = {
  meta: { code: 200, message: "Login successful" },
  data: {
    access_token: FAKE_ACCESS_TOKEN,
    refresh_token: FAKE_REFRESH_TOKEN,
    expires_in: STANDARD_EXPIRES_IN,
    user: {
      id: FAKE_USER_ID,
      email: FAKE_EMAIL,
      nik: FAKE_NIK_MASKED,
    },
    redirect_context: {
      type: "booking",
      event_id: FAKE_EVENT_ID,
      booking_id: FAKE_BOOKING_ID,
      message: "Resume your booking",
    },
  },
};

export const mockVerifyResponseWithoutNik: VerifyResponseDto = {
  meta: { code: 200, message: "Login successful" },
  data: {
    access_token: FAKE_ACCESS_TOKEN,
    refresh_token: FAKE_REFRESH_TOKEN,
    expires_in: STANDARD_EXPIRES_IN,
    user: {
      id: FAKE_USER_ID,
      email: FAKE_EMAIL,
      // No NIK - user hasn't registered NIK yet
    },
  },
};

export const mockRefreshResponse: RefreshResponseDto = {
  meta: { code: 200, message: "Token refreshed" },
  data: {
    access_token: FAKE_ACCESS_TOKEN,
    refresh_token: FAKE_NEW_REFRESH_TOKEN,
    expires_in: STANDARD_EXPIRES_IN,
  },
};

export const mockRegisterResponse: RegisterResponseDto = {
  meta: { code: 201, message: "Registration successful" },
  data: {
    user_id: FAKE_USER_ID,
  },
};

// =============================================================================
// Mock Error Responses
// =============================================================================

export const mockRateLimitResponse = {
  meta: { code: 429, message: "Rate limited" },
  data: { retry_after: 60 },
};

export const mockTokenInvalidResponse = {
  meta: { code: 401, message: "Session ended", error_code: "TOKEN_INVALID" },
  data: {},
};

export const mockTokenExpiredResponse = {
  meta: { code: 401, message: "Token expired", error_code: "TOKEN_EXPIRED" },
  data: {},
};

export const mockNikAlreadyRegisteredResponse = {
  meta: {
    code: 409,
    message: "NIK already registered",
    error_code: "NIK_ALREADY_REGISTERED",
  },
  data: {},
};

export const mockConsentRequiredResponse = {
  meta: {
    code: 422,
    message: "Consent required",
    error_code: "CONSENT_REQUIRED",
  },
  data: {},
};

export const mockValidationErrorResponse = {
  meta: {
    code: 400,
    message: "Invalid email format",
    error_code: "VALIDATION_ERROR",
  },
  data: {},
};
