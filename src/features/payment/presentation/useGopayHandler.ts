/**
 * useGopayHandler Hook
 *
 * GH-14 T8: Handle GoPay deep link flow with AppState monitoring.
 * ADR-007 §7: GoPay External Link Handling
 *
 * Flow:
 * 1. WebView navigates to gojek.link or gopay://
 * 2. PaymentWebView opens URL via Linking.openURL()
 * 3. User completes payment in GoPay app
 * 4. User returns to Rusuh app (manual via app switcher)
 * 5. AppState listener detects "active" state
 * 6. Hook calls verifyStatus to check payment result
 *
 * @module features/payment/presentation/useGopayHandler
 */

import { useEffect, useRef, useCallback } from "react";
import { AppState, Linking } from "react-native";
import type { AppStateStatus } from "react-native";

/**
 * Adapter port for status verification.
 * Defined here to avoid boundary violation.
 */
export interface GopayStatusAdapter {
  verifyStatus(bookingId: string): Promise<{ status: string }>;
}

/**
 * GoPay URL patterns.
 */
const GOPAY_PATTERNS = ["gojek.link", "gopay://", "gojek://"];

/**
 * Hook result interface.
 */
export interface UseGopayHandlerResult {
  /** Open GoPay URL in external app */
  openGopayUrl: (url: string) => Promise<boolean>;
  /** Check if URL is a GoPay link */
  isGopayUrl: (url: string) => boolean;
}

/**
 * useGopayHandler
 *
 * Handles GoPay deep link flow with automatic status check on app return.
 *
 * @param adapter - Adapter implementing GopayStatusAdapter
 * @param bookingId - Current booking ID (null when not in payment flow)
 * @param onStatusChange - Callback when status changes after return
 * @param isActive - Whether GoPay handling is active
 */
export function useGopayHandler(
  adapter: GopayStatusAdapter,
  bookingId: string | null,
  onStatusChange: (status: "PAID" | "HELD" | "EXPIRED") => void,
  isActive: boolean = true
): UseGopayHandlerResult {
  /** Track if we opened GoPay (to trigger check on return) */
  const openedGopay = useRef(false);
  /** Track previous app state */
  const previousState = useRef<AppStateStatus>("active");

  /**
   * Check if URL is a GoPay link.
   * R7-AC1, R7-AC2
   */
  const isGopayUrl = useCallback((url: string): boolean => {
    return GOPAY_PATTERNS.some((pattern) => url.includes(pattern));
  }, []);

  /**
   * Open GoPay URL in external app.
   */
  const openGopayUrl = useCallback(
    async (url: string): Promise<boolean> => {
      if (!isGopayUrl(url)) {
        console.warn("[useGopayHandler] URL is not a GoPay link:", url);
        return false;
      }

      try {
        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          console.warn("[useGopayHandler] Cannot open GoPay URL:", url);
          return false;
        }

        await Linking.openURL(url);
        openedGopay.current = true;
        return true;
      } catch (error) {
        console.error("[useGopayHandler] Failed to open GoPay:", error);
        return false;
      }
    },
    [isGopayUrl]
  );

  /**
   * AppState change handler.
   * R7-AC4, R7-AC5: Verify status when app returns to foreground
   */
  useEffect(() => {
    if (!isActive || !bookingId) {
      return;
    }

    const handleAppStateChange = async (nextState: AppStateStatus) => {
      const wasBackground =
        previousState.current === "background" ||
        previousState.current === "inactive";
      const isNowActive = nextState === "active";

      // R7-AC4: Detect app foreground return
      if (wasBackground && isNowActive && openedGopay.current) {
        // Reset flag
        openedGopay.current = false;

        // R7-AC5: Verify status
        try {
          const booking = await adapter.verifyStatus(bookingId);

          // R7-AC6: PAID -> notify
          if (booking.status === "PAID") {
            onStatusChange("PAID");
          }
          // R7-AC7: HELD -> still in progress
          else if (booking.status === "HELD") {
            onStatusChange("HELD");
          }
          // EXPIRED/CANCELLED -> notify
          else {
            onStatusChange("EXPIRED");
          }
        } catch (error) {
          console.error(
            "[useGopayHandler] Failed to verify status on return:",
            error
          );
          // Don't change state on error - let user retry
        }
      }

      previousState.current = nextState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
    };
  }, [adapter, bookingId, isActive, onStatusChange]);

  return {
    openGopayUrl,
    isGopayUrl,
  };
}

/**
 * Check if GoPay app is installed.
 * Useful for showing "Install GoPay" message.
 */
export async function isGopayInstalled(): Promise<boolean> {
  try {
    // Check gojek:// scheme
    const canOpenGojek = await Linking.canOpenURL("gojek://");
    if (canOpenGojek) return true;

    // Check gopay:// scheme
    const canOpenGopay = await Linking.canOpenURL("gopay://");
    return canOpenGopay;
  } catch {
    return false;
  }
}
