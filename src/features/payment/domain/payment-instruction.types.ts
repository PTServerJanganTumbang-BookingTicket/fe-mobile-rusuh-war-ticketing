/**
 * Payment Instruction Types
 *
 * GH-13: Domain types for payment instructions.
 * Domain layer imports ONLY TypeScript — no React, React Native, or external libs.
 *
 * @module features/payment/domain/payment-instruction.types
 */

import type { BankCode, PaymentMethod } from "./payment-method.types";
import { PaymentMethod as PM } from "./payment-method.types";

/**
 * Virtual Account instruction for bank_transfer payment.
 */
export interface VAInstruction {
  /** Virtual account number to transfer to */
  virtualAccountNumber: string;
  /** Bank code for the VA */
  bankCode: BankCode;
  /** Account holder name (typically event/merchant name) */
  accountName: string;
  /** Transfer amount */
  amount: number;
}

/**
 * GoPay instruction for gopay payment.
 */
export interface GopayInstruction {
  /** URL to QR code image for scan-to-pay */
  qrCodeUrl: string;
  /** Deep link URL to open GoPay app directly on mobile */
  deeplinkUrl: string;
  /** Payment amount */
  amount: number;
}

/**
 * Payment instruction discriminated union.
 * The method field determines which instruction shape is available.
 */
export type PaymentInstruction =
  | {
      method: typeof PM.BANK_TRANSFER;
      instruction: VAInstruction;
    }
  | {
      method: typeof PM.GOPAY;
      instruction: GopayInstruction;
    };

/**
 * Payment initiation result.
 * Returned after successfully initiating a payment.
 */
export interface PaymentInitiation {
  /** Unique payment ID for tracking */
  paymentId: string;
  /** Payment method used */
  method: PaymentMethod;
  /** Payment instruction based on method */
  instruction: PaymentInstruction;
  /** ISO 8601 timestamp when payment expires */
  expiresAt: string;
  /** Server time for TTL calculation */
  serverTime: string;
}

/**
 * Type guard for VAInstruction.
 */
export function isVAInstruction(value: unknown): value is VAInstruction {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const instr = value as Record<string, unknown>;

  return (
    typeof instr.virtualAccountNumber === "string" &&
    typeof instr.bankCode === "string" &&
    typeof instr.accountName === "string" &&
    typeof instr.amount === "number"
  );
}

/**
 * Type guard for GopayInstruction.
 */
export function isGopayInstruction(value: unknown): value is GopayInstruction {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const instr = value as Record<string, unknown>;

  return (
    typeof instr.qrCodeUrl === "string" &&
    typeof instr.deeplinkUrl === "string" &&
    typeof instr.amount === "number"
  );
}

/**
 * Type guard for PaymentInstruction.
 */
export function isValidPaymentInstruction(
  value: unknown
): value is PaymentInstruction {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const pi = value as Record<string, unknown>;

  if (pi.method === PM.BANK_TRANSFER) {
    return isVAInstruction(pi.instruction);
  }

  if (pi.method === PM.GOPAY) {
    return isGopayInstruction(pi.instruction);
  }

  return false;
}

/**
 * Type guard for PaymentInitiation.
 */
export function isValidPaymentInitiation(
  value: unknown
): value is PaymentInitiation {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const init = value as Record<string, unknown>;

  return (
    typeof init.paymentId === "string" &&
    typeof init.method === "string" &&
    isValidPaymentInstruction(init.instruction) &&
    typeof init.expiresAt === "string" &&
    typeof init.serverTime === "string"
  );
}
