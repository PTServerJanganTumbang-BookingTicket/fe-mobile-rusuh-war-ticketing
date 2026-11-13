/**
 * Payment Domain Rules Tests
 *
 * GH-13 T3: Tests for Payment domain rules.
 */

import {
  PaymentStatus,
  TERMINAL_STATUSES,
  MAX_PAYMENT_ATTEMPTS,
  MIN_RETRY_REMAINING_MS,
  isTerminalStatus,
  canRetryPayment,
  hasTimeForRetry,
} from "@/features/payment/domain";

describe("Payment Domain Rules", () => {
  describe("TERMINAL_STATUSES", () => {
    it("contains PAID, FAILED, and EXPIRED", () => {
      expect(TERMINAL_STATUSES).toContain(PaymentStatus.PAID);
      expect(TERMINAL_STATUSES).toContain(PaymentStatus.FAILED);
      expect(TERMINAL_STATUSES).toContain(PaymentStatus.EXPIRED);
      expect(TERMINAL_STATUSES).toHaveLength(3);
    });

    it("does not contain PENDING", () => {
      expect(TERMINAL_STATUSES).not.toContain(PaymentStatus.PENDING);
    });
  });

  describe("Constants", () => {
    it("MAX_PAYMENT_ATTEMPTS is 5", () => {
      expect(MAX_PAYMENT_ATTEMPTS).toBe(5);
    });

    it("MIN_RETRY_REMAINING_MS is 60 seconds", () => {
      expect(MIN_RETRY_REMAINING_MS).toBe(60_000);
    });
  });

  describe("isTerminalStatus", () => {
    it("returns false for PENDING", () => {
      expect(isTerminalStatus(PaymentStatus.PENDING)).toBe(false);
    });

    it("returns true for PAID", () => {
      expect(isTerminalStatus(PaymentStatus.PAID)).toBe(true);
    });

    it("returns true for FAILED", () => {
      expect(isTerminalStatus(PaymentStatus.FAILED)).toBe(true);
    });

    it("returns true for EXPIRED", () => {
      expect(isTerminalStatus(PaymentStatus.EXPIRED)).toBe(true);
    });
  });

  describe("canRetryPayment", () => {
    it("returns true when attempt < max and status is not terminal", () => {
      expect(canRetryPayment(PaymentStatus.PENDING, 0)).toBe(true);
      expect(canRetryPayment(PaymentStatus.PENDING, 4)).toBe(true);
    });

    it("returns false when attempt >= max", () => {
      expect(canRetryPayment(PaymentStatus.PENDING, 5)).toBe(false);
      expect(canRetryPayment(PaymentStatus.PENDING, 6)).toBe(false);
    });

    it("returns false when status is terminal regardless of attempts", () => {
      expect(canRetryPayment(PaymentStatus.PAID, 0)).toBe(false);
      expect(canRetryPayment(PaymentStatus.FAILED, 0)).toBe(false);
      expect(canRetryPayment(PaymentStatus.EXPIRED, 0)).toBe(false);
    });

    it("respects custom maxAttempts parameter", () => {
      expect(canRetryPayment(PaymentStatus.PENDING, 2, 3)).toBe(true);
      expect(canRetryPayment(PaymentStatus.PENDING, 3, 3)).toBe(false);
    });
  });

  describe("hasTimeForRetry", () => {
    it("returns true with sufficient time remaining", () => {
      expect(hasTimeForRetry(60_000)).toBe(true);
      expect(hasTimeForRetry(120_000)).toBe(true);
    });

    it("returns false with insufficient time remaining", () => {
      expect(hasTimeForRetry(59_999)).toBe(false);
      expect(hasTimeForRetry(0)).toBe(false);
    });

    it("respects custom minRetryMs parameter", () => {
      expect(hasTimeForRetry(30_000, 30_000)).toBe(true);
      expect(hasTimeForRetry(29_999, 30_000)).toBe(false);
    });
  });
});
