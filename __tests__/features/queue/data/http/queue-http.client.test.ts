/**
 * Queue HTTP Client Tests
 *
 * GH-9 T5: Integration tests for Queue HTTP client.
 * Uses mock fetch transport.
 *
 * Test Matrix:
 * - Integration: join() with captcha_token success
 * - Integration: join() with guest X-Device-Id header
 * - Integration: join() with authenticated Authorization header
 * - Integration: join() missing captcha returns CAPTCHA_REQUIRED
 * - Integration: join() guest missing device ID returns DEVICE_ID_REQUIRED
 * - Integration: join() HTTP 503 returns QUEUE_FULL
 * - Integration: join() HTTP 409 returns FULL_BOOKED
 * - Integration: join() HTTP 410 returns CLOSED
 * - Integration: getMe() success returns QueueMeResponse
 * - Integration: getMe() with GRANTED returns grant metadata
 * - Integration: getMe() HTTP 401 returns TOKEN_INVALID
 * - Integration: Network failure returns NETWORK_ERROR
 * - Integration: Timeout returns TIMEOUT_ERROR
 *
 * @module __tests__/features/queue/data/http/queue-http.client.test
 */

import type { AuthContext } from "@/core/domain";
import { createAccessToken, createDeviceId } from "@/core/domain";
import { QueueHttpClient } from "@/features/queue/data/http";
import type {
  QueueJoinRequest,
  QueueMeRequest,
} from "@/features/queue/data/http";

// --- Test Helpers ---

function createMockFetch(
  responseData: unknown,
  options: { status?: number; ok?: boolean; delay?: number } = {}
): jest.Mock {
  const { status = 200, ok = true, delay = 0 } = options;

  return jest.fn().mockImplementation(() => {
    const response = {
      ok,
      status,
      json: () => Promise.resolve(responseData),
    };

    if (delay > 0) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(response), delay)
      );
    }

    return Promise.resolve(response);
  });
}

function createNetworkErrorFetch(): jest.Mock {
  return jest.fn().mockRejectedValue(new Error("Network request failed"));
}

function createAbortFetch(): jest.Mock {
  return jest.fn().mockImplementation(() => {
    const error = new Error("Aborted");
    error.name = "AbortError";
    throw error;
  });
}

const TEST_BASE_URL = "https://api.test.rusuh.id";
const TEST_EVENT_ID = "evt_12345";

const guestAuthContext: AuthContext = {
  type: "guest",
  deviceId: createDeviceId("550e8400-e29b-41d4-a716-446655440000"),
};

const authenticatedAuthContext: AuthContext = {
  type: "authenticated",
  accessToken: createAccessToken("access_token_abc123"),
};

describe("QueueHttpClient", () => {
  describe("join()", () => {
    // Integration: join() with captcha_token success
    it("successfully joins queue with captcha_token", async () => {
      const successResponse = {
        queue_token: "qt_test123",
        sse_url: "https://sse.test.rusuh.id/stream/123",
        ticket_no: 42,
        joined_at: "2026-11-12T10:00:00Z",
      };

      const mockFetch = createMockFetch(successResponse);
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const request: QueueJoinRequest = {
        eventId: TEST_EVENT_ID,
        captchaToken: "captcha_token_xyz",
        authContext: guestAuthContext,
      };

      const result = await client.join(request);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.queue_token).toBe("qt_test123");
        expect(result.data.sse_url).toBe(
          "https://sse.test.rusuh.id/stream/123"
        );
        expect(result.data.ticket_no).toBe(42);
        expect(result.data.joined_at).toBe("2026-11-12T10:00:00Z");
      }

      // Verify request body
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.captcha_token).toBe("captcha_token_xyz");
    });

    // Integration: join() with guest X-Device-Id header
    it("includes X-Device-Id header for guest auth", async () => {
      const successResponse = {
        queue_token: "qt_guest",
        sse_url: "https://sse.test.rusuh.id/stream/guest",
        ticket_no: 1,
        joined_at: "2026-11-12T10:05:00Z",
      };

      const mockFetch = createMockFetch(successResponse);
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const request: QueueJoinRequest = {
        eventId: TEST_EVENT_ID,
        captchaToken: "captcha",
        authContext: guestAuthContext,
      };

      await client.join(request);

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers["X-Device-Id"]).toBe(
        "550e8400-e29b-41d4-a716-446655440000"
      );
      expect(headers["Authorization"]).toBeUndefined();
    });

    // Integration: join() with authenticated Authorization header
    it("includes Authorization header for authenticated auth", async () => {
      const successResponse = {
        queue_token: "qt_auth",
        sse_url: "https://sse.test.rusuh.id/stream/auth",
        ticket_no: 5,
        joined_at: "2026-11-12T10:10:00Z",
      };

      const mockFetch = createMockFetch(successResponse);
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const request: QueueJoinRequest = {
        eventId: TEST_EVENT_ID,
        captchaToken: "captcha",
        authContext: authenticatedAuthContext,
      };

      await client.join(request);

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("Bearer access_token_abc123");
      expect(headers["X-Device-Id"]).toBeUndefined();
    });

    // Integration: join() missing captcha returns CAPTCHA_REQUIRED
    it("returns CAPTCHA_REQUIRED error for 400 with CAPTCHA_REQUIRED code", async () => {
      const errorResponse = {
        error_code: "CAPTCHA_REQUIRED",
        message: "CAPTCHA verification required",
      };

      const mockFetch = createMockFetch(errorResponse, {
        status: 400,
        ok: false,
      });
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const request: QueueJoinRequest = {
        eventId: TEST_EVENT_ID,
        captchaToken: "",
        authContext: guestAuthContext,
      };

      const result = await client.join(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("CAPTCHA_REQUIRED");
        expect(result.error.httpStatus).toBe(400);
        expect(result.error.retryable).toBe(true);
      }
    });

    // Integration: join() guest missing device ID returns DEVICE_ID_REQUIRED
    it("returns DEVICE_ID_REQUIRED error for 400 with DEVICE_ID_REQUIRED code", async () => {
      const errorResponse = {
        error_code: "DEVICE_ID_REQUIRED",
        message: "X-Device-Id header is required for guest users",
      };

      const mockFetch = createMockFetch(errorResponse, {
        status: 400,
        ok: false,
      });
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const request: QueueJoinRequest = {
        eventId: TEST_EVENT_ID,
        captchaToken: "captcha",
        authContext: guestAuthContext,
      };

      const result = await client.join(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("DEVICE_ID_REQUIRED");
        expect(result.error.httpStatus).toBe(400);
      }
    });

    // Integration: join() HTTP 503 returns QUEUE_FULL
    it("returns QUEUE_FULL error for HTTP 503", async () => {
      const errorResponse = {
        error_code: "QUEUE_FULL",
        message: "Queue is at capacity",
        data: {
          queue_state: "FULL_QUEUE",
          retry_after: 30,
        },
      };

      const mockFetch = createMockFetch(errorResponse, {
        status: 503,
        ok: false,
      });
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const request: QueueJoinRequest = {
        eventId: TEST_EVENT_ID,
        captchaToken: "captcha",
        authContext: guestAuthContext,
      };

      const result = await client.join(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("QUEUE_FULL");
        expect(result.error.httpStatus).toBe(503);
        expect(result.error.queueState).toBe("FULL_QUEUE");
        expect(result.error.retryable).toBe(true);
      }
    });

    // Integration: join() HTTP 409 returns FULL_BOOKED
    it("returns FULL_BOOKED error for HTTP 409", async () => {
      const errorResponse = {
        error_code: "FULL_BOOKED",
        message: "All tickets have been booked",
        data: {
          queue_state: "FULL_BOOKED",
        },
      };

      const mockFetch = createMockFetch(errorResponse, {
        status: 409,
        ok: false,
      });
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const request: QueueJoinRequest = {
        eventId: TEST_EVENT_ID,
        captchaToken: "captcha",
        authContext: guestAuthContext,
      };

      const result = await client.join(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("FULL_BOOKED");
        expect(result.error.httpStatus).toBe(409);
        expect(result.error.queueState).toBe("FULL_BOOKED");
        expect(result.error.retryable).toBe(false);
      }
    });

    // Integration: join() HTTP 410 returns CLOSED
    it("returns SALE_CLOSED error for HTTP 410", async () => {
      const errorResponse = {
        error_code: "SALE_CLOSED",
        message: "Sale has ended",
      };

      const mockFetch = createMockFetch(errorResponse, {
        status: 410,
        ok: false,
      });
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const request: QueueJoinRequest = {
        eventId: TEST_EVENT_ID,
        captchaToken: "captcha",
        authContext: guestAuthContext,
      };

      const result = await client.join(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SALE_CLOSED");
        expect(result.error.httpStatus).toBe(410);
        expect(result.error.queueState).toBe("CLOSED");
      }
    });
  });

  describe("getMe()", () => {
    const queueMeRequest: QueueMeRequest = {
      eventId: TEST_EVENT_ID,
      queueToken: "qt_test123",
    };

    // Integration: getMe() success returns QueueMeResponse
    it("successfully retrieves queue status", async () => {
      const successResponse = {
        state: "QUEUED",
        server_time: "2026-11-12T10:15:00Z",
        position: 30,
        rate_per_min: 15,
      };

      const mockFetch = createMockFetch(successResponse);
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const result = await client.getMe(queueMeRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.state).toBe("QUEUED");
        expect(result.data.server_time).toBe("2026-11-12T10:15:00Z");
        expect(result.data.position).toBe(30);
        expect(result.data.rate_per_min).toBe(15);
      }
    });

    it("includes X-Queue-Token header", async () => {
      const successResponse = {
        state: "QUEUED",
        server_time: "2026-11-12T10:20:00Z",
      };

      const mockFetch = createMockFetch(successResponse);
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      await client.getMe(queueMeRequest);

      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Record<string, string>;
      expect(headers["X-Queue-Token"]).toBe("qt_test123");
    });

    // Integration: getMe() with GRANTED returns grant metadata
    it("returns grant metadata when state is GRANTED", async () => {
      const grantedResponse = {
        state: "GRANTED",
        server_time: "2026-11-12T10:25:00Z",
        grant_token: "gt_xyz789",
        booking_expires_at: "2026-11-12T10:35:00Z",
      };

      const mockFetch = createMockFetch(grantedResponse);
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const result = await client.getMe(queueMeRequest);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.state).toBe("GRANTED");
        expect(result.data.grant_token).toBe("gt_xyz789");
        expect(result.data.booking_expires_at).toBe("2026-11-12T10:35:00Z");
      }
    });

    // Integration: getMe() HTTP 401 returns TOKEN_INVALID
    it("returns TOKEN_INVALID error for HTTP 401", async () => {
      const errorResponse = {
        error_code: "TOKEN_INVALID",
        message: "Queue token is invalid or expired",
      };

      const mockFetch = createMockFetch(errorResponse, {
        status: 401,
        ok: false,
      });
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const result = await client.getMe(queueMeRequest);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("TOKEN_INVALID");
        expect(result.error.httpStatus).toBe(401);
      }
    });
  });

  describe("error handling", () => {
    // Integration: Network failure returns NETWORK_ERROR
    it("returns NETWORK_ERROR on network failure", async () => {
      const mockFetch = createNetworkErrorFetch();
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const request: QueueJoinRequest = {
        eventId: TEST_EVENT_ID,
        captchaToken: "captcha",
        authContext: guestAuthContext,
      };

      const result = await client.join(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NETWORK_ERROR");
        expect(result.error.retryable).toBe(true);
      }
    });

    // Integration: Timeout returns TIMEOUT_ERROR
    it("returns TIMEOUT_ERROR on request timeout", async () => {
      const mockFetch = createAbortFetch();
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
        timeoutMs: 100,
      });

      const request: QueueJoinRequest = {
        eventId: TEST_EVENT_ID,
        captchaToken: "captcha",
        authContext: guestAuthContext,
      };

      const result = await client.join(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("TIMEOUT_ERROR");
        expect(result.error.message).toContain("100ms");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("handles network error on getMe", async () => {
      const mockFetch = createNetworkErrorFetch();
      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      const request: QueueMeRequest = {
        eventId: TEST_EVENT_ID,
        queueToken: "qt_test",
      };

      const result = await client.getMe(request);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NETWORK_ERROR");
      }
    });
  });

  describe("URL construction", () => {
    it("constructs correct join URL", async () => {
      const mockFetch = createMockFetch({
        queue_token: "qt_test",
        sse_url: "https://sse.test.rusuh.id/stream",
        ticket_no: 1,
        joined_at: "2026-11-12T10:00:00Z",
      });

      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      await client.join({
        eventId: "evt_abc",
        captchaToken: "captcha",
        authContext: guestAuthContext,
      });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toBe("https://api.test.rusuh.id/events/evt_abc/queue/join");
    });

    it("constructs correct me URL", async () => {
      const mockFetch = createMockFetch({
        state: "QUEUED",
        server_time: "2026-11-12T10:00:00Z",
      });

      const client = new QueueHttpClient({
        baseUrl: TEST_BASE_URL,
        fetch: mockFetch,
      });

      await client.getMe({
        eventId: "evt_xyz",
        queueToken: "qt_test",
      });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toBe("https://api.test.rusuh.id/events/evt_xyz/queue/me");
    });

    it("handles baseUrl with trailing slash", async () => {
      const mockFetch = createMockFetch({
        state: "QUEUED",
        server_time: "2026-11-12T10:00:00Z",
      });

      const client = new QueueHttpClient({
        baseUrl: "https://api.test.rusuh.id/",
        fetch: mockFetch,
      });

      await client.getMe({
        eventId: "evt_xyz",
        queueToken: "qt_test",
      });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toBe("https://api.test.rusuh.id/events/evt_xyz/queue/me");
    });
  });
});
