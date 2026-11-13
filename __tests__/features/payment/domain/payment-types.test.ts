/**
 * Payment Domain Types Tests
 *
 * GH-13 T1: Tests for Payment domain type validation.
 */

import {
  PaymentMethod,
  BankCode,
  VALID_BANK_CODES,
  isValidPaymentMethod,
  isValidBankCode,
  PaymentStatus,
  VALID_PAYMENT_STATUSES,
  TERMINAL_PAYMENT_STATUSES,
  isValidPaymentStatus,
  isTerminalPaymentStatus,
  isValidPaymentStatusResult,
  isVAInstruction,
  isGopayInstruction,
  isValidPaymentInstruction,
  isValidPaymentInitiation,
  type VAInstruction,
  type GopayInstruction,
  type PaymentInstruction,
  type PaymentInitiation,
  type PaymentStatusResult,
} from "@/features/payment/domain";

describe("Payment Method Types", () => {
  describe("PaymentMethod", () => {
    it("has bank_transfer method", () => {
      expect(PaymentMethod.BANK_TRANSFER).toBe("bank_transfer");
    });

    it("has gopay method", () => {
      expect(PaymentMethod.GOPAY).toBe("gopay");
    });
  });

  describe("BankCode", () => {
    it("has all supported bank codes", () => {
      expect(BankCode.BCA).toBe("bca");
      expect(BankCode.BNI).toBe("bni");
      expect(BankCode.BRI).toBe("bri");
      expect(BankCode.CIMB).toBe("cimb");
    });

    it("VALID_BANK_CODES contains all banks", () => {
      expect(VALID_BANK_CODES).toContain("bca");
      expect(VALID_BANK_CODES).toContain("bni");
      expect(VALID_BANK_CODES).toContain("bri");
      expect(VALID_BANK_CODES).toContain("cimb");
      expect(VALID_BANK_CODES).toHaveLength(4);
    });
  });

  describe("isValidPaymentMethod", () => {
    it("returns true for bank_transfer", () => {
      expect(isValidPaymentMethod("bank_transfer")).toBe(true);
    });

    it("returns true for gopay", () => {
      expect(isValidPaymentMethod("gopay")).toBe(true);
    });

    it("returns false for invalid method", () => {
      expect(isValidPaymentMethod("credit_card")).toBe(false);
      expect(isValidPaymentMethod("")).toBe(false);
      expect(isValidPaymentMethod(null)).toBe(false);
      expect(isValidPaymentMethod(undefined)).toBe(false);
    });
  });

  describe("isValidBankCode", () => {
    it("returns true for valid bank codes", () => {
      expect(isValidBankCode("bca")).toBe(true);
      expect(isValidBankCode("bni")).toBe(true);
      expect(isValidBankCode("bri")).toBe(true);
      expect(isValidBankCode("cimb")).toBe(true);
    });

    it("returns false for invalid bank codes", () => {
      expect(isValidBankCode("mandiri")).toBe(false);
      expect(isValidBankCode("")).toBe(false);
      expect(isValidBankCode(null)).toBe(false);
    });
  });
});

describe("Payment Status Types", () => {
  describe("PaymentStatus", () => {
    it("has all status values", () => {
      expect(PaymentStatus.PENDING).toBe("PENDING");
      expect(PaymentStatus.PAID).toBe("PAID");
      expect(PaymentStatus.FAILED).toBe("FAILED");
      expect(PaymentStatus.EXPIRED).toBe("EXPIRED");
    });
  });

  describe("VALID_PAYMENT_STATUSES", () => {
    it("contains all statuses", () => {
      expect(VALID_PAYMENT_STATUSES).toHaveLength(4);
      expect(VALID_PAYMENT_STATUSES).toContain("PENDING");
      expect(VALID_PAYMENT_STATUSES).toContain("PAID");
      expect(VALID_PAYMENT_STATUSES).toContain("FAILED");
      expect(VALID_PAYMENT_STATUSES).toContain("EXPIRED");
    });
  });

  describe("TERMINAL_PAYMENT_STATUSES", () => {
    it("contains only terminal statuses", () => {
      expect(TERMINAL_PAYMENT_STATUSES).toHaveLength(2);
      expect(TERMINAL_PAYMENT_STATUSES).toContain("PAID");
      expect(TERMINAL_PAYMENT_STATUSES).toContain("EXPIRED");
    });
  });

  describe("isValidPaymentStatus", () => {
    it("returns true for valid statuses", () => {
      expect(isValidPaymentStatus("PENDING")).toBe(true);
      expect(isValidPaymentStatus("PAID")).toBe(true);
      expect(isValidPaymentStatus("FAILED")).toBe(true);
      expect(isValidPaymentStatus("EXPIRED")).toBe(true);
    });

    it("returns false for invalid statuses", () => {
      expect(isValidPaymentStatus("CANCELLED")).toBe(false);
      expect(isValidPaymentStatus("pending")).toBe(false);
      expect(isValidPaymentStatus(null)).toBe(false);
    });
  });

  describe("isTerminalPaymentStatus", () => {
    it("returns true for terminal statuses", () => {
      expect(isTerminalPaymentStatus("PAID")).toBe(true);
      expect(isTerminalPaymentStatus("EXPIRED")).toBe(true);
    });

    it("returns false for non-terminal statuses", () => {
      expect(isTerminalPaymentStatus("PENDING")).toBe(false);
      expect(isTerminalPaymentStatus("FAILED")).toBe(false);
    });
  });

  describe("isValidPaymentStatusResult", () => {
    const validResult: PaymentStatusResult = {
      status: "PENDING",
      canRetry: false,
      initiatedAt: "2026-01-15T10:00:00Z",
      expiresAt: "2026-01-15T10:10:00Z",
      updatedAt: "2026-01-15T10:00:00Z",
      serverTime: "2026-01-15T10:00:05Z",
    };

    it("returns true for valid result", () => {
      expect(isValidPaymentStatusResult(validResult)).toBe(true);
    });

    it("returns true for result with retry info", () => {
      const withRetry: PaymentStatusResult = {
        ...validResult,
        status: "FAILED",
        canRetry: true,
        retryInfo: {
          retriesRemaining: 2,
          nextRetryAt: "2026-01-15T10:05:00Z",
        },
      };
      expect(isValidPaymentStatusResult(withRetry)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isValidPaymentStatusResult(null)).toBe(false);
    });

    it("returns false for missing fields", () => {
      expect(isValidPaymentStatusResult({ status: "PENDING" })).toBe(false);
      expect(
        isValidPaymentStatusResult({ ...validResult, status: undefined })
      ).toBe(false);
      expect(
        isValidPaymentStatusResult({ ...validResult, canRetry: undefined })
      ).toBe(false);
    });

    it("returns false for invalid status", () => {
      expect(
        isValidPaymentStatusResult({ ...validResult, status: "INVALID" })
      ).toBe(false);
    });
  });
});

describe("Payment Instruction Types", () => {
  describe("isVAInstruction", () => {
    const validVA: VAInstruction = {
      virtualAccountNumber: "70012345678901",
      bankCode: "bca",
      accountName: "RUSUH CONCERT",
      amount: 500000,
    };

    it("returns true for valid VA instruction", () => {
      expect(isVAInstruction(validVA)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isVAInstruction(null)).toBe(false);
    });

    it("returns false for missing fields", () => {
      expect(
        isVAInstruction({ ...validVA, virtualAccountNumber: undefined })
      ).toBe(false);
      expect(isVAInstruction({ ...validVA, bankCode: undefined })).toBe(false);
      expect(isVAInstruction({ ...validVA, accountName: undefined })).toBe(
        false
      );
      expect(isVAInstruction({ ...validVA, amount: undefined })).toBe(false);
    });
  });

  describe("isGopayInstruction", () => {
    const validGopay: GopayInstruction = {
      qrCodeUrl: "https://example.com/qr/abc123",
      deeplinkUrl: "gojek://gopay/merchanttransfer?txid=abc123",
      amount: 500000,
    };

    it("returns true for valid GoPay instruction", () => {
      expect(isGopayInstruction(validGopay)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isGopayInstruction(null)).toBe(false);
    });

    it("returns false for missing fields", () => {
      expect(isGopayInstruction({ ...validGopay, qrCodeUrl: undefined })).toBe(
        false
      );
      expect(
        isGopayInstruction({ ...validGopay, deeplinkUrl: undefined })
      ).toBe(false);
      expect(isGopayInstruction({ ...validGopay, amount: undefined })).toBe(
        false
      );
    });
  });

  describe("isValidPaymentInstruction", () => {
    const validVAInstruction: PaymentInstruction = {
      method: "bank_transfer",
      instruction: {
        virtualAccountNumber: "70012345678901",
        bankCode: "bca",
        accountName: "RUSUH CONCERT",
        amount: 500000,
      },
    };

    const validGopayInstruction: PaymentInstruction = {
      method: "gopay",
      instruction: {
        qrCodeUrl: "https://example.com/qr/abc123",
        deeplinkUrl: "gojek://gopay/merchanttransfer?txid=abc123",
        amount: 500000,
      },
    };

    it("returns true for valid bank_transfer instruction", () => {
      expect(isValidPaymentInstruction(validVAInstruction)).toBe(true);
    });

    it("returns true for valid gopay instruction", () => {
      expect(isValidPaymentInstruction(validGopayInstruction)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isValidPaymentInstruction(null)).toBe(false);
    });

    it("returns false for invalid method", () => {
      expect(
        isValidPaymentInstruction({ method: "credit_card", instruction: {} })
      ).toBe(false);
    });

    it("returns false for mismatched method and instruction", () => {
      expect(
        isValidPaymentInstruction({
          method: "bank_transfer",
          instruction: {
            qrCodeUrl: "https://example.com/qr",
            deeplinkUrl: "gojek://...",
            amount: 500000,
          },
        })
      ).toBe(false);
    });
  });

  describe("isValidPaymentInitiation", () => {
    const validInitiation: PaymentInitiation = {
      paymentId: "pay_abc123",
      method: "bank_transfer",
      instruction: {
        method: "bank_transfer",
        instruction: {
          virtualAccountNumber: "70012345678901",
          bankCode: "bca",
          accountName: "RUSUH CONCERT",
          amount: 500000,
        },
      },
      expiresAt: "2026-01-15T10:10:00Z",
      serverTime: "2026-01-15T10:00:00Z",
    };

    it("returns true for valid initiation", () => {
      expect(isValidPaymentInitiation(validInitiation)).toBe(true);
    });

    it("returns true for gopay initiation", () => {
      const gopayInit: PaymentInitiation = {
        paymentId: "pay_xyz789",
        method: "gopay",
        instruction: {
          method: "gopay",
          instruction: {
            qrCodeUrl: "https://example.com/qr/abc123",
            deeplinkUrl: "gojek://gopay/merchanttransfer?txid=abc123",
            amount: 500000,
          },
        },
        expiresAt: "2026-01-15T10:10:00Z",
        serverTime: "2026-01-15T10:00:00Z",
      };
      expect(isValidPaymentInitiation(gopayInit)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isValidPaymentInitiation(null)).toBe(false);
    });

    it("returns false for missing fields", () => {
      expect(
        isValidPaymentInitiation({ ...validInitiation, paymentId: undefined })
      ).toBe(false);
      expect(
        isValidPaymentInitiation({ ...validInitiation, expiresAt: undefined })
      ).toBe(false);
      expect(
        isValidPaymentInitiation({ ...validInitiation, instruction: undefined })
      ).toBe(false);
    });
  });
});

describe("Type Discrimination", () => {
  it("PaymentInstruction discriminates correctly by method", () => {
    const bankTransfer: PaymentInstruction = {
      method: "bank_transfer",
      instruction: {
        virtualAccountNumber: "70012345678901",
        bankCode: "bca",
        accountName: "RUSUH CONCERT",
        amount: 500000,
      },
    };

    const gopay: PaymentInstruction = {
      method: "gopay",
      instruction: {
        qrCodeUrl: "https://example.com/qr/abc123",
        deeplinkUrl: "gojek://gopay/merchanttransfer?txid=abc123",
        amount: 500000,
      },
    };

    // Type narrowing works
    if (bankTransfer.method === "bank_transfer") {
      expect(bankTransfer.instruction.virtualAccountNumber).toBe(
        "70012345678901"
      );
    }

    if (gopay.method === "gopay") {
      expect(gopay.instruction.deeplinkUrl).toContain("gojek://");
    }
  });
});
