/**
 * Payment URL Validator Tests
 *
 * GH-14 T10: Unit tests for URL validation.
 */

import {
  validatePaymentUrl,
  isValidPaymentUrl,
  extractBookingIdFromUrl,
  PAYMENT_URL_PREFIX,
} from "../../../../src/features/payment/data/payment-url.validator";
import { PaymentError } from "../../../../src/features/payment/data/RealPaymentAdapter";

describe("payment-url.validator", () => {
  describe("validatePaymentUrl", () => {
    it("should pass for valid payment URL", () => {
      const url =
        "https://rush-my-ticket.my.id/m/orders/booking_123/pay#code=hc_abc123";
      expect(() => validatePaymentUrl(url)).not.toThrow();
    });

    it("should pass for URL without fragment", () => {
      const url = "https://rush-my-ticket.my.id/m/orders/booking_123/pay";
      expect(() => validatePaymentUrl(url)).not.toThrow();
    });

    it("should throw for wrong origin", () => {
      const url = "https://evil.com/m/orders/booking_123/pay#code=hc_abc123";
      expect(() => validatePaymentUrl(url)).toThrow(PaymentError);
      expect(() => validatePaymentUrl(url)).toThrow(
        /does not match expected origin/
      );
    });

    it("should throw for HTTP (non-HTTPS) URL", () => {
      const url = "http://rush-my-ticket.my.id/m/orders/booking_123/pay";
      expect(() => validatePaymentUrl(url)).toThrow(PaymentError);
    });

    it("should throw for wrong path structure", () => {
      const url = "https://rush-my-ticket.my.id/orders/booking_123/pay";
      expect(() => validatePaymentUrl(url)).toThrow(PaymentError);
      expect(() => validatePaymentUrl(url)).toThrow(
        /does not match expected origin/
      );
    });

    it("should throw for missing booking ID", () => {
      const url = "https://rush-my-ticket.my.id/m/orders//pay";
      expect(() => validatePaymentUrl(url)).toThrow(PaymentError);
    });

    it("should throw for subdomain spoofing attempt", () => {
      const url =
        "https://rush-my-ticket.my.id.evil.com/m/orders/booking_123/pay";
      expect(() => validatePaymentUrl(url)).toThrow(PaymentError);
    });

    it("should throw for suspicious query parameters", () => {
      const url =
        "https://rush-my-ticket.my.id/m/orders/booking_123/pay?token=secret";
      expect(() => validatePaymentUrl(url)).toThrow(PaymentError);
      expect(() => validatePaymentUrl(url)).toThrow(
        /suspicious query parameters/
      );
    });

    it("should throw for access_token in query", () => {
      const url =
        "https://rush-my-ticket.my.id/m/orders/booking_123/pay?access_token=secret";
      expect(() => validatePaymentUrl(url)).toThrow(PaymentError);
    });
  });

  describe("isValidPaymentUrl", () => {
    it("should return true for valid URL", () => {
      const url = "https://rush-my-ticket.my.id/m/orders/booking_123/pay";
      expect(isValidPaymentUrl(url)).toBe(true);
    });

    it("should return false for invalid URL", () => {
      const url = "https://evil.com/m/orders/booking_123/pay";
      expect(isValidPaymentUrl(url)).toBe(false);
    });
  });

  describe("extractBookingIdFromUrl", () => {
    it("should extract booking ID from valid URL", () => {
      const url = "https://rush-my-ticket.my.id/m/orders/booking_abc_123/pay";
      expect(extractBookingIdFromUrl(url)).toBe("booking_abc_123");
    });

    it("should return null for invalid URL", () => {
      const url = "https://evil.com/m/orders/booking_123/pay";
      expect(extractBookingIdFromUrl(url)).toBeNull();
    });
  });

  describe("PAYMENT_URL_PREFIX", () => {
    it("should be the expected prefix", () => {
      expect(PAYMENT_URL_PREFIX).toBe("https://rush-my-ticket.my.id/m/orders/");
    });
  });
});
