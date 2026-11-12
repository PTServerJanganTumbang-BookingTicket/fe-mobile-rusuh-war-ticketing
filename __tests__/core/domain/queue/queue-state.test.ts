/**
 * Queue State Unit Tests
 *
 * Tests for queue state type guards and helpers.
 * R3-AC1: Five queue states
 * R3-AC2: FULL_QUEUE distinct from FULL_BOOKED
 * R3-AC3: SOLD_OUT is NOT a valid queue state
 * R3-AC4: CLOSED is terminal
 * R3-AC5: Distinct comparison test
 * R16-AC4: Queue state tests
 *
 * @module __tests__/core/domain/queue/queue-state.test
 */

import {
  isFullBooked,
  isQueueFull,
  isQueueOpen,
  isTerminalQueueState,
  isValidQueueState,
  NON_TERMINAL_QUEUE_STATES,
  QUEUE_STATES,
  TERMINAL_QUEUE_STATES,
} from "@/core/domain";
import {
  ALL_QUEUE_STATES,
  QUEUE_STATE_CLOSED,
  QUEUE_STATE_FULL_BOOKED,
  QUEUE_STATE_FULL_QUEUE,
  QUEUE_STATE_OPEN,
  QUEUE_STATE_SCHEDULED,
} from "@/core/domain/__fixtures__";

describe("Queue States (R3-AC1)", () => {
  it("contains exactly 5 states", () => {
    expect(QUEUE_STATES).toHaveLength(5);
  });

  it("contains SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED", () => {
    expect(QUEUE_STATES).toContain("SCHEDULED");
    expect(QUEUE_STATES).toContain("OPEN");
    expect(QUEUE_STATES).toContain("FULL_QUEUE");
    expect(QUEUE_STATES).toContain("FULL_BOOKED");
    expect(QUEUE_STATES).toContain("CLOSED");
  });
});

describe("SOLD_OUT is NOT a queue state (R3-AC3)", () => {
  it("SOLD_OUT is not in QUEUE_STATES", () => {
    expect(QUEUE_STATES).not.toContain("SOLD_OUT");
  });

  it("isValidQueueState returns false for SOLD_OUT", () => {
    expect(isValidQueueState("SOLD_OUT")).toBe(false);
  });

  it("fixtures do not include SOLD_OUT", () => {
    const fixtureStates = ALL_QUEUE_STATES.map((f) => f.state);
    expect(fixtureStates).not.toContain("SOLD_OUT");
  });
});

describe("FULL_QUEUE vs FULL_BOOKED (R3-AC2, R3-AC5)", () => {
  it("FULL_QUEUE and FULL_BOOKED are distinct values", () => {
    expect(QUEUE_STATE_FULL_QUEUE.state).not.toBe(
      QUEUE_STATE_FULL_BOOKED.state
    );
    expect("FULL_QUEUE").not.toBe("FULL_BOOKED");
  });

  it("FULL_QUEUE has HTTP 503 (queue capacity)", () => {
    expect(QUEUE_STATE_FULL_QUEUE.httpStatus).toBe(503);
    expect(QUEUE_STATE_FULL_QUEUE.errorCode).toBe("QUEUE_FULL");
  });

  it("FULL_BOOKED has HTTP 409 (inventory)", () => {
    expect(QUEUE_STATE_FULL_BOOKED.httpStatus).toBe(409);
    expect(QUEUE_STATE_FULL_BOOKED.errorCode).toBe("FULL_BOOKED");
  });

  it("isQueueFull matches only FULL_QUEUE", () => {
    expect(isQueueFull("FULL_QUEUE")).toBe(true);
    expect(isQueueFull("FULL_BOOKED")).toBe(false);
    expect(isQueueFull("OPEN")).toBe(false);
  });

  it("isFullBooked matches only FULL_BOOKED", () => {
    expect(isFullBooked("FULL_BOOKED")).toBe(true);
    expect(isFullBooked("FULL_QUEUE")).toBe(false);
    expect(isFullBooked("OPEN")).toBe(false);
  });
});

describe("Terminal states (R3-AC4)", () => {
  it("CLOSED is terminal", () => {
    expect(isTerminalQueueState("CLOSED")).toBe(true);
    expect(QUEUE_STATE_CLOSED.isTerminal).toBe(true);
  });

  it("other states are non-terminal", () => {
    expect(isTerminalQueueState("SCHEDULED")).toBe(false);
    expect(isTerminalQueueState("OPEN")).toBe(false);
    expect(isTerminalQueueState("FULL_QUEUE")).toBe(false);
    expect(isTerminalQueueState("FULL_BOOKED")).toBe(false);
  });

  it("TERMINAL_QUEUE_STATES contains only CLOSED", () => {
    expect(TERMINAL_QUEUE_STATES).toEqual(["CLOSED"]);
  });

  it("NON_TERMINAL_QUEUE_STATES contains the other four", () => {
    expect(NON_TERMINAL_QUEUE_STATES).toHaveLength(4);
    expect(NON_TERMINAL_QUEUE_STATES).toContain("SCHEDULED");
    expect(NON_TERMINAL_QUEUE_STATES).toContain("OPEN");
    expect(NON_TERMINAL_QUEUE_STATES).toContain("FULL_QUEUE");
    expect(NON_TERMINAL_QUEUE_STATES).toContain("FULL_BOOKED");
  });
});

describe("isValidQueueState", () => {
  it("returns true for all valid states", () => {
    QUEUE_STATES.forEach((state) => {
      expect(isValidQueueState(state)).toBe(true);
    });
  });

  it("returns false for invalid strings", () => {
    expect(isValidQueueState("INVALID")).toBe(false);
    expect(isValidQueueState("")).toBe(false);
    expect(isValidQueueState("open")).toBe(false); // case-sensitive
  });

  it("returns false for non-strings", () => {
    expect(isValidQueueState(null)).toBe(false);
    expect(isValidQueueState(undefined)).toBe(false);
    expect(isValidQueueState(123)).toBe(false);
    expect(isValidQueueState({})).toBe(false);
  });
});

describe("isQueueOpen", () => {
  it("returns true for OPEN state", () => {
    expect(isQueueOpen("OPEN")).toBe(true);
    expect(QUEUE_STATE_OPEN.state).toBe("OPEN");
  });

  it("returns false for other states", () => {
    expect(isQueueOpen("SCHEDULED")).toBe(false);
    expect(isQueueOpen("FULL_QUEUE")).toBe(false);
    expect(isQueueOpen("FULL_BOOKED")).toBe(false);
    expect(isQueueOpen("CLOSED")).toBe(false);
  });
});

describe("Fixture consistency", () => {
  it("all fixtures have correct isTerminal values", () => {
    expect(QUEUE_STATE_SCHEDULED.isTerminal).toBe(false);
    expect(QUEUE_STATE_OPEN.isTerminal).toBe(false);
    expect(QUEUE_STATE_FULL_QUEUE.isTerminal).toBe(false);
    expect(QUEUE_STATE_FULL_BOOKED.isTerminal).toBe(false);
    expect(QUEUE_STATE_CLOSED.isTerminal).toBe(true);
  });
});
