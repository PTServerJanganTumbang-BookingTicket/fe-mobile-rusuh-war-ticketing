/**
 * Engagement State Unit Tests
 *
 * Tests for engagement state type guards and helpers.
 * R4-AC1: Six engagement states
 * R4-AC2: Types compile without React dependencies
 * R4-AC3: State transitions documented
 * R16-AC4: Engagement state tests
 *
 * @module __tests__/core/domain/queue/engagement.test
 */

import {
  ACTIVE_ENGAGEMENT_STATES,
  ENGAGEMENT_STATES,
  isActiveEngagementState,
  isConfirmed,
  isExpired,
  isGranted,
  isTerminalEngagementState,
  isValidEngagementState,
  TERMINAL_ENGAGEMENT_STATES,
} from "@/core/domain";
import {
  ALL_ENGAGEMENT_STATES,
  ENGAGEMENT_STATE_AWAITING_PAYMENT,
  ENGAGEMENT_STATE_CONFIRMED,
  ENGAGEMENT_STATE_EXPIRED,
  ENGAGEMENT_STATE_GRANTED,
  ENGAGEMENT_STATE_QUEUED,
  ENGAGEMENT_STATE_SELECTING,
  SUCCESS_FLOW_STATES,
} from "@/core/domain/__fixtures__";

describe("Engagement States (R4-AC1)", () => {
  it("contains exactly 6 states", () => {
    expect(ENGAGEMENT_STATES).toHaveLength(6);
  });

  it("contains all required states", () => {
    expect(ENGAGEMENT_STATES).toContain("QUEUED");
    expect(ENGAGEMENT_STATES).toContain("GRANTED");
    expect(ENGAGEMENT_STATES).toContain("SELECTING");
    expect(ENGAGEMENT_STATES).toContain("AWAITING_PAYMENT");
    expect(ENGAGEMENT_STATES).toContain("CONFIRMED");
    expect(ENGAGEMENT_STATES).toContain("EXPIRED");
  });
});

describe("isValidEngagementState", () => {
  it("returns true for all valid states", () => {
    ENGAGEMENT_STATES.forEach((state) => {
      expect(isValidEngagementState(state)).toBe(true);
    });
  });

  it("returns false for invalid strings", () => {
    expect(isValidEngagementState("INVALID")).toBe(false);
    expect(isValidEngagementState("")).toBe(false);
    expect(isValidEngagementState("queued")).toBe(false);
  });

  it("returns false for non-strings", () => {
    expect(isValidEngagementState(null)).toBe(false);
    expect(isValidEngagementState(undefined)).toBe(false);
    expect(isValidEngagementState(123)).toBe(false);
  });
});

describe("Terminal states", () => {
  it("CONFIRMED is terminal", () => {
    expect(isTerminalEngagementState("CONFIRMED")).toBe(true);
    expect(ENGAGEMENT_STATE_CONFIRMED.isTerminal).toBe(true);
  });

  it("EXPIRED is terminal", () => {
    expect(isTerminalEngagementState("EXPIRED")).toBe(true);
    expect(ENGAGEMENT_STATE_EXPIRED.isTerminal).toBe(true);
  });

  it("non-terminal states return false", () => {
    expect(isTerminalEngagementState("QUEUED")).toBe(false);
    expect(isTerminalEngagementState("GRANTED")).toBe(false);
    expect(isTerminalEngagementState("SELECTING")).toBe(false);
    expect(isTerminalEngagementState("AWAITING_PAYMENT")).toBe(false);
  });

  it("TERMINAL_ENGAGEMENT_STATES has correct values", () => {
    expect(TERMINAL_ENGAGEMENT_STATES).toContain("CONFIRMED");
    expect(TERMINAL_ENGAGEMENT_STATES).toContain("EXPIRED");
    expect(TERMINAL_ENGAGEMENT_STATES).toHaveLength(2);
  });
});

describe("Active states (user interaction expected)", () => {
  it("GRANTED is active", () => {
    expect(isActiveEngagementState("GRANTED")).toBe(true);
    expect(ENGAGEMENT_STATE_GRANTED.isActive).toBe(true);
  });

  it("SELECTING is active", () => {
    expect(isActiveEngagementState("SELECTING")).toBe(true);
    expect(ENGAGEMENT_STATE_SELECTING.isActive).toBe(true);
  });

  it("AWAITING_PAYMENT is active", () => {
    expect(isActiveEngagementState("AWAITING_PAYMENT")).toBe(true);
    expect(ENGAGEMENT_STATE_AWAITING_PAYMENT.isActive).toBe(true);
  });

  it("non-active states return false", () => {
    expect(isActiveEngagementState("QUEUED")).toBe(false);
    expect(isActiveEngagementState("CONFIRMED")).toBe(false);
    expect(isActiveEngagementState("EXPIRED")).toBe(false);
  });

  it("ACTIVE_ENGAGEMENT_STATES has correct values", () => {
    expect(ACTIVE_ENGAGEMENT_STATES).toContain("GRANTED");
    expect(ACTIVE_ENGAGEMENT_STATES).toContain("SELECTING");
    expect(ACTIVE_ENGAGEMENT_STATES).toContain("AWAITING_PAYMENT");
    expect(ACTIVE_ENGAGEMENT_STATES).toHaveLength(3);
  });
});

describe("Specific state checks", () => {
  it("isGranted matches only GRANTED", () => {
    expect(isGranted("GRANTED")).toBe(true);
    expect(isGranted("QUEUED")).toBe(false);
    expect(isGranted("CONFIRMED")).toBe(false);
  });

  it("isConfirmed matches only CONFIRMED", () => {
    expect(isConfirmed("CONFIRMED")).toBe(true);
    expect(isConfirmed("GRANTED")).toBe(false);
    expect(isConfirmed("EXPIRED")).toBe(false);
  });

  it("isExpired matches only EXPIRED", () => {
    expect(isExpired("EXPIRED")).toBe(true);
    expect(isExpired("CONFIRMED")).toBe(false);
    expect(isExpired("GRANTED")).toBe(false);
  });
});

describe("State transition flow (R4-AC3)", () => {
  it("QUEUED can transition to GRANTED or EXPIRED", () => {
    expect(ENGAGEMENT_STATE_QUEUED.nextStates).toContain("GRANTED");
    expect(ENGAGEMENT_STATE_QUEUED.nextStates).toContain("EXPIRED");
  });

  it("GRANTED can transition to SELECTING or EXPIRED", () => {
    expect(ENGAGEMENT_STATE_GRANTED.nextStates).toContain("SELECTING");
    expect(ENGAGEMENT_STATE_GRANTED.nextStates).toContain("EXPIRED");
  });

  it("SELECTING can transition to AWAITING_PAYMENT or EXPIRED", () => {
    expect(ENGAGEMENT_STATE_SELECTING.nextStates).toContain("AWAITING_PAYMENT");
    expect(ENGAGEMENT_STATE_SELECTING.nextStates).toContain("EXPIRED");
  });

  it("AWAITING_PAYMENT can transition to CONFIRMED or EXPIRED", () => {
    expect(ENGAGEMENT_STATE_AWAITING_PAYMENT.nextStates).toContain("CONFIRMED");
    expect(ENGAGEMENT_STATE_AWAITING_PAYMENT.nextStates).toContain("EXPIRED");
  });

  it("terminal states have no next states", () => {
    expect(ENGAGEMENT_STATE_CONFIRMED.nextStates).toHaveLength(0);
    expect(ENGAGEMENT_STATE_EXPIRED.nextStates).toHaveLength(0);
  });

  it("success flow follows happy path", () => {
    const happyPath = SUCCESS_FLOW_STATES.map((f) => f.state);

    expect(happyPath).toEqual([
      "QUEUED",
      "GRANTED",
      "SELECTING",
      "AWAITING_PAYMENT",
      "CONFIRMED",
    ]);
  });
});

describe("Fixture consistency", () => {
  it("all fixtures have matching isTerminal values", () => {
    ALL_ENGAGEMENT_STATES.forEach((fixture) => {
      expect(isTerminalEngagementState(fixture.state)).toBe(fixture.isTerminal);
    });
  });

  it("all fixtures have matching isActive values", () => {
    ALL_ENGAGEMENT_STATES.forEach((fixture) => {
      expect(isActiveEngagementState(fixture.state)).toBe(fixture.isActive);
    });
  });
});
