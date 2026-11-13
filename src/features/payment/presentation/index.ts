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
export type {
  UsePaymentWebViewResult,
  PaymentWebViewAdapter,
} from "./usePaymentWebView";
export {
  usePaymentWebView,
  PaymentWebViewError,
  PaymentErrorCode,
} from "./usePaymentWebView";

// useGopayHandler hook
export type {
  UseGopayHandlerResult,
  GopayStatusAdapter,
} from "./useGopayHandler";
export { useGopayHandler, isGopayInstalled } from "./useGopayHandler";
