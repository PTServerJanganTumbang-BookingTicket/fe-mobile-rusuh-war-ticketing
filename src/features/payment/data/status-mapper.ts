/**
 * Status Mapper
 *
 * GH-14 T5: Maps booking status to PaymentStatusResult.
 * ADR-007: "Aplikasi selalu memastikan lewat GET /bookings/{booking_id}"
 *
 * @module features/payment/data/status-mapper
 */

import type { PaymentStatusResult } from "../domain/payment-status.types";
import { PaymentStatus } from "../domain/payment-status.types";
import { MAX_PAYMENT_ATTEMPTS } from "../domain/payment.rules";
import type { BookingStatusResponse } from "./RealPaymentAdapter";

/**
 * Booking status values from backend.
 * CONTRACT-BASELINE.md §4.4
 */
export const BookingStatus = {
  /** Tickets selected, awaiting payment */
  HELD: "HELD",
  /** Payment confirmed */
  PAID: "PAID",
  /** Booking expired (TTL or manual) */
  EXPIRED: "EXPIRED",
  /** User cancelled */
  CANCELLED: "CANCELLED",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/**
 * Payment status within a booking (when status = HELD).
 */
export const BookingPaymentStatus = {
  PENDING: "PENDING",
  FAILED: "FAILED",
} as const;

export type BookingPaymentStatus =
  (typeof BookingPaymentStatus)[keyof typeof BookingPaymentStatus];

/**
 * Map booking status to PaymentStatusResult.
 *
 * Mapping rules:
 * - PAID -> PAID
 * - EXPIRED -> EXPIRED
 * - CANCELLED -> EXPIRED (treat as no longer payable)
 * - HELD + PENDING -> PENDING
 * - HELD + FAILED -> FAILED with canRetry
 * - HELD + (none) -> PENDING (default for new bookings)
 */
export function mapBookingToPaymentStatus(
  booking: BookingStatusResponse,
  currentAttempt: number = 1
): PaymentStatusResult {
  const now = new Date().toISOString();

  // Terminal states
  if (booking.status === BookingStatus.PAID) {
    return {
      status: PaymentStatus.PAID,
      canRetry: false,
      initiatedAt: booking.paidAt ?? now,
      expiresAt: booking.expiresAt ?? now,
      updatedAt: now,
      serverTime: now,
    };
  }

  if (
    booking.status === BookingStatus.EXPIRED ||
    booking.status === BookingStatus.CANCELLED
  ) {
    return {
      status: PaymentStatus.EXPIRED,
      canRetry: false,
      initiatedAt: now,
      expiresAt: booking.expiresAt ?? now,
      updatedAt: now,
      serverTime: now,
    };
  }

  // HELD status - check payment status
  if (booking.status === BookingStatus.HELD) {
    if (booking.paymentStatus === BookingPaymentStatus.FAILED) {
      const canRetry = currentAttempt < MAX_PAYMENT_ATTEMPTS;
      return {
        status: PaymentStatus.FAILED,
        canRetry,
        retryInfo: canRetry
          ? { retriesRemaining: MAX_PAYMENT_ATTEMPTS - currentAttempt }
          : undefined,
        initiatedAt: now,
        expiresAt: booking.expiresAt ?? now,
        updatedAt: now,
        serverTime: now,
      };
    }

    // Default to PENDING for HELD bookings
    return {
      status: PaymentStatus.PENDING,
      canRetry: false,
      initiatedAt: now,
      expiresAt: booking.expiresAt ?? now,
      updatedAt: now,
      serverTime: now,
    };
  }

  // Unknown status - default to PENDING
  return {
    status: PaymentStatus.PENDING,
    canRetry: false,
    initiatedAt: now,
    expiresAt: booking.expiresAt ?? now,
    updatedAt: now,
    serverTime: now,
  };
}

/**
 * Check if booking is payable.
 */
export function isBookingPayable(booking: BookingStatusResponse): boolean {
  return (
    booking.status === BookingStatus.HELD &&
    booking.paymentStatus !== BookingPaymentStatus.FAILED
  );
}

/**
 * Check if booking payment is complete.
 */
export function isPaymentComplete(booking: BookingStatusResponse): boolean {
  return booking.status === BookingStatus.PAID;
}

/**
 * Check if booking has expired.
 */
export function isBookingExpired(booking: BookingStatusResponse): boolean {
  return (
    booking.status === BookingStatus.EXPIRED ||
    booking.status === BookingStatus.CANCELLED
  );
}
