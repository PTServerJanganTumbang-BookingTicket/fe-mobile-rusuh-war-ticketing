/**
 * RealQueueDataSource Tests
 *
 * GH-9 T7: Integration tests for RealQueueDataSource.
 * Uses mock HTTP and SSE clients.
 *
 * Test Matrix:
 * - Integration: start() calls join then connects SSE
 * - Integration: SSE message triggers onUpdate
 * - Integration: Grant detection triggers getMe then onUpdate with grant
 * - Integration: stop() closes SSE and cleans up
 * - Integration: retry() stops then starts
 * - Integration: join error triggers onError
 * - Integration: SSE error triggers onError
 * - Integration: CLOSED state triggers onComplete
 * - Integration: Implements similar interface as FakeQueueDataSource
 *
 * @module __tests__/features/queue/data/RealQueueDataSource.test
 */

import { createDeviceId } from "@/core/domain";
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
  joinResponse: QueueHttpResult<QueueJoinResponseDto> = {
    ok: true,
    data: {
      queue_token: "qt_mock123",
      sse_url: "https://sse.mock.rusuh.id/stream/123",
      ticket_no: 42,
      joined_at: "2026-11-12T10:00:00Z",
    },
  };

  getMeResponse: QueueHttpResult<QueueMeResponseDto> = {
    ok: true,
    data: {
      state: "QUEUED",
      server_time: "2026-11-12T10:05:00Z",
      position: 30,
    },
  };

  joinCalls: Array<{
    eventId: string;
    captchaToken: string;
    authContext: AuthContext;
  }> = [];
  getMeCalls: Array<{ eventId: string; queueToken: string }> = [];

  async join(request: {
    eventId: string;
    captchaToken: string;
    authContext: AuthContext;
  }): Promise<QueueHttpResult<QueueJoinResponseDto>> {
    this.joinCalls.push(request);
    return this.joinResponse;
  }

  async getMe(request: {
    eventId: string;
    queueToken: string;
  }): Promise<QueueHttpResult<QueueMeResponseDto>> {
    this.getMeCalls.push(request);
    return this.getMeResponse;
  }
}

// --- Mock SSE Client ---

class MockSseClient implements SseClientPort {
  connectCalls: Array<{
    config: SseConnectionConfig;
    callbacks: SseCallbacks;
  }> = [];
  closeCalls = 0;
  reconnectCalls = 0;

  private callbacks: SseCallbacks | null = null;
  private connected = false;

  connect(config: SseConnectionConfig, callbacks: SseCallbacks): void {
    this.connectCalls.push({ config, callbacks });
    this.callbacks = callbacks;
    this.connected = true;
  }

  close(): void {
    this.closeCalls++;
    this.connected = false;
    if (this.callbacks) {
      this.callbacks.onClose();
    }
  }

  reconnect(): void {
    this.reconnectCalls++;
  }

  isConnected(): boolean {
    return this.connected;
  }

  getReconnectCount(): number {
    return this.reconnectCalls;
  }

  // Test helper: Simulate receiving an update
  simulateUpdate(update: QueueUpdate): void {
    if (this.callbacks) {
      this.callbacks.onUpdate(update);
    }
  }

  // Test helper: Simulate an error
  simulateError(error: QueueError): void {
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

function createTestConfig(
  overrides: Partial<RealQueueDataSourceConfig> = {}
): RealQueueDataSourceConfig {
  return {
    eventId: "evt_test123",
    captchaToken: "captcha_xyz",
    authContext: guestAuthContext,
    apiBaseUrl: "https://api.mock.rusuh.id",
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

describe("RealQueueDataSource", () => {
  // Integration: start() calls join then connects SSE
  describe("start()", () => {
    it("calls join() then connects SSE on success", async () => {
      const httpClient = new MockHttpClient();
      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onUpdate: callbacks.onUpdate,
        onError: callbacks.onError,
      });

      await dataSource.start();

      // Verify join was called
      expect(httpClient.joinCalls).toHaveLength(1);
      expect(httpClient.joinCalls[0].eventId).toBe("evt_test123");
      expect(httpClient.joinCalls[0].captchaToken).toBe("captcha_xyz");

      // Verify SSE connect was called
      expect(sseClient.connectCalls).toHaveLength(1);
      expect(sseClient.connectCalls[0].config.queueToken).toBe("qt_mock123");
      expect(sseClient.connectCalls[0].config.sseUrl).toBe(
        "https://sse.mock.rusuh.id/stream/123"
      );
    });

    it("is idempotent when already running", async () => {
      const httpClient = new MockHttpClient();
      const sseClient = new MockSseClient();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
      });

      await dataSource.start();
      await dataSource.start(); // Second call should be no-op

      expect(httpClient.joinCalls).toHaveLength(1);
      expect(sseClient.connectCalls).toHaveLength(1);
    });

    it("handles rejoin response with existing state", async () => {
      const httpClient = new MockHttpClient();
      httpClient.joinResponse = {
        ok: true,
        data: {
          queue_token: "qt_rejoin",
          sse_url: "https://sse.mock.rusuh.id/stream/rejoin",
          ticket_no: 15,
          joined_at: "2026-11-12T09:00:00Z",
          rejoined: true,
          state: "SELECTING",
        },
      };

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
    });
  });

  // Integration: SSE message triggers onUpdate
  describe("SSE message handling", () => {
    it("emits onUpdate when SSE receives position update", async () => {
      const httpClient = new MockHttpClient();
      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onUpdate: callbacks.onUpdate,
      });

      await dataSource.start();

      // Simulate SSE position update
      sseClient.simulateUpdate({
        position: 30,
        queueState: "OPEN",
        engagementState: "QUEUED",
        serverTime: "2026-11-12T10:10:00Z",
        ratePerMin: 10,
      });

      expect(callbacks.updates).toHaveLength(1);
      expect(callbacks.updates[0].position).toBe(30);
      expect(callbacks.updates[0].queueState).toBe("OPEN");
    });
  });

  // Integration: Grant detection triggers getMe then onUpdate with grant
  describe("grant detection", () => {
    it("fetches grant metadata via /me when GRANTED state received", async () => {
      const httpClient = new MockHttpClient();
      httpClient.getMeResponse = {
        ok: true,
        data: {
          state: "GRANTED",
          server_time: "2026-11-12T10:20:00Z",
          grant_token: "gt_abc123",
          booking_expires_at: "2026-11-12T10:30:00Z",
        },
      };

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onUpdate: callbacks.onUpdate,
      });

      await dataSource.start();

      // Simulate SSE grant state (without grant metadata)
      sseClient.simulateUpdate({
        position: 0,
        queueState: "OPEN",
        engagementState: "GRANTED",
        serverTime: "2026-11-12T10:20:00Z",
      });

      // Allow async /me call to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify /me was called
      expect(httpClient.getMeCalls).toHaveLength(1);

      // Verify update includes grant metadata
      expect(callbacks.updates).toHaveLength(1);
      expect(callbacks.updates[0].engagementState).toBe("GRANTED");
      expect(callbacks.updates[0].grant?.grant_token).toBe("gt_abc123");
      expect(callbacks.updates[0].grant?.booking_expires_at).toBe(
        "2026-11-12T10:30:00Z"
      );
    });

    it("still emits update if /me fails", async () => {
      const httpClient = new MockHttpClient();
      httpClient.getMeResponse = {
        ok: false,
        error: createQueueError("TOKEN_INVALID", "Token expired"),
      };

      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onUpdate: callbacks.onUpdate,
        onError: callbacks.onError,
      });

      await dataSource.start();

      sseClient.simulateUpdate({
        position: 0,
        queueState: "OPEN",
        engagementState: "GRANTED",
        serverTime: "2026-11-12T10:20:00Z",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Update still emitted (without grant)
      expect(callbacks.updates).toHaveLength(1);
      expect(callbacks.updates[0].grant).toBeUndefined();

      // Error also emitted
      expect(callbacks.errors).toHaveLength(1);
      expect(callbacks.errors[0].code).toBe("TOKEN_INVALID");
    });
  });

  // Integration: stop() closes SSE and cleans up
  describe("stop()", () => {
    it("closes SSE connection", async () => {
      const httpClient = new MockHttpClient();
      const sseClient = new MockSseClient();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
      });

      await dataSource.start();
      expect(dataSource.getIsRunning()).toBe(true);

      dataSource.stop();

      expect(sseClient.closeCalls).toBe(1);
      expect(dataSource.getIsRunning()).toBe(false);
    });
  });

  // Integration: retry() stops then starts
  describe("retry()", () => {
    it("stops current flow and restarts", async () => {
      const httpClient = new MockHttpClient();
      const sseClient = new MockSseClient();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
      });

      await dataSource.start();
      await dataSource.retry();

      // Should have stopped (close called) then started again
      expect(sseClient.closeCalls).toBeGreaterThanOrEqual(1);
      expect(httpClient.joinCalls).toHaveLength(2);
      expect(sseClient.connectCalls).toHaveLength(2);
    });
  });

  // Integration: join error triggers onError
  describe("join error handling", () => {
    it("emits onError when join fails", async () => {
      const httpClient = new MockHttpClient();
      httpClient.joinResponse = {
        ok: false,
        error: createQueueError(
          "CAPTCHA_REQUIRED",
          "CAPTCHA verification required"
        ),
      };

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
      expect(callbacks.errors[0].code).toBe("CAPTCHA_REQUIRED");

      // SSE should NOT be connected
      expect(sseClient.connectCalls).toHaveLength(0);
      expect(dataSource.getIsRunning()).toBe(false);
    });
  });

  // Integration: SSE error triggers onError
  describe("SSE error handling", () => {
    it("emits onError when SSE reports error", async () => {
      const httpClient = new MockHttpClient();
      const sseClient = new MockSseClient();
      const callbacks = createCallbackSpies();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
        onError: callbacks.onError,
      });

      await dataSource.start();

      sseClient.simulateError(
        createQueueError("SSE_CONNECTION_ERROR", "Connection lost")
      );

      expect(callbacks.errors).toHaveLength(1);
      expect(callbacks.errors[0].code).toBe("SSE_CONNECTION_ERROR");
    });
  });

  // Integration: CLOSED state triggers onComplete
  describe("terminal state handling", () => {
    it("emits onComplete and closes SSE on CLOSED state", async () => {
      const httpClient = new MockHttpClient();
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

      sseClient.simulateUpdate({
        position: 0,
        queueState: "CLOSED",
        engagementState: "EXPIRED",
        serverTime: "2026-11-12T12:00:00Z",
      });

      // Update should be emitted
      expect(callbacks.updates).toHaveLength(1);
      expect(callbacks.updates[0].queueState).toBe("CLOSED");

      // Complete should be called
      expect(callbacks.completeCalls).toBe(1);

      // SSE should be closed
      expect(sseClient.closeCalls).toBe(1);
      expect(dataSource.getIsRunning()).toBe(false);
    });
  });

  // Integration: Interface consistency with FakeQueueDataSource
  describe("interface consistency", () => {
    it("has same core interface methods as FakeQueueDataSource", () => {
      const dataSource = new RealQueueDataSource(createTestConfig());

      // Both have these methods
      expect(typeof dataSource.start).toBe("function");
      expect(typeof dataSource.stop).toBe("function");
      expect(typeof dataSource.retry).toBe("function");
      expect(typeof dataSource.getCurrentState).toBe("function");
      expect(typeof dataSource.getIsRunning).toBe("function");
      expect(typeof dataSource.setCallbacks).toBe("function");
    });

    it("setCallbacks updates callbacks at runtime", async () => {
      const httpClient = new MockHttpClient();
      const sseClient = new MockSseClient();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
      });

      await dataSource.start();

      // Set callbacks after start
      const callbacks = createCallbackSpies();
      dataSource.setCallbacks({
        onUpdate: callbacks.onUpdate,
        onComplete: callbacks.onComplete,
        onError: callbacks.onError,
      });

      // Verify callback is used
      sseClient.simulateUpdate({
        position: 20,
        queueState: "OPEN",
        engagementState: "QUEUED",
        serverTime: "2026-11-12T10:15:00Z",
      });

      expect(callbacks.updates).toHaveLength(1);
    });

    it("getCurrentState returns current state copy", async () => {
      const httpClient = new MockHttpClient();
      const sseClient = new MockSseClient();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
      });

      await dataSource.start();

      sseClient.simulateUpdate({
        position: 25,
        queueState: "OPEN",
        engagementState: "QUEUED",
        serverTime: "2026-11-12T10:20:00Z",
      });

      const state = dataSource.getCurrentState();
      expect(state?.position).toBe(25);

      // Verify it's a copy (modifying doesn't affect internal state)
      if (state) {
        state.position = 999;
      }
      expect(dataSource.getCurrentState()?.position).toBe(25);
    });

    it("getQueueToken returns the queue token", async () => {
      const httpClient = new MockHttpClient();
      const sseClient = new MockSseClient();

      const dataSource = new RealQueueDataSource({
        ...createTestConfig(),
        httpClient,
        sseClient,
      });

      expect(dataSource.getQueueToken()).toBeNull();

      await dataSource.start();

      expect(dataSource.getQueueToken()).toBe("qt_mock123");
    });
  });
});
