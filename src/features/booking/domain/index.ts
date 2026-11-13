/**
 * Booking Domain Layer
 *
 * GH-12: Public exports for booking domain types and utilities.
 *
 * @module features/booking/domain
 */

// Types
export type {
  BookingAccount,
  BookingCategory,
  BookingError,
  BookingErrorCode,
  BookingSession,
  TicketSelection,
  TicketSlot,
} from "./booking.types";

// Constants
export { MAX_TICKETS_PER_ORDER } from "./booking.types";

// Error utilities
export {
  isRecoverableError,
  isSlotError,
  requiresQueueReturn,
} from "./booking.types";
