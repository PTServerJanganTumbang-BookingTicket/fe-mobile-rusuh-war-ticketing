/**
 * Selection Utility Tests
 *
 * GH-12 T2: Unit tests for selection utility functions.
 */

import {
  totalSelectedCount,
  canAddTicket,
  canRemoveTicket,
} from "@/features/booking/domain/selection.utils";
import type {
  BookingCategory,
  TicketSelection,
} from "@/features/booking/domain";

describe("Selection Utilities", () => {
  // Test fixtures
  const vipCategory: BookingCategory = {
    id: "cat_vip",
    name: "VIP",
    description: "VIP area",
    price: 1500000,
    available: 100,
    maxPerOrder: 3,
  };

  const festivalCategory: BookingCategory = {
    id: "cat_festival",
    name: "Festival",
    description: "Festival area",
    price: 850000,
    available: 50,
    maxPerOrder: 3,
  };

  const limitedCategory: BookingCategory = {
    id: "cat_limited",
    name: "Limited",
    description: "Limited stock",
    price: 500000,
    available: 2,
    maxPerOrder: 2,
  };

  const soldOutCategory: BookingCategory = {
    id: "cat_soldout",
    name: "Sold Out",
    description: "No more tickets",
    price: 400000,
    available: 0,
    maxPerOrder: 0,
  };

  describe("totalSelectedCount", () => {
    it("returns sum of all quantities", () => {
      const selection: TicketSelection = {
        cat_vip: 2,
        cat_festival: 1,
      };

      expect(totalSelectedCount(selection)).toBe(3);
    });

    it("returns 0 for empty selection", () => {
      const selection: TicketSelection = {};

      expect(totalSelectedCount(selection)).toBe(0);
    });

    it("handles single category", () => {
      const selection: TicketSelection = {
        cat_vip: 1,
      };

      expect(totalSelectedCount(selection)).toBe(1);
    });

    it("handles zero quantities", () => {
      const selection: TicketSelection = {
        cat_vip: 0,
        cat_festival: 0,
      };

      expect(totalSelectedCount(selection)).toBe(0);
    });
  });

  describe("canAddTicket", () => {
    it("returns true when total < 3 and available > current", () => {
      const selection: TicketSelection = {
        cat_vip: 1,
      };

      expect(canAddTicket(selection, vipCategory)).toBe(true);
    });

    it("returns false when total = 3 (MAX_TICKETS_PER_ORDER)", () => {
      const selection: TicketSelection = {
        cat_vip: 2,
        cat_festival: 1,
      };

      expect(canAddTicket(selection, vipCategory)).toBe(false);
      expect(canAddTicket(selection, festivalCategory)).toBe(false);
    });

    it("returns false when current = available", () => {
      const selection: TicketSelection = {
        cat_limited: 2,
      };

      expect(canAddTicket(selection, limitedCategory)).toBe(false);
    });

    it("returns false when current = maxPerOrder", () => {
      const category: BookingCategory = {
        ...vipCategory,
        maxPerOrder: 2,
      };
      const selection: TicketSelection = {
        cat_vip: 2,
      };

      expect(canAddTicket(selection, category)).toBe(false);
    });

    it("returns false for sold out category", () => {
      const selection: TicketSelection = {};

      expect(canAddTicket(selection, soldOutCategory)).toBe(false);
    });

    it("returns true for empty selection with available stock", () => {
      const selection: TicketSelection = {};

      expect(canAddTicket(selection, vipCategory)).toBe(true);
    });

    it("handles missing category in selection", () => {
      const selection: TicketSelection = {
        cat_vip: 1,
      };

      expect(canAddTicket(selection, festivalCategory)).toBe(true);
    });

    it("respects both total and category limits", () => {
      // Limited to 2 per order, have 1 VIP
      const selection: TicketSelection = {
        cat_vip: 1,
      };
      const lowLimitCategory: BookingCategory = {
        ...festivalCategory,
        maxPerOrder: 1,
        available: 10,
      };

      // Can add festival (current 0 < maxPerOrder 1)
      expect(canAddTicket(selection, lowLimitCategory)).toBe(true);

      // After adding one festival
      const updated: TicketSelection = {
        cat_vip: 1,
        [lowLimitCategory.id]: 1,
      };

      // Cannot add more festival (current 1 = maxPerOrder 1)
      expect(canAddTicket(updated, lowLimitCategory)).toBe(false);
    });
  });

  describe("canRemoveTicket", () => {
    it("returns true when current > 0", () => {
      const selection: TicketSelection = {
        cat_vip: 2,
      };

      expect(canRemoveTicket(selection, "cat_vip")).toBe(true);
    });

    it("returns false when current = 0", () => {
      const selection: TicketSelection = {
        cat_vip: 0,
      };

      expect(canRemoveTicket(selection, "cat_vip")).toBe(false);
    });

    it("returns false for missing category in selection", () => {
      const selection: TicketSelection = {
        cat_vip: 1,
      };

      expect(canRemoveTicket(selection, "cat_festival")).toBe(false);
    });

    it("returns false for empty selection", () => {
      const selection: TicketSelection = {};

      expect(canRemoveTicket(selection, "cat_vip")).toBe(false);
    });

    it("returns true when current = 1", () => {
      const selection: TicketSelection = {
        cat_vip: 1,
      };

      expect(canRemoveTicket(selection, "cat_vip")).toBe(true);
    });
  });
});
