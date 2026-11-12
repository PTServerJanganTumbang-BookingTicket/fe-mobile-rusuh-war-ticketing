/**
 * Error Mapper Tests
 *
 * GH-6 T4: Mapper unit tests
 * R9-AC1: Maps all known error codes
 * R9-AC4: Unknown codes captured in UNKNOWN variant
 */

import {
  mapErrorResponse,
  createNetworkError,
  createStorageError,
} from "@/features/auth/data";
import {
  mockRateLimitResponse,
  mockTokenInvalidResponse,
  mockTokenExpiredResponse,
  mockNikAlreadyRegisteredResponse,
  mockConsentRequiredResponse,
  mockValidationErrorResponse,
} from "../../__fixtures__";

describe("mapErrorResponse", () => {
  describe("rate limit errors", () => {
    it("maps 429 response to RATE_LIMITED with retry_after_ms", () => {
      const error = mapErrorResponse(mockRateLimitResponse, 429);

      expect(error.code).toBe("RATE_LIMITED");
      if (error.code === "RATE_LIMITED") {
        // retry_after is 60 seconds, converted to ms
        expect(error.retryAfterMs).toBe(60000);
      }
    });
  });

  describe("auth token errors", () => {
    it("maps TOKEN_INVALID error code", () => {
      const error = mapErrorResponse(mockTokenInvalidResponse, 401);

      expect(error.code).toBe("TOKEN_INVALID");
      if (error.code === "TOKEN_INVALID") {
        expect(error.message).toBe("Session ended");
      }
    });

    it("maps TOKEN_EXPIRED error code", () => {
      const error = mapErrorResponse(mockTokenExpiredResponse, 401);

      expect(error.code).toBe("TOKEN_EXPIRED");
      if (error.code === "TOKEN_EXPIRED") {
        expect(error.message).toBe("Token expired");
      }
    });
  });

  describe("registration errors", () => {
    it("maps NIK_ALREADY_REGISTERED error code", () => {
      const error = mapErrorResponse(mockNikAlreadyRegisteredResponse, 409);

      expect(error.code).toBe("NIK_ALREADY_REGISTERED");
      if (error.code === "NIK_ALREADY_REGISTERED") {
        expect(error.message).toBe("NIK already registered");
      }
    });

    it("maps CONSENT_REQUIRED error code", () => {
      const error = mapErrorResponse(mockConsentRequiredResponse, 422);

      expect(error.code).toBe("CONSENT_REQUIRED");
      if (error.code === "CONSENT_REQUIRED") {
        expect(error.message).toBe("Consent required");
      }
    });
  });

  describe("validation errors", () => {
    it("maps VALIDATION_ERROR error code", () => {
      const error = mapErrorResponse(mockValidationErrorResponse, 400);

      expect(error.code).toBe("VALIDATION_ERROR");
      if (error.code === "VALIDATION_ERROR") {
        expect(error.message).toBe("Invalid email format");
      }
    });

    it("maps 400 without error_code to VALIDATION_ERROR", () => {
      const response = {
        meta: { code: 400, message: "Bad request" },
        data: {},
      };

      const error = mapErrorResponse(response, 400);

      expect(error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("unknown errors", () => {
    it("maps unknown error_code to UNKNOWN with original preserved", () => {
      const response = {
        meta: {
          code: 500,
          message: "Internal error",
          error_code: "SOME_UNKNOWN_CODE",
        },
        data: {},
      };

      const error = mapErrorResponse(response, 500);

      expect(error.code).toBe("UNKNOWN");
      if (error.code === "UNKNOWN") {
        expect(error.message).toBe("Internal error");
        expect(error.originalCode).toBe("SOME_UNKNOWN_CODE");
      }
    });

    it("maps unexpected status code to UNKNOWN", () => {
      const response = {
        meta: { code: 503, message: "Service unavailable" },
        data: {},
      };

      const error = mapErrorResponse(response, 503);

      expect(error.code).toBe("UNKNOWN");
    });
  });

  describe("status code fallbacks", () => {
    it("maps 401 without error_code to TOKEN_INVALID", () => {
      const response = {
        meta: { code: 401, message: "Unauthorized" },
        data: {},
      };

      const error = mapErrorResponse(response, 401);

      expect(error.code).toBe("TOKEN_INVALID");
    });

    it("maps 409 without error_code to NIK_ALREADY_REGISTERED", () => {
      const response = {
        meta: { code: 409, message: "Conflict" },
        data: {},
      };

      const error = mapErrorResponse(response, 409);

      expect(error.code).toBe("NIK_ALREADY_REGISTERED");
    });

    it("maps 422 without error_code to CONSENT_REQUIRED", () => {
      const response = {
        meta: { code: 422, message: "Unprocessable" },
        data: {},
      };

      const error = mapErrorResponse(response, 422);

      expect(error.code).toBe("CONSENT_REQUIRED");
    });
  });
});

describe("createNetworkError", () => {
  it("creates NETWORK_ERROR with message", () => {
    const error = createNetworkError("Connection refused");

    expect(error.code).toBe("NETWORK_ERROR");
    if (error.code === "NETWORK_ERROR") {
      expect(error.message).toBe("Connection refused");
    }
  });
});

describe("createStorageError", () => {
  it("creates STORAGE_ERROR with message", () => {
    const error = createStorageError("SecureStore unavailable");

    expect(error.code).toBe("STORAGE_ERROR");
    if (error.code === "STORAGE_ERROR") {
      expect(error.message).toBe("SecureStore unavailable");
    }
  });
});
