/**
 * Payment Feature Domain Layer
 *
 * GH-13: Domain exports for Payment feature.
 * Domain layer imports ONLY TypeScript — no React, React Native, or external libs.
 *
 * @module features/payment/domain
 */

// Payment method types
export type { AvailableBank, AvailableMethod } from "./payment-method.types";
export {
  PaymentMethod,
  BankCode,
  VALID_BANK_CODES,
  isValidPaymentMethod,
  isValidBankCode,
} from "./payment-method.types";

// Payment status types
export type { RetryInfo, PaymentStatusResult } from "./payment-status.types";
export {
  PaymentStatus,
  VALID_PAYMENT_STATUSES,
  TERMINAL_PAYMENT_STATUSES,
  isValidPaymentStatus,
  isTerminalPaymentStatus,
  isValidPaymentStatusResult,
} from "./payment-status.types";

// Payment instruction types
export type {
  VAInstruction,
  GopayInstruction,
  PaymentInstruction,
  PaymentInitiation,
} from "./payment-instruction.types";
export {
  isVAInstruction,
  isGopayInstruction,
  isValidPaymentInstruction,
  isValidPaymentInitiation,
} from "./payment-instruction.types";
