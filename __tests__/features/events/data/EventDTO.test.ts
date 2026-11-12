/**
 * EventDTO Tests
 *
 * GH-17: Unit tests for EventDTO schema and validation
 * Test IDs: UT-EVT17-01 to UT-EVT17-03 (request-related),
 *           UT-EVT17-11, UT-EVT17-12 (validation)
 */
import { VALID_QUEUE_STATES, isValidQueueState } from "@/features/events/data";

describe("EventDTO Schema", () => {
  describe("VALID_QUEUE_STATES", () => {
    it("should contain exactly 5 queue states", () => {
      expect(VALID_QUEUE_STATES).toHaveLength(5);
    });

    it("should contain SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED", () => {
      expect(VALID_QUEUE_STATES).toContain("SCHEDULED");
      expect(VALID_QUEUE_STATES).toContain("OPEN");
      expect(VALID_QUEUE_STATES).toContain("FULL_QUEUE");
      expect(VALID_QUEUE_STATES).toContain("FULL_BOOKED");
      expect(VALID_QUEUE_STATES).toContain("CLOSED");
    });

    it("should not contain removed states (NOT_OPEN, DIRECT, FULL)", () => {
      expect(VALID_QUEUE_STATES).not.toContain("NOT_OPEN");
      expect(VALID_QUEUE_STATES).not.toContain("DIRECT");
      expect(VALID_QUEUE_STATES).not.toContain("FULL");
    });
  });

  describe("isValidQueueState", () => {
    // UT-EVT17-11: Unknown queue_state rejects
    it("should return true for SCHEDULED", () => {
      expect(isValidQueueState("SCHEDULED")).toBe(true);
    });

    it("should return true for OPEN", () => {
      expect(isValidQueueState("OPEN")).toBe(true);
    });

    it("should return true for FULL_QUEUE", () => {
      expect(isValidQueueState("FULL_QUEUE")).toBe(true);
    });

    it("should return true for FULL_BOOKED", () => {
      expect(isValidQueueState("FULL_BOOKED")).toBe(true);
    });

    it("should return true for CLOSED", () => {
      expect(isValidQueueState("CLOSED")).toBe(true);
    });

    it("should return false for unknown state (e.g., UNKNOWN_VALUE)", () => {
      expect(isValidQueueState("UNKNOWN_VALUE")).toBe(false);
    });

    it("should return false for removed state NOT_OPEN", () => {
      expect(isValidQueueState("NOT_OPEN")).toBe(false);
    });

    it("should return false for removed state DIRECT", () => {
      expect(isValidQueueState("DIRECT")).toBe(false);
    });

    it("should return false for removed state FULL (now FULL_QUEUE/FULL_BOOKED)", () => {
      expect(isValidQueueState("FULL")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidQueueState("")).toBe(false);
    });

    it("should return false for lowercase variants", () => {
      expect(isValidQueueState("open")).toBe(false);
      expect(isValidQueueState("scheduled")).toBe(false);
    });
  });
});
