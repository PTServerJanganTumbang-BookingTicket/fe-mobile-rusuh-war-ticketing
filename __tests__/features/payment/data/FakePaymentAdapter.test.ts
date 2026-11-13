/**
 * FakePaymentAdapter Unit Tests
 *
 * GH-13 T8: Comprehensive unit tests for FakePaymentAdapter.
 * Tests all 15 required cases from spec.
 */

import { FakePaymentAdapter } from "@/features/payment/data/FakePaymentAdapter";
import {
  PaymentMethod,
  BankCode,
} from "@/features/payment/domain/payment-method.types";
import { PaymentStatus } from "@/features/payment/domain/payment-status.types";
import { MAX_PAYMENT_ATTEMPTS } from "@/features/payment/domain/payment.rules";

describe("FakePaymentAdapter", () => {
  let adapter: FakePaymentAdapter;

  beforeEach(() => {
    adapter = new FakePaymentAdapter();
    adapter._reset();
  });

  // ================================================================
  // Test Case 1: getAvailableMethods returns bank_transfer with 4 banks
  // ================================================================
  describe("getAvailableMethods", () => {
    it("returns bank_transfer with 4 banks (BCA, BNI, BRI, CIMB)", async () => {
      const methods = await adapter.getAvailableMethods();

      const bankTransfer = methods.find(
        (m) => m.method === PaymentMethod.BANK_TRANSFER
      );
      expect(bankTransfer).toBeDefined();
      expect(bankTransfer?.method).toBe(PaymentMethod.BANK_TRANSFER);

      if (bankTransfer?.method === PaymentMethod.BANK_TRANSFER) {
        expect(bankTransfer.banks).toHaveLength(4);
        const bankCodes = bankTransfer.banks.map((b) => b.code);
        expect(bankCodes).toContain(BankCode.BCA);
        expect(bankCodes).toContain(BankCode.BNI);
        expect(bankCodes).toContain(BankCode.BRI);
        expect(bankCodes).toContain(BankCode.CIMB);
      }
    });

    // ================================================================
    // Test Case 2: getAvailableMethods returns gopay
    // ================================================================
    it("returns gopay method", async () => {
      const methods = await adapter.getAvailableMethods();

      const gopay = methods.find((m) => m.method === PaymentMethod.GOPAY);
      expect(gopay).toBeDefined();
      expect(gopay?.method).toBe(PaymentMethod.GOPAY);
    });
  });

  // ================================================================
  // Test Case 3: initiatePayment for bank_transfer returns VA instructions
  // ================================================================
  describe("initiatePayment", () => {
    const testBookingId = "bkg_test_12345678";

    it("returns VA instructions for bank_transfer", async () => {
      const result = await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      expect(result.method).toBe(PaymentMethod.BANK_TRANSFER);
      expect(result.paymentId).toMatch(/^pay_/);
      expect(result.expiresAt).toBeDefined();
      expect(result.serverTime).toBeDefined();

      expect(result.instruction.method).toBe(PaymentMethod.BANK_TRANSFER);
      if (result.instruction.method === PaymentMethod.BANK_TRANSFER) {
        const va = result.instruction.instruction;
        expect(va.virtualAccountNumber).toMatch(/^8888014/); // BCA prefix
        expect(va.bankCode).toBe(BankCode.BCA);
        expect(va.accountName).toBe("RUSUH BOOKING TIKET");
        expect(va.amount).toBeGreaterThan(0);
      }
    });

    // ================================================================
    // Test Case 4: initiatePayment for gopay returns QR + deeplink
    // ================================================================
    it("returns QR + deeplink for gopay", async () => {
      const result = await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.GOPAY
      );

      expect(result.method).toBe(PaymentMethod.GOPAY);
      expect(result.paymentId).toMatch(/^pay_/);
      expect(result.expiresAt).toBeDefined();

      expect(result.instruction.method).toBe(PaymentMethod.GOPAY);
      if (result.instruction.method === PaymentMethod.GOPAY) {
        const gopay = result.instruction.instruction;
        expect(gopay.qrCodeUrl).toMatch(/^data:image\/png;base64,/);
        expect(gopay.deeplinkUrl).toMatch(/^gojek:\/\/gopay/);
        expect(gopay.amount).toBeGreaterThan(0);
      }
    });

    // ================================================================
    // Test Case 5: initiatePayment is idempotent
    // ================================================================
    it("is idempotent - same booking returns same instructions", async () => {
      const first = await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BNI
      );

      const second = await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BNI
      );

      expect(second.paymentId).toBe(first.paymentId);
      expect(second.expiresAt).toBe(first.expiresAt);
      expect(second.instruction).toEqual(first.instruction);
    });
  });

  // ================================================================
  // Test Case 6: getPaymentStatus returns PENDING initially
  // ================================================================
  describe("getPaymentStatus", () => {
    const testBookingId = "bkg_status_test_001";

    it("returns PENDING initially", async () => {
      await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BRI
      );

      const status = await adapter.getPaymentStatus(testBookingId);

      expect(status.status).toBe(PaymentStatus.PENDING);
      expect(status.canRetry).toBe(false);
      expect(status.initiatedAt).toBeDefined();
      expect(status.expiresAt).toBeDefined();
      expect(status.serverTime).toBeDefined();
    });

    // ================================================================
    // Test Case 7: payment-success scenario transitions to PAID
    // ================================================================
    it("transitions to PAID via _setState (payment-success scenario)", async () => {
      await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      // Simulate payment success
      adapter._setState(testBookingId, { status: PaymentStatus.PAID });

      const status = await adapter.getPaymentStatus(testBookingId);

      expect(status.status).toBe(PaymentStatus.PAID);
      expect(status.canRetry).toBe(false);
    });

    // ================================================================
    // Test Case 8: payment-failure scenario transitions to FAILED with can_retry
    // ================================================================
    it("transitions to FAILED with canRetry=true (payment-failure scenario)", async () => {
      await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      // Simulate payment failure (attempt 1)
      adapter._setState(testBookingId, {
        status: PaymentStatus.FAILED,
        currentAttempt: 1,
      });

      const status = await adapter.getPaymentStatus(testBookingId);

      expect(status.status).toBe(PaymentStatus.FAILED);
      expect(status.canRetry).toBe(true);
      expect(status.retryInfo).toBeDefined();
      expect(status.retryInfo?.retriesRemaining).toBe(MAX_PAYMENT_ATTEMPTS - 1);
    });

    // ================================================================
    // Test Case 9: payment-timeout scenario transitions to EXPIRED
    // ================================================================
    it("transitions to EXPIRED after TTL elapses (payment-timeout scenario)", async () => {
      await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      // Set expiry to the past
      const pastExpiry = new Date(Date.now() - 1000).toISOString();
      adapter._setState(testBookingId, {
        status: PaymentStatus.PENDING,
        expiresAt: pastExpiry,
      });

      const status = await adapter.getPaymentStatus(testBookingId);

      expect(status.status).toBe(PaymentStatus.EXPIRED);
      expect(status.canRetry).toBe(false);
    });
  });

  // ================================================================
  // Test Case 10: retryPayment increments attempt_number
  // ================================================================
  describe("retryPayment", () => {
    const testBookingId = "bkg_retry_test_001";

    it("increments attempt_number on retry", async () => {
      await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      const initialState = adapter._getState(testBookingId);
      expect(initialState?.currentAttempt).toBe(1);

      // Set to FAILED to allow retry
      adapter._setState(testBookingId, { status: PaymentStatus.FAILED });

      await adapter.retryPayment(testBookingId, PaymentMethod.GOPAY);

      const afterRetry = adapter._getState(testBookingId);
      expect(afterRetry?.currentAttempt).toBe(2);
      expect(afterRetry?.method).toBe(PaymentMethod.GOPAY);
    });

    // ================================================================
    // Test Case 11: retryPayment fails after max attempts (5)
    // ================================================================
    it("fails after max attempts (5)", async () => {
      await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      // Set to max attempts and FAILED
      adapter._setState(testBookingId, {
        status: PaymentStatus.FAILED,
        currentAttempt: MAX_PAYMENT_ATTEMPTS,
      });

      await expect(
        adapter.retryPayment(testBookingId, PaymentMethod.GOPAY)
      ).rejects.toThrow("Maximum retry attempts exceeded");
    });

    // ================================================================
    // Test Case 12: retryPayment fails if already settled
    // ================================================================
    it("fails if already settled (PAID)", async () => {
      await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      adapter._setState(testBookingId, { status: PaymentStatus.PAID });

      await expect(
        adapter.retryPayment(testBookingId, PaymentMethod.GOPAY)
      ).rejects.toThrow("Can only retry failed payments");
    });

    it("fails if already settled (EXPIRED)", async () => {
      await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      adapter._setState(testBookingId, { status: PaymentStatus.EXPIRED });

      await expect(
        adapter.retryPayment(testBookingId, PaymentMethod.GOPAY)
      ).rejects.toThrow("Can only retry failed payments");
    });

    it("fails if status is PENDING", async () => {
      await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      // Status defaults to PENDING, no _setState needed

      await expect(
        adapter.retryPayment(testBookingId, PaymentMethod.GOPAY)
      ).rejects.toThrow("Can only retry failed payments");
    });

    it("fails if no payment found for booking", async () => {
      await expect(
        adapter.retryPayment("nonexistent_booking", PaymentMethod.GOPAY)
      ).rejects.toThrow("No payment found for booking");
    });

    it("fails if payment window has expired during retry", async () => {
      await adapter.initiatePayment(
        testBookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      // Set to FAILED with expired TTL
      const pastExpiry = new Date(Date.now() - 1000).toISOString();
      adapter._setState(testBookingId, {
        status: PaymentStatus.FAILED,
        expiresAt: pastExpiry,
      });

      await expect(
        adapter.retryPayment(testBookingId, PaymentMethod.GOPAY)
      ).rejects.toThrow("Payment window has expired");
    });
  });

  // ================================================================
  // Test Case 13: adapter state can be inspected via _getState
  // ================================================================
  describe("_getState", () => {
    it("returns undefined for unknown booking", () => {
      const state = adapter._getState("unknown_booking");
      expect(state).toBeUndefined();
    });

    it("returns state after initiatePayment", async () => {
      const bookingId = "bkg_state_test_001";
      await adapter.initiatePayment(
        bookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BNI
      );

      const state = adapter._getState(bookingId);

      expect(state).toBeDefined();
      expect(state?.status).toBe(PaymentStatus.PENDING);
      expect(state?.currentAttempt).toBe(1);
      expect(state?.method).toBe(PaymentMethod.BANK_TRANSFER);
      expect(state?.bankCode).toBe(BankCode.BNI);
      expect(state?.paymentId).toMatch(/^pay_/);
      expect(state?.initiatedAt).toBeDefined();
      expect(state?.expiresAt).toBeDefined();
      expect(state?.updatedAt).toBeDefined();
    });
  });

  // ================================================================
  // Test Case 14: adapter can be reset via _reset between tests
  // ================================================================
  describe("_reset", () => {
    it("clears all state between tests", async () => {
      const bookingId = "bkg_reset_test_001";
      await adapter.initiatePayment(
        bookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      expect(adapter._getState(bookingId)).toBeDefined();

      adapter._reset();

      expect(adapter._getState(bookingId)).toBeUndefined();
    });

    it("allows fresh state after reset", async () => {
      const bookingId = "bkg_fresh_test_001";
      await adapter.initiatePayment(
        bookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      adapter._setState(bookingId, { currentAttempt: 3 });
      expect(adapter._getState(bookingId)?.currentAttempt).toBe(3);

      adapter._reset();

      await adapter.initiatePayment(bookingId, PaymentMethod.GOPAY);

      const state = adapter._getState(bookingId);
      expect(state?.currentAttempt).toBe(1);
      expect(state?.method).toBe(PaymentMethod.GOPAY);
    });
  });

  // ================================================================
  // Test Case 15: all methods resolve within 10ms in test mode
  // ================================================================
  describe("performance", () => {
    it("getAvailableMethods resolves within 10ms", async () => {
      const start = performance.now();
      await adapter.getAvailableMethods();
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });

    it("initiatePayment resolves within 10ms", async () => {
      const start = performance.now();
      await adapter.initiatePayment(
        "bkg_perf_001",
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });

    it("getPaymentStatus resolves within 10ms", async () => {
      await adapter.initiatePayment(
        "bkg_perf_002",
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      const start = performance.now();
      await adapter.getPaymentStatus("bkg_perf_002");
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });

    it("retryPayment resolves within 10ms", async () => {
      await adapter.initiatePayment(
        "bkg_perf_003",
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );
      adapter._setState("bkg_perf_003", { status: PaymentStatus.FAILED });

      const start = performance.now();
      await adapter.retryPayment("bkg_perf_003", PaymentMethod.GOPAY);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(10);
    });
  });

  // ================================================================
  // Additional edge cases
  // ================================================================
  describe("edge cases", () => {
    it("generates deterministic VA numbers based on booking ID", async () => {
      const booking1 = "bkg_00000001";
      const booking2 = "bkg_00000002";

      const result1 = await adapter.initiatePayment(
        booking1,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      adapter._reset();

      const result1Again = await adapter.initiatePayment(
        booking1,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      // Same booking ID should produce same VA number
      if (
        result1.instruction.method === PaymentMethod.BANK_TRANSFER &&
        result1Again.instruction.method === PaymentMethod.BANK_TRANSFER
      ) {
        expect(result1Again.instruction.instruction.virtualAccountNumber).toBe(
          result1.instruction.instruction.virtualAccountNumber
        );
      }

      // Different booking ID should produce different VA number
      adapter._reset();
      const result2 = await adapter.initiatePayment(
        booking2,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      if (
        result1.instruction.method === PaymentMethod.BANK_TRANSFER &&
        result2.instruction.method === PaymentMethod.BANK_TRANSFER
      ) {
        expect(result2.instruction.instruction.virtualAccountNumber).not.toBe(
          result1.instruction.instruction.virtualAccountNumber
        );
      }
    });

    it("generates different VA numbers for different banks", async () => {
      const bookingId = "bkg_bank_test_001";

      const bcaResult = await adapter.initiatePayment(
        bookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      adapter._reset();

      const bniResult = await adapter.initiatePayment(
        bookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BNI
      );

      if (
        bcaResult.instruction.method === PaymentMethod.BANK_TRANSFER &&
        bniResult.instruction.method === PaymentMethod.BANK_TRANSFER
      ) {
        expect(bniResult.instruction.instruction.virtualAccountNumber).not.toBe(
          bcaResult.instruction.instruction.virtualAccountNumber
        );
        // BCA prefix is 014, BNI prefix is 009
        expect(bcaResult.instruction.instruction.virtualAccountNumber).toMatch(
          /^8888014/
        );
        expect(bniResult.instruction.instruction.virtualAccountNumber).toMatch(
          /^8888009/
        );
      }
    });

    it("_setDefaultAmount changes amount in payment instructions", async () => {
      adapter._setDefaultAmount(1000000);

      const result = await adapter.initiatePayment(
        "bkg_amount_test",
        PaymentMethod.GOPAY
      );

      if (result.instruction.method === PaymentMethod.GOPAY) {
        expect(result.instruction.instruction.amount).toBe(1000000);
      }
    });

    it("getPaymentStatus returns default PENDING for uninitiated booking", async () => {
      const status = await adapter.getPaymentStatus("uninitiated_booking");

      expect(status.status).toBe(PaymentStatus.PENDING);
      expect(status.canRetry).toBe(false);
    });

    it("gopay deeplink includes payment ID and amount", async () => {
      adapter._setDefaultAmount(750000);
      const result = await adapter.initiatePayment(
        "bkg_deeplink_test",
        PaymentMethod.GOPAY
      );

      if (result.instruction.method === PaymentMethod.GOPAY) {
        expect(result.instruction.instruction.deeplinkUrl).toContain(
          result.paymentId
        );
        expect(result.instruction.instruction.deeplinkUrl).toContain("750000");
      }
    });

    it("retryPayment resets status to PENDING", async () => {
      const bookingId = "bkg_retry_reset_test";

      await adapter.initiatePayment(
        bookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      adapter._setState(bookingId, { status: PaymentStatus.FAILED });

      await adapter.retryPayment(bookingId, PaymentMethod.GOPAY);

      const state = adapter._getState(bookingId);
      expect(state?.status).toBe(PaymentStatus.PENDING);
    });

    it("retryPayment allows switching payment method", async () => {
      const bookingId = "bkg_switch_method_test";

      await adapter.initiatePayment(
        bookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      adapter._setState(bookingId, { status: PaymentStatus.FAILED });

      const retryResult = await adapter.retryPayment(
        bookingId,
        PaymentMethod.GOPAY
      );

      expect(retryResult.method).toBe(PaymentMethod.GOPAY);
      expect(retryResult.instruction.method).toBe(PaymentMethod.GOPAY);
    });

    it("retryPayment generates new paymentId", async () => {
      const bookingId = "bkg_new_id_test";

      const initial = await adapter.initiatePayment(
        bookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      adapter._setState(bookingId, { status: PaymentStatus.FAILED });

      const retry = await adapter.retryPayment(
        bookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BNI
      );

      expect(retry.paymentId).not.toBe(initial.paymentId);
      expect(retry.paymentId).toContain("_2"); // Second attempt
    });

    it("_setState preserves existing state when partial update", async () => {
      const bookingId = "bkg_partial_update_test";

      await adapter.initiatePayment(
        bookingId,
        PaymentMethod.BANK_TRANSFER,
        BankCode.BCA
      );

      const initialState = adapter._getState(bookingId);
      const initialInitiatedAt = initialState?.initiatedAt;

      adapter._setState(bookingId, { status: PaymentStatus.FAILED });

      const updatedState = adapter._getState(bookingId);
      expect(updatedState?.status).toBe(PaymentStatus.FAILED);
      expect(updatedState?.initiatedAt).toBe(initialInitiatedAt);
      expect(updatedState?.method).toBe(PaymentMethod.BANK_TRANSFER);
    });
  });
});
