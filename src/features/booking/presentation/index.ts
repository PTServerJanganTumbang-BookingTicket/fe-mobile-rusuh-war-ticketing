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
