/**
 * Queue HTTP DTOs Tests
 *
 * GH-9 T2: Unit tests for Queue HTTP DTOs.
 *
 * @module __tests__/features/queue/data/dtos/queue-http.dtos.test
 */

import {
  isQueueJoinResponse,
  isQueueMeResponse,
  isQueueErrorResponse,
  extractQueueToken,
  extractSseUrl,
  extractGrantMetadata,
  type QueueJoinResponseDto,
  type QueueMeResponseDto,
  type QueueErrorResponseDto,
} from "@/features/queue/data/dtos";

describe("QueueJoinResponseDto", () => {
  const validResponse: QueueJoinResponseDto = {
    queue_token: "qt_abc123",
    sse_url: "https://sse.example.com/stream/123",
    ticket_no: 42,
    joined_at: "2026-11-12T10:00:00Z",
  };

  describe("isQueueJoinResponse", () => {
    it("returns true for valid response", () => {
      expect(isQueueJoinResponse(validResponse)).toBe(true);
    });

    it("returns true for response with optional fields", () => {
      const withOptional: QueueJoinResponseDto = {
        ...validResponse,
        rejoined: true,
        state: "SELECTING",
      };
      expect(isQueueJoinResponse(withOptional)).toBe(true);
    });

    it("returns false when queue_token missing", () => {
      const invalid = { ...validResponse, queue_token: undefined };
      expect(isQueueJoinResponse(invalid)).toBe(false);
    });

    it("returns false when sse_url missing", () => {
      const invalid = { ...validResponse, sse_url: undefined };
      expect(isQueueJoinResponse(invalid)).toBe(false);
    });

    it("returns false when ticket_no missing", () => {
      const invalid = { ...validResponse, ticket_no: undefined };
      expect(isQueueJoinResponse(invalid)).toBe(false);
    });

    it("returns false when joined_at missing", () => {
      const invalid = { ...validResponse, joined_at: undefined };
      expect(isQueueJoinResponse(invalid)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isQueueJoinResponse(null)).toBe(false);
    });

    it("returns false for non-object", () => {
      expect(isQueueJoinResponse("string")).toBe(false);
      expect(isQueueJoinResponse(123)).toBe(false);
    });
  });

  describe("extractQueueToken", () => {
    it("extracts queue_token", () => {
      expect(extractQueueToken(validResponse)).toBe("qt_abc123");
    });
  });

  describe("extractSseUrl", () => {
    it("extracts sse_url", () => {
      expect(extractSseUrl(validResponse)).toBe(
        "https://sse.example.com/stream/123"
      );
    });
  });
});

describe("QueueMeResponseDto", () => {
  const queuedResponse: QueueMeResponseDto = {
    state: "QUEUED",
    server_time: "2026-11-12T10:05:00Z",
    position: 30,
    rate_per_min: 15,
  };

  const grantedResponse: QueueMeResponseDto = {
    state: "GRANTED",
    server_time: "2026-11-12T10:10:00Z",
    grant_token: "gt_xyz789",
    booking_expires_at: "2026-11-12T10:20:00Z",
  };

  describe("isQueueMeResponse", () => {
    it("returns true for QUEUED response", () => {
      expect(isQueueMeResponse(queuedResponse)).toBe(true);
    });

    it("returns true for GRANTED response", () => {
      expect(isQueueMeResponse(grantedResponse)).toBe(true);
    });

    it("returns false when state missing", () => {
      const invalid = { server_time: "2026-11-12T10:00:00Z" };
      expect(isQueueMeResponse(invalid)).toBe(false);
    });

    it("returns false when server_time missing", () => {
      const invalid = { state: "QUEUED" };
      expect(isQueueMeResponse(invalid)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isQueueMeResponse(null)).toBe(false);
    });
  });

  describe("extractGrantMetadata", () => {
    it("extracts grant metadata when GRANTED", () => {
      const metadata = extractGrantMetadata(grantedResponse);
      expect(metadata).toEqual({
        grantToken: "gt_xyz789",
        expiresAt: "2026-11-12T10:20:00Z",
      });
    });

    it("returns null when not GRANTED", () => {
      expect(extractGrantMetadata(queuedResponse)).toBeNull();
    });

    it("returns null when GRANTED but missing grant_token", () => {
      const incomplete: QueueMeResponseDto = {
        state: "GRANTED",
        server_time: "2026-11-12T10:10:00Z",
        booking_expires_at: "2026-11-12T10:20:00Z",
      };
      expect(extractGrantMetadata(incomplete)).toBeNull();
    });

    it("returns null when GRANTED but missing booking_expires_at", () => {
      const incomplete: QueueMeResponseDto = {
        state: "GRANTED",
        server_time: "2026-11-12T10:10:00Z",
        grant_token: "gt_xyz789",
      };
      expect(extractGrantMetadata(incomplete)).toBeNull();
    });
  });
});

describe("QueueErrorResponseDto", () => {
  const errorResponse: QueueErrorResponseDto = {
    error_code: "CAPTCHA_REQUIRED",
    message: "CAPTCHA verification required",
  };

  const errorWithData: QueueErrorResponseDto = {
    error_code: "QUEUE_FULL",
    message: "Queue is at capacity",
    data: {
      queue_state: "FULL_QUEUE",
      retry_after: 30,
    },
  };

  describe("isQueueErrorResponse", () => {
    it("returns true for basic error response", () => {
      expect(isQueueErrorResponse(errorResponse)).toBe(true);
    });

    it("returns true for error response with data", () => {
      expect(isQueueErrorResponse(errorWithData)).toBe(true);
    });

    it("returns false when error_code missing", () => {
      const invalid = { message: "Some error" };
      expect(isQueueErrorResponse(invalid)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isQueueErrorResponse(null)).toBe(false);
    });

    it("returns false for non-object", () => {
      expect(isQueueErrorResponse("string")).toBe(false);
    });
  });
});

describe("Response field extraction", () => {
  it("sse_url host may differ from API host", () => {
    // R4-AC1: sse_url is used as-is, host may differ
    const response: QueueJoinResponseDto = {
      queue_token: "qt_test",
      sse_url: "https://different-host.example.com/sse/stream",
      ticket_no: 1,
      joined_at: "2026-11-12T10:00:00Z",
    };

    const sseUrl = extractSseUrl(response);

    // URL should be preserved exactly (different host allowed)
    expect(sseUrl).toBe("https://different-host.example.com/sse/stream");
    expect(new URL(sseUrl).host).toBe("different-host.example.com");
  });

  it("rejoin response includes state field", () => {
    // R2-AC4: Rejoin response handling
    const rejoinResponse: QueueJoinResponseDto = {
      queue_token: "qt_rejoin",
      sse_url: "https://sse.example.com/stream",
      ticket_no: 10,
      joined_at: "2026-11-12T09:00:00Z",
      rejoined: true,
      state: "SELECTING",
    };

    expect(isQueueJoinResponse(rejoinResponse)).toBe(true);
    expect(rejoinResponse.rejoined).toBe(true);
    expect(rejoinResponse.state).toBe("SELECTING");
  });
});
