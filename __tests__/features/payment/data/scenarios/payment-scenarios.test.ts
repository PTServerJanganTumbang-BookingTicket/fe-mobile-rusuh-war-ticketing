/**
 * Payment Scenarios Unit Tests
 *
 * GH-13 T6: Verifies scenario definitions and configuration.
 *
 * @module __tests__/features/payment/data/scenarios/payment-scenarios.test
 */

import { PaymentStatus } from "@/features/payment/domain/payment-status.types";
import { PAYMENT_TTL_MS } from "@/features/payment/domain/payment-ttl.utils";
import {
  SCENARIO_PAYMENT_SUCCESS,
  SCENARIO_PAYMENT_FAILURE,
  SCENARIO_PAYMENT_TIMEOUT,
  SCENARIO_PAYMENT_CANCELLED,
  PAYMENT_SCENARIOS,
  DEFAULT_TEST_SCENARIO,
  withDelay,
  withTtl,
  getScenario,
  listScenarios,
  type PaymentScenario,
} from "@/features/payment/data/scenarios";

describe("Payment Scenarios", () => {
  describe("SCENARIO_PAYMENT_SUCCESS", () => {
    it("has correct structure", () => {
      expect(SCENARIO_PAYMENT_SUCCESS).toMatchObject({
        name: "SCENARIO_PAYMENT_SUCCESS",
        description: expect.any(String),
        transitions: expect.any(Array),
        delayMs: expect.any(Number),
      });
    });

    it("transitions to PAID status", () => {
      expect(SCENARIO_PAYMENT_SUCCESS.transitions).toHaveLength(1);
      expect(SCENARIO_PAYMENT_SUCCESS.transitions[0].status).toBe(
        PaymentStatus.PAID
      );
    });

    it("has no delay for tests", () => {
      expect(SCENARIO_PAYMENT_SUCCESS.delayMs).toBe(0);
    });
  });

  describe("SCENARIO_PAYMENT_FAILURE", () => {
    it("has correct structure", () => {
      expect(SCENARIO_PAYMENT_FAILURE).toMatchObject({
        name: "SCENARIO_PAYMENT_FAILURE",
        description: expect.any(String),
        transitions: expect.any(Array),
        delayMs: expect.any(Number),
      });
    });

    it("transitions to FAILED status", () => {
      expect(SCENARIO_PAYMENT_FAILURE.transitions).toHaveLength(1);
      expect(SCENARIO_PAYMENT_FAILURE.transitions[0].status).toBe(
        PaymentStatus.FAILED
      );
    });

    it("includes canRetry: true", () => {
      expect(SCENARIO_PAYMENT_FAILURE.transitions[0].canRetry).toBe(true);
    });

    it("includes failure reason", () => {
      expect(SCENARIO_PAYMENT_FAILURE.transitions[0].failureReason).toBe(
        "insufficient_funds"
      );
    });
  });

  describe("SCENARIO_PAYMENT_TIMEOUT", () => {
    it("has correct structure", () => {
      expect(SCENARIO_PAYMENT_TIMEOUT).toMatchObject({
        name: "SCENARIO_PAYMENT_TIMEOUT",
        description: expect.any(String),
        transitions: expect.any(Array),
        delayMs: expect.any(Number),
      });
    });

    it("transitions to EXPIRED status", () => {
      expect(SCENARIO_PAYMENT_TIMEOUT.transitions).toHaveLength(1);
      expect(SCENARIO_PAYMENT_TIMEOUT.transitions[0].status).toBe(
        PaymentStatus.EXPIRED
      );
    });

    it("respects TTL configuration", () => {
      expect(SCENARIO_PAYMENT_TIMEOUT.ttlMs).toBe(PAYMENT_TTL_MS);
    });

    it("has canRetry: false", () => {
      expect(SCENARIO_PAYMENT_TIMEOUT.transitions[0].canRetry).toBe(false);
    });
  });

  describe("SCENARIO_PAYMENT_CANCELLED", () => {
    it("has correct structure", () => {
      expect(SCENARIO_PAYMENT_CANCELLED).toMatchObject({
        name: "SCENARIO_PAYMENT_CANCELLED",
        description: expect.any(String),
        transitions: expect.any(Array),
        delayMs: expect.any(Number),
      });
    });

    it("has cancelled state (FAILED with user_cancelled reason)", () => {
      expect(SCENARIO_PAYMENT_CANCELLED.transitions).toHaveLength(1);
      expect(SCENARIO_PAYMENT_CANCELLED.transitions[0].status).toBe(
        PaymentStatus.FAILED
      );
      expect(SCENARIO_PAYMENT_CANCELLED.transitions[0].failureReason).toBe(
        "user_cancelled"
      );
    });

    it("has canRetry: false for user cancellation", () => {
      expect(SCENARIO_PAYMENT_CANCELLED.transitions[0].canRetry).toBe(false);
    });
  });

  describe("Delay Configuration", () => {
    it("all default scenarios have immediate delay (delayMs = 0)", () => {
      const scenarios = [
        SCENARIO_PAYMENT_SUCCESS,
        SCENARIO_PAYMENT_FAILURE,
        SCENARIO_PAYMENT_TIMEOUT,
        SCENARIO_PAYMENT_CANCELLED,
      ];

      scenarios.forEach((scenario) => {
        expect(scenario.delayMs).toBe(0);
      });
    });

    it("withDelay creates scenario with custom delay", () => {
      const delayed = withDelay(SCENARIO_PAYMENT_SUCCESS, 3000);

      expect(delayed.delayMs).toBe(3000);
      expect(delayed.name).toBe(SCENARIO_PAYMENT_SUCCESS.name);
      expect(delayed.transitions).toEqual(SCENARIO_PAYMENT_SUCCESS.transitions);
    });

    it("withDelay does not mutate original scenario", () => {
      const original = SCENARIO_PAYMENT_SUCCESS;
      const delayed = withDelay(original, 5000);

      expect(original.delayMs).toBe(0);
      expect(delayed.delayMs).toBe(5000);
    });
  });

  describe("TTL Configuration", () => {
    it("withTtl creates scenario with custom TTL", () => {
      const shortTtl = withTtl(SCENARIO_PAYMENT_TIMEOUT, 30000);

      expect(shortTtl.ttlMs).toBe(30000);
      expect(shortTtl.name).toBe(SCENARIO_PAYMENT_TIMEOUT.name);
    });

    it("withTtl does not mutate original scenario", () => {
      const original = SCENARIO_PAYMENT_TIMEOUT;
      const modified = withTtl(original, 10000);

      expect(original.ttlMs).toBe(PAYMENT_TTL_MS);
      expect(modified.ttlMs).toBe(10000);
    });
  });

  describe("DEFAULT_TEST_SCENARIO", () => {
    it("is SCENARIO_PAYMENT_SUCCESS", () => {
      expect(DEFAULT_TEST_SCENARIO).toBe(SCENARIO_PAYMENT_SUCCESS);
    });

    it("has immediate delay (delayMs = 0)", () => {
      expect(DEFAULT_TEST_SCENARIO.delayMs).toBe(0);
    });
  });

  describe("PAYMENT_SCENARIOS map", () => {
    it("contains all four scenarios", () => {
      expect(Object.keys(PAYMENT_SCENARIOS)).toHaveLength(4);
    });

    it("has correct keys", () => {
      expect(PAYMENT_SCENARIOS).toHaveProperty("SCENARIO_PAYMENT_SUCCESS");
      expect(PAYMENT_SCENARIOS).toHaveProperty("SCENARIO_PAYMENT_FAILURE");
      expect(PAYMENT_SCENARIOS).toHaveProperty("SCENARIO_PAYMENT_TIMEOUT");
      expect(PAYMENT_SCENARIOS).toHaveProperty("SCENARIO_PAYMENT_CANCELLED");
    });
  });

  describe("getScenario", () => {
    it("returns scenario by name", () => {
      const scenario = getScenario("SCENARIO_PAYMENT_SUCCESS");
      expect(scenario).toBe(SCENARIO_PAYMENT_SUCCESS);
    });

    it("returns undefined for unknown name", () => {
      const scenario = getScenario("UNKNOWN_SCENARIO");
      expect(scenario).toBeUndefined();
    });
  });

  describe("listScenarios", () => {
    it("returns all scenario names", () => {
      const names = listScenarios();

      expect(names).toContain("SCENARIO_PAYMENT_SUCCESS");
      expect(names).toContain("SCENARIO_PAYMENT_FAILURE");
      expect(names).toContain("SCENARIO_PAYMENT_TIMEOUT");
      expect(names).toContain("SCENARIO_PAYMENT_CANCELLED");
    });

    it("returns exactly 4 scenarios", () => {
      expect(listScenarios()).toHaveLength(4);
    });
  });

  describe("PaymentScenario type", () => {
    it("all scenarios satisfy PaymentScenario interface", () => {
      const scenarios: PaymentScenario[] = [
        SCENARIO_PAYMENT_SUCCESS,
        SCENARIO_PAYMENT_FAILURE,
        SCENARIO_PAYMENT_TIMEOUT,
        SCENARIO_PAYMENT_CANCELLED,
      ];

      scenarios.forEach((scenario) => {
        expect(typeof scenario.name).toBe("string");
        expect(typeof scenario.description).toBe("string");
        expect(Array.isArray(scenario.transitions)).toBe(true);
        expect(typeof scenario.delayMs).toBe("number");
      });
    });
  });
});
