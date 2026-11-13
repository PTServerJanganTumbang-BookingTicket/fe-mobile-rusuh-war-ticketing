/**
 * Payment URL Validator
 *
 * GH-14 T3: Validates payment_url before opening WebView.
 * Security: Ensures URL matches expected origin to prevent malicious redirects.
 *
 * ADR-007 §3: "Aplikasi **wajib** memeriksa URL diawali
 * `https://rush-my-ticket.my.id/m/orders/` sebelum membukanya."
 *
 * @module features/payment/data/payment-url.validator
 */

import { PaymentError, PaymentErrorCode } from "./RealPaymentAdapter";

/**
 * Expected URL prefix for payment WebView.
 * Only URLs starting with this prefix are considered valid.
 */
export const PAYMENT_URL_PREFIX = "https://rush-my-ticket.my.id/m/orders/";

/**
 * Expected URL pattern: {prefix}{booking_id}/pay#code={handoff_code}
 */
export const PAYMENT_URL_PATTERN =
  /^https:\/\/rush-my-ticket\.my\.id\/m\/orders\/[^/]+\/pay(#code=[^&]+)?$/;

/**
 * Validate payment URL before opening WebView.
 *
 * R3-AC1: URL MUST start with https://rush-my-ticket.my.id/m/orders/
 * R3-AC2: URL MUST NOT contain credentials in path or query (except #code fragment)
 * R3-AC3: Invalid URL throws PaymentError.INVALID_PAYMENT_URL
 * R3-AC4: Validation is synchronous
 *
 * @param url - Payment URL from handoff response
 * @throws PaymentError if URL is invalid
 */
export function validatePaymentUrl(url: string): void {
  // R3-AC1: Must start with expected prefix
  if (!url.startsWith(PAYMENT_URL_PREFIX)) {
    throw new PaymentError(
      PaymentErrorCode.INVALID_PAYMENT_URL,
      `Payment URL does not match expected origin. Expected prefix: ${PAYMENT_URL_PREFIX}`,
      { url: maskUrl(url) }
    );
  }

  // Must use HTTPS
  if (!url.startsWith("https://")) {
    throw new PaymentError(
      PaymentErrorCode.INVALID_PAYMENT_URL,
      "Payment URL must use HTTPS",
      { url: maskUrl(url) }
    );
  }

  // R3-AC2: Must not contain credentials in query string
  // Fragment (#code=...) is allowed, query string (?...) with sensitive data is not
  const urlObj = new URL(url);

  // Check for suspicious query parameters
  const suspiciousParams = [
    "token",
    "access_token",
    "auth",
    "password",
    "secret",
    "key",
    "grant",
    "bearer",
  ];

  for (const param of urlObj.searchParams.keys()) {
    if (
      suspiciousParams.some((s) =>
        param.toLowerCase().includes(s.toLowerCase())
      )
    ) {
      throw new PaymentError(
        PaymentErrorCode.INVALID_PAYMENT_URL,
        "Payment URL contains suspicious query parameters",
        { param }
      );
    }
  }

  // Validate path structure: /m/orders/{booking_id}/pay
  const pathParts = urlObj.pathname.split("/").filter(Boolean);
  if (
    pathParts.length !== 4 ||
    pathParts[0] !== "m" ||
    pathParts[1] !== "orders" ||
    pathParts[3] !== "pay"
  ) {
    throw new PaymentError(
      PaymentErrorCode.INVALID_PAYMENT_URL,
      "Payment URL path structure is invalid",
      { pathname: urlObj.pathname }
    );
  }

  // Check booking_id is not empty
  const bookingId = pathParts[2];
  if (!bookingId || bookingId.length === 0) {
    throw new PaymentError(
      PaymentErrorCode.INVALID_PAYMENT_URL,
      "Payment URL missing booking ID",
      { pathname: urlObj.pathname }
    );
  }
}

/**
 * Check if URL is a valid payment URL (non-throwing version).
 *
 * @param url - URL to check
 * @returns true if valid, false otherwise
 */
export function isValidPaymentUrl(url: string): boolean {
  try {
    validatePaymentUrl(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract booking ID from payment URL.
 *
 * @param url - Valid payment URL
 * @returns Booking ID or null if invalid
 */
export function extractBookingIdFromUrl(url: string): string | null {
  try {
    validatePaymentUrl(url);
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    return pathParts[2] ?? null;
  } catch {
    return null;
  }
}

/**
 * Mask URL for safe logging (hide potential sensitive data).
 */
function maskUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Keep protocol and host, mask everything else
    return `${urlObj.protocol}//${urlObj.host}/***`;
  } catch {
    // If URL parsing fails, return generic mask
    return "***invalid-url***";
  }
}
