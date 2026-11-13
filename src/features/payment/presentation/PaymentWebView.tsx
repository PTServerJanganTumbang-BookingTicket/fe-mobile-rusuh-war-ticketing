/**
 * PaymentWebView Component
 *
 * GH-14 T6: Secure WebView wrapper for payment handoff.
 * ADR-007 §9: WebView security configuration.
 *
 * @module features/payment/presentation/PaymentWebView
 */

import React, { useCallback } from "react";
import { StyleSheet, View, Linking } from "react-native";
import WebView, { type WebViewProps } from "react-native-webview";

/**
 * WebView message types from payment page.
 */
export type WebViewMessageType =
  "PAYMENT_DONE" | "PAYMENT_EXPIRED" | "HANDOFF_EXPIRED" | "CLOSE";

/**
 * Message payload from WebView.
 */
export interface WebViewMessage {
  type: WebViewMessageType;
  booking_id: string;
}

/**
 * Props for PaymentWebView component.
 */
export interface PaymentWebViewProps {
  /** Payment URL from handoff response */
  url: string;
  /** Called when payment is complete (PAYMENT_DONE) */
  onPaymentComplete: (bookingId: string) => void;
  /** Called when payment has expired (PAYMENT_EXPIRED) */
  onPaymentExpired: (bookingId: string) => void;
  /** Called when handoff code needs refresh (HANDOFF_EXPIRED) */
  onHandoffExpired: (bookingId: string) => void;
  /** Called when user closes payment (CLOSE) */
  onClose: (bookingId: string) => void;
  /** Called on WebView load error */
  onError?: (error: string) => void;
  /** Test ID for automation */
  testID?: string;
}

/**
 * Allowed origin for payment WebView.
 */
const ALLOWED_ORIGIN = "https://rush-my-ticket.my.id";

/**
 * Patterns for GoPay external links.
 */
const GOPAY_PATTERNS = ["gojek.link", "gopay://", "gojek://"];

/**
 * PaymentWebView - Secure WebView wrapper for payment handoff flow.
 */
export function PaymentWebView({
  url,
  onPaymentComplete,
  onPaymentExpired,
  onHandoffExpired,
  onClose,
  onError,
  testID = "payment-webview",
}: PaymentWebViewProps) {
  /**
   * Handle navigation requests.
   */
  const handleShouldStartLoad: WebViewProps["onShouldStartLoadWithRequest"] =
    useCallback((request) => {
      const requestUrl = request.url;

      // Allow payment origin
      if (requestUrl.startsWith(ALLOWED_ORIGIN)) {
        return true;
      }

      // Handle GoPay links externally
      const isGopayLink = GOPAY_PATTERNS.some((pattern) =>
        requestUrl.includes(pattern)
      );

      if (isGopayLink) {
        Linking.openURL(requestUrl).catch((err) => {
          console.warn("[PaymentWebView] Failed to open GoPay link:", err);
        });
        return false;
      }

      // Block all other navigations
      console.warn("[PaymentWebView] Blocked navigation to:", requestUrl);
      return false;
    }, []);

  /**
   * Handle messages from WebView.
   */
  const handleMessage: WebViewProps["onMessage"] = useCallback(
    (event) => {
      const eventUrl = event.nativeEvent.url;

      // Validate origin
      if (!eventUrl.startsWith(ALLOWED_ORIGIN)) {
        return;
      }

      try {
        const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
        const { type, booking_id: bookingId } = data;

        switch (type) {
          case "PAYMENT_DONE":
            onPaymentComplete(bookingId);
            break;
          case "PAYMENT_EXPIRED":
            onPaymentExpired(bookingId);
            break;
          case "HANDOFF_EXPIRED":
            onHandoffExpired(bookingId);
            break;
          case "CLOSE":
            onClose(bookingId);
            break;
          default:
            console.warn("[PaymentWebView] Unknown message type:", type);
        }
      } catch (e) {
        console.warn("[PaymentWebView] Invalid message format:", e);
      }
    },
    [onPaymentComplete, onPaymentExpired, onHandoffExpired, onClose]
  );

  /**
   * Handle WebView errors.
   */
  const handleError: WebViewProps["onError"] = useCallback(
    (event) => {
      const errorMessage =
        event.nativeEvent.description || "WebView load failed";
      console.error("[PaymentWebView] Error:", errorMessage);
      onError?.(errorMessage);
    },
    [onError]
  );

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        originWhitelist={[ALLOWED_ORIGIN]}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onMessage={handleMessage}
        onError={handleError}
        javaScriptEnabled={true}
        setSupportMultipleWindows={false}
        allowFileAccess={false}
        sharedCookiesEnabled={false}
        cacheEnabled={false}
        mediaPlaybackRequiresUserAction={true}
        startInLoadingState={true}
        testID={testID}
        style={styles.webView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webView: {
    flex: 1,
  },
});
