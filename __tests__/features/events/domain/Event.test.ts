/**
 * Event Domain Type Tests
 *
 * GH-16: Verify Event types match canonical contract schema.
 */
import type {
  Event,
  EventStatus,
  QueueState,
  DisplayBlock,
} from "@/features/events/domain";

describe("Event Domain Types", () => {
  describe("EventStatus", () => {
    it("should accept all valid EventStatus values", () => {
      const statuses: EventStatus[] = [
        "AVAILABLE",
        "SELLING_OUT_FAST",
        "SOLD_OUT",
      ];
      expect(statuses).toHaveLength(3);
      statuses.forEach((status) => {
        expect(typeof status).toBe("string");
      });
    });
  });

  describe("QueueState", () => {
    it("should accept all valid QueueState values", () => {
      const states: QueueState[] = ["NOT_OPEN", "DIRECT", "OPEN", "FULL"];
      expect(states).toHaveLength(4);
      states.forEach((state) => {
        expect(typeof state).toBe("string");
      });
    });
  });

  describe("DisplayBlock", () => {
    it("should have correct structure", () => {
      const display: DisplayBlock = {
        enabled: true,
        action: "JOIN_QUEUE",
        labelKey: "join_queue",
        badgeKey: null,
      };

      expect(display.enabled).toBe(true);
      expect(display.action).toBe("JOIN_QUEUE");
      expect(display.labelKey).toBe("join_queue");
      expect(display.badgeKey).toBeNull();
    });

    it("should accept all valid action values", () => {
      const actions: DisplayBlock["action"][] = [
        "JOIN_QUEUE",
        "GO_TO_TICKETS",
        "NONE",
      ];
      expect(actions).toHaveLength(3);
    });

    it("should accept string badgeKey", () => {
      const display: DisplayBlock = {
        enabled: false,
        action: "NONE",
        labelKey: "sold_out",
        badgeKey: "sold_out",
      };

      expect(display.badgeKey).toBe("sold_out");
    });
  });

  describe("Event", () => {
    it("should have all required fields matching contract", () => {
      const event: Event = {
        id: "evt_test",
        name: "Test Event",
        category: "LIVE MUSIC",
        venue: "Test Venue",
        city: "Jakarta",
        date: "2026-12-25",
        imageUrl: "/images/test.webp",
        status: "AVAILABLE",
        queueState: "OPEN",
        display: {
          enabled: true,
          action: "JOIN_QUEUE",
          labelKey: "join_queue",
          badgeKey: null,
        },
      };

      expect(event.id).toBe("evt_test");
      expect(event.name).toBe("Test Event");
      expect(event.category).toBe("LIVE MUSIC");
      expect(event.venue).toBe("Test Venue");
      expect(event.city).toBe("Jakarta");
      expect(event.date).toBe("2026-12-25");
      expect(event.imageUrl).toBe("/images/test.webp");
      expect(event.status).toBe("AVAILABLE");
      expect(event.queueState).toBe("OPEN");
      expect(event.display).toBeDefined();
    });
  });
});
