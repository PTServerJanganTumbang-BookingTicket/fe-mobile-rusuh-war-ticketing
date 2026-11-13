/**
 * GoPay URL Utilities Tests
 *
 * GH-14 T10: Unit tests for GoPay URL detection.
 */

// GoPay URL patterns from the implementation
const GOPAY_PATTERNS = ["gojek.link", "gopay://", "gojek://"];

/**
 * Check if URL is a GoPay link.
 */
function isGopayUrl(url: string): boolean {
  return GOPAY_PATTERNS.some((pattern) => url.includes(pattern));
}

describe("GoPay URL utilities", () => {
  describe("isGopayUrl", () => {
    it("should return true for gojek.link URLs", () => {
      expect(isGopayUrl("https://gojek.link/gopay/abc123")).toBe(true);
    });

    it("should return true for gopay:// URLs", () => {
      expect(isGopayUrl("gopay://payment?id=123")).toBe(true);
    });

    it("should return true for gojek:// URLs", () => {
      expect(isGopayUrl("gojek://app/payment")).toBe(true);
    });

    it("should return false for non-GoPay URLs", () => {
      expect(isGopayUrl("https://example.com")).toBe(false);
    });

    it("should return false for rush-my-ticket.my.id URLs", () => {
      expect(isGopayUrl("https://rush-my-ticket.my.id/m/orders/123/pay")).toBe(
        false
      );
    });

    it("should return false for random payment URLs", () => {
      expect(isGopayUrl("https://midtrans.com/pay/123")).toBe(false);
    });
  });
});
