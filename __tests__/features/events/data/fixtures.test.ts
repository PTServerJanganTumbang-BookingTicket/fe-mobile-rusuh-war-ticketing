/**
 * Event Fixtures Tests
 *
 * GH-16: Verify fixtures cover all status/state values and match contract.
 */
import { FAKE_EVENTS } from "@/features/events/data";
import type { EventStatus, QueueState } from "@/features/events/domain";

describe("Event Fixtures", () => {
  describe("Coverage", () => {
    it("should cover all EventStatus values", () => {
      const expectedStatuses: EventStatus[] = [
        "AVAILABLE",
        "SELLING_OUT_FAST",
        "SOLD_OUT",
      ];

      const foundStatuses = new Set(FAKE_EVENTS.map((e) => e.status));

      expectedStatuses.forEach((status) => {
        expect(foundStatuses.has(status)).toBe(true);
      });
    });

    it("should cover all QueueState values", () => {
      const expectedStates: QueueState[] = [
        "NOT_OPEN",
        "DIRECT",
        "OPEN",
        "FULL",
      ];

      const foundStates = new Set(FAKE_EVENTS.map((e) => e.queueState));

      expectedStates.forEach((state) => {
        expect(foundStates.has(state)).toBe(true);
      });
    });

    it("should include AVAILABLE + FULL combination (status/queueState independence)", () => {
      const availableWithFullQueue = FAKE_EVENTS.find(
        (e) => e.status === "AVAILABLE" && e.queueState === "FULL"
      );

      expect(availableWithFullQueue).toBeDefined();
    });
  });

  describe("Contract alignment", () => {
    it("should have all required fields for each event", () => {
      FAKE_EVENTS.forEach((event) => {
        expect(typeof event.id).toBe("string");
        expect(typeof event.name).toBe("string");
        expect(typeof event.category).toBe("string");
        expect(typeof event.venue).toBe("string");
        expect(typeof event.city).toBe("string");
        expect(typeof event.date).toBe("string");
        expect(typeof event.imageUrl).toBe("string");
        expect(typeof event.status).toBe("string");
        expect(typeof event.queueState).toBe("string");
        expect(event.display).toBeDefined();
        expect(typeof event.display.enabled).toBe("boolean");
        expect(typeof event.display.action).toBe("string");
        expect(typeof event.display.labelKey).toBe("string");
      });
    });

    it("should have unique IDs for all events", () => {
      const ids = FAKE_EVENTS.map((e) => e.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have valid date format (ISO date string)", () => {
      FAKE_EVENTS.forEach((event) => {
        const date = new Date(event.date);
        expect(date.toString()).not.toBe("Invalid Date");
      });
    });
  });

  describe("Determinism", () => {
    it("should return the same events on multiple reads", () => {
      const firstRead = [...FAKE_EVENTS];
      const secondRead = [...FAKE_EVENTS];

      expect(firstRead).toEqual(secondRead);
    });
  });
});
