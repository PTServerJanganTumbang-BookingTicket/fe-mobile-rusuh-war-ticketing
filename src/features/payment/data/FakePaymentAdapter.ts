/**
 * FakePaymentAdapter
 *
 * GH-13 T5: Deterministic fake implementation of PaymentPort.
 * Follows FakeBookingDataSource pattern (ADR-1).
 *
 * @module features/payment/data/FakePaymentAdapter
 */

import type { PaymentPort } from "../domain/payment.port";
import type {
  AvailableMethod,
  BankCode,
  PaymentMethod,
} from "../domain/payment-method.types";
import type { PaymentInitiation } from "../domain/payment-instruction.types";
import type { PaymentStatusResult } from "../domain/payment-status.types";
import {
  PaymentMethod as PM,
  BankCode as BC,
} from "../domain/payment-method.types";
import { PaymentStatus } from "../domain/payment-status.types";
import { MAX_PAYMENT_ATTEMPTS } from "../domain/payment.rules";
import { PAYMENT_TTL_MS } from "../domain/payment-ttl.utils";

/**
 * Internal payment state tracked per booking.
 */
interface PaymentState {
  status: PaymentStatus;
  currentAttempt: number;
  initiatedAt: string;
  expiresAt: string;
  updatedAt: string;
  method?: PaymentMethod;
  bankCode?: BankCode;
  paymentId: string;
}

/**
 * Available banks for bank_transfer method.
 */
const AVAILABLE_BANKS: ReadonlyArray<{ code: BankCode; name: string }> = [
  { code: BC.BCA, name: "BCA" },
  { code: BC.BNI, name: "BNI" },
  { code: BC.BRI, name: "BRI" },
  { code: BC.CIMB, name: "CIMB Niaga" },
] as const;

/**
 * Generate a deterministic VA number.
 * Pattern: 8888 + bankCode numeric + last 8 of bookingId
 */
function generateVANumber(bankCode: BankCode, bookingId: string): string {
  const bankPrefix: Record<BankCode, string> = {
    [BC.BCA]: "014",
    [BC.BNI]: "009",
    [BC.BRI]: "002",
    [BC.CIMB]: "022",
  };
  const last8 = bookingId
    .slice(-8)
    .replace(/[^0-9]/g, "")
    .padStart(8, "0");
  return `8888${bankPrefix[bankCode]}${last8}`;
}

/**
 * Generate a deterministic payment ID.
 */
function generatePaymentId(bookingId: string, attempt: number): string {
  return `pay_${bookingId.slice(-12)}_${attempt}`;
}

/**
 * Base64 placeholder for QR code (1x1 transparent PNG).
 */
const QR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

/**
 * FakePaymentAdapter
 *
 * Implements PaymentPort with in-memory state management.
 * Operations resolve immediately for test mode.
 */
export class FakePaymentAdapter implements PaymentPort {
  /** In-memory state keyed by bookingId */
  private state: Map<string, PaymentState> = new Map();

  /** Default payment amount for mock data */
  private defaultAmount = 500000;

  /**
   * Get available payment methods.
   * Returns bank_transfer (with 4 banks) and gopay.
   */
  async getAvailableMethods(): Promise<AvailableMethod[]> {
    return [
      {
        method: PM.BANK_TRANSFER,
        banks: AVAILABLE_BANKS,
      },
      {
        method: PM.GOPAY,
      },
    ];
  }

  /**
   * Initiate payment for a booking.
   * Idempotent: same booking returns same instructions.
   */
  async initiatePayment(
    bookingId: string,
    method: PaymentMethod,
    bankCode?: BankCode
  ): Promise<PaymentInitiation> {
    // Check existing state for idempotency
    const existing = this.state.get(bookingId);
    if (existing && existing.status === PaymentStatus.PENDING) {
      // Return existing payment initiation
      return this.buildPaymentInitiation(existing, bookingId);
    }

    // Create new payment state
    const now = new Date();
    const expiresAt = new Date(now.getTime() + PAYMENT_TTL_MS);
    const attempt = existing ? existing.currentAttempt + 1 : 1;

    const newState: PaymentState = {
      status: PaymentStatus.PENDING,
      currentAttempt: attempt,
      initiatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      updatedAt: now.toISOString(),
      method,
      bankCode: method === PM.BANK_TRANSFER ? bankCode : undefined,
      paymentId: generatePaymentId(bookingId, attempt),
    };

    this.state.set(bookingId, newState);

    return this.buildPaymentInitiation(newState, bookingId);
  }

  /**
   * Get current payment status for a booking.
   */
  async getPaymentStatus(bookingId: string): Promise<PaymentStatusResult> {
    const state = this.state.get(bookingId);
    const now = new Date();

    if (!state) {
      // No payment initiated - return default pending state
      const defaultExpiry = new Date(now.getTime() + PAYMENT_TTL_MS);
      return {
        status: PaymentStatus.PENDING,
        canRetry: false,
        initiatedAt: now.toISOString(),
        expiresAt: defaultExpiry.toISOString(),
        updatedAt: now.toISOString(),
        serverTime: now.toISOString(),
      };
    }

    // Check for expiration
    const expiresAt = new Date(state.expiresAt);
    if (now > expiresAt && state.status === PaymentStatus.PENDING) {
      // Auto-expire
      state.status = PaymentStatus.EXPIRED;
      state.updatedAt = now.toISOString();
    }

    const canRetry =
      state.status === PaymentStatus.FAILED &&
      state.currentAttempt < MAX_PAYMENT_ATTEMPTS;

    const result: PaymentStatusResult = {
      status: state.status,
      canRetry,
      initiatedAt: state.initiatedAt,
      expiresAt: state.expiresAt,
      updatedAt: state.updatedAt,
      serverTime: now.toISOString(),
    };

    if (canRetry) {
      result.retryInfo = {
        retriesRemaining: MAX_PAYMENT_ATTEMPTS - state.currentAttempt,
      };
    }

    return result;
  }

  /**
   * Retry payment with same or different method.
   * Enforces max 5 attempts.
   */
  async retryPayment(
    bookingId: string,
    method: PaymentMethod,
    bankCode?: BankCode
  ): Promise<PaymentInitiation> {
    const state = this.state.get(bookingId);

    if (!state) {
      throw new Error("No payment found for booking");
    }

    if (state.status !== PaymentStatus.FAILED) {
      throw new Error("Can only retry failed payments");
    }

    if (state.currentAttempt >= MAX_PAYMENT_ATTEMPTS) {
      throw new Error("Maximum retry attempts exceeded");
    }

    // Check TTL
    const now = new Date();
    const expiresAt = new Date(state.expiresAt);
    if (now > expiresAt) {
      state.status = PaymentStatus.EXPIRED;
      state.updatedAt = now.toISOString();
      throw new Error("Payment window has expired");
    }

    // Increment attempt and reset to pending
    const newAttempt = state.currentAttempt + 1;
    const newState: PaymentState = {
      ...state,
      status: PaymentStatus.PENDING,
      currentAttempt: newAttempt,
      updatedAt: now.toISOString(),
      method,
      bankCode: method === PM.BANK_TRANSFER ? bankCode : undefined,
      paymentId: generatePaymentId(bookingId, newAttempt),
    };

    this.state.set(bookingId, newState);

    return this.buildPaymentInitiation(newState, bookingId);
  }

  // ============================================================
  // Test support methods (prefixed with underscore)
  // ============================================================

  /**
   * Set payment state for a booking (test support).
   */
  _setState(bookingId: string, partialState: Partial<PaymentState>): void {
    const now = new Date();
    const existing = this.state.get(bookingId);

    const newState: PaymentState = {
      status: partialState.status ?? existing?.status ?? PaymentStatus.PENDING,
      currentAttempt:
        partialState.currentAttempt ?? existing?.currentAttempt ?? 1,
      initiatedAt:
        partialState.initiatedAt ?? existing?.initiatedAt ?? now.toISOString(),
      expiresAt:
        partialState.expiresAt ??
        existing?.expiresAt ??
        new Date(now.getTime() + PAYMENT_TTL_MS).toISOString(),
      updatedAt: partialState.updatedAt ?? now.toISOString(),
      method: partialState.method ?? existing?.method,
      bankCode: partialState.bankCode ?? existing?.bankCode,
      paymentId:
        partialState.paymentId ??
        existing?.paymentId ??
        generatePaymentId(bookingId, 1),
    };

    this.state.set(bookingId, newState);
  }

  /**
   * Get payment state for a booking (test support).
   */
  _getState(bookingId: string): PaymentState | undefined {
    return this.state.get(bookingId);
  }

  /**
   * Reset all state (test support).
   */
  _reset(): void {
    this.state.clear();
  }

  /**
   * Set default amount for mock payments (test support).
   */
  _setDefaultAmount(amount: number): void {
    this.defaultAmount = amount;
  }

  // ============================================================
  // Private helpers
  // ============================================================

  /**
   * Build PaymentInitiation from state.
   */
  private buildPaymentInitiation(
    state: PaymentState,
    bookingId: string
  ): PaymentInitiation {
    const method = state.method ?? PM.BANK_TRANSFER;
    const bankCode = state.bankCode ?? BC.BCA;

    if (method === PM.BANK_TRANSFER) {
      return {
        paymentId: state.paymentId,
        method: PM.BANK_TRANSFER,
        instruction: {
          method: PM.BANK_TRANSFER,
          instruction: {
            virtualAccountNumber: generateVANumber(bankCode, bookingId),
            bankCode: bankCode,
            accountName: "RUSUH BOOKING TIKET",
            amount: this.defaultAmount,
          },
        },
        expiresAt: state.expiresAt,
        serverTime: state.updatedAt,
      };
    }

    // GoPay
    return {
      paymentId: state.paymentId,
      method: PM.GOPAY,
      instruction: {
        method: PM.GOPAY,
        instruction: {
          qrCodeUrl: QR_PLACEHOLDER,
          deeplinkUrl: `gojek://gopay/merchanttransfer?tref=${state.paymentId}&amount=${this.defaultAmount}`,
          amount: this.defaultAmount,
        },
      },
      expiresAt: state.expiresAt,
      serverTime: state.updatedAt,
    };
  }
}
