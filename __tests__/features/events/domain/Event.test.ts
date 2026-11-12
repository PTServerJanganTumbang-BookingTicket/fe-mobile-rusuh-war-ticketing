/**
 * Event Domain Type Tests
 *
 * GH-17: Verify evolved Event types match real contract.
 * Evolution from GH-16:
 * - QueueState: 4 → 5 values
 * - EventStatus: Removed
 * - DisplayBlock: Simplified (enabled only)
 */
import type { Event, QueueState, DisplayBlock } from "@/features/events/domain";

describe("Event Domain Types", () => {
  describe("QueueState", () => {
    it("should accept all 5 valid QueueState values", () => {
      // GH-17: 5 states (SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED)
      const states: QueueState[] = [
        "SCHEDULED",
        "OPEN",
        "FULL_QUEUE",
        "FULL_BOOKED",
        "CLOSED",
      ];
      expect(states).toHaveLength(5);
      states.forEach((state) => {
        expect(typeof state).toBe("string");
      });
    });

    it("should not include removed DIRECT state", () => {
      // GH-17: DIRECT is removed per ADR-006 v2.12
      const states: QueueState[] = [
        "SCHEDULED",
        "OPEN",
        "FULL_QUEUE",
        "FULL_BOOKED",
        "CLOSED",
      ];
      expect(states).not.toContain("DIRECT");
      expect(states).not.toContain("NOT_OPEN");
      expect(states).not.toContain("FULL");
    });
  });

  describe("DisplayBlock", () => {
    it("should have only enabled field (simplified from GH-16)", () => {
      // GH-17: Simplified - only enabled, no action/labelKey/badgeKey
      const display: DisplayBlock = {
        enabled: true,
      };

      expect(display.enabled).toBe(true);
      // GH-17: These fields no longer exist
      expect((display as Record<string, unknown>).action).toBeUndefined();
      expect((display as Record<string, unknown>).labelKey).toBeUndefined();
      expect((display as Record<string, unknown>).badgeKey).toBeUndefined();
    });

    it("should accept enabled=false", () => {
      const display: DisplayBlock = {
        enabled: false,
      };

      expect(display.enabled).toBe(false);
    });
  });

  describe("Event", () => {
    it("should have all required fields matching GH-17 contract", () => {
      const event: Event = {
        id: "evt_test",
        name: "Test Event",
        category: "LIVE MUSIC",
        location: "Test Venue, Jakarta", // GH-17: merged venue/city
        date: "2026-12-25",
        imageUrl: "/images/test.webp",
        queueState: "OPEN",
        display: {
          enabled: true,
        },
      };

      expect(event.id).toBe("evt_test");
      expect(event.name).toBe("Test Event");
      expect(event.category).toBe("LIVE MUSIC");
      expect(event.location).toBe("Test Venue, Jakarta");
      expect(event.date).toBe("2026-12-25");
      expect(event.imageUrl).toBe("/images/test.webp");
      expect(event.queueState).toBe("OPEN");
      expect(event.display).toBeDefined();
      expect(event.display.enabled).toBe(true);
    });

    it("should accept optional saleStartsAt field", () => {
      const event: Event = {
        id: "evt_test",
        name: "Test Event",
        category: "LIVE MUSIC",
        location: "Test Venue, Jakarta",
        date: "2026-12-25",
        imageUrl: "/images/test.webp",
        queueState: "SCHEDULED",
        display: {
          enabled: false,
        },
        saleStartsAt: "2026-12-20T10:00:00Z",
      };

      expect(event.saleStartsAt).toBe("2026-12-20T10:00:00Z");
    });

    it("should not have removed fields (status, venue, city)", () => {
      const event: Event = {
        id: "evt_test",
        name: "Test Event",
        category: "LIVE MUSIC",
        location: "Test Venue, Jakarta",
        date: "2026-12-25",
        imageUrl: "/images/test.webp",
        queueState: "OPEN",
        display: {
          enabled: true,
        },
      };

      // GH-17: These fields no longer exist
      expect((event as Record<string, unknown>).status).toBeUndefined();
      expect((event as Record<string, unknown>).venue).toBeUndefined();
      expect((event as Record<string, unknown>).city).toBeUndefined();
    });
  });
});
