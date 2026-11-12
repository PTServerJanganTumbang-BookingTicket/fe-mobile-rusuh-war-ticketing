/**
 * Queue Error Types Tests
 *
 * GH-9 T1: Unit tests for QueueError domain types.
 *
 * @module __tests__/features/queue/domain/queue-error.test
 */

import {
  type QueueErrorCode,
  QUEUE_ERROR_CODES,
  RETRYABLE_ERROR_CODES,
  TERMINAL_ERROR_CODES,
  isValidQueueErrorCode,
  isRetryableError,
  isTerminalError,
  isTransportError,
  createQueueError,
  createNetworkError,
  createTimeoutError,
  createSseConnectionError,
  createUnknownError,
} from "@/features/queue/domain";

describe("QueueError structure validation", () => {
  it("creates a valid QueueError with all required fields", () => {
    const error = createQueueError("NETWORK_ERROR", "Connection failed");

    expect(error).toEqual({
      code: "NETWORK_ERROR",
      message: "Connection failed",
      retryable: true,
      httpStatus: undefined,
      queueState: undefined,
    });
  });

  it("creates a QueueError with optional httpStatus", () => {
    const error = createQueueError("UNAUTHORIZED", "Not authenticated", {
      httpStatus: 401,
    });

    expect(error.httpStatus).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("creates a QueueError with optional queueState", () => {
    const error = createQueueError("QUEUE_FULL", "Queue capacity reached", {
      httpStatus: 503,
      queueState: "FULL_QUEUE",
    });

    expect(error.queueState).toBe("FULL_QUEUE");
    expect(error.httpStatus).toBe(503);
    expect(error.retryable).toBe(true);
  });

  it("creates FULL_BOOKED error with distinct queueState", () => {
    const error = createQueueError("FULL_BOOKED", "Inventory exhausted", {
      httpStatus: 409,
      queueState: "FULL_BOOKED",
    });

    expect(error.queueState).toBe("FULL_BOOKED");
    expect(error.httpStatus).toBe(409);
    // FULL_BOOKED is NOT in RETRYABLE_ERROR_CODES
    expect(error.retryable).toBe(false);
  });
});

describe("isRetryableError type guard", () => {
  it("returns true for NETWORK_ERROR", () => {
    const error = createNetworkError("Connection failed");
    expect(isRetryableError(error)).toBe(true);
  });

  it("returns true for TIMEOUT_ERROR", () => {
    const error = createTimeoutError("Request timed out");
    expect(isRetryableError(error)).toBe(true);
  });

  it("returns true for SSE_CONNECTION_ERROR", () => {
    const error = createSseConnectionError("SSE connection lost");
    expect(isRetryableError(error)).toBe(true);
  });

  it("returns true for QUEUE_FULL (temporary, 503)", () => {
    const error = createQueueError("QUEUE_FULL", "Queue full", {
      httpStatus: 503,
      queueState: "FULL_QUEUE",
    });
    expect(isRetryableError(error)).toBe(true);
  });

  it("returns true for CAPTCHA_REQUIRED", () => {
    const error = createQueueError("CAPTCHA_REQUIRED", "CAPTCHA required", {
      httpStatus: 400,
    });
    expect(isRetryableError(error)).toBe(true);
  });

  it("returns false for SALE_CLOSED (terminal)", () => {
    const error = createQueueError("SALE_CLOSED", "Sale ended", {
      httpStatus: 410,
      queueState: "CLOSED",
    });
    expect(isRetryableError(error)).toBe(false);
  });

  it("returns false for FULL_BOOKED (not retryable per spec)", () => {
    const error = createQueueError("FULL_BOOKED", "Fully booked", {
      httpStatus: 409,
      queueState: "FULL_BOOKED",
    });
    expect(isRetryableError(error)).toBe(false);
  });

  it("returns false for EVENT_NOT_FOUND (terminal)", () => {
    const error = createQueueError("EVENT_NOT_FOUND", "Event not found", {
      httpStatus: 404,
    });
    expect(isRetryableError(error)).toBe(false);
  });

  it("returns false for UNAUTHORIZED", () => {
    const error = createQueueError("UNAUTHORIZED", "Unauthorized", {
      httpStatus: 401,
    });
    expect(isRetryableError(error)).toBe(false);
  });
});

describe("isTerminalError type guard", () => {
  it("returns true for SALE_CLOSED", () => {
    const error = createQueueError("SALE_CLOSED", "Sale ended", {
      queueState: "CLOSED",
    });
    expect(isTerminalError(error)).toBe(true);
  });

  it("returns true for EVENT_NOT_FOUND", () => {
    const error = createQueueError("EVENT_NOT_FOUND", "Event not found");
    expect(isTerminalError(error)).toBe(true);
  });

  it("returns false for NETWORK_ERROR", () => {
    const error = createNetworkError("Connection failed");
    expect(isTerminalError(error)).toBe(false);
  });

  it("returns false for QUEUE_FULL", () => {
    const error = createQueueError("QUEUE_FULL", "Queue full");
    expect(isTerminalError(error)).toBe(false);
  });
});

describe("isTransportError type guard", () => {
  it("returns true for NETWORK_ERROR", () => {
    const error = createNetworkError("Connection failed");
    expect(isTransportError(error)).toBe(true);
  });

  it("returns true for TIMEOUT_ERROR", () => {
    const error = createTimeoutError("Timed out");
    expect(isTransportError(error)).toBe(true);
  });

  it("returns true for SSE_CONNECTION_ERROR", () => {
    const error = createSseConnectionError("SSE failed");
    expect(isTransportError(error)).toBe(true);
  });

  it("returns false for domain errors", () => {
    const unauthorized = createQueueError("UNAUTHORIZED", "Unauthorized");
    const captchaRequired = createQueueError("CAPTCHA_REQUIRED", "CAPTCHA");
    const queueFull = createQueueError("QUEUE_FULL", "Full");

    expect(isTransportError(unauthorized)).toBe(false);
    expect(isTransportError(captchaRequired)).toBe(false);
    expect(isTransportError(queueFull)).toBe(false);
  });
});

describe("Error code completeness", () => {
  it("QUEUE_ERROR_CODES contains all expected codes", () => {
    const expectedCodes: QueueErrorCode[] = [
      "NETWORK_ERROR",
      "TIMEOUT_ERROR",
      "SSE_CONNECTION_ERROR",
      "UNKNOWN_ERROR",
      "CAPTCHA_REQUIRED",
      "CAPTCHA_FAILED",
      "DEVICE_ID_REQUIRED",
      "QUEUE_FULL",
      "FULL_BOOKED",
      "SALE_CLOSED",
      "UNAUTHORIZED",
      "TOKEN_INVALID",
      "EVENT_NOT_FOUND",
    ];

    expect(QUEUE_ERROR_CODES).toEqual(expect.arrayContaining(expectedCodes));
    expect(QUEUE_ERROR_CODES.length).toBe(expectedCodes.length);
  });

  it("RETRYABLE_ERROR_CODES is subset of QUEUE_ERROR_CODES", () => {
    for (const code of RETRYABLE_ERROR_CODES) {
      expect(QUEUE_ERROR_CODES).toContain(code);
    }
  });

  it("TERMINAL_ERROR_CODES is subset of QUEUE_ERROR_CODES", () => {
    for (const code of TERMINAL_ERROR_CODES) {
      expect(QUEUE_ERROR_CODES).toContain(code);
    }
  });

  it("RETRYABLE and TERMINAL codes do not overlap", () => {
    const overlap = RETRYABLE_ERROR_CODES.filter((code) =>
      TERMINAL_ERROR_CODES.includes(code)
    );
    expect(overlap).toHaveLength(0);
  });
});

describe("isValidQueueErrorCode", () => {
  it("returns true for valid error codes", () => {
    for (const code of QUEUE_ERROR_CODES) {
      expect(isValidQueueErrorCode(code)).toBe(true);
    }
  });

  it("returns false for invalid strings", () => {
    expect(isValidQueueErrorCode("INVALID_CODE")).toBe(false);
    expect(isValidQueueErrorCode("network_error")).toBe(false);
    expect(isValidQueueErrorCode("")).toBe(false);
  });

  it("returns false for non-strings", () => {
    expect(isValidQueueErrorCode(null)).toBe(false);
    expect(isValidQueueErrorCode(undefined)).toBe(false);
    expect(isValidQueueErrorCode(123)).toBe(false);
    expect(isValidQueueErrorCode({})).toBe(false);
  });
});

describe("Factory functions", () => {
  it("createNetworkError creates correct error", () => {
    const error = createNetworkError("Network failed");
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.message).toBe("Network failed");
    expect(error.retryable).toBe(true);
  });

  it("createTimeoutError creates correct error", () => {
    const error = createTimeoutError("Request timed out");
    expect(error.code).toBe("TIMEOUT_ERROR");
    expect(error.message).toBe("Request timed out");
    expect(error.retryable).toBe(true);
  });

  it("createSseConnectionError creates correct error", () => {
    const error = createSseConnectionError("SSE connection lost");
    expect(error.code).toBe("SSE_CONNECTION_ERROR");
    expect(error.message).toBe("SSE connection lost");
    expect(error.retryable).toBe(true);
  });

  it("createUnknownError creates correct error", () => {
    const error = createUnknownError("Something went wrong");
    expect(error.code).toBe("UNKNOWN_ERROR");
    expect(error.message).toBe("Something went wrong");
    // UNKNOWN_ERROR is not in RETRYABLE_ERROR_CODES
    expect(error.retryable).toBe(false);
  });
});

describe("R7-AC5: FULL_QUEUE vs FULL_BOOKED distinction", () => {
  it("FULL_QUEUE and FULL_BOOKED are distinct error codes", () => {
    const queueFull = createQueueError("QUEUE_FULL", "Queue capacity", {
      httpStatus: 503,
      queueState: "FULL_QUEUE",
    });
    const fullBooked = createQueueError("FULL_BOOKED", "Inventory exhausted", {
      httpStatus: 409,
      queueState: "FULL_BOOKED",
    });

    expect(queueFull.code).not.toBe(fullBooked.code);
    expect(queueFull.queueState).not.toBe(fullBooked.queueState);
    expect(queueFull.httpStatus).not.toBe(fullBooked.httpStatus);
    expect(queueFull.retryable).not.toBe(fullBooked.retryable);
  });
});
