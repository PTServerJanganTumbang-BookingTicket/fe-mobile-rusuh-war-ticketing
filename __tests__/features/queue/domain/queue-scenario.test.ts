/**
 * Queue Scenario Types Tests
 *
 * GH-8 T1: Tests for QueueScenario and QueueScenarioStep validation.
 */

import {
  isValidScenario,
  isValidScenarioStep,
  type QueueScenario,
  type QueueScenarioStep,
  type QueueUpdate,
} from "@/features/queue/domain";

describe("QueueScenario Types", () => {
  const validInitialState: QueueUpdate = {
    position: 100,
    queueState: "OPEN",
    engagementState: "QUEUED",
    serverTime: "2026-01-15T10:00:00Z",
    ratePerMin: 20,
  };

  describe("isValidScenarioStep", () => {
    it("returns true for valid step with position update", () => {
      const step: QueueScenarioStep = {
        delayMs: 1000,
        update: { position: 80 },
      };

      expect(isValidScenarioStep(step)).toBe(true);
    });

    it("returns true for step with delayMs of 0", () => {
      const step: QueueScenarioStep = {
        delayMs: 0,
        update: { position: 80 },
      };

      expect(isValidScenarioStep(step)).toBe(true);
    });

    it("returns true for step with multiple update fields", () => {
      const step: QueueScenarioStep = {
        delayMs: 1000,
        update: {
          position: 0,
          engagementState: "GRANTED",
          grant: {
            grant_token: "gt_abc",
            booking_expires_at: "2026-01-15T10:15:00Z",
          },
        },
      };

      expect(isValidScenarioStep(step)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isValidScenarioStep(null)).toBe(false);
    });

    it("returns false for missing delayMs", () => {
      const step = {
        update: { position: 80 },
      };

      expect(isValidScenarioStep(step)).toBe(false);
    });

    it("returns false for negative delayMs", () => {
      const step = {
        delayMs: -100,
        update: { position: 80 },
      };

      expect(isValidScenarioStep(step)).toBe(false);
    });

    it("returns false for missing update", () => {
      const step = {
        delayMs: 1000,
      };

      expect(isValidScenarioStep(step)).toBe(false);
    });

    it("returns false for null update", () => {
      const step = {
        delayMs: 1000,
        update: null,
      };

      expect(isValidScenarioStep(step)).toBe(false);
    });
  });

  describe("isValidScenario", () => {
    it("returns true for valid scenario", () => {
      const scenario: QueueScenario = {
        name: "queue-moving",
        description: "Normal queue progression",
        initialState: validInitialState,
        steps: [
          { delayMs: 1000, update: { position: 80 } },
          { delayMs: 1000, update: { position: 60 } },
        ],
      };

      expect(isValidScenario(scenario)).toBe(true);
    });

    it("returns true for scenario with empty steps array", () => {
      const scenario: QueueScenario = {
        name: "instant-grant",
        description: "Grant immediately (for fast testing)",
        initialState: {
          position: 0,
          queueState: "OPEN",
          engagementState: "GRANTED",
          serverTime: "2026-01-15T10:00:00Z",
          grant: {
            grant_token: "gt_abc",
            booking_expires_at: "2026-01-15T10:15:00Z",
          },
        },
        steps: [],
      };

      expect(isValidScenario(scenario)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isValidScenario(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isValidScenario(undefined)).toBe(false);
    });

    it("returns false for missing name", () => {
      const scenario = {
        description: "Test scenario",
        initialState: validInitialState,
        steps: [],
      };

      expect(isValidScenario(scenario)).toBe(false);
    });

    it("returns false for empty name", () => {
      const scenario = {
        name: "",
        description: "Test scenario",
        initialState: validInitialState,
        steps: [],
      };

      expect(isValidScenario(scenario)).toBe(false);
    });

    it("returns false for missing description", () => {
      const scenario = {
        name: "test",
        initialState: validInitialState,
        steps: [],
      };

      expect(isValidScenario(scenario)).toBe(false);
    });

    it("returns false for missing initialState", () => {
      const scenario = {
        name: "test",
        description: "Test scenario",
        steps: [],
      };

      expect(isValidScenario(scenario)).toBe(false);
    });

    it("returns false for null initialState", () => {
      const scenario = {
        name: "test",
        description: "Test scenario",
        initialState: null,
        steps: [],
      };

      expect(isValidScenario(scenario)).toBe(false);
    });

    it("returns false for missing steps", () => {
      const scenario = {
        name: "test",
        description: "Test scenario",
        initialState: validInitialState,
      };

      expect(isValidScenario(scenario)).toBe(false);
    });

    it("returns false for non-array steps", () => {
      const scenario = {
        name: "test",
        description: "Test scenario",
        initialState: validInitialState,
        steps: "not-an-array",
      };

      expect(isValidScenario(scenario)).toBe(false);
    });
  });

  describe("QueueScenario structure", () => {
    it("supports all queue states in steps", () => {
      const scenario: QueueScenario = {
        name: "state-transitions",
        description: "Tests all queue state transitions",
        initialState: {
          position: 100,
          queueState: "SCHEDULED",
          engagementState: "QUEUED",
          serverTime: "2026-01-15T10:00:00Z",
        },
        steps: [
          { delayMs: 1000, update: { queueState: "OPEN" } },
          { delayMs: 1000, update: { queueState: "FULL_QUEUE" } },
          { delayMs: 1000, update: { queueState: "OPEN" } },
          { delayMs: 1000, update: { queueState: "FULL_BOOKED" } },
          { delayMs: 1000, update: { queueState: "OPEN" } },
          { delayMs: 1000, update: { queueState: "CLOSED" } },
        ],
      };

      expect(isValidScenario(scenario)).toBe(true);
      expect(scenario.steps).toHaveLength(6);
    });

    it("supports all engagement states in steps", () => {
      const scenario: QueueScenario = {
        name: "engagement-flow",
        description: "Full engagement flow to CONFIRMED",
        initialState: {
          position: 10,
          queueState: "OPEN",
          engagementState: "QUEUED",
          serverTime: "2026-01-15T10:00:00Z",
        },
        steps: [
          {
            delayMs: 1000,
            update: {
              position: 0,
              engagementState: "GRANTED",
              grant: {
                grant_token: "gt_abc",
                booking_expires_at: "2026-01-15T10:15:00Z",
              },
            },
          },
          { delayMs: 1000, update: { engagementState: "SELECTING" } },
          { delayMs: 1000, update: { engagementState: "AWAITING_PAYMENT" } },
          { delayMs: 1000, update: { engagementState: "CONFIRMED" } },
        ],
      };

      expect(isValidScenario(scenario)).toBe(true);
      expect(scenario.steps).toHaveLength(4);
    });
  });
});
