/**
 * usePaymentWebView Hook
 *
 * GH-14 T7: State management for WebView payment flow.
 * Handles handoff request, message events, and status verification.
 *
 * @module features/payment/presentation/usePaymentWebView
 */

import { useState, useCallback, useRef } from "react";

/**
 * Payment adapter port for WebView operations.
 * Defined here to avoid boundary violation.
 */
export interface PaymentWebViewAdapter {
  requestHandoff(bookingId: string): Promise<{ paymentUrl: string }>;
  verifyStatus(bookingId: string): Promise<{ status: string }>;
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
 * Payment error for presentation layer.
 */
export class PaymentWebViewError extends Error {
  constructor(
    public readonly code: PaymentErrorCode,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "PaymentWebViewError";
  }
}

/**
 * Hook result interface.
 */
export interface UsePaymentWebViewResult {
  /** Payment URL for WebView (null if not loaded) */
  paymentUrl: string | null;
  /** Whether handoff request is in progress */
  isLoading: boolean;
  /** Error from handoff or verification */
  error: PaymentWebViewError | null;
  /** Request handoff code and set payment URL */
  requestHandoff: (bookingId: string) => Promise<void>;
  /** Handle PAYMENT_DONE message */
  handlePaymentComplete: (bookingId: string) => Promise<void>;
  /** Handle PAYMENT_EXPIRED message */
  handlePaymentExpired: (bookingId: string) => Promise<void>;
  /** Handle HANDOFF_EXPIRED message */
  handleHandoffExpired: (bookingId: string) => Promise<void>;
  /** Handle CLOSE message */
  handleClose: (bookingId: string) => Promise<void>;
  /** Reload WebView with new handoff */
  reload: () => void;
  /** Clear payment URL (close WebView) */
  close: () => void;
  /** Clear error */
  clearError: () => void;
}

/**
 * Maximum handoff retry attempts.
 * R9-AC4: Maximum 3 handoff retries per payment session
 */
const MAX_HANDOFF_RETRIES = 3;

/**
 * usePaymentWebView
 *
 * Manages WebView payment flow state and lifecycle.
 *
 * @param adapter - Payment adapter implementing PaymentWebViewAdapter
 * @param onSuccess - Callback when payment verified as PAID
 * @param onExpired - Callback when payment verified as EXPIRED
 */
export function usePaymentWebView(
  adapter: PaymentWebViewAdapter,
  onSuccess: (bookingId: string) => void,
  onExpired: (bookingId: string) => void
): UsePaymentWebViewResult {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PaymentWebViewError | null>(null);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);

  /** Track handoff retry count */
  const handoffRetryCount = useRef(0);

  /**
   * Request handoff code and set payment URL.
   * R2-AC1 through R2-AC6
   */
  const requestHandoff = useCallback(
    async (bookingId: string) => {
      setIsLoading(true);
      setError(null);
      setCurrentBookingId(bookingId);

      try {
        const handoff = await adapter.requestHandoff(bookingId);
        setPaymentUrl(handoff.paymentUrl);
        // Reset retry count on successful handoff
        handoffRetryCount.current = 0;
      } catch (e) {
        setError(e as PaymentWebViewError);
      } finally {
        setIsLoading(false);
      }
    },
    [adapter]
  );

  /**
   * Verify booking status and navigate accordingly.
   * R6-AC1 through R6-AC5
   */
  const verifyAndNavigate = useCallback(
    async (bookingId: string) => {
      try {
        const booking = await adapter.verifyStatus(bookingId);

        // R6-AC2: Route based on status
        if (booking.status === "PAID") {
          onSuccess(bookingId);
        } else if (
          booking.status === "EXPIRED" ||
          booking.status === "CANCELLED"
        ) {
          onExpired(bookingId);
        }
        // R6-AC3: HELD status - booking still in progress
        // Don't close WebView, let payment continue
      } catch (e) {
        // R6-AC5: Network error during verification
        setError(
          new PaymentWebViewError(
            PaymentErrorCode.NETWORK_ERROR,
            "Failed to verify payment status",
            e
          )
        );
      }
    },
    [adapter, onSuccess, onExpired]
  );

  /**
   * Handle PAYMENT_DONE message.
   * R5-AC4: Close WebView and verify status
   */
  const handlePaymentComplete = useCallback(
    async (bookingId: string) => {
      setPaymentUrl(null);
      await verifyAndNavigate(bookingId);
    },
    [verifyAndNavigate]
  );

  /**
   * Handle PAYMENT_EXPIRED message.
   * R5-AC5: Close WebView and handle expiry
   */
  const handlePaymentExpired = useCallback(
    async (bookingId: string) => {
      setPaymentUrl(null);
      await verifyAndNavigate(bookingId);
    },
    [verifyAndNavigate]
  );

  /**
   * Handle HANDOFF_EXPIRED message.
   * R9-AC1 through R9-AC5: Request new handoff code with retry logic
   */
  const handleHandoffExpired = useCallback(
    async (bookingId: string) => {
      // R9-AC4: Check retry limit
      if (handoffRetryCount.current >= MAX_HANDOFF_RETRIES) {
        setError(
          new PaymentWebViewError(
            PaymentErrorCode.UNKNOWN,
            "Too many handoff attempts. Please try again later."
          )
        );
        setPaymentUrl(null);
        return;
      }

      // R9-AC5: Exponential backoff: 0s, 1s, 2s
      const delay = handoffRetryCount.current * 1000;
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      handoffRetryCount.current++;

      try {
        // R9-AC1: Request new handoff code
        const handoff = await adapter.requestHandoff(bookingId);
        // R9-AC2: Update URL to reload WebView
        setPaymentUrl(handoff.paymentUrl);
      } catch (e) {
        const paymentError = e as PaymentWebViewError;

        // R9-AC3: Grant expired - booking has ended
        if (paymentError.code === PaymentErrorCode.GRANT_EXPIRED) {
          setPaymentUrl(null);
          await verifyAndNavigate(bookingId);
        } else {
          setError(paymentError);
        }
      }
    },
    [adapter, verifyAndNavigate]
  );

  /**
   * Handle CLOSE message.
   * R5-AC7: Close WebView and verify status
   */
  const handleClose = useCallback(
    async (bookingId: string) => {
      setPaymentUrl(null);
      await verifyAndNavigate(bookingId);
    },
    [verifyAndNavigate]
  );

  /**
   * Reload WebView with new handoff.
   */
  const reload = useCallback(() => {
    if (currentBookingId) {
      requestHandoff(currentBookingId);
    }
  }, [currentBookingId, requestHandoff]);

  /**
   * Close WebView without verification.
   */
  const close = useCallback(() => {
    setPaymentUrl(null);
    setCurrentBookingId(null);
    handoffRetryCount.current = 0;
  }, []);

  /**
   * Clear error state.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    paymentUrl,
    isLoading,
    error,
    requestHandoff,
    handlePaymentComplete,
    handlePaymentExpired,
    handleHandoffExpired,
    handleClose,
    reload,
    close,
    clearError,
  };
}
