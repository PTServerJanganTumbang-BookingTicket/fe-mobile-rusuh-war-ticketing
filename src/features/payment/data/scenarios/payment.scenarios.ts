/**
 * Payment Scenario Definitions
 *
 * GH-13 T6: Configurable scenarios for FakePaymentAdapter testing.
 * Each scenario defines a state transition sequence with optional delays.
 *
 * @module features/payment/data/scenarios/payment.scenarios
 */

import { PaymentStatus } from "../../domain/payment-status.types";
import { PAYMENT_TTL_MS } from "../../domain/payment-ttl.utils";

/**
 * State transition in a payment scenario.
 */
export interface PaymentStateTransition {
  /** Target status after transition */
  status: PaymentStatus;
  /** Whether retry is allowed after this transition */
  canRetry?: boolean;
  /** Failure reason when status is FAILED */
  failureReason?: string;
}

/**
 * Payment scenario definition.
 */
export interface PaymentScenario {
  /** Unique scenario name */
  name: string;
  /** Human-readable description */
  description: string;
  /** State transition sequence (PENDING is implicit start) */
  transitions: PaymentStateTransition[];
  /** Delay in milliseconds between states (0 for tests, >0 for manual) */
  delayMs: number;
  /** TTL in milliseconds (defaults to PAYMENT_TTL_MS) */
  ttlMs?: number;
}

/**
 * Scenario: Successful payment.
 * PENDING -> PAID
 */
export const SCENARIO_PAYMENT_SUCCESS: PaymentScenario = {
  name: "SCENARIO_PAYMENT_SUCCESS",
  description: "Payment completes successfully after user pays",
  transitions: [{ status: PaymentStatus.PAID }],
  delayMs: 0,
};

/**
 * Scenario: Payment failure with retry allowed.
 * PENDING -> FAILED (can_retry: true)
 */
export const SCENARIO_PAYMENT_FAILURE: PaymentScenario = {
  name: "SCENARIO_PAYMENT_FAILURE",
  description: "Payment fails but user can retry",
  transitions: [
    {
      status: PaymentStatus.FAILED,
      canRetry: true,
      failureReason: "insufficient_funds",
    },
  ],
  delayMs: 0,
};

/**
 * Scenario: Payment expires due to TTL.
 * PENDING -> EXPIRED (respects TTL)
 */
export const SCENARIO_PAYMENT_TIMEOUT: PaymentScenario = {
  name: "SCENARIO_PAYMENT_TIMEOUT",
  description: "Payment expires after TTL window closes",
  transitions: [{ status: PaymentStatus.EXPIRED, canRetry: false }],
  delayMs: 0,
  ttlMs: PAYMENT_TTL_MS,
};

/**
 * Scenario: User-initiated cancellation.
 * PENDING -> FAILED (user cancelled, can_retry: false implies terminal for this flow)
 *
 * Note: PaymentStatus enum doesn't have CANCELLED, so we use FAILED with
 * a specific failure reason. The adapter interprets this as user cancellation.
 */
export const SCENARIO_PAYMENT_CANCELLED: PaymentScenario = {
  name: "SCENARIO_PAYMENT_CANCELLED",
  description: "User cancels the payment",
  transitions: [
    {
      status: PaymentStatus.FAILED,
      canRetry: false,
      failureReason: "user_cancelled",
    },
  ],
  delayMs: 0,
};

/**
 * Map of all scenarios for lookup by name.
 */
export const PAYMENT_SCENARIOS: Record<string, PaymentScenario> = {
  SCENARIO_PAYMENT_SUCCESS,
  SCENARIO_PAYMENT_FAILURE,
  SCENARIO_PAYMENT_TIMEOUT,
  SCENARIO_PAYMENT_CANCELLED,
};

/**
 * Default scenario for tests (immediate resolution, no delay).
 */
export const DEFAULT_TEST_SCENARIO = SCENARIO_PAYMENT_SUCCESS;

/**
 * Create a scenario with custom delay.
 * Useful for manual testing with realistic timing.
 */
export function withDelay(
  scenario: PaymentScenario,
  delayMs: number
): PaymentScenario {
  return {
    ...scenario,
    delayMs,
  };
}

/**
 * Create a scenario with custom TTL.
 * Useful for testing expiration behavior with shorter windows.
 */
export function withTtl(
  scenario: PaymentScenario,
  ttlMs: number
): PaymentScenario {
  return {
    ...scenario,
    ttlMs,
  };
}

/**
 * Get scenario by name.
 * Returns undefined if not found.
 */
export function getScenario(name: string): PaymentScenario | undefined {
  return PAYMENT_SCENARIOS[name];
}

/**
 * List all available scenario names.
 */
export function listScenarios(): string[] {
  return Object.keys(PAYMENT_SCENARIOS);
}
