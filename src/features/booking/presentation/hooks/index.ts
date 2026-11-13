/**
 * Booking Presentation Hooks
 *
 * GH-12: Public exports for booking hooks.
 *
 * @module features/booking/presentation/hooks
 */

export { useBooking } from "./useBooking";
export type {
  BookingDataSourceInterface,
  NikCheckState,
  NikCheckStatus,
  UseBookingConfig,
  UseBookingResult,
} from "./useBooking";

export { useSelectionReducer } from "./useSelectionReducer";
export type {
  SelectionAction,
  SelectionState,
  UseSelectionReducerResult,
} from "./useSelectionReducer";
