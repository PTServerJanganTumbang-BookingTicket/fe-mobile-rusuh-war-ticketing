/**
 * Booking Domain Types
 *
 * GH-12: Core types for ticket selection and booking flow.
 * Contract Evidence: sjtrbt20261112.openapi.json
 *
 * @module features/booking/domain/booking.types
 */

/**
 * Maximum tickets allowed per order (total across all categories).
 * R2-AC3: Given total selected = 3, add button is disabled.
 */
export const MAX_TICKETS_PER_ORDER = 3;

/**
 * Ticket category from GET /events/{event_id}/tickets.
 * R1-AC2: Category shows name, description, price, and available stock.
 */
export interface BookingCategory {
  /** Unique category identifier */
  id: string;
  /** Display name (e.g., "VIP", "Festival", "Tribune") */
  name: string;
  /** Category description */
  description: string;
  /** Price in IDR */
  price: number;
  /** Available stock for this category */
  available: number;
  /** Maximum per order for this category (min of category limit, available, MAX_TICKETS_PER_ORDER) */
  maxPerOrder: number;
}

/**
 * Booking session from ticket page response.
 * R8-AC1: Session.expires_at provides countdown timer source.
 */
export interface BookingSession {
  /** ISO 8601 timestamp when booking window expires */
  expiresAt: string;
  /** Server time for offset calculation */
  serverTime: string;
}

/**
 * Account info for logged-in users.
 * R5-AC1: Logged-in user with nik_masked can use "Use my NIK" option.
 */
export interface BookingAccount {
  /** User's email address */
  email: string;
  /** Masked NIK (null if no NIK registered) */
  nikMasked: string | null;
}

/**
 * Ticket selection state.
 * R2: Map of category_id to quantity.
 * FE-Web pattern: Record<string, number>
 */
export type TicketSelection = Record<string, number>;

/**
 * Individual ticket slot requiring NIK holder.
 * R3-AC1: Each slot shows TextInput for NIK entry.
 * ADR-4: Slot-based NIK management with keys like `cat_vip_0`.
 */
export interface TicketSlot {
  /** Unique slot key: `${categoryId}_${index}` */
  slotKey: string;
  /** Category ID this slot belongs to */
  categoryId: string;
  /** Category name for display */
  categoryName: string;
  /** Price for this ticket */
  price: number;
  /** NIK input (null until assigned) - reuses NikInput from core/domain */
  nikInput: import("@/core/domain/booking/nik.types").NikInput | null;
}

/**
 * Booking error codes.
 * R7-AC3/4/5: Different error codes for booking failures.
 * R9-AC3: Grant token invalid error.
 */
export type BookingErrorCode =
  | "GRANT_TOKEN_INVALID"
  | "DEVICE_MISMATCH"
  | "BOOKING_EXPIRED"
  | "NIK_ALREADY_USED"
  | "INSUFFICIENT_STOCK"
  | "TICKETS_UNAVAILABLE"
  | "VALIDATION_ERROR"
  | "NIK_NOT_FOUND"
  | "NIK_INACTIVE"
  | "NETWORK_ERROR";

/**
 * Booking error structure.
 * Includes optional field and index for slot-specific errors.
 */
export interface BookingError {
  /** Error code */
  code: BookingErrorCode;
  /** Human-readable error message */
  message: string;
  /** Field path for validation errors (e.g., 'tickets[0].nik') */
  field?: string;
  /** Slot index for NIK-specific errors */
  index?: number;
}

/**
 * Check if error is slot-specific (NIK error).
 */
export function isSlotError(error: BookingError): boolean {
  return error.index !== undefined;
}

/**
 * Check if error is recoverable (can retry).
 */
export function isRecoverableError(error: BookingError): boolean {
  return error.code === "NETWORK_ERROR";
}

/**
 * Check if error requires returning to queue.
 */
export function requiresQueueReturn(error: BookingError): boolean {
  return (
    error.code === "GRANT_TOKEN_INVALID" ||
    error.code === "BOOKING_EXPIRED" ||
    error.code === "DEVICE_MISMATCH"
  );
}
