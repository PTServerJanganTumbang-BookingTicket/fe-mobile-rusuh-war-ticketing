/**
 * SSE Message Parser Tests
 *
 * GH-9 T4: Unit tests for SSE message parsing.
 *
 * Test Matrix:
 * - UT-09: parse position event → QueueUpdate.position
 * - UT-10: parse state event → QueueUpdate.queueState
 * - UT-11: parse grant event → QueueUpdate with GRANTED + grant
 * - UT-12: malformed JSON → null (no throw)
 * - UT-13: unsupported event type → null
 * - UT-14: missing required fields → null
 * - UT-15: validate QueueState against union
 * - UT-16: validate EngagementState against union
 *
 * @module __tests__/features/queue/data/mappers/sse-message.parser.test
 */

import {
  parseSseMessage,
  isHeartbeat,
  isErrorMessage,
  extractErrorDetails,
} from "@/features/queue/data/mappers";

describe("SSE Message Parser", () => {
  // UT-09: parse position event → QueueUpdate.position
  describe("position event parsing", () => {
    it("parses position event into QueueUpdate", () => {
      const data = JSON.stringify({
        event: "position",
        position: 42,
        queue_state: "OPEN",
        engagement_state: "QUEUED",
        server_time: "2026-11-12T10:00:00Z",
        rate_per_min: 15,
      });

      const update = parseSseMessage(data);

      expect(update).not.toBeNull();
      expect(update?.position).toBe(42);
      expect(update?.queueState).toBe("OPEN");
      expect(update?.engagementState).toBe("QUEUED");
      expect(update?.serverTime).toBe("2026-11-12T10:00:00Z");
      expect(update?.ratePerMin).toBe(15);
      expect(update?.grant).toBeUndefined();
    });

    it("infers position event from position field", () => {
      const data = JSON.stringify({
        position: 100,
        server_time: "2026-11-12T10:05:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).not.toBeNull();
      expect(update?.position).toBe(100);
      // Defaults for missing optional fields
      expect(update?.queueState).toBe("OPEN");
      expect(update?.engagementState).toBe("QUEUED");
    });

    it("respects event type from SSE event: line", () => {
      const data = JSON.stringify({
        position: 50,
        server_time: "2026-11-12T10:10:00Z",
      });

      const update = parseSseMessage(data, "position");

      expect(update).not.toBeNull();
      expect(update?.position).toBe(50);
    });
  });

  // UT-10: parse state event → QueueUpdate.queueState
  describe("state event parsing", () => {
    it("parses state event into QueueUpdate with queueState", () => {
      const data = JSON.stringify({
        event: "state",
        queue_state: "FULL_QUEUE",
        engagement_state: "QUEUED",
        server_time: "2026-11-12T10:15:00Z",
        position: 999,
      });

      const update = parseSseMessage(data);

      expect(update).not.toBeNull();
      expect(update?.queueState).toBe("FULL_QUEUE");
      expect(update?.engagementState).toBe("QUEUED");
      expect(update?.position).toBe(999);
    });

    it("parses FULL_BOOKED state event", () => {
      const data = JSON.stringify({
        event: "state",
        queue_state: "FULL_BOOKED",
        server_time: "2026-11-12T10:20:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).not.toBeNull();
      expect(update?.queueState).toBe("FULL_BOOKED");
    });

    it("parses CLOSED state event", () => {
      const data = JSON.stringify({
        event: "state",
        queue_state: "CLOSED",
        server_time: "2026-11-12T10:25:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).not.toBeNull();
      expect(update?.queueState).toBe("CLOSED");
    });

    it("defaults position to 0 for state events without position", () => {
      const data = JSON.stringify({
        event: "state",
        queue_state: "SCHEDULED",
        server_time: "2026-11-12T09:00:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).not.toBeNull();
      expect(update?.position).toBe(0);
    });
  });

  // UT-11: parse grant event → QueueUpdate with GRANTED + grant
  describe("grant event parsing", () => {
    it("parses grant event with grant_token and booking_expires_at", () => {
      const data = JSON.stringify({
        event: "grant",
        grant_token: "gt_xyz789",
        booking_expires_at: "2026-11-12T10:30:00Z",
        server_time: "2026-11-12T10:20:00Z",
        queue_state: "OPEN",
      });

      const update = parseSseMessage(data);

      expect(update).not.toBeNull();
      expect(update?.engagementState).toBe("GRANTED");
      expect(update?.position).toBe(0);
      expect(update?.grant).toEqual({
        grant_token: "gt_xyz789",
        booking_expires_at: "2026-11-12T10:30:00Z",
      });
    });

    it("infers grant event from grant_token and booking_expires_at", () => {
      const data = JSON.stringify({
        grant_token: "gt_abc123",
        booking_expires_at: "2026-11-12T10:40:00Z",
        server_time: "2026-11-12T10:30:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).not.toBeNull();
      expect(update?.engagementState).toBe("GRANTED");
      expect(update?.grant?.grant_token).toBe("gt_abc123");
    });

    it("grant event sets position to 0", () => {
      const data = JSON.stringify({
        event: "grant",
        grant_token: "gt_test",
        booking_expires_at: "2026-11-12T11:00:00Z",
        server_time: "2026-11-12T10:50:00Z",
      });

      const update = parseSseMessage(data);

      expect(update?.position).toBe(0);
    });
  });

  // UT-12: malformed JSON → null (no throw)
  describe("malformed JSON handling", () => {
    it("returns null for invalid JSON", () => {
      const data = "not valid json";

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });

    it("returns null for truncated JSON", () => {
      const data = '{"position": 42, "server_time":';

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });

    it("returns null for empty string", () => {
      const update = parseSseMessage("");

      expect(update).toBeNull();
    });

    it("returns null for whitespace-only string", () => {
      const update = parseSseMessage("   \n\t  ");

      expect(update).toBeNull();
    });

    it("returns null for JSON array", () => {
      const data = JSON.stringify([1, 2, 3]);

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });

    it("returns null for JSON primitive", () => {
      const update = parseSseMessage("123");

      expect(update).toBeNull();
    });
  });

  // UT-13: unsupported event type → null
  describe("unsupported event type handling", () => {
    it("returns null for unknown event type", () => {
      const data = JSON.stringify({
        event: "custom_event",
        position: 42,
        server_time: "2026-11-12T10:00:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });

    it("returns null for heartbeat event (no data update)", () => {
      const data = JSON.stringify({
        event: "heartbeat",
      });

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });

    it("returns null for error event (handled separately)", () => {
      const data = JSON.stringify({
        event: "error",
        error_code: "SERVER_ERROR",
        message: "Internal server error",
      });

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });
  });

  // UT-14: missing required fields → null
  describe("missing required fields handling", () => {
    it("returns null for position event without server_time", () => {
      const data = JSON.stringify({
        event: "position",
        position: 42,
        queue_state: "OPEN",
      });

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });

    it("returns null for position event without position", () => {
      const data = JSON.stringify({
        event: "position",
        server_time: "2026-11-12T10:00:00Z",
        queue_state: "OPEN",
      });

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });

    it("returns null for state event without queue_state", () => {
      const data = JSON.stringify({
        event: "state",
        server_time: "2026-11-12T10:00:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });

    it("returns null for grant event without grant_token", () => {
      const data = JSON.stringify({
        event: "grant",
        booking_expires_at: "2026-11-12T10:30:00Z",
        server_time: "2026-11-12T10:20:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });

    it("returns null for grant event without booking_expires_at", () => {
      const data = JSON.stringify({
        event: "grant",
        grant_token: "gt_test",
        server_time: "2026-11-12T10:20:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });
  });

  // UT-15: validate QueueState against union
  describe("QueueState validation", () => {
    it("accepts valid QueueStates", () => {
      const validStates = [
        "SCHEDULED",
        "OPEN",
        "FULL_QUEUE",
        "FULL_BOOKED",
        "CLOSED",
      ];

      for (const queueState of validStates) {
        const data = JSON.stringify({
          event: "state",
          queue_state: queueState,
          server_time: "2026-11-12T10:00:00Z",
        });

        const update = parseSseMessage(data);

        expect(update).not.toBeNull();
        expect(update?.queueState).toBe(queueState);
      }
    });

    it("rejects invalid QueueState", () => {
      const data = JSON.stringify({
        event: "state",
        queue_state: "INVALID_STATE",
        server_time: "2026-11-12T10:00:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });

    it("rejects lowercase queue state", () => {
      const data = JSON.stringify({
        event: "state",
        queue_state: "open",
        server_time: "2026-11-12T10:00:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });
  });

  // UT-16: validate EngagementState against union
  describe("EngagementState validation", () => {
    it("accepts valid EngagementStates", () => {
      const validStates = [
        "QUEUED",
        "SELECTING",
        "GRANTED",
        "AWAITING_PAYMENT",
        "CONFIRMED",
        "EXPIRED",
      ];

      for (const engagementState of validStates) {
        const data = JSON.stringify({
          position: 10,
          queue_state: "OPEN",
          engagement_state: engagementState,
          server_time: "2026-11-12T10:00:00Z",
        });

        const update = parseSseMessage(data);

        expect(update).not.toBeNull();
        expect(update?.engagementState).toBe(engagementState);
      }
    });

    it("rejects invalid EngagementState", () => {
      const data = JSON.stringify({
        position: 10,
        queue_state: "OPEN",
        engagement_state: "INVALID_ENGAGEMENT",
        server_time: "2026-11-12T10:00:00Z",
      });

      const update = parseSseMessage(data);

      expect(update).toBeNull();
    });
  });

  describe("isHeartbeat", () => {
    it("identifies heartbeat from event type", () => {
      const data = JSON.stringify({});

      expect(isHeartbeat(data, "heartbeat")).toBe(true);
    });

    it("identifies heartbeat from message content", () => {
      const data = JSON.stringify({ event: "heartbeat" });

      expect(isHeartbeat(data)).toBe(true);
    });

    it("returns false for non-heartbeat", () => {
      const data = JSON.stringify({ event: "position", position: 42 });

      expect(isHeartbeat(data)).toBe(false);
    });

    it("returns false for invalid JSON", () => {
      expect(isHeartbeat("invalid")).toBe(false);
    });
  });

  describe("isErrorMessage", () => {
    it("identifies error from event type", () => {
      const data = JSON.stringify({});

      expect(isErrorMessage(data, "error")).toBe(true);
    });

    it("identifies error from message content", () => {
      const data = JSON.stringify({
        event: "error",
        error_code: "SERVER_ERROR",
      });

      expect(isErrorMessage(data)).toBe(true);
    });

    it("returns false for non-error", () => {
      const data = JSON.stringify({ event: "position" });

      expect(isErrorMessage(data)).toBe(false);
    });
  });

  describe("extractErrorDetails", () => {
    it("extracts error code and message", () => {
      const data = JSON.stringify({
        event: "error",
        error_code: "QUEUE_FULL",
        message: "Queue is at capacity",
      });

      const details = extractErrorDetails(data);

      expect(details?.code).toBe("QUEUE_FULL");
      expect(details?.message).toBe("Queue is at capacity");
    });

    it("returns null for invalid JSON", () => {
      expect(extractErrorDetails("invalid")).toBeNull();
    });

    it("returns object with undefined fields if not present", () => {
      const data = JSON.stringify({ event: "error" });

      const details = extractErrorDetails(data);

      expect(details?.code).toBeUndefined();
      expect(details?.message).toBeUndefined();
    });
  });
});
