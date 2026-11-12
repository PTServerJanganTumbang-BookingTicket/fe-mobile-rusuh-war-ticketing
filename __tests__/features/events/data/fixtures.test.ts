/**
 * Event Fixtures Tests
 *
 * GH-17: Verify fixtures cover all 5 QueueState values and match evolved contract.
 * Evolution from GH-16:
 * - QueueState: 4 → 5 values
 * - EventStatus: Removed
 * - DisplayBlock: Simplified (enabled only)
 */
import { FAKE_EVENTS } from "@/features/events/data";
import type { QueueState } from "@/features/events/domain";

describe("Event Fixtures", () => {
  describe("Coverage", () => {
    it("should cover all 5 QueueState values", () => {
      // GH-17: 5 states (SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED)
      const expectedStates: QueueState[] = [
        "SCHEDULED",
        "OPEN",
        "FULL_QUEUE",
        "FULL_BOOKED",
        "CLOSED",
      ];

      const foundStates = new Set(FAKE_EVENTS.map((e) => e.queueState));

      expectedStates.forEach((state) => {
        expect(foundStates.has(state)).toBe(true);
      });
    });

    it("should include FULL_BOOKED with enabled=true (R7-AC2)", () => {
      const fullBooked = FAKE_EVENTS.find(
        (e) => e.queueState === "FULL_BOOKED"
      );

      expect(fullBooked).toBeDefined();
      expect(fullBooked!.display.enabled).toBe(true);
    });

    it("should include SCHEDULED with saleStartsAt", () => {
      const scheduled = FAKE_EVENTS.find((e) => e.queueState === "SCHEDULED");

      expect(scheduled).toBeDefined();
      expect(scheduled!.saleStartsAt).toBeDefined();
    });
  });

  describe("Contract alignment (GH-17 evolved)", () => {
    it("should have all required fields for each event", () => {
      FAKE_EVENTS.forEach((event) => {
        expect(typeof event.id).toBe("string");
        expect(typeof event.name).toBe("string");
        expect(typeof event.category).toBe("string");
        expect(typeof event.location).toBe("string"); // GH-17: merged venue/city
        expect(typeof event.date).toBe("string");
        expect(typeof event.imageUrl).toBe("string");
        expect(typeof event.queueState).toBe("string");
        expect(event.display).toBeDefined();
        expect(typeof event.display.enabled).toBe("boolean");
        // GH-17: action, labelKey, badgeKey removed from DisplayBlock
      });
    });

    it("should not have removed fields (status, venue, city)", () => {
      FAKE_EVENTS.forEach((event) => {
        expect((event as Record<string, unknown>).status).toBeUndefined();
        expect((event as Record<string, unknown>).venue).toBeUndefined();
        expect((event as Record<string, unknown>).city).toBeUndefined();
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

  describe("display.enabled correctness per QueueState", () => {
    it("SCHEDULED should have enabled=false", () => {
      const scheduled = FAKE_EVENTS.find((e) => e.queueState === "SCHEDULED");
      expect(scheduled!.display.enabled).toBe(false);
    });

    it("OPEN should have enabled=true", () => {
      const open = FAKE_EVENTS.find((e) => e.queueState === "OPEN");
      expect(open!.display.enabled).toBe(true);
    });

    it("FULL_QUEUE should have enabled=false", () => {
      const fullQueue = FAKE_EVENTS.find((e) => e.queueState === "FULL_QUEUE");
      expect(fullQueue!.display.enabled).toBe(false);
    });

    it("FULL_BOOKED should have enabled=true (reversible)", () => {
      const fullBooked = FAKE_EVENTS.find(
        (e) => e.queueState === "FULL_BOOKED"
      );
      expect(fullBooked!.display.enabled).toBe(true);
    });

    it("CLOSED should have enabled=false", () => {
      const closed = FAKE_EVENTS.find((e) => e.queueState === "CLOSED");
      expect(closed!.display.enabled).toBe(false);
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
