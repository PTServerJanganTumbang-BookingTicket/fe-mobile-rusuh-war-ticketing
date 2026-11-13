/**
 * Payment Method Types
 *
 * GH-13: Domain types for payment methods.
 * Domain layer imports ONLY TypeScript — no React, React Native, or external libs.
 *
 * @module features/payment/domain/payment-method.types
 */

/**
 * Available payment methods.
 * CONTRACT: Backend supports bank_transfer (VA) and gopay (QRIS).
 */
export const PaymentMethod = {
  BANK_TRANSFER: "bank_transfer",
  GOPAY: "gopay",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/**
 * Supported bank codes for VA payment.
 */
export const BankCode = {
  BCA: "bca",
  BNI: "bni",
  BRI: "bri",
  CIMB: "cimb",
} as const;

export type BankCode = (typeof BankCode)[keyof typeof BankCode];

/**
 * All valid bank codes for validation.
 */
export const VALID_BANK_CODES: readonly BankCode[] = [
  BankCode.BCA,
  BankCode.BNI,
  BankCode.BRI,
  BankCode.CIMB,
];

/**
 * Type guard for valid PaymentMethod.
 */
export function isValidPaymentMethod(value: unknown): value is PaymentMethod {
  return value === PaymentMethod.BANK_TRANSFER || value === PaymentMethod.GOPAY;
}

/**
 * Type guard for valid BankCode.
 */
export function isValidBankCode(value: unknown): value is BankCode {
  return VALID_BANK_CODES.includes(value as BankCode);
}

/**
 * Available bank for bank_transfer method.
 */
export interface AvailableBank {
  /** Bank code */
  code: BankCode;
  /** Display name for the bank */
  name: string;
}

/**
 * Available payment method with configuration.
 * For bank_transfer, includes list of available banks.
 */
export type AvailableMethod =
  | {
      method: typeof PaymentMethod.BANK_TRANSFER;
      banks: readonly AvailableBank[];
    }
  | {
      method: typeof PaymentMethod.GOPAY;
    };
