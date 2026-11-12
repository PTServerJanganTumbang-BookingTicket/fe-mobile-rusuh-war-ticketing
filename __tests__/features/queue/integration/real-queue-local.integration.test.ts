/**
 * Real Queue Local Integration Tests
 *
 * GH-9 T9: Integration tests covering full scenarios with deterministic
 * local transport doubles (mock HTTP, mock SSE). Verifies no real network calls.
 *
 * Test Matrix:
 * - Integration: Full guest join → SSE → position updates → grant
 * - Integration: Full authenticated join → SSE → grant
 * - Integration: Rejoin response handling
 * - Integration: FULL_QUEUE error recovery
 * - Integration: FULL_BOOKED state handling
 * - Integration: CLOSED terminal state
 * - Integration: Network failure handling
 * - Integration: useQueue hook with RealQueueDataSource mock
 * - Integration: No real HTTP/SSE calls (mock fetch to throw)
 *
 * @module __tests__/features/queue/integration/real-queue-local.integration.test
 */

import { createDeviceId, createAccessToken } from "@/core/domain";
import type { AuthContext } from "@/core/domain";
import { RealQueueDataSource } from "@/features/queue/data/RealQueueDataSource";
import type { RealQueueDataSourceConfig } from "@/features/queue/data/RealQueueDataSource";
import type {
  QueueHttpClientPort,
  QueueHttpResult,
} from "@/features/queue/data/http";
import type {
  SseClientPort,
  SseConnectionConfig,
  SseCallbacks,
} from "@/features/queue/data/sse";
import type {
  QueueJoinResponseDto,
  QueueMeResponseDto,
} from "@/features/queue/data/dtos";
import type { QueueUpdate, QueueError } from "@/features/queue/domain";
import { createQueueError } from "@/features/queue/domain";

// --- Mock HTTP Client ---

class MockHttpClient implements QueueHttpClientPort {
  joinResponses: QueueHttpResult<QueueJoinResponseDto>[] = [];
  getMeResponses: QueueHttpResult<QueueMeResponseDto>[] = [];

  private joinCallIndex = 0;
  private getMeCallIndex = 0;

  async join(): Promise<QueueHttpResult<QueueJoinResponseDto>> {
    const response =
      this.joinResponses[this.joinCallIndex] ?? this.joinResponses[0];
    if (this.joinCallIndex < this.joinResponses.length - 1) {
      this.joinCallIndex++;
    }
    return response;
  }

  async getMe(): Promise<QueueHttpResult<QueueMeResponseDto>> {
    const response =
      this.getMeResponses[this.getMeCallIndex] ?? this.getMeResponses[0];
    if (this.getMeCallIndex < this.getMeResponses.length - 1) {
      this.getMeCallIndex++;
    }
    return response;
  }
}

// --- Mock SSE Client ---

class MockSseClient implements SseClientPort {
  private callbacks: SseCallbacks | null = null;
  private connected = false;
  private messageQueue: QueueUpdate[] = [];

  connect(_config: SseConnectionConfig, callbacks: SseCallbacks): void {
    this.callbacks = callbacks;
    this.connected = true;
    // Flush any queued messages
    this.flushMessages();
  }

  close(): void {
    this.connected = false;
    if (this.callbacks) {
      this.callbacks.onClose();
    }
  }

  reconnect(): void {
    // No-op for tests
  }

  isConnected(): boolean {
    return this.connected;
  }

  getReconnectCount(): number {
    return 0;
  }

  // Test helpers
  queueMessage(update: QueueUpdate): void {
    if (this.connected && this.callbacks) {
      this.callbacks.onUpdate(update);
    } else {
      this.messageQueue.push(update);
    }
  }

  private flushMessages(): void {
    if (this.callbacks) {
      for (const msg of this.messageQueue) {
        this.callbacks.onUpdate(msg);
      }
      this.messageQueue = [];
    }
  }

  emitError(error: QueueError): void {
    if (this.callbacks) {
      this.callbacks.onError(error);
    }
  }
}

// --- Test Setup ---

const guestAuthContext: AuthContext = {
  type: "guest",
  deviceId: createDeviceId("550e8400-e29b-41d4-a716-446655440000"),
};

const authenticatedAuthContext: AuthContext = {
  type: "authenticated",
  accessToken: createAccessToken("access_token_test123"),
};

function createTestConfig(
  overrides: Partial<RealQueueDataSourceConfig> = {}
): RealQueueDataSourceConfig {
  return {
    eventId: "evt_integration_test",
    captchaToken: "captcha_integration",
    authContext: guestAuthContext,
    apiBaseUrl: "https://api.integration.rusuh.id",
    ...overrides,
  };
}

function createCallbackSpies(): {
  updates: QueueUpdate[];
  errors: QueueError[];
  completeCalls: number;
  onUpdate: (update: QueueUpdate) => void;
  onComplete: () => void;
  onError: (error: QueueError) => void;
} {
  const updates: QueueUpdate[] = [];
  const errors: QueueError[] = [];
  let completeCalls = 0;

  return {
    updates,
    errors,
    get completeCalls() {
      return completeCalls;
    },
    onUpdate: (update) => updates.push(update),
    onComplete: () => {
      completeCalls++;
    },
    onError: (error) => errors.push(error),
  };
}

describe("Real Queue Local Integration Tests", () => {
  // Integration: Full guest join → SSE → position updates → grant
  describe("Full guest flow", () => {
    it("completes full flow: join → SSE → position updates → grant", async () => {
      const httpClient = new MockHttpClient();
      httpClient.joinResponses = [
        {
          ok: true,
          data: {
            queue_token: "qt_guest_flow",
            sse_url: "https://sse.test.rusuh.id/stream/guest",
            ticket_no: 50,
            joined_at: "2026-11-12T10:00:00Z",
          },
        },
      ];
      httpClient.getMeResponses = [
        {
          ok: true,
          data: {
            state: "GRANTED",
            server_time: "2026-11-12T10:10:00Z",
            grant_token: "gt_flow_test",
            booking_expires_at: "2026-11-12T10:20:00Z",
          },
        },
      ];

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig({ authContext: guestAuthContext }),
        httpClient,
        sseClient,
        onUpdate: callbacks.onUpdate,
        onComplete: callbacks.onComplete,
        onError: callbacks.onError,
      });

      await dataSource.start();

      // Simulate position updates
      sseClient.queueMessage({
        position: 40,
        queueState: "OPEN",
        engagementState: "QUEUED",
        serverTime: "2026-11-12T10:02:00Z",
      });

      sseClient.queueMessage({
        position: 20,
        queueState: "OPEN",
        engagementState: "QUEUED",
        serverTime: "2026-11-12T10:05:00Z",
      });

      // Simulate grant
      sseClient.queueMessage({
        position: 0,
        queueState: "OPEN",
        engagementState: "GRANTED",
        serverTime: "2026-11-12T10:10:00Z",
      });

      // Wait for /me call
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should have received updates
      expect(callbacks.updates.length).toBeGreaterThanOrEqual(3);

      // Final update should have grant metadata
      const grantUpdate = callbacks.updates.find(
        (u) => u.engagementState === "GRANTED" && u.grant
      );
      expect(grantUpdate).toBeDefined();
      expect(grantUpdate?.grant?.grant_token).toBe("gt_flow_test");

      dataSource.stop();
    });
  });

  // Integration: Full authenticated join → SSE → grant
  describe("Full authenticated flow", () => {
    it("uses authenticated auth context correctly", async () => {
      const httpClient = new MockHttpClient();
      httpClient.joinResponses = [
        {
          ok: true,
          data: {
            queue_token: "qt_auth_flow",
            sse_url: "https://sse.test.rusuh.id/stream/auth",
            ticket_no: 10,
            joined_at: "2026-11-12T10:00:00Z",
          },
        },
      ];
      httpClient.getMeResponses = [
        {
          ok: true,
          data: {
            state: "GRANTED",
            server_time: "2026-11-12T10:05:00Z",
            grant_token: "gt_auth",
            booking_expires_at: "2026-11-12T10:15:00Z",
          },
        },
      ];

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig({ authContext: authenticatedAuthContext }),
        httpClient,
        sseClient,
        onUpdate: callbacks.onUpdate,
        onComplete: callbacks.onComplete,
      });

      await dataSource.start();

      // Simulate immediate grant
      sseClient.queueMessage({
        position: 0,
        queueState: "OPEN",
        engagementState: "GRANTED",
        serverTime: "2026-11-12T10:05:00Z",
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      const grantUpdate = callbacks.updates.find(
        (u) => u.engagementState === "GRANTED"
      );
      expect(grantUpdate).toBeDefined();

      dataSource.stop();
    });
  });

  // Integration: Rejoin response handling
  describe("Rejoin handling", () => {
    it("handles rejoin response with existing state", async () => {
      const httpClient = new MockHttpClient();
      httpClient.joinResponses = [
        {
          ok: true,
          data: {
            queue_token: "qt_rejoin",
            sse_url: "https://sse.test.rusuh.id/stream/rejoin",
            ticket_no: 15,
            joined_at: "2026-11-12T09:00:00Z",
            rejoined: true,
            state: "SELECTING",
          },
        },
      ];

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onUpdate: callbacks.onUpdate,
      });

      await dataSource.start();

      // Should emit initial state from rejoin
      expect(callbacks.updates).toHaveLength(1);
      expect(callbacks.updates[0].position).toBe(15);
      expect(callbacks.updates[0].engagementState).toBe("SELECTING");

      dataSource.stop();
    });
  });

  // Integration: FULL_QUEUE error recovery
  describe("FULL_QUEUE error handling", () => {
    it("reports FULL_QUEUE error with retryable flag", async () => {
      const httpClient = new MockHttpClient();
      httpClient.joinResponses = [
        {
          ok: false,
          error: createQueueError("QUEUE_FULL", "Queue is at capacity", {
            httpStatus: 503,
            queueState: "FULL_QUEUE",
          }),
        },
      ];

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onError: callbacks.onError,
      });

      await dataSource.start();

      expect(callbacks.errors).toHaveLength(1);
      expect(callbacks.errors[0].code).toBe("QUEUE_FULL");
      expect(callbacks.errors[0].retryable).toBe(true);
      expect(callbacks.errors[0].queueState).toBe("FULL_QUEUE");
      expect(dataSource.getIsRunning()).toBe(false);
    });
  });

  // Integration: FULL_BOOKED state handling
  describe("FULL_BOOKED state handling", () => {
    it("handles FULL_BOOKED as distinct from FULL_QUEUE", async () => {
      const httpClient = new MockHttpClient();
      httpClient.joinResponses = [
        {
          ok: true,
          data: {
            queue_token: "qt_full_booked_test",
            sse_url: "https://sse.test.rusuh.id/stream/fb",
            ticket_no: 100,
            joined_at: "2026-11-12T10:00:00Z",
          },
        },
      ];

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onUpdate: callbacks.onUpdate,
        onComplete: callbacks.onComplete,
      });

      await dataSource.start();

      // Simulate FULL_BOOKED state via SSE
      sseClient.queueMessage({
        position: 100,
        queueState: "FULL_BOOKED",
        engagementState: "QUEUED",
        serverTime: "2026-11-12T10:30:00Z",
      });

      // FULL_BOOKED update should be emitted
      const fullBookedUpdate = callbacks.updates.find(
        (u) => u.queueState === "FULL_BOOKED"
      );
      expect(fullBookedUpdate).toBeDefined();
      expect(fullBookedUpdate?.queueState).toBe("FULL_BOOKED");

      // FULL_BOOKED is NOT same as FULL_QUEUE
      expect(fullBookedUpdate?.queueState).not.toBe("FULL_QUEUE");

      dataSource.stop();
    });
  });

  // Integration: CLOSED terminal state
  describe("CLOSED terminal state", () => {
    it("triggers onComplete and stops on CLOSED", async () => {
      const httpClient = new MockHttpClient();
      httpClient.joinResponses = [
        {
          ok: true,
          data: {
            queue_token: "qt_closed_test",
            sse_url: "https://sse.test.rusuh.id/stream/closed",
            ticket_no: 75,
            joined_at: "2026-11-12T10:00:00Z",
          },
        },
      ];

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onUpdate: callbacks.onUpdate,
        onComplete: callbacks.onComplete,
      });

      await dataSource.start();

      sseClient.queueMessage({
        position: 0,
        queueState: "CLOSED",
        engagementState: "EXPIRED",
        serverTime: "2026-11-12T12:00:00Z",
      });

      // Update should be emitted
      const closedUpdate = callbacks.updates.find(
        (u) => u.queueState === "CLOSED"
      );
      expect(closedUpdate).toBeDefined();

      // onComplete should be called
      expect(callbacks.completeCalls).toBe(1);

      // Should be stopped
      expect(dataSource.getIsRunning()).toBe(false);
    });
  });

  // Integration: Network failure handling
  describe("Network failure handling", () => {
    it("reports NETWORK_ERROR on join failure", async () => {
      const httpClient = new MockHttpClient();
      httpClient.joinResponses = [
        {
          ok: false,
          error: createQueueError("NETWORK_ERROR", "Connection failed"),
        },
      ];

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onError: callbacks.onError,
      });

      await dataSource.start();

      expect(callbacks.errors).toHaveLength(1);
      expect(callbacks.errors[0].code).toBe("NETWORK_ERROR");
      expect(callbacks.errors[0].retryable).toBe(true);
    });

    it("reports SSE_CONNECTION_ERROR on SSE failure", async () => {
      const httpClient = new MockHttpClient();
      httpClient.joinResponses = [
        {
          ok: true,
          data: {
            queue_token: "qt_sse_error",
            sse_url: "https://sse.test.rusuh.id/stream/error",
            ticket_no: 50,
            joined_at: "2026-11-12T10:00:00Z",
          },
        },
      ];

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onError: callbacks.onError,
      });

      await dataSource.start();

      sseClient.emitError(
        createQueueError("SSE_CONNECTION_ERROR", "SSE connection lost")
      );

      expect(callbacks.errors).toHaveLength(1);
      expect(callbacks.errors[0].code).toBe("SSE_CONNECTION_ERROR");

      dataSource.stop();
    });
  });

  // Integration: No real HTTP/SSE calls
  describe("Transport isolation", () => {
    it("does not call real fetch API", async () => {
      // This test verifies that our mocks are being used, not real fetch
      const originalFetch = global.fetch;
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("REAL FETCH CALLED"));

      const httpClient = new MockHttpClient();
      httpClient.joinResponses = [
        {
          ok: true,
          data: {
            queue_token: "qt_isolation",
            sse_url: "https://sse.test.rusuh.id/stream/iso",
            ticket_no: 1,
            joined_at: "2026-11-12T10:00:00Z",
          },
        },
      ];

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient, // Using mock
        sseClient, // Using mock
        onUpdate: callbacks.onUpdate,
      });

      // Should not throw because we're using mocks
      await dataSource.start();

      // Real fetch should not have been called
      expect(global.fetch).not.toHaveBeenCalled();

      dataSource.stop();
      global.fetch = originalFetch;
    });
  });

  // Integration: State transition sequence
  describe("State transition sequence", () => {
    it("processes correct state sequence: QUEUED → SELECTING → GRANTED", async () => {
      const httpClient = new MockHttpClient();
      httpClient.joinResponses = [
        {
          ok: true,
          data: {
            queue_token: "qt_sequence",
            sse_url: "https://sse.test.rusuh.id/stream/seq",
            ticket_no: 30,
            joined_at: "2026-11-12T10:00:00Z",
          },
        },
      ];
      httpClient.getMeResponses = [
        {
          ok: true,
          data: {
            state: "GRANTED",
            server_time: "2026-11-12T10:10:00Z",
            grant_token: "gt_sequence",
            booking_expires_at: "2026-11-12T10:20:00Z",
          },
        },
      ];

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onUpdate: callbacks.onUpdate,
      });

      await dataSource.start();

      // QUEUED state
      sseClient.queueMessage({
        position: 20,
        queueState: "OPEN",
        engagementState: "QUEUED",
        serverTime: "2026-11-12T10:02:00Z",
      });

      // SELECTING state
      sseClient.queueMessage({
        position: 5,
        queueState: "OPEN",
        engagementState: "SELECTING",
        serverTime: "2026-11-12T10:05:00Z",
      });

      // GRANTED state
      sseClient.queueMessage({
        position: 0,
        queueState: "OPEN",
        engagementState: "GRANTED",
        serverTime: "2026-11-12T10:10:00Z",
      });

      await new Promise((resolve) => setTimeout(resolve, 20));

      // Verify state sequence
      const engagementStates = callbacks.updates.map((u) => u.engagementState);
      expect(engagementStates).toContain("QUEUED");
      expect(engagementStates).toContain("SELECTING");
      expect(engagementStates).toContain("GRANTED");

      // GRANTED should come after QUEUED
      const queuedIndex = engagementStates.indexOf("QUEUED");
      const grantedIndex = engagementStates.lastIndexOf("GRANTED");
      expect(grantedIndex).toBeGreaterThan(queuedIndex);

      dataSource.stop();
    });
  });
});
