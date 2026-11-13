/**
 * Booking Domain Types Tests
 *
 * GH-12 T1: Unit tests for booking domain types.
 */

import {
  MAX_TICKETS_PER_ORDER,
  isSlotError,
  isRecoverableError,
  requiresQueueReturn,
} from "@/features/booking/domain";
import type {
  BookingCategory,
  BookingSession,
  BookingAccount,
  TicketSelection,
  TicketSlot,
  BookingError,
  BookingErrorCode,
} from "@/features/booking/domain";

describe("Booking Domain Types", () => {
  describe("MAX_TICKETS_PER_ORDER", () => {
    it("equals 3", () => {
      expect(MAX_TICKETS_PER_ORDER).toBe(3);
    });
  });

  describe("BookingCategory", () => {
    it("has required fields", () => {
      const category: BookingCategory = {
        id: "cat_vip",
        name: "VIP",
        description: "VIP seating area",
        price: 1500000,
        available: 100,
        maxPerOrder: 3,
      };

      expect(category.id).toBe("cat_vip");
      expect(category.name).toBe("VIP");
      expect(category.description).toBe("VIP seating area");
      expect(category.price).toBe(1500000);
      expect(category.available).toBe(100);
      expect(category.maxPerOrder).toBe(3);
    });

    it("allows zero available stock", () => {
      const soldOutCategory: BookingCategory = {
        id: "cat_sold",
        name: "Sold Out",
        description: "No more tickets",
        price: 500000,
        available: 0,
        maxPerOrder: 0,
      };

      expect(soldOutCategory.available).toBe(0);
      expect(soldOutCategory.maxPerOrder).toBe(0);
    });
  });

  describe("BookingSession", () => {
    it("has required fields", () => {
      const session: BookingSession = {
        expiresAt: "2026-11-12T12:05:00.000Z",
        serverTime: "2026-11-12T12:00:00.000Z",
      };

      expect(session.expiresAt).toBe("2026-11-12T12:05:00.000Z");
      expect(session.serverTime).toBe("2026-11-12T12:00:00.000Z");
    });
  });

  describe("BookingAccount", () => {
    it("has email and nikMasked", () => {
      const account: BookingAccount = {
        email: "user@example.com",
        nikMasked: "3201****1234",
      };

      expect(account.email).toBe("user@example.com");
      expect(account.nikMasked).toBe("3201****1234");
    });

    it("allows null nikMasked for users without registered NIK", () => {
      const account: BookingAccount = {
        email: "new@example.com",
        nikMasked: null,
      };

      expect(account.nikMasked).toBeNull();
    });
  });

  describe("TicketSelection", () => {
    it("is a Record of category ID to quantity", () => {
      const selection: TicketSelection = {
        cat_vip: 2,
        cat_festival: 1,
      };

      expect(selection["cat_vip"]).toBe(2);
      expect(selection["cat_festival"]).toBe(1);
      expect(selection["cat_tribune"]).toBeUndefined();
    });

    it("can be empty", () => {
      const selection: TicketSelection = {};
      expect(Object.keys(selection)).toHaveLength(0);
    });
  });

  describe("TicketSlot", () => {
    it("has required fields with null nikInput initially", () => {
      const slot: TicketSlot = {
        slotKey: "cat_vip_0",
        categoryId: "cat_vip",
        categoryName: "VIP",
        price: 1500000,
        nikInput: null,
      };

      expect(slot.slotKey).toBe("cat_vip_0");
      expect(slot.categoryId).toBe("cat_vip");
      expect(slot.categoryName).toBe("VIP");
      expect(slot.price).toBe(1500000);
      expect(slot.nikInput).toBeNull();
    });

    it("can have raw NikInput", () => {
      const slot: TicketSlot = {
        slotKey: "cat_vip_0",
        categoryId: "cat_vip",
        categoryName: "VIP",
        price: 1500000,
        nikInput: { type: "raw", nik: "3201020304050607" },
      };

      expect(slot.nikInput).toEqual({ type: "raw", nik: "3201020304050607" });
    });

    it("can have saved NikInput", () => {
      const slot: TicketSlot = {
        slotKey: "cat_vip_1",
        categoryId: "cat_vip",
        categoryName: "VIP",
        price: 1500000,
        nikInput: { type: "saved", savedNikId: "snik_001" },
      };

      expect(slot.nikInput).toEqual({ type: "saved", savedNikId: "snik_001" });
    });

    it("can have account NikInput", () => {
      const slot: TicketSlot = {
        slotKey: "cat_festival_0",
        categoryId: "cat_festival",
        categoryName: "Festival",
        price: 850000,
        nikInput: { type: "account", useAccountNik: true },
      };

      expect(slot.nikInput).toEqual({ type: "account", useAccountNik: true });
    });
  });

  describe("BookingError", () => {
    it("has code and message", () => {
      const error: BookingError = {
        code: "NIK_ALREADY_USED",
        message: "This NIK already has a ticket for this event",
      };

      expect(error.code).toBe("NIK_ALREADY_USED");
      expect(error.message).toBe(
        "This NIK already has a ticket for this event"
      );
    });

    it("can have optional field and index", () => {
      const error: BookingError = {
        code: "NIK_NOT_FOUND",
        message: "NIK not found in registry",
        field: "tickets[0].nik",
        index: 0,
      };

      expect(error.field).toBe("tickets[0].nik");
      expect(error.index).toBe(0);
    });
  });

  describe("BookingErrorCode", () => {
    it("includes all expected error codes", () => {
      const codes: BookingErrorCode[] = [
        "GRANT_TOKEN_INVALID",
        "DEVICE_MISMATCH",
        "BOOKING_EXPIRED",
        "NIK_ALREADY_USED",
        "INSUFFICIENT_STOCK",
        "TICKETS_UNAVAILABLE",
        "VALIDATION_ERROR",
        "NIK_NOT_FOUND",
        "NIK_INACTIVE",
        "NETWORK_ERROR",
      ];

      // Type check passes if all codes are valid
      expect(codes).toHaveLength(10);
    });
  });

  describe("isSlotError", () => {
    it("returns true when error has index", () => {
      const error: BookingError = {
        code: "NIK_NOT_FOUND",
        message: "NIK not found",
        index: 0,
      };

      expect(isSlotError(error)).toBe(true);
    });

    it("returns false when error has no index", () => {
      const error: BookingError = {
        code: "BOOKING_EXPIRED",
        message: "Booking window expired",
      };

      expect(isSlotError(error)).toBe(false);
    });
  });

  describe("isRecoverableError", () => {
    it("returns true for NETWORK_ERROR", () => {
      const error: BookingError = {
        code: "NETWORK_ERROR",
        message: "Network error",
      };

      expect(isRecoverableError(error)).toBe(true);
    });

    it("returns false for other errors", () => {
      const codes: BookingErrorCode[] = [
        "GRANT_TOKEN_INVALID",
        "BOOKING_EXPIRED",
        "NIK_ALREADY_USED",
        "INSUFFICIENT_STOCK",
      ];

      for (const code of codes) {
        const error: BookingError = { code, message: "test" };
        expect(isRecoverableError(error)).toBe(false);
      }
    });
  });

  describe("requiresQueueReturn", () => {
    it("returns true for GRANT_TOKEN_INVALID", () => {
      const error: BookingError = {
        code: "GRANT_TOKEN_INVALID",
        message: "Invalid grant token",
      };

      expect(requiresQueueReturn(error)).toBe(true);
    });

    it("returns true for BOOKING_EXPIRED", () => {
      const error: BookingError = {
        code: "BOOKING_EXPIRED",
        message: "Booking expired",
      };

      expect(requiresQueueReturn(error)).toBe(true);
    });

    it("returns true for DEVICE_MISMATCH", () => {
      const error: BookingError = {
        code: "DEVICE_MISMATCH",
        message: "Device mismatch",
      };

      expect(requiresQueueReturn(error)).toBe(true);
    });

    it("returns false for other errors", () => {
      const codes: BookingErrorCode[] = [
        "NIK_ALREADY_USED",
        "INSUFFICIENT_STOCK",
        "NETWORK_ERROR",
      ];

      for (const code of codes) {
        const error: BookingError = { code, message: "test" };
        expect(requiresQueueReturn(error)).toBe(false);
      }
    });
  });
});
