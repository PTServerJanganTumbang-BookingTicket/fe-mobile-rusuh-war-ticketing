/**
 * Queue Scenario Fixtures Tests
 *
 * GH-8 T4: Tests for deterministic scenario fixtures.
 */

import {
  SCENARIO_QUEUE_MOVING,
  SCENARIO_QUEUE_STUCK,
  SCENARIO_FULL_BOOKED_THEN_OPEN,
  SCENARIO_CLOSED,
  SCENARIO_FULL_QUEUE,
  SCENARIO_GRANTED_FAST,
  SCENARIOS,
  DEFAULT_SCENARIO,
} from "@/features/queue/data/fixtures";
import { isValidScenario } from "@/features/queue/domain";

describe("Queue Scenario Fixtures", () => {
  describe("SCENARIO_QUEUE_MOVING", () => {
    it("has correct structure", () => {
      expect(isValidScenario(SCENARIO_QUEUE_MOVING)).toBe(true);
      expect(SCENARIO_QUEUE_MOVING.name).toBe("queue-moving");
    });

    it("starts with OPEN queue state and QUEUED engagement", () => {
      expect(SCENARIO_QUEUE_MOVING.initialState.queueState).toBe("OPEN");
      expect(SCENARIO_QUEUE_MOVING.initialState.engagementState).toBe("QUEUED");
    });

    it("ends with GRANTED engagement state", () => {
      const lastStep =
        SCENARIO_QUEUE_MOVING.steps[SCENARIO_QUEUE_MOVING.steps.length - 1];
      expect(lastStep.update.engagementState).toBe("GRANTED");
    });

    it("includes grant metadata in final step", () => {
      const lastStep =
        SCENARIO_QUEUE_MOVING.steps[SCENARIO_QUEUE_MOVING.steps.length - 1];
      expect(lastStep.update.grant).toBeDefined();
      expect(lastStep.update.grant?.grant_token).toMatch(/^gt_/);
      expect(lastStep.update.grant?.booking_expires_at).toBeDefined();
    });

    it("has decreasing position values", () => {
      let prevPosition = SCENARIO_QUEUE_MOVING.initialState.position;
      for (const step of SCENARIO_QUEUE_MOVING.steps) {
        const newPosition = step.update.position ?? prevPosition;
        expect(newPosition).toBeLessThanOrEqual(prevPosition);
        prevPosition = newPosition;
      }
    });
  });

  describe("SCENARIO_QUEUE_STUCK", () => {
    it("has correct structure", () => {
      expect(isValidScenario(SCENARIO_QUEUE_STUCK)).toBe(true);
      expect(SCENARIO_QUEUE_STUCK.name).toBe("queue-stuck");
    });

    it("emits bounded updates at same position (stall)", () => {
      const stuckSteps = SCENARIO_QUEUE_STUCK.steps.filter(
        (step) =>
          step.update.position === SCENARIO_QUEUE_STUCK.initialState.position
      );
      expect(stuckSteps.length).toBeGreaterThanOrEqual(2);
      expect(stuckSteps.length).toBeLessThanOrEqual(5); // Bounded
    });

    it("eventually progresses past stall", () => {
      const lastStep =
        SCENARIO_QUEUE_STUCK.steps[SCENARIO_QUEUE_STUCK.steps.length - 1];
      expect(lastStep.update.position).toBeLessThan(
        SCENARIO_QUEUE_STUCK.initialState.position
      );
    });
  });

  describe("SCENARIO_FULL_BOOKED_THEN_OPEN", () => {
    it("has correct structure", () => {
      expect(isValidScenario(SCENARIO_FULL_BOOKED_THEN_OPEN)).toBe(true);
      expect(SCENARIO_FULL_BOOKED_THEN_OPEN.name).toBe("full-booked-then-open");
    });

    it("includes FULL_BOOKED state in sequence", () => {
      const fullBookedStep = SCENARIO_FULL_BOOKED_THEN_OPEN.steps.find(
        (step) => step.update.queueState === "FULL_BOOKED"
      );
      expect(fullBookedStep).toBeDefined();
    });

    it("recovers to OPEN state after FULL_BOOKED", () => {
      const fullBookedIndex = SCENARIO_FULL_BOOKED_THEN_OPEN.steps.findIndex(
        (step) => step.update.queueState === "FULL_BOOKED"
      );
      const recoveryStep = SCENARIO_FULL_BOOKED_THEN_OPEN.steps.find(
        (step, index) =>
          index > fullBookedIndex && step.update.queueState === "OPEN"
      );
      expect(recoveryStep).toBeDefined();
    });

    it("ends with GRANTED after recovery", () => {
      const lastStep =
        SCENARIO_FULL_BOOKED_THEN_OPEN.steps[
          SCENARIO_FULL_BOOKED_THEN_OPEN.steps.length - 1
        ];
      expect(lastStep.update.engagementState).toBe("GRANTED");
    });
  });

  describe("SCENARIO_CLOSED", () => {
    it("has correct structure", () => {
      expect(isValidScenario(SCENARIO_CLOSED)).toBe(true);
      expect(SCENARIO_CLOSED.name).toBe("closed");
    });

    it("ends with CLOSED queue state", () => {
      const lastStep = SCENARIO_CLOSED.steps[SCENARIO_CLOSED.steps.length - 1];
      expect(lastStep.update.queueState).toBe("CLOSED");
    });

    it("does NOT have GRANTED engagement state", () => {
      const grantedStep = SCENARIO_CLOSED.steps.find(
        (step) => step.update.engagementState === "GRANTED"
      );
      expect(grantedStep).toBeUndefined();
    });

    it("does NOT have grant metadata", () => {
      const grantStep = SCENARIO_CLOSED.steps.find(
        (step) => step.update.grant !== undefined
      );
      expect(grantStep).toBeUndefined();
    });
  });

  describe("SCENARIO_FULL_QUEUE", () => {
    it("has correct structure", () => {
      expect(isValidScenario(SCENARIO_FULL_QUEUE)).toBe(true);
      expect(SCENARIO_FULL_QUEUE.name).toBe("full-queue");
    });

    it("starts with FULL_QUEUE state", () => {
      expect(SCENARIO_FULL_QUEUE.initialState.queueState).toBe("FULL_QUEUE");
    });

    it("has high position number reflecting full queue", () => {
      expect(SCENARIO_FULL_QUEUE.initialState.position).toBeGreaterThan(500);
    });

    it("includes FULL_QUEUE state in sequence", () => {
      const fullQueueStep = SCENARIO_FULL_QUEUE.steps.find(
        (step) => step.update.queueState === "FULL_QUEUE"
      );
      expect(fullQueueStep).toBeDefined();
    });
  });

  describe("SCENARIO_GRANTED_FAST", () => {
    it("has correct structure", () => {
      expect(isValidScenario(SCENARIO_GRANTED_FAST)).toBe(true);
      expect(SCENARIO_GRANTED_FAST.name).toBe("granted-fast");
    });

    it("includes grant metadata", () => {
      const lastStep =
        SCENARIO_GRANTED_FAST.steps[SCENARIO_GRANTED_FAST.steps.length - 1];
      expect(lastStep.update.grant).toBeDefined();
      expect(lastStep.update.grant?.grant_token).toMatch(/^gt_/);
    });

    it("has minimal steps for fast testing", () => {
      expect(SCENARIO_GRANTED_FAST.steps.length).toBeLessThanOrEqual(3);
    });

    it("has short delays for fast testing", () => {
      for (const step of SCENARIO_GRANTED_FAST.steps) {
        expect(step.delayMs).toBeLessThanOrEqual(1000);
      }
    });
  });

  describe("SCENARIOS collection", () => {
    it("contains all named scenarios", () => {
      expect(SCENARIOS["queue-moving"]).toBe(SCENARIO_QUEUE_MOVING);
      expect(SCENARIOS["queue-stuck"]).toBe(SCENARIO_QUEUE_STUCK);
      expect(SCENARIOS["full-booked-then-open"]).toBe(
        SCENARIO_FULL_BOOKED_THEN_OPEN
      );
      expect(SCENARIOS["closed"]).toBe(SCENARIO_CLOSED);
      expect(SCENARIOS["full-queue"]).toBe(SCENARIO_FULL_QUEUE);
      expect(SCENARIOS["granted-fast"]).toBe(SCENARIO_GRANTED_FAST);
    });

    it("has 6 scenarios", () => {
      expect(Object.keys(SCENARIOS)).toHaveLength(6);
    });
  });

  describe("DEFAULT_SCENARIO", () => {
    it("is queue-moving", () => {
      expect(DEFAULT_SCENARIO).toBe(SCENARIO_QUEUE_MOVING);
    });
  });
});
