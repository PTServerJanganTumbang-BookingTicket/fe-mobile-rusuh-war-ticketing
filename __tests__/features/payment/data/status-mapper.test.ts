/**
 * Status Mapper Tests
 *
 * GH-14 T10: Unit tests for booking status to PaymentStatusResult mapping.
 */

import {
  mapBookingToPaymentStatus,
  isBookingPayable,
  isPaymentComplete,
  isBookingExpired,
  BookingStatus,
  BookingPaymentStatus,
} from "../../../../src/features/payment/data/status-mapper";
import { PaymentStatus } from "../../../../src/features/payment/domain/payment-status.types";

describe("status-mapper", () => {
  describe("mapBookingToPaymentStatus", () => {
    it("should map PAID booking to PAID status", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.PAID,
        paidAt: "2026-11-13T10:00:00Z",
        expiresAt: "2026-11-13T10:10:00Z",
      };

      const result = mapBookingToPaymentStatus(booking);

      expect(result.status).toBe(PaymentStatus.PAID);
      expect(result.canRetry).toBe(false);
    });

    it("should map EXPIRED booking to EXPIRED status", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.EXPIRED,
        expiresAt: "2026-11-13T10:10:00Z",
      };

      const result = mapBookingToPaymentStatus(booking);

      expect(result.status).toBe(PaymentStatus.EXPIRED);
      expect(result.canRetry).toBe(false);
    });

    it("should map CANCELLED booking to EXPIRED status", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.CANCELLED,
        expiresAt: "2026-11-13T10:10:00Z",
      };

      const result = mapBookingToPaymentStatus(booking);

      expect(result.status).toBe(PaymentStatus.EXPIRED);
      expect(result.canRetry).toBe(false);
    });

    it("should map HELD + PENDING to PENDING status", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.HELD,
        paymentStatus: BookingPaymentStatus.PENDING,
        expiresAt: "2026-11-13T10:10:00Z",
      };

      const result = mapBookingToPaymentStatus(booking);

      expect(result.status).toBe(PaymentStatus.PENDING);
      expect(result.canRetry).toBe(false);
    });

    it("should map HELD + FAILED to FAILED status with canRetry", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.HELD,
        paymentStatus: BookingPaymentStatus.FAILED,
        expiresAt: "2026-11-13T10:10:00Z",
      };

      const result = mapBookingToPaymentStatus(booking, 1);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.canRetry).toBe(true);
      expect(result.retryInfo?.retriesRemaining).toBe(4); // MAX_PAYMENT_ATTEMPTS (5) - 1
    });

    it("should not allow retry when max attempts reached", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.HELD,
        paymentStatus: BookingPaymentStatus.FAILED,
        expiresAt: "2026-11-13T10:10:00Z",
      };

      const result = mapBookingToPaymentStatus(booking, 5);

      expect(result.status).toBe(PaymentStatus.FAILED);
      expect(result.canRetry).toBe(false);
      expect(result.retryInfo).toBeUndefined();
    });

    it("should default to PENDING for HELD without paymentStatus", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.HELD,
        expiresAt: "2026-11-13T10:10:00Z",
      };

      const result = mapBookingToPaymentStatus(booking);

      expect(result.status).toBe(PaymentStatus.PENDING);
    });
  });

  describe("isBookingPayable", () => {
    it("should return true for HELD booking without FAILED status", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.HELD,
        paymentStatus: BookingPaymentStatus.PENDING,
      };

      expect(isBookingPayable(booking)).toBe(true);
    });

    it("should return false for HELD booking with FAILED status", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.HELD,
        paymentStatus: BookingPaymentStatus.FAILED,
      };

      expect(isBookingPayable(booking)).toBe(false);
    });

    it("should return false for PAID booking", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.PAID,
      };

      expect(isBookingPayable(booking)).toBe(false);
    });
  });

  describe("isPaymentComplete", () => {
    it("should return true for PAID booking", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.PAID,
      };

      expect(isPaymentComplete(booking)).toBe(true);
    });

    it("should return false for HELD booking", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.HELD,
      };

      expect(isPaymentComplete(booking)).toBe(false);
    });
  });

  describe("isBookingExpired", () => {
    it("should return true for EXPIRED booking", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.EXPIRED,
      };

      expect(isBookingExpired(booking)).toBe(true);
    });

    it("should return true for CANCELLED booking", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.CANCELLED,
      };

      expect(isBookingExpired(booking)).toBe(true);
    });

    it("should return false for HELD booking", () => {
      const booking = {
        bookingId: "booking_123",
        status: BookingStatus.HELD,
      };

      expect(isBookingExpired(booking)).toBe(false);
    });
  });
});
