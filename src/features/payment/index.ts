/**
 * Payment Feature Module
 *
 * GH-13: Fake payment adapter for testing
 * GH-14: Real payment adapter with WebView handoff
 *
 * All external imports should come through this barrel.
 *
 * Architecture:
 * - Domain: Payment models, port, rules, TTL utilities
 * - Data: FakePaymentAdapter, RealPaymentAdapter, scenarios
 * - Presentation: PaymentWebView, hooks
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

// FakePaymentAdapter (GH-13)
export { FakePaymentAdapter } from "./data/FakePaymentAdapter";

// RealPaymentAdapter (GH-14)
export type {
  RealPaymentAdapterConfig,
  BookingStatusResponse,
} from "./data/RealPaymentAdapter";
export {
  RealPaymentAdapter,
  PaymentError,
  PaymentErrorCode,
} from "./data/RealPaymentAdapter";

// Handoff DTOs (GH-14)
export type { HandoffResponse, HandoffResponseDto } from "./data/dto";
export { mapHandoffResponse, isValidHandoffResponseDto } from "./data/dto";

// URL Validation (GH-14)
export {
  validatePaymentUrl,
  isValidPaymentUrl,
  extractBookingIdFromUrl,
  PAYMENT_URL_PREFIX,
} from "./data/payment-url.validator";

// Status Mapper (GH-14)
export {
  mapBookingToPaymentStatus,
  isBookingPayable,
  isPaymentComplete,
  isBookingExpired,
  BookingStatus,
  BookingPaymentStatus,
} from "./data/status-mapper";

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

// ============================================================================
// Presentation Exports (GH-14)
// ============================================================================

// PaymentWebView component
export type {
  PaymentWebViewProps,
  WebViewMessage,
  WebViewMessageType,
} from "./presentation";
export { PaymentWebView } from "./presentation";

// usePaymentWebView hook
export type {
  UsePaymentWebViewResult,
  PaymentWebViewAdapter,
} from "./presentation";
export {
  usePaymentWebView,
  PaymentWebViewError,
  PaymentErrorCode as WebViewErrorCode,
} from "./presentation";

// useGopayHandler hook
export type { UseGopayHandlerResult, GopayStatusAdapter } from "./presentation";
export { useGopayHandler, isGopayInstalled } from "./presentation";
