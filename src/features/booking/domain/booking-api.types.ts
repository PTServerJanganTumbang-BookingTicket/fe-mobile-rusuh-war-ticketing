/**
 * Booking API Request/Response Types
 *
 * GH-12 T4: Types matching sjtrbt20261112.openapi.json contract.
 * R7: Booking creation request/response.
 * R9: Grant authentication.
 *
 * @module features/booking/domain/booking-api.types
 */

import type {
  BookingAccount,
  BookingCategory,
  BookingSession,
} from "./booking.types";

/**
 * Event info from ticket page response.
 */
export interface TicketPageEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  imageUrl: string;
}

/**
 * Booking rules from ticket page response.
 */
export interface BookingRules {
  /** Maximum tickets per order (always 3) */
  maxTicketsPerOrder: number;
  /** One NIK per ticket constraint */
  oneNikPerTicket: boolean;
}

/**
 * GET /events/{event_id}/tickets response.
 * R1-AC1: Categories fetched from this endpoint.
 */
export interface TicketPageResponse {
  /** Event details */
  event: TicketPageEvent;
  /** Booking session with TTL */
  session: BookingSession;
  /** Available ticket categories */
  categories: BookingCategory[];
  /** Booking rules */
  rules: BookingRules;
  /** Account info (logged-in only, null for guest) */
  account: BookingAccount | null;
}

/**
 * Saved NIK from user's account.
 * R4-AC1: GET /accounts/me/saved-niks returns these.
 */
export interface SavedNik {
  /** Unique saved NIK ID */
  id: string;
  /** Masked NIK for display (e.g., "3201****1234") */
  nikMasked: string;
  /** Optional alias label (e.g., "Adik", "Kakak") */
  label?: string;
}

/**
 * NIK validation response.
 * R3-AC3/4/5: POST /nik/validate response.
 */
export interface NikValidationResponse {
  /** The NIK that was validated */
  nik: string;
  /** Whether the NIK is valid */
  valid: boolean;
  /** Reason for invalid NIK */
  reason?: "NIK_NOT_FOUND" | "NIK_INACTIVE" | "NIK_ALREADY_USED";
  /** Whether this NIK already has a ticket for this event */
  alreadyUsed?: boolean;
}

/**
 * Individual ticket in booking request.
 * R7-AC1: Each ticket has exactly one of: nik, saved_nik_id, use_account_nik.
 */
export interface BookingTicketRequest {
  /** Category ID for this ticket */
  categoryId: string;
  /** Raw NIK (exactly one of three) */
  nik?: string;
  /** Saved NIK ID (exactly one of three) */
  savedNikId?: string;
  /** Use account's registered NIK (exactly one of three) */
  useAccountNik?: true;
}

/**
 * POST /bookings request body.
 * R7-AC1: Submit booking with event_id, tickets[], contact_email.
 */
export interface BookingRequest {
  /** Event ID */
  eventId: string;
  /** Tickets with NIK assignments */
  tickets: BookingTicketRequest[];
  /** Contact email for booking confirmation */
  contactEmail: string;
}

/**
 * Ticket in booking response with masked info.
 */
export interface BookingResponseTicket {
  /** Category name */
  category: string;
  /** Ticket price */
  price: number;
  /** Masked NIK for display */
  nikMasked: string;
  /** Holder name from NIK registry */
  holderName: string;
}

/**
 * Booking summary with pricing.
 */
export interface BookingSummary {
  /** Subtotal (sum of ticket prices) */
  subtotal: number;
  /** Service fee (added by backend) */
  serviceFee: number;
  /** Total amount to pay */
  total: number;
}

/**
 * Payment TTL info.
 */
export interface PaymentTtl {
  /** ISO 8601 timestamp when payment window expires */
  expiresAt: string;
  /** TTL in seconds */
  ttlSeconds: number;
  /** Server time for offset calculation */
  serverTime: string;
}

/**
 * POST /bookings response.
 * R7-AC2: Returns booking_id and summary.
 */
export interface BookingResponse {
  /** Unique booking ID */
  bookingId: string;
  /** Initial status (always PENDING_PAYMENT) */
  status: "PENDING_PAYMENT";
  /** Event info */
  event: {
    id: string;
    name: string;
    date: string;
    venue: string;
  };
  /** Tickets with holder info */
  tickets: BookingResponseTicket[];
  /** Pricing summary */
  summary: BookingSummary;
  /** Payment window TTL */
  paymentTtl: PaymentTtl;
}
