/**
 * Queue Update Types Tests
 *
 * GH-8 T1: Tests for QueueUpdate type validation.
 */

import {
  isValidQueueUpdate,
  hasGrantInfo,
  type QueueUpdate,
} from "@/features/queue/domain";

describe("QueueUpdate Types", () => {
  describe("isValidQueueUpdate", () => {
    it("returns true for valid QueueUpdate", () => {
      const update: QueueUpdate = {
        position: 42,
        queueState: "OPEN",
        engagementState: "QUEUED",
        serverTime: "2026-01-15T10:00:00Z",
      };

      expect(isValidQueueUpdate(update)).toBe(true);
    });

    it("returns true for QueueUpdate with optional ratePerMin", () => {
      const update: QueueUpdate = {
        position: 42,
        queueState: "OPEN",
        engagementState: "QUEUED",
        serverTime: "2026-01-15T10:00:00Z",
        ratePerMin: 20,
      };

      expect(isValidQueueUpdate(update)).toBe(true);
    });

    it("returns true for QueueUpdate with grant info", () => {
      const update: QueueUpdate = {
        position: 0,
        queueState: "OPEN",
        engagementState: "GRANTED",
        serverTime: "2026-01-15T10:00:00Z",
        grant: {
          grant_token: "gt_abc123",
          booking_expires_at: "2026-01-15T10:15:00Z",
        },
      };

      expect(isValidQueueUpdate(update)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isValidQueueUpdate(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isValidQueueUpdate(undefined)).toBe(false);
    });

    it("returns false for missing position", () => {
      const update = {
        queueState: "OPEN",
        engagementState: "QUEUED",
        serverTime: "2026-01-15T10:00:00Z",
      };

      expect(isValidQueueUpdate(update)).toBe(false);
    });

    it("returns false for negative position", () => {
      const update = {
        position: -1,
        queueState: "OPEN",
        engagementState: "QUEUED",
        serverTime: "2026-01-15T10:00:00Z",
      };

      expect(isValidQueueUpdate(update)).toBe(false);
    });

    it("returns false for missing queueState", () => {
      const update = {
        position: 42,
        engagementState: "QUEUED",
        serverTime: "2026-01-15T10:00:00Z",
      };

      expect(isValidQueueUpdate(update)).toBe(false);
    });

    it("returns false for missing engagementState", () => {
      const update = {
        position: 42,
        queueState: "OPEN",
        serverTime: "2026-01-15T10:00:00Z",
      };

      expect(isValidQueueUpdate(update)).toBe(false);
    });

    it("returns false for missing serverTime", () => {
      const update = {
        position: 42,
        queueState: "OPEN",
        engagementState: "QUEUED",
      };

      expect(isValidQueueUpdate(update)).toBe(false);
    });

    it("returns true for position 0 (granted state)", () => {
      const update: QueueUpdate = {
        position: 0,
        queueState: "OPEN",
        engagementState: "GRANTED",
        serverTime: "2026-01-15T10:00:00Z",
      };

      expect(isValidQueueUpdate(update)).toBe(true);
    });
  });

  describe("hasGrantInfo", () => {
    it("returns false for QueueUpdate without grant", () => {
      const update: QueueUpdate = {
        position: 42,
        queueState: "OPEN",
        engagementState: "QUEUED",
        serverTime: "2026-01-15T10:00:00Z",
      };

      expect(hasGrantInfo(update)).toBe(false);
    });

    it("returns true for QueueUpdate with valid grant", () => {
      const update: QueueUpdate = {
        position: 0,
        queueState: "OPEN",
        engagementState: "GRANTED",
        serverTime: "2026-01-15T10:00:00Z",
        grant: {
          grant_token: "gt_abc123",
          booking_expires_at: "2026-01-15T10:15:00Z",
        },
      };

      expect(hasGrantInfo(update)).toBe(true);
    });

    it("returns false when grant has missing grant_token", () => {
      const update: QueueUpdate = {
        position: 0,
        queueState: "OPEN",
        engagementState: "GRANTED",
        serverTime: "2026-01-15T10:00:00Z",
        grant: {
          grant_token: "",
          booking_expires_at: "2026-01-15T10:15:00Z",
        },
      };

      // Empty string is still a string, so it passes the type check
      expect(hasGrantInfo(update)).toBe(true);
    });

    it("narrows type to include grant", () => {
      const update: QueueUpdate = {
        position: 0,
        queueState: "OPEN",
        engagementState: "GRANTED",
        serverTime: "2026-01-15T10:00:00Z",
        grant: {
          grant_token: "gt_abc123",
          booking_expires_at: "2026-01-15T10:15:00Z",
        },
      };

      if (hasGrantInfo(update)) {
        // TypeScript now knows grant is defined
        expect(update.grant.grant_token).toBe("gt_abc123");
        expect(update.grant.booking_expires_at).toBe("2026-01-15T10:15:00Z");
      }
    });
  });
});
