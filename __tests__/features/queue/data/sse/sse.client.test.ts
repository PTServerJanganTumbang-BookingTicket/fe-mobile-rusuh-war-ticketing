/**
 * SSE Client Tests
 *
 * GH-9 T6: Integration tests for SSE client wrapper.
 * Uses mock EventSource transport.
 *
 * Test Matrix:
 * - Integration: connect(sse_url, headers) establishes connection
 * - Integration: onMessage receives server events
 * - Integration: onError receives connection errors
 * - Integration: close() disconnects cleanly
 * - Integration: reconnect uses same sse_url and queue_token
 * - Integration: reconnect limit reached emits error
 * - Unit: headers include X-Queue-Token (via URL param)
 *
 * @module __tests__/features/queue/data/sse/sse.client.test
 */

import { SseClient } from "@/features/queue/data/sse";
import type {
  SseConnectionConfig,
  SseCallbacks,
} from "@/features/queue/data/sse";
import type { QueueUpdate, QueueError } from "@/features/queue/domain";

// --- Mock EventSource ---

class MockEventSource {
  readonly url: string;
  readyState: number = 0; // CONNECTING

  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  private eventListeners: Map<string, ((event: MessageEvent) => void)[]> =
    new Map();

  constructor(url: string) {
    this.url = url;
    // Simulate async open
    setTimeout(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) {
        this.onopen(new Event("open"));
      }
    }, 0);
  }

  addEventListener(
    type: string,
    listener: (event: MessageEvent) => void
  ): void {
    const listeners = this.eventListeners.get(type) ?? [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  removeEventListener(
    type: string,
    listener: (event: MessageEvent) => void
  ): void {
    const listeners = this.eventListeners.get(type) ?? [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  close(): void {
    this.readyState = 2; // CLOSED
  }

  // Test helper: Simulate receiving a message
  simulateMessage(data: string, eventType?: string): void {
    const event = {
      data,
      type: eventType ?? "message",
    } as MessageEvent;

    // Call typed event listeners first
    if (eventType) {
      const listeners = this.eventListeners.get(eventType) ?? [];
      for (const listener of listeners) {
        listener(event);
      }
    }

    // Also call generic onmessage if no type or fallback
    if (!eventType && this.onmessage) {
      this.onmessage(event);
    }
  }

  // Test helper: Simulate error
  simulateError(): void {
    this.readyState = 2; // CLOSED
    if (this.onerror) {
      this.onerror(new Event("error"));
    }
  }
}

// --- Test Helpers ---

function createMockEventSourceFactory(): {
  factory: (url: string) => MockEventSource;
  instances: MockEventSource[];
} {
  const instances: MockEventSource[] = [];

  const factory = (url: string): MockEventSource => {
    const instance = new MockEventSource(url);
    instances.push(instance);
    return instance;
  };

  return { factory, instances };
}

function createCallbackSpies(): {
  callbacks: SseCallbacks;
  updates: QueueUpdate[];
  errors: QueueError[];
  closeCalls: number;
} {
  const updates: QueueUpdate[] = [];
  const errors: QueueError[] = [];
  let closeCalls = 0;

  return {
    callbacks: {
      onUpdate: (update) => updates.push(update),
      onError: (error) => errors.push(error),
      onClose: () => {
        closeCalls++;
      },
    },
    updates,
    errors,
    get closeCalls() {
      return closeCalls;
    },
  };
}

const TEST_CONFIG: SseConnectionConfig = {
  sseUrl: "https://sse.test.rusuh.id/stream/123",
  queueToken: "qt_test123",
  maxReconnectAttempts: 2,
  reconnectDelayMs: 10, // Fast for tests
};

describe("SseClient", () => {
  // Integration: connect(sse_url, headers) establishes connection
  describe("connect()", () => {
    it("establishes connection to SSE URL", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const { callbacks } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(instances).toHaveLength(1);
      expect(instances[0].url).toContain("sse.test.rusuh.id/stream/123");
    });

    it("includes queue token as URL parameter", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const { callbacks } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const url = new URL(instances[0].url);
      expect(url.searchParams.get("token")).toBe("qt_test123");
    });

    it("resets reconnect count on successful connection", async () => {
      const { factory } = createMockEventSourceFactory();
      const { callbacks } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });

      // First connect (sets count to 0)
      client.connect(TEST_CONFIG, callbacks);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Manual reconnect (increments count)
      client.reconnect();
      expect(client.getReconnectCount()).toBe(1);

      // New connect (resets count)
      client.connect(TEST_CONFIG, callbacks);
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(client.getReconnectCount()).toBe(0);
    });
  });

  // Integration: onMessage receives server events
  describe("message handling", () => {
    it("parses position event and calls onUpdate", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const { callbacks, updates } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate position message
      instances[0].simulateMessage(
        JSON.stringify({
          position: 42,
          queue_state: "OPEN",
          engagement_state: "QUEUED",
          server_time: "2026-11-12T10:00:00Z",
        }),
        "position"
      );

      expect(updates).toHaveLength(1);
      expect(updates[0].position).toBe(42);
      expect(updates[0].queueState).toBe("OPEN");
      expect(updates[0].engagementState).toBe("QUEUED");
    });

    it("parses grant event and calls onUpdate with GRANTED state", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const { callbacks, updates } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      instances[0].simulateMessage(
        JSON.stringify({
          grant_token: "gt_xyz789",
          booking_expires_at: "2026-11-12T10:30:00Z",
          server_time: "2026-11-12T10:20:00Z",
        }),
        "grant"
      );

      expect(updates).toHaveLength(1);
      expect(updates[0].engagementState).toBe("GRANTED");
      expect(updates[0].grant?.grant_token).toBe("gt_xyz789");
    });

    it("ignores heartbeat events", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const { callbacks, updates } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      instances[0].simulateMessage(
        JSON.stringify({ event: "heartbeat" }),
        "heartbeat"
      );

      expect(updates).toHaveLength(0);
    });

    it("ignores malformed messages gracefully", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const { callbacks, updates, errors } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      instances[0].simulateMessage("not valid json", "position");

      // Should not crash, and no update emitted
      expect(updates).toHaveLength(0);
      // Malformed parse is graceful, not an error
      expect(errors).toHaveLength(0);
    });
  });

  // Integration: onError receives connection errors
  describe("error handling", () => {
    it("calls onError on SSE error event message", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const { callbacks, errors } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      instances[0].simulateMessage(
        JSON.stringify({
          event: "error",
          error_code: "SERVER_ERROR",
          message: "Internal server error",
        }),
        "error"
      );

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe("SSE_CONNECTION_ERROR");
    });
  });

  // Integration: close() disconnects cleanly
  describe("close()", () => {
    it("closes EventSource and calls onClose", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const spy = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, spy.callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      client.close();

      expect(instances[0].readyState).toBe(2); // CLOSED
      expect(spy.closeCalls).toBe(1);
    });

    it("clears pending reconnect timeout on close", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const spy = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(
        {
          ...TEST_CONFIG,
          reconnectDelayMs: 1000, // Long delay
        },
        spy.callbacks
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate disconnect to trigger reconnect scheduling
      instances[0].simulateError();

      // Close before reconnect fires
      client.close();

      // Wait longer than reconnect delay
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should only have one instance (no reconnect)
      expect(instances).toHaveLength(1);
    });

    it("reports not connected after close", async () => {
      const { factory } = createMockEventSourceFactory();
      const { callbacks } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(client.isConnected()).toBe(true);

      client.close();

      expect(client.isConnected()).toBe(false);
    });
  });

  // Integration: reconnect uses same sse_url and queue_token
  describe("reconnect()", () => {
    it("reconnects with same URL and token", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const { callbacks } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const firstUrl = instances[0].url;

      client.reconnect();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(instances).toHaveLength(2);
      expect(instances[1].url).toBe(firstUrl);
    });

    it("increments reconnect count", async () => {
      const { factory } = createMockEventSourceFactory();
      const { callbacks } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(client.getReconnectCount()).toBe(0);

      client.reconnect();
      expect(client.getReconnectCount()).toBe(1);

      client.reconnect();
      expect(client.getReconnectCount()).toBe(2);
    });

    it("closes previous connection before reconnecting", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const { callbacks } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      await new Promise((resolve) => setTimeout(resolve, 10));

      client.reconnect();

      expect(instances[0].readyState).toBe(2); // First one closed
    });
  });

  // Integration: reconnect limit reached emits error
  describe("automatic reconnection", () => {
    it("auto-reconnects on disconnect up to max attempts", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const spy = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(
        {
          ...TEST_CONFIG,
          maxReconnectAttempts: 2,
          reconnectDelayMs: 10,
        },
        spy.callbacks
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      // First disconnect
      instances[0].simulateError();

      await new Promise((resolve) => setTimeout(resolve, 20));

      // Should have reconnected
      expect(instances.length).toBeGreaterThanOrEqual(2);
    });

    it("emits error and closes when max reconnect attempts reached", async () => {
      const { factory, instances } = createMockEventSourceFactory();
      const spy = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      // maxReconnectAttempts: 0 means NO reconnects allowed
      client.connect(
        {
          ...TEST_CONFIG,
          maxReconnectAttempts: 0,
          reconnectDelayMs: 5,
        },
        spy.callbacks
      );

      await new Promise((resolve) => setTimeout(resolve, 15));

      // First disconnect - with maxReconnectAttempts=0, should immediately error
      instances[0].simulateError();

      // Wait for error handling
      await new Promise((resolve) => setTimeout(resolve, 30));

      // Should have error about max reconnects
      const maxReconnectError = spy.errors.find((e) =>
        e.message.includes("Max reconnect")
      );
      expect(maxReconnectError).toBeDefined();
      expect(spy.closeCalls).toBeGreaterThan(0);
    });
  });

  describe("isConnected()", () => {
    it("returns true when connection is open", async () => {
      const { factory } = createMockEventSourceFactory();
      const { callbacks } = createCallbackSpies();

      const client = new SseClient({ eventSourceFactory: factory });
      client.connect(TEST_CONFIG, callbacks);

      // Wait for connection
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(client.isConnected()).toBe(true);
    });

    it("returns false before connection", () => {
      const { factory } = createMockEventSourceFactory();

      const client = new SseClient({ eventSourceFactory: factory });

      expect(client.isConnected()).toBe(false);
    });
  });
});
