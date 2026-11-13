/**
 * Booking API Types Tests
 *
 * GH-12 T4: Type structure validation for API request/response types.
 */

import type {
  TicketPageResponse,
  BookingRequest,
  BookingTicketRequest,
  BookingResponse,
  NikValidationResponse,
  SavedNik,
} from "@/features/booking/domain/booking-api.types";

describe("Booking API Types", () => {
  describe("TicketPageResponse", () => {
    it("has all required fields", () => {
      const response: TicketPageResponse = {
        event: {
          id: "evt_001",
          name: "Concert Night",
          date: "2026-12-01",
          venue: "Istora Senayan",
          imageUrl: "https://example.com/image.jpg",
        },
        session: {
          expiresAt: "2026-11-12T12:05:00.000Z",
          serverTime: "2026-11-12T12:00:00.000Z",
        },
        categories: [
          {
            id: "cat_vip",
            name: "VIP",
            description: "VIP area",
            price: 1500000,
            available: 100,
            maxPerOrder: 3,
          },
        ],
        rules: {
          maxTicketsPerOrder: 3,
          oneNikPerTicket: true,
        },
        account: null,
      };

      expect(response.event.id).toBe("evt_001");
      expect(response.session.expiresAt).toBeDefined();
      expect(response.categories).toHaveLength(1);
      expect(response.rules.maxTicketsPerOrder).toBe(3);
      expect(response.account).toBeNull();
    });

    it("includes account for logged-in users", () => {
      const response: TicketPageResponse = {
        event: {
          id: "evt_001",
          name: "Concert",
          date: "2026-12-01",
          venue: "Venue",
          imageUrl: "https://example.com/image.jpg",
        },
        session: {
          expiresAt: "2026-11-12T12:05:00.000Z",
          serverTime: "2026-11-12T12:00:00.000Z",
        },
        categories: [],
        rules: {
          maxTicketsPerOrder: 3,
          oneNikPerTicket: true,
        },
        account: {
          email: "user@example.com",
          nikMasked: "3201****1234",
        },
      };

      expect(response.account).not.toBeNull();
      expect(response.account?.email).toBe("user@example.com");
      expect(response.account?.nikMasked).toBe("3201****1234");
    });
  });

  describe("BookingRequest", () => {
    it("has required structure with raw NIK", () => {
      const ticket: BookingTicketRequest = {
        categoryId: "cat_vip",
        nik: "3201020304050607",
      };

      const request: BookingRequest = {
        eventId: "evt_001",
        tickets: [ticket],
        contactEmail: "user@example.com",
      };

      expect(request.eventId).toBe("evt_001");
      expect(request.tickets[0].nik).toBe("3201020304050607");
      expect(request.tickets[0].savedNikId).toBeUndefined();
      expect(request.tickets[0].useAccountNik).toBeUndefined();
    });

    it("supports saved NIK ID", () => {
      const ticket: BookingTicketRequest = {
        categoryId: "cat_vip",
        savedNikId: "snik_001",
      };

      expect(ticket.savedNikId).toBe("snik_001");
      expect(ticket.nik).toBeUndefined();
    });

    it("supports use account NIK", () => {
      const ticket: BookingTicketRequest = {
        categoryId: "cat_festival",
        useAccountNik: true,
      };

      expect(ticket.useAccountNik).toBe(true);
      expect(ticket.nik).toBeUndefined();
      expect(ticket.savedNikId).toBeUndefined();
    });

    it("supports multiple tickets with different NIK types", () => {
      const request: BookingRequest = {
        eventId: "evt_001",
        tickets: [
          { categoryId: "cat_vip", nik: "3201020304050607" },
          { categoryId: "cat_vip", savedNikId: "snik_001" },
          { categoryId: "cat_festival", useAccountNik: true },
        ],
        contactEmail: "user@example.com",
      };

      expect(request.tickets).toHaveLength(3);
      expect(request.tickets[0].nik).toBeDefined();
      expect(request.tickets[1].savedNikId).toBeDefined();
      expect(request.tickets[2].useAccountNik).toBe(true);
    });
  });

  describe("BookingResponse", () => {
    it("has complete booking response structure", () => {
      const response: BookingResponse = {
        bookingId: "bkg_abc123",
        status: "PENDING_PAYMENT",
        event: {
          id: "evt_001",
          name: "Concert Night",
          date: "2026-12-01",
          venue: "Istora Senayan",
        },
        tickets: [
          {
            category: "VIP",
            price: 1500000,
            nikMasked: "3201****0607",
            holderName: "John Doe",
          },
        ],
        summary: {
          subtotal: 1500000,
          serviceFee: 50000,
          total: 1550000,
        },
        paymentTtl: {
          expiresAt: "2026-11-12T12:10:00.000Z",
          ttlSeconds: 600,
          serverTime: "2026-11-12T12:00:00.000Z",
        },
      };

      expect(response.bookingId).toBe("bkg_abc123");
      expect(response.status).toBe("PENDING_PAYMENT");
      expect(response.tickets).toHaveLength(1);
      expect(response.summary.total).toBe(1550000);
      expect(response.paymentTtl.ttlSeconds).toBe(600);
    });
  });

  describe("NikValidationResponse", () => {
    it("represents valid NIK", () => {
      const response: NikValidationResponse = {
        nik: "3201020304050607",
        valid: true,
      };

      expect(response.valid).toBe(true);
      expect(response.reason).toBeUndefined();
    });

    it("represents invalid NIK with reason", () => {
      const response: NikValidationResponse = {
        nik: "0000000000000000",
        valid: false,
        reason: "NIK_NOT_FOUND",
      };

      expect(response.valid).toBe(false);
      expect(response.reason).toBe("NIK_NOT_FOUND");
    });

    it("indicates already used NIK", () => {
      const response: NikValidationResponse = {
        nik: "3201020304050607",
        valid: false,
        reason: "NIK_ALREADY_USED",
        alreadyUsed: true,
      };

      expect(response.alreadyUsed).toBe(true);
    });
  });

  describe("SavedNik", () => {
    it("has required fields", () => {
      const savedNik: SavedNik = {
        id: "snik_001",
        nikMasked: "3201****1234",
      };

      expect(savedNik.id).toBe("snik_001");
      expect(savedNik.nikMasked).toBe("3201****1234");
    });

    it("supports optional label", () => {
      const savedNik: SavedNik = {
        id: "snik_002",
        nikMasked: "3201****5678",
        label: "Adik",
      };

      expect(savedNik.label).toBe("Adik");
    });
  });
});
