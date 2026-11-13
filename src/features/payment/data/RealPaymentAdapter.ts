/**
 * RealPaymentAdapter
 *
 * GH-14: Real payment adapter using WebView handoff per ADR-007.
 * Implements PaymentPort interface for production use.
 *
 * Flow:
 * 1. requestHandoff() -> POST /payments/{booking_id}/handoff -> handoff_code
 * 2. Open WebView with payment_url (includes #code=handoff_code)
 * 3. WebView handles payment session exchange and payment UI
 * 4. verifyStatus() -> GET /bookings/{booking_id} -> final status
 *
 * @module features/payment/data/RealPaymentAdapter
 */

import type { PaymentPort } from "../domain/payment.port";
import type {
  AvailableMethod,
  BankCode,
  PaymentMethod,
} from "../domain/payment-method.types";
import type { PaymentInitiation } from "../domain/payment-instruction.types";
import type { PaymentStatusResult } from "../domain/payment-status.types";
import type {
  GuestGrantHeaders,
  AuthenticatedGrantHeaders,
} from "../../../core/domain/auth/headers.types";
import type { HandoffResponse } from "./dto/handoff.dto";

import {
  PaymentMethod as PM,
  BankCode as BC,
} from "../domain/payment-method.types";
import { validatePaymentUrl } from "./payment-url.validator";
import { mapBookingToPaymentStatus } from "./status-mapper";

/**
 * Grant headers type union.
 */
type GrantHeaders = GuestGrantHeaders | AuthenticatedGrantHeaders;

/**
 * Configuration for RealPaymentAdapter.
 */
export interface RealPaymentAdapterConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number;
  /** Function to get current grant headers */
  getGrantHeaders: () => Promise<GrantHeaders>;
}

/**
 * Payment error codes.
 */
export const PaymentErrorCode = {
  GRANT_EXPIRED: "GRANT_EXPIRED",
  BOOKING_NOT_PAYABLE: "BOOKING_NOT_PAYABLE",
  INVALID_PAYMENT_URL: "INVALID_PAYMENT_URL",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  UNKNOWN: "UNKNOWN",
} as const;

export type PaymentErrorCode =
  (typeof PaymentErrorCode)[keyof typeof PaymentErrorCode];

/**
 * Payment error thrown by RealPaymentAdapter.
 */
export class PaymentError extends Error {
  constructor(
    public readonly code: PaymentErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "PaymentError";
  }
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
 * RealPaymentAdapter
 *
 * Implements PaymentPort via WebView handoff mechanism.
 * Most payment operations are delegated to the WebView;
 * this adapter handles handoff code acquisition and status verification.
 */
export class RealPaymentAdapter implements PaymentPort {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly getGrantHeaders: () => Promise<GrantHeaders>;

  constructor(config: RealPaymentAdapterConfig) {
    this.baseUrl = config.baseUrl;
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.getGrantHeaders = config.getGrantHeaders;
  }

  // =========================================================================
  // PaymentPort Interface Methods
  // =========================================================================

  /**
   * Get available payment methods.
   * POC: Returns hardcoded methods. Production: GET /payments/methods
   */
  async getAvailableMethods(): Promise<AvailableMethod[]> {
    // POC implementation - return hardcoded methods
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
   * Initiate payment via WebView handoff.
   * Returns payment_url for WebView consumption.
   */
  async initiatePayment(
    bookingId: string,
    method: PaymentMethod,
    bankCode?: BankCode
  ): Promise<PaymentInitiation> {
    const handoff = await this.requestHandoff(bookingId);

    // Return WebView-based initiation
    return {
      paymentId: `webview_${bookingId}`,
      method,
      instruction: this.createPlaceholderInstruction(method, bankCode),
      expiresAt: handoff.expiresAt,
      serverTime: new Date().toISOString(),
      // Extended property for WebView flow
      webViewUrl: handoff.paymentUrl,
    } as PaymentInitiation & { webViewUrl: string };
  }

  /**
   * Get current payment status by verifying booking status.
   */
  async getPaymentStatus(bookingId: string): Promise<PaymentStatusResult> {
    const bookingStatus = await this.verifyStatus(bookingId);
    return mapBookingToPaymentStatus(bookingStatus);
  }

  /**
   * Retry payment by requesting new handoff code.
   */
  async retryPayment(
    bookingId: string,
    method: PaymentMethod,
    bankCode?: BankCode
  ): Promise<PaymentInitiation> {
    // Request new handoff code and return
    return this.initiatePayment(bookingId, method, bankCode);
  }

  // =========================================================================
  // WebView Handoff Methods
  // =========================================================================

  /**
   * Request handoff code from backend.
   * ADR-007 §5.6: POST /payments/{booking_id}/handoff
   *
   * @throws PaymentError.GRANT_EXPIRED if grant is invalid
   * @throws PaymentError.BOOKING_NOT_PAYABLE if booking status invalid
   */
  async requestHandoff(bookingId: string): Promise<HandoffResponse> {
    const url = new URL(
      `/payments/${bookingId}/handoff`,
      this.baseUrl
    ).toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers = await this.getGrantHeaders();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...headers,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.mapHttpError(response.status, errorData);
      }

      const data = await response.json();
      const handoffResponse: HandoffResponse = {
        handoffCode: data.handoff_code,
        paymentUrl: data.payment_url,
        expiresAt: data.expires_at,
      };

      // Validate payment URL before returning
      validatePaymentUrl(handoffResponse.paymentUrl);

      return handoffResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof PaymentError) {
        throw error;
      }
      throw this.mapFetchError(error);
    }
  }

  /**
   * Verify booking status after WebView closes.
   * ADR-007: This is the authoritative check — postMessage is just a signal.
   */
  async verifyStatus(bookingId: string): Promise<BookingStatusResponse> {
    const url = new URL(`/bookings/${bookingId}`, this.baseUrl).toString();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers = await this.getGrantHeaders();
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.mapHttpError(response.status, errorData);
      }

      const data = await response.json();
      return {
        bookingId: data.booking_id,
        status: data.status,
        paymentStatus: data.payment_status,
        paidAt: data.paid_at,
        expiresAt: data.expires_at,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof PaymentError) {
        throw error;
      }
      throw this.mapFetchError(error);
    }
  }

  // =========================================================================
  // Private Helpers
  // =========================================================================

  /**
   * Create placeholder instruction for WebView flow.
   * Actual instructions are rendered in WebView, not here.
   */
  private createPlaceholderInstruction(
    method: PaymentMethod,
    bankCode?: BankCode
  ) {
    if (method === PM.BANK_TRANSFER) {
      return {
        method: "bank_transfer" as const,
        instruction: {
          virtualAccountNumber: "WEBVIEW",
          bankCode: bankCode ?? BC.BCA,
          accountName: "WEBVIEW",
          amount: 0,
        },
      };
    }

    return {
      method: "gopay" as const,
      instruction: {
        qrCodeUrl: "WEBVIEW",
        deeplinkUrl: "WEBVIEW",
        amount: 0,
      },
    };
  }

  /**
   * Map HTTP error to PaymentError.
   */
  private mapHttpError(
    status: number,
    errorData: { code?: string; message?: string }
  ): PaymentError {
    const code = errorData.code;

    if (status === 401) {
      if (code === "GRANT_TOKEN_INVALID" || code === "GRANT_EXPIRED") {
        return new PaymentError(
          PaymentErrorCode.GRANT_EXPIRED,
          "Session expired. Please re-authenticate.",
          errorData
        );
      }
    }

    if (status === 409) {
      if (code === "BOOKING_STATUS_INVALID") {
        return new PaymentError(
          PaymentErrorCode.BOOKING_NOT_PAYABLE,
          "Booking cannot be paid in current state.",
          errorData
        );
      }
    }

    return new PaymentError(
      PaymentErrorCode.UNKNOWN,
      errorData.message ?? `HTTP ${status} error`,
      errorData
    );
  }

  /**
   * Map fetch error to PaymentError.
   */
  private mapFetchError(error: unknown): PaymentError {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return new PaymentError(
          PaymentErrorCode.TIMEOUT,
          "Request timed out",
          error
        );
      }
      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        return new PaymentError(
          PaymentErrorCode.NETWORK_ERROR,
          "Network connection failed",
          error
        );
      }
    }

    return new PaymentError(
      PaymentErrorCode.NETWORK_ERROR,
      "Request failed",
      error
    );
  }
}

/**
 * Booking status response from GET /bookings/{id}.
 */
export interface BookingStatusResponse {
  bookingId: string;
  status: string;
  paymentStatus?: string;
  paidAt?: string;
  expiresAt?: string;
}
