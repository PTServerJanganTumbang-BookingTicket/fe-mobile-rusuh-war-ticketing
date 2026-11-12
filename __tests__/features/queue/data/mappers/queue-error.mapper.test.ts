/**
 * Queue Error Mapper Tests
 *
 * GH-9 T3: Unit tests for Queue error mapping.
 * Tests all CONTRACT-BASELINE.md error codes.
 *
 * Test Matrix:
 * - UT-01: mapHttpError(400, CAPTCHA_REQUIRED) → QueueError
 * - UT-02: mapHttpError(400, CAPTCHA_FAILED) → QueueError
 * - UT-03: mapHttpError(400, DEVICE_ID_REQUIRED) → QueueError
 * - UT-04: mapHttpError(503, QUEUE_FULL) → QueueError with FULL_QUEUE
 * - UT-05: mapHttpError(409, FULL_BOOKED) → QueueError with FULL_BOOKED
 * - UT-06: mapHttpError(410, _) → QueueError with CLOSED
 * - UT-07: mapHttpError(401, UNAUTHORIZED) → QueueError
 * - UT-08: mapHttpError(401, TOKEN_INVALID) → QueueError
 * - UT-09: mapHttpError(404, _) → EVENT_NOT_FOUND
 * - UT-10: mapNetworkError() → NETWORK_ERROR
 * - UT-11: mapTimeoutError() → TIMEOUT_ERROR
 *
 * @module __tests__/features/queue/data/mappers/queue-error.mapper.test
 */

import {
  mapHttpError,
  mapNetworkError,
  mapTimeoutError,
  hasQueueStateTransition,
  getErrorQueueState,
} from "@/features/queue/data/mappers";
import type { QueueErrorResponseDto } from "@/features/queue/data/dtos";

describe("Queue Error Mapper", () => {
  describe("mapHttpError", () => {
    // UT-01: mapHttpError(400, CAPTCHA_REQUIRED) → QueueError
    it("maps 400 CAPTCHA_REQUIRED to QueueError", () => {
      const errorDto: QueueErrorResponseDto = {
        error_code: "CAPTCHA_REQUIRED",
        message: "CAPTCHA verification required",
      };

      const error = mapHttpError(400, errorDto);

      expect(error.code).toBe("CAPTCHA_REQUIRED");
      expect(error.message).toBe("CAPTCHA verification required");
      expect(error.httpStatus).toBe(400);
      expect(error.retryable).toBe(true);
    });

    // UT-02: mapHttpError(400, CAPTCHA_FAILED) → QueueError
    it("maps 400 CAPTCHA_FAILED to QueueError", () => {
      const errorDto: QueueErrorResponseDto = {
        error_code: "CAPTCHA_FAILED",
        message: "CAPTCHA verification failed",
      };

      const error = mapHttpError(400, errorDto);

      expect(error.code).toBe("CAPTCHA_FAILED");
      expect(error.message).toBe("CAPTCHA verification failed");
      expect(error.httpStatus).toBe(400);
      expect(error.retryable).toBe(true);
    });

    // UT-03: mapHttpError(400, DEVICE_ID_REQUIRED) → QueueError
    it("maps 400 DEVICE_ID_REQUIRED to QueueError", () => {
      const errorDto: QueueErrorResponseDto = {
        error_code: "DEVICE_ID_REQUIRED",
        message: "X-Device-Id header required for guest users",
      };

      const error = mapHttpError(400, errorDto);

      expect(error.code).toBe("DEVICE_ID_REQUIRED");
      expect(error.message).toBe("X-Device-Id header required for guest users");
      expect(error.httpStatus).toBe(400);
      expect(error.retryable).toBe(false);
    });

    // UT-04: mapHttpError(503, QUEUE_FULL) → QueueError with FULL_QUEUE
    it("maps 503 QUEUE_FULL to QueueError with FULL_QUEUE state", () => {
      const errorDto: QueueErrorResponseDto = {
        error_code: "QUEUE_FULL",
        message: "Queue is at capacity",
        data: {
          queue_state: "FULL_QUEUE",
          retry_after: 30,
        },
      };

      const error = mapHttpError(503, errorDto);

      expect(error.code).toBe("QUEUE_FULL");
      expect(error.message).toBe("Queue is at capacity");
      expect(error.httpStatus).toBe(503);
      expect(error.queueState).toBe("FULL_QUEUE");
      expect(error.retryable).toBe(true); // R7-AC2: FULL_QUEUE is retryable
    });

    // UT-05: mapHttpError(409, FULL_BOOKED) → QueueError with FULL_BOOKED
    it("maps 409 FULL_BOOKED to QueueError with FULL_BOOKED state", () => {
      const errorDto: QueueErrorResponseDto = {
        error_code: "FULL_BOOKED",
        message: "All tickets have been booked",
        data: {
          queue_state: "FULL_BOOKED",
        },
      };

      const error = mapHttpError(409, errorDto);

      expect(error.code).toBe("FULL_BOOKED");
      expect(error.message).toBe("All tickets have been booked");
      expect(error.httpStatus).toBe(409);
      expect(error.queueState).toBe("FULL_BOOKED");
      expect(error.retryable).toBe(false);
    });

    // UT-06: mapHttpError(410, _) → QueueError with CLOSED
    it("maps 410 to QueueError with CLOSED state (terminal)", () => {
      const errorDto: QueueErrorResponseDto = {
        error_code: "SALE_CLOSED",
        message: "Sale has ended",
      };

      const error = mapHttpError(410, errorDto);

      expect(error.code).toBe("SALE_CLOSED");
      expect(error.message).toBe("Sale has ended");
      expect(error.httpStatus).toBe(410);
      expect(error.queueState).toBe("CLOSED");
      expect(error.retryable).toBe(false);
    });

    // UT-07: mapHttpError(401, UNAUTHORIZED) → QueueError
    it("maps 401 UNAUTHORIZED to QueueError", () => {
      const errorDto: QueueErrorResponseDto = {
        error_code: "UNAUTHORIZED",
        message: "Authentication required",
      };

      const error = mapHttpError(401, errorDto);

      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Authentication required");
      expect(error.httpStatus).toBe(401);
      expect(error.retryable).toBe(false);
    });

    // UT-08: mapHttpError(401, TOKEN_INVALID) → QueueError
    it("maps 401 TOKEN_INVALID to QueueError", () => {
      const errorDto: QueueErrorResponseDto = {
        error_code: "TOKEN_INVALID",
        message: "Queue token is invalid or expired",
      };

      const error = mapHttpError(401, errorDto);

      expect(error.code).toBe("TOKEN_INVALID");
      expect(error.message).toBe("Queue token is invalid or expired");
      expect(error.httpStatus).toBe(401);
      expect(error.retryable).toBe(false);
    });

    it("maps 401 TOKEN_EXPIRED to TOKEN_INVALID", () => {
      const errorDto: QueueErrorResponseDto = {
        error_code: "TOKEN_EXPIRED",
        message: "Queue token has expired",
      };

      const error = mapHttpError(401, errorDto);

      expect(error.code).toBe("TOKEN_INVALID");
      expect(error.message).toBe("Queue token has expired");
      expect(error.httpStatus).toBe(401);
    });

    // UT-09: mapHttpError(404, _) → EVENT_NOT_FOUND
    it("maps 404 to EVENT_NOT_FOUND (terminal)", () => {
      const errorDto: QueueErrorResponseDto = {
        error_code: "NOT_FOUND",
        message: "Event does not exist",
      };

      const error = mapHttpError(404, errorDto);

      expect(error.code).toBe("EVENT_NOT_FOUND");
      expect(error.message).toBe("Event does not exist");
      expect(error.httpStatus).toBe(404);
      expect(error.retryable).toBe(false);
    });

    it("handles 400 without error_code as UNKNOWN_ERROR", () => {
      const errorDto: QueueErrorResponseDto = {
        error_code: "",
        message: "Bad request",
      };

      const error = mapHttpError(400, errorDto);

      expect(error.code).toBe("UNKNOWN_ERROR");
      expect(error.httpStatus).toBe(400);
    });

    it("handles unknown HTTP status as UNKNOWN_ERROR", () => {
      const error = mapHttpError(500);

      expect(error.code).toBe("UNKNOWN_ERROR");
      expect(error.httpStatus).toBe(500);
      expect(error.message).toBe("HTTP 500 error");
    });

    it("handles 503 without body using default FULL_QUEUE state", () => {
      const error = mapHttpError(503);

      expect(error.code).toBe("QUEUE_FULL");
      expect(error.queueState).toBe("FULL_QUEUE");
    });

    it("handles 409 without body using default FULL_BOOKED state", () => {
      const error = mapHttpError(409);

      expect(error.code).toBe("FULL_BOOKED");
      expect(error.queueState).toBe("FULL_BOOKED");
    });
  });

  // UT-10: mapNetworkError() → NETWORK_ERROR
  describe("mapNetworkError", () => {
    it("creates NETWORK_ERROR from Error object", () => {
      const originalError = new Error("Connection refused");

      const error = mapNetworkError(originalError);

      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Connection refused");
      expect(error.retryable).toBe(true);
      expect(error.httpStatus).toBeUndefined();
    });

    it("creates NETWORK_ERROR from unknown error", () => {
      const error = mapNetworkError("string error");

      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Network connection failed");
      expect(error.retryable).toBe(true);
    });

    it("creates NETWORK_ERROR without argument", () => {
      const error = mapNetworkError();

      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.message).toBe("Network connection failed");
      expect(error.retryable).toBe(true);
    });
  });

  // UT-11: mapTimeoutError() → TIMEOUT_ERROR
  describe("mapTimeoutError", () => {
    it("creates TIMEOUT_ERROR with duration", () => {
      const error = mapTimeoutError(30000);

      expect(error.code).toBe("TIMEOUT_ERROR");
      expect(error.message).toBe("Request timed out after 30000ms");
      expect(error.retryable).toBe(true);
      expect(error.httpStatus).toBeUndefined();
    });

    it("creates TIMEOUT_ERROR without duration", () => {
      const error = mapTimeoutError();

      expect(error.code).toBe("TIMEOUT_ERROR");
      expect(error.message).toBe("Request timed out");
      expect(error.retryable).toBe(true);
    });
  });

  describe("hasQueueStateTransition", () => {
    it("returns true when queueState is present", () => {
      const error = mapHttpError(503, {
        error_code: "QUEUE_FULL",
        data: { queue_state: "FULL_QUEUE" },
      });

      expect(hasQueueStateTransition(error)).toBe(true);
    });

    it("returns false when queueState is undefined", () => {
      const error = mapHttpError(400, {
        error_code: "CAPTCHA_REQUIRED",
      });

      expect(hasQueueStateTransition(error)).toBe(false);
    });
  });

  describe("getErrorQueueState", () => {
    it("extracts FULL_QUEUE state", () => {
      const error = mapHttpError(503, {
        error_code: "QUEUE_FULL",
        data: { queue_state: "FULL_QUEUE" },
      });

      expect(getErrorQueueState(error)).toBe("FULL_QUEUE");
    });

    it("extracts FULL_BOOKED state", () => {
      const error = mapHttpError(409, {
        error_code: "FULL_BOOKED",
        data: { queue_state: "FULL_BOOKED" },
      });

      expect(getErrorQueueState(error)).toBe("FULL_BOOKED");
    });

    it("extracts CLOSED state", () => {
      const error = mapHttpError(410, {
        error_code: "SALE_CLOSED",
      });

      expect(getErrorQueueState(error)).toBe("CLOSED");
    });

    it("returns undefined for non-state errors", () => {
      const error = mapNetworkError();

      expect(getErrorQueueState(error)).toBeUndefined();
    });
  });

  // R3-AC4, R3-AC5: FULL_QUEUE ≠ FULL_BOOKED - distinct states
  describe("FULL_QUEUE vs FULL_BOOKED distinction (R3-AC4, R3-AC5)", () => {
    it("FULL_QUEUE is distinct from FULL_BOOKED", () => {
      const fullQueueError = mapHttpError(503, {
        error_code: "QUEUE_FULL",
        data: { queue_state: "FULL_QUEUE" },
      });

      const fullBookedError = mapHttpError(409, {
        error_code: "FULL_BOOKED",
        data: { queue_state: "FULL_BOOKED" },
      });

      // Different codes
      expect(fullQueueError.code).toBe("QUEUE_FULL");
      expect(fullBookedError.code).toBe("FULL_BOOKED");
      expect(fullQueueError.code).not.toBe(fullBookedError.code);

      // Different states
      expect(fullQueueError.queueState).toBe("FULL_QUEUE");
      expect(fullBookedError.queueState).toBe("FULL_BOOKED");
      expect(fullQueueError.queueState).not.toBe(fullBookedError.queueState);

      // Different HTTP statuses
      expect(fullQueueError.httpStatus).toBe(503);
      expect(fullBookedError.httpStatus).toBe(409);

      // Different retryability (FULL_QUEUE is retryable, FULL_BOOKED is not)
      expect(fullQueueError.retryable).toBe(true);
      expect(fullBookedError.retryable).toBe(false);
    });
  });
});
