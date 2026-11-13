/**
 * Payment Port Interface
 *
 * GH-13: Architecture-neutral port defining payment operations.
 * Domain layer imports ONLY TypeScript — no React, React Native, or external libs.
 *
 * @module features/payment/domain/payment.port
 */

import type {
  AvailableMethod,
  BankCode,
  PaymentMethod,
} from "./payment-method.types";
import type { PaymentInitiation } from "./payment-instruction.types";
import type { PaymentStatusResult } from "./payment-status.types";

/**
 * Payment Port Interface
 *
 * Defines WHAT payment operations exist, not HOW they execute.
 * Implementations may be real API, fake, or mock.
 */
export interface PaymentPort {
  /**
   * Get available payment methods for current booking context.
   * Returns bank_transfer (with banks array) and gopay.
   */
  getAvailableMethods(): Promise<AvailableMethod[]>;

  /**
   * Initiate payment for a booking.
   * @param bookingId - The booking to pay for
   * @param method - Selected payment method
   * @param bankCode - Required for bank_transfer, undefined for gopay
   * @returns Payment initiation with instructions and expiry
   */
  initiatePayment(
    bookingId: string,
    method: PaymentMethod,
    bankCode?: BankCode
  ): Promise<PaymentInitiation>;

  /**
   * Get current payment status for a booking.
   * @param bookingId - The booking to check
   * @returns Current status with retry info if applicable
   */
  getPaymentStatus(bookingId: string): Promise<PaymentStatusResult>;

  /**
   * Retry payment with same or different method.
   * Only valid when status.canRetry is true and within TTL.
   * @param bookingId - The booking to retry
   * @param method - Payment method for retry
   * @param bankCode - Required for bank_transfer
   */
  retryPayment(
    bookingId: string,
    method: PaymentMethod,
    bankCode?: BankCode
  ): Promise<PaymentInitiation>;
}
