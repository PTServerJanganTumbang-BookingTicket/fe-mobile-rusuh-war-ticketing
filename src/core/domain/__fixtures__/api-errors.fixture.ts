/**
 * API Error Test Fixtures
 *
 * Deterministic fixtures matching CONTRACT-BASELINE.md for all error codes.
 * R13-AC4: Fixtures exist for all R2-AC1 error codes
 *
 * @module core/domain/__fixtures__/api-errors.fixture
 */

import type { ApiError, KnownApiErrorCode } from "../api/error.types";

/**
 * API error fixture with full error details.
 */
export interface ApiErrorFixture {
  code: KnownApiErrorCode;
  status: number;
  message: string;
  description: string;
}

/**
 * DEVICE_ID_REQUIRED error fixture.
 * CONTRACT-BASELINE.md §3.4, §6.3: Guest missing X-Device-Id
 */
export const ERROR_DEVICE_ID_REQUIRED: ApiErrorFixture = {
  code: "DEVICE_ID_REQUIRED",
  status: 400,
  message: "Device ID is required for guest requests",
  description: "Guest missing X-Device-Id header",
};

/**
 * CAPTCHA_REQUIRED error fixture.
 * CONTRACT-BASELINE.md §6.3: Missing captcha_token
 */
export const ERROR_CAPTCHA_REQUIRED: ApiErrorFixture = {
  code: "CAPTCHA_REQUIRED",
  status: 400,
  message: "CAPTCHA verification is required",
  description: "Missing captcha_token in queue join request",
};

/**
 * QUEUE_FULL error fixture.
 * CONTRACT-BASELINE.md §2.4, §6.3: Queue capacity reached
 */
export const ERROR_QUEUE_FULL: ApiErrorFixture = {
  code: "QUEUE_FULL",
  status: 503,
  message: "Queue capacity has been reached",
  description: "Queue capacity reached (temporary, retryable)",
};

/**
 * FULL_BOOKED error fixture.
 * CONTRACT-BASELINE.md §2.4: Inventory exhaustion
 */
export const ERROR_FULL_BOOKED: ApiErrorFixture = {
  code: "FULL_BOOKED",
  status: 409,
  message: "All tickets have been booked",
  description: "Inventory exhaustion (may recover if holds expire)",
};

/**
 * DEVICE_MISMATCH error fixture.
 * Device ID doesn't match the one used for queue join.
 */
export const ERROR_DEVICE_MISMATCH: ApiErrorFixture = {
  code: "DEVICE_MISMATCH",
  status: 400,
  message: "Device ID does not match",
  description: "X-Device-Id doesn't match the one used for queue join",
};

/**
 * GRANT_TOKEN_INVALID error fixture.
 * Invalid or expired grant token.
 */
export const ERROR_GRANT_TOKEN_INVALID: ApiErrorFixture = {
  code: "GRANT_TOKEN_INVALID",
  status: 401,
  message: "Grant token is invalid or expired",
  description: "X-Grant-Token is invalid or has expired",
};

/**
 * NIK_ALREADY_USED error fixture.
 * CONTRACT-BASELINE.md §4.1: NIK already used for this event
 */
export const ERROR_NIK_ALREADY_USED: ApiErrorFixture = {
  code: "NIK_ALREADY_USED",
  status: 409,
  message: "NIK has already been used for this event",
  description:
    "NIK uniqueness constraint violation (1 NIK = 1 ticket per event)",
};

/**
 * DUKCAPIL_UNAVAILABLE error fixture.
 * NIK validation service is unavailable.
 */
export const ERROR_DUKCAPIL_UNAVAILABLE: ApiErrorFixture = {
  code: "DUKCAPIL_UNAVAILABLE",
  status: 503,
  message: "NIK validation service is temporarily unavailable",
  description: "Dukcapil (NIK validation) service is down",
};

/**
 * All API error fixtures.
 * R13-AC6: Fixtures are exported for use in feature tests
 */
export const ALL_API_ERRORS: readonly ApiErrorFixture[] = [
  ERROR_DEVICE_ID_REQUIRED,
  ERROR_CAPTCHA_REQUIRED,
  ERROR_QUEUE_FULL,
  ERROR_FULL_BOOKED,
  ERROR_DEVICE_MISMATCH,
  ERROR_GRANT_TOKEN_INVALID,
  ERROR_NIK_ALREADY_USED,
  ERROR_DUKCAPIL_UNAVAILABLE,
];

/**
 * Create an ApiError from a fixture.
 */
export function createApiErrorFromFixture(fixture: ApiErrorFixture): ApiError {
  return {
    status: fixture.status,
    code: fixture.code,
    message: fixture.message,
  };
}

/**
 * Retryable error fixtures (temporary conditions).
 */
export const RETRYABLE_ERRORS: readonly ApiErrorFixture[] = [
  ERROR_QUEUE_FULL,
  ERROR_DUKCAPIL_UNAVAILABLE,
];

/**
 * Client error fixtures (user action needed).
 */
export const CLIENT_ERRORS: readonly ApiErrorFixture[] = [
  ERROR_DEVICE_ID_REQUIRED,
  ERROR_CAPTCHA_REQUIRED,
  ERROR_DEVICE_MISMATCH,
];
