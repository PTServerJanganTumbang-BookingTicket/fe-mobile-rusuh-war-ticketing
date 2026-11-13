/**
 * Booking Presentation Layer
 *
 * GH-12: Public exports for booking presentation layer.
 *
 * @module features/booking/presentation
 */

// Hooks
export { useBooking, useSelectionReducer } from "./hooks";
export type {
  BookingDataSourceInterface,
  NikCheckState,
  NikCheckStatus,
  SelectionAction,
  SelectionState,
  UseBookingConfig,
  UseBookingResult,
  UseSelectionReducerResult,
} from "./hooks";

// Components
export {
  CategoryCard,
  CountdownBanner,
  NikInputField,
  OrderSummary,
  buildOrderLines,
} from "./components";
export type {
  CategoryCardProps,
  CountdownBannerProps,
  NikInputFieldProps,
  OrderLine,
  OrderSummaryProps,
} from "./components";

// Screens
export { TicketSelectionScreen } from "./screens";
export type { TicketSelectionScreenProps } from "./screens";
