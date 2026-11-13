/**
 * Booking Domain Layer
 *
 * GH-12: Public exports for booking domain types and utilities.
 *
 * @module features/booking/domain
 */

// Domain Types
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

// Selection utilities (T2)
export {
  canAddTicket,
  canRemoveTicket,
  totalSelectedCount,
} from "./selection.utils";

// Slot utilities (T3)
export { buildSlots, parseSlotKey, updateSlotNikInput } from "./slot.utils";

// API Types (T4)
export type {
  BookingRequest,
  BookingResponse,
  BookingResponseTicket,
  BookingRules,
  BookingSummary,
  BookingTicketRequest,
  NikValidationResponse,
  PaymentTtl,
  SavedNik,
  TicketPageEvent,
  TicketPageResponse,
} from "./booking-api.types";
