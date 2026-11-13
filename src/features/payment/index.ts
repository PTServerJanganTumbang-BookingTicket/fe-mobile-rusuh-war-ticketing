/**
 * Payment Feature Module
 *
 * GH-13: Public API for Payment feature.
 * All external imports should come through this barrel.
 *
 * Architecture:
 * - Domain: Payment models, port, rules, TTL utilities
 * - Data: FakePaymentAdapter (deterministic fake), scenarios
 *
 * Boundary Rule: Internal implementation stays in layer folders;
 * only public API types and components are exported.
 */

// ============================================================================
// Domain Exports (types only, pure TypeScript)
// ============================================================================

// Payment port interface
export type { PaymentPort } from "./domain";

// Payment method types
export type { AvailableBank, AvailableMethod } from "./domain";
export {
  PaymentMethod,
  BankCode,
  VALID_BANK_CODES,
  isValidPaymentMethod,
  isValidBankCode,
} from "./domain";

// Payment status types
export type { RetryInfo, PaymentStatusResult } from "./domain";
export {
  PaymentStatus,
  VALID_PAYMENT_STATUSES,
  TERMINAL_PAYMENT_STATUSES,
  isValidPaymentStatus,
  isTerminalPaymentStatus,
  isValidPaymentStatusResult,
} from "./domain";

// Payment instruction types
export type {
  VAInstruction,
  GopayInstruction,
  PaymentInstruction,
  PaymentInitiation,
} from "./domain";
export {
  isVAInstruction,
  isGopayInstruction,
  isValidPaymentInstruction,
  isValidPaymentInitiation,
} from "./domain";

// Payment rules
export {
  TERMINAL_STATUSES,
  MAX_PAYMENT_ATTEMPTS,
  MIN_RETRY_REMAINING_MS,
  isTerminalStatus,
  canRetryPayment,
  hasTimeForRetry,
} from "./domain";

// Payment TTL utilities
export type { ExpiryInfo, ParsedServerTime } from "./domain";
export {
  remainingMs,
  serverOffsetMs,
  getExpiryInfo,
  parseServerTime,
  PAYMENT_TTL_SECONDS,
  PAYMENT_TTL_MS,
} from "./domain";

// ============================================================================
// Data Exports (adapters, scenarios)
// ============================================================================

// FakePaymentAdapter
export { FakePaymentAdapter } from "./data/FakePaymentAdapter";

// Payment scenarios for testing
export type { PaymentScenario, PaymentStateTransition } from "./data/scenarios";
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
} from "./data/scenarios";
