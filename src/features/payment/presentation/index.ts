/**
 * Payment Presentation Layer
 *
 * GH-14: WebView-based payment UI components and hooks.
 *
 * @module features/payment/presentation
 */

// PaymentWebView component
export type {
  PaymentWebViewProps,
  WebViewMessage,
  WebViewMessageType,
} from "./PaymentWebView";
export { PaymentWebView } from "./PaymentWebView";

// usePaymentWebView hook
export type { UsePaymentWebViewResult } from "./usePaymentWebView";
export { usePaymentWebView } from "./usePaymentWebView";

// useGopayHandler hook
export type { UseGopayHandlerResult } from "./useGopayHandler";
export { useGopayHandler, isGopayInstalled } from "./useGopayHandler";
