/**
 * Payment Scenarios Barrel Export
 *
 * GH-13 T6: Public API for payment scenario configuration.
 *
 * @module features/payment/data/scenarios
 */

export type {
  PaymentScenario,
  PaymentStateTransition,
} from "./payment.scenarios";

export {
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
} from "./payment.scenarios";
