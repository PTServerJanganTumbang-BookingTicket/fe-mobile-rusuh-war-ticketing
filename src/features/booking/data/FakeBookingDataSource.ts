/**
 * FakeBookingDataSource
 *
 * GH-12 T6: Deterministic data source for ticket selection flow.
 * Follows GH-8 FakeQueueDataSource pattern (ADR-1).
 *
 * @module features/booking/data/FakeBookingDataSource
 */

import type {
  BookingRequest,
  BookingResponse,
  NikValidationResponse,
  SavedNik,
  TicketPageResponse,
  BookingError,
  BookingCategory,
  BookingSession,
  BookingAccount,
} from "../domain";

import {
  CATEGORIES,
  CATEGORIES_WITH_SOLD_OUT,
  EVENT_FIXTURE,
  lookupNik,
  NIK_DIRECTORY,
  SAVED_NIKS,
  ACCOUNT_EMAIL,
  ACCOUNT_NIK_MASKED,
  NIK_VALID_1_NAME,
  NIK_VALID_2_NAME,
  NIK_VALID_3_NAME,
} from "./fixtures";

/**
 * Scenarios for FakeBookingDataSource.
 */
export type BookingScenario =
  | "normal"
  | "soldout"
  | "expired"
  | "nik_already_used"
  | "insufficient_stock"
  | "grant_invalid"
  | "guest";

/**
 * Configuration for FakeBookingDataSource.
 */
export interface FakeBookingDataSourceConfig {
  /** Scenario to simulate. Defaults to 'normal'. */
  scenario?: BookingScenario;
  /** Session TTL in milliseconds from now. Defaults to 5 minutes. */
  sessionTtlMs?: number;
  /** Whether user is logged in. Defaults to true. */
  isLoggedIn?: boolean;
  /** Grant token for authentication (optional, for tracking). */
  grantToken?: string;
}

/**
 * FakeBookingDataSource
 *
 * Provides deterministic responses for ticket selection flow testing.
 * ADR-1: Follows FakeQueueDataSource pattern - simple async methods, no Observer.
 */
export class FakeBookingDataSource {
  private scenario: BookingScenario;
  private sessionTtlMs: number;
  private isLoggedIn: boolean;
  private grantToken: string | undefined;
  private bookingCounter = 0;

  constructor(config: FakeBookingDataSourceConfig = {}) {
    this.scenario = config.scenario ?? "normal";
    this.sessionTtlMs = config.sessionTtlMs ?? 5 * 60 * 1000; // 5 minutes
    this.isLoggedIn = config.isLoggedIn ?? true;
    this.grantToken = config.grantToken;
  }

  /**
   * Set scenario for subsequent calls.
   */
  setScenario(scenario: BookingScenario): void {
    this.scenario = scenario;
  }

  /**
   * Get current scenario.
   */
  getScenario(): BookingScenario {
    return this.scenario;
  }

  /**
   * Set logged-in state.
   */
  setLoggedIn(isLoggedIn: boolean): void {
    this.isLoggedIn = isLoggedIn;
  }

  /**
   * GET /events/{event_id}/tickets
   *
   * R1-AC1: Returns categories fetched from endpoint.
   */
  async getTicketPage(_eventId: string): Promise<TicketPageResponse> {
    // Simulate async
    await this.simulateDelay(50);

    // Check for grant_invalid scenario
    if (this.scenario === "grant_invalid") {
      throw this.createError("GRANT_TOKEN_INVALID", "Grant token is invalid");
    }

    // Check for expired scenario
    if (this.scenario === "expired") {
      throw this.createError("BOOKING_EXPIRED", "Booking window has expired");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTtlMs);

    const session: BookingSession = {
      expiresAt: expiresAt.toISOString(),
      serverTime: now.toISOString(),
    };

    const account: BookingAccount | null = this.isLoggedIn
      ? { email: ACCOUNT_EMAIL, nikMasked: ACCOUNT_NIK_MASKED }
      : null;

    const categories: BookingCategory[] =
      this.scenario === "soldout" ? CATEGORIES_WITH_SOLD_OUT : CATEGORIES;

    return {
      event: EVENT_FIXTURE,
      session,
      categories,
      rules: {
        maxTicketsPerOrder: 3,
        oneNikPerTicket: true,
      },
      account,
    };
  }

  /**
   * POST /nik/validate
   *
   * R3-AC3: Validates NIK and returns result.
   */
  async validateNik(nik: string): Promise<NikValidationResponse> {
    await this.simulateDelay(100);

    return lookupNik(nik);
  }

  /**
   * GET /accounts/me/saved-niks
   *
   * R4-AC1: Returns saved NIKs for logged-in user.
   */
  async getSavedNiks(): Promise<SavedNik[]> {
    await this.simulateDelay(30);

    if (!this.isLoggedIn) {
      return [];
    }

    return SAVED_NIKS;
  }

  /**
   * POST /bookings
   *
   * R7-AC1/2: Creates booking and returns response.
   * R7-AC3/4/5: Returns errors for various failure scenarios.
   */
  async createBooking(request: BookingRequest): Promise<BookingResponse> {
    await this.simulateDelay(200);

    // Check scenarios
    if (this.scenario === "grant_invalid") {
      throw this.createError("GRANT_TOKEN_INVALID", "Grant token is invalid");
    }

    if (this.scenario === "expired") {
      throw this.createError("BOOKING_EXPIRED", "Booking window has expired");
    }

    if (this.scenario === "insufficient_stock") {
      throw this.createError(
        "INSUFFICIENT_STOCK",
        "Not enough tickets available"
      );
    }

    if (this.scenario === "nik_already_used") {
      throw this.createError(
        "NIK_ALREADY_USED",
        "This NIK already has a ticket for this event",
        "tickets[0].nik",
        0
      );
    }

    // Validate tickets
    for (let i = 0; i < request.tickets.length; i++) {
      const ticket = request.tickets[i];

      // Check for NIK validation errors in request
      if (ticket.nik) {
        const entry = NIK_DIRECTORY[ticket.nik];
        if (entry && !entry.valid) {
          throw this.createError(
            entry.reason === "NIK_ALREADY_USED"
              ? "NIK_ALREADY_USED"
              : entry.reason === "NIK_INACTIVE"
                ? "NIK_NOT_FOUND"
                : "NIK_NOT_FOUND",
            `NIK validation failed: ${entry.reason}`,
            `tickets[${i}].nik`,
            i
          );
        }
      }
    }

    // Generate booking response
    this.bookingCounter++;
    const bookingId = `bkg_fake_${this.bookingCounter.toString().padStart(6, "0")}`;

    const now = new Date();
    const paymentExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 min payment window

    // Build ticket response based on request
    const responseTickets = request.tickets.map((ticket, index) => {
      // Determine holder info
      let holderName = `Holder ${index + 1}`;
      let nikMasked = "****";

      if (ticket.nik) {
        const entry = NIK_DIRECTORY[ticket.nik];
        if (entry) {
          holderName = entry.holderName ?? holderName;
          nikMasked = entry.masked;
        }
      } else if (ticket.savedNikId) {
        // Map saved NIK ID to actual NIK entry
        if (ticket.savedNikId === "snik_001") {
          holderName = NIK_VALID_2_NAME;
          nikMasked = NIK_DIRECTORY["3201020304050002"].masked;
        } else if (ticket.savedNikId === "snik_002") {
          holderName = NIK_VALID_3_NAME;
          nikMasked = NIK_DIRECTORY["3201020304050003"].masked;
        }
      } else if (ticket.useAccountNik) {
        holderName = NIK_VALID_1_NAME;
        nikMasked = ACCOUNT_NIK_MASKED;
      }

      // Get category price
      const category = CATEGORIES.find((c) => c.id === ticket.categoryId);
      const price = category?.price ?? 0;
      const categoryName = category?.name ?? "Unknown";

      return {
        category: categoryName,
        price,
        nikMasked,
        holderName,
      };
    });

    const subtotal = responseTickets.reduce((sum, t) => sum + t.price, 0);
    const serviceFee = Math.round(subtotal * 0.03); // 3% service fee
    const total = subtotal + serviceFee;

    return {
      bookingId,
      status: "PENDING_PAYMENT",
      event: {
        id: EVENT_FIXTURE.id,
        name: EVENT_FIXTURE.name,
        date: EVENT_FIXTURE.date,
        venue: EVENT_FIXTURE.venue,
      },
      tickets: responseTickets,
      summary: {
        subtotal,
        serviceFee,
        total,
      },
      paymentTtl: {
        expiresAt: paymentExpiresAt.toISOString(),
        ttlSeconds: 600,
        serverTime: now.toISOString(),
      },
    };
  }

  /**
   * Create a BookingError.
   */
  private createError(
    code: BookingError["code"],
    message: string,
    field?: string,
    index?: number
  ): BookingError {
    const error: BookingError = { code, message };
    if (field !== undefined) {
      error.field = field;
    }
    if (index !== undefined) {
      error.index = index;
    }
    return error;
  }

  /**
   * Simulate network delay.
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
