/**
 * Slot Builder Utility Tests
 *
 * GH-12 T3: Unit tests for slot builder utility.
 */

import {
  buildSlots,
  parseSlotKey,
  updateSlotNikInput,
} from "@/features/booking/domain/slot.utils";
import type {
  BookingCategory,
  TicketSelection,
  TicketSlot,
} from "@/features/booking/domain";

describe("Slot Utilities", () => {
  // Test fixtures
  const categories: BookingCategory[] = [
    {
      id: "cat_vip",
      name: "VIP",
      description: "VIP area",
      price: 1500000,
      available: 100,
      maxPerOrder: 3,
    },
    {
      id: "cat_festival",
      name: "Festival",
      description: "Festival area",
      price: 850000,
      available: 50,
      maxPerOrder: 3,
    },
    {
      id: "cat_tribune",
      name: "Tribune",
      description: "Tribune seating",
      price: 500000,
      available: 200,
      maxPerOrder: 3,
    },
  ];

  describe("buildSlots", () => {
    it("returns empty array with empty selection", () => {
      const selection: TicketSelection = {};

      const slots = buildSlots(selection, categories);

      expect(slots).toEqual([]);
    });

    it("creates 2 slots with {cat_vip: 2}", () => {
      const selection: TicketSelection = {
        cat_vip: 2,
      };

      const slots = buildSlots(selection, categories);

      expect(slots).toHaveLength(2);
      expect(slots[0].slotKey).toBe("cat_vip_0");
      expect(slots[1].slotKey).toBe("cat_vip_1");
    });

    it("preserves category name and price", () => {
      const selection: TicketSelection = {
        cat_vip: 1,
      };

      const slots = buildSlots(selection, categories);

      expect(slots[0].categoryName).toBe("VIP");
      expect(slots[0].price).toBe(1500000);
    });

    it("initializes nikInput as null", () => {
      const selection: TicketSelection = {
        cat_vip: 1,
        cat_festival: 1,
      };

      const slots = buildSlots(selection, categories);

      expect(slots.every((slot) => slot.nikInput === null)).toBe(true);
    });

    it("preserves category order", () => {
      const selection: TicketSelection = {
        cat_vip: 1,
        cat_festival: 1,
        cat_tribune: 1,
      };

      const slots = buildSlots(selection, categories);

      expect(slots).toHaveLength(3);
      expect(slots[0].categoryId).toBe("cat_vip");
      expect(slots[1].categoryId).toBe("cat_festival");
      expect(slots[2].categoryId).toBe("cat_tribune");
    });

    it("handles multiple tickets per category with multiple categories", () => {
      const selection: TicketSelection = {
        cat_vip: 2,
        cat_festival: 1,
      };

      const slots = buildSlots(selection, categories);

      expect(slots).toHaveLength(3);
      expect(slots[0].slotKey).toBe("cat_vip_0");
      expect(slots[1].slotKey).toBe("cat_vip_1");
      expect(slots[2].slotKey).toBe("cat_festival_0");
    });

    it("ignores categories with zero quantity", () => {
      const selection: TicketSelection = {
        cat_vip: 0,
        cat_festival: 1,
      };

      const slots = buildSlots(selection, categories);

      expect(slots).toHaveLength(1);
      expect(slots[0].categoryId).toBe("cat_festival");
    });

    it("ignores categories not in selection", () => {
      const selection: TicketSelection = {
        cat_vip: 1,
      };

      const slots = buildSlots(selection, categories);

      expect(slots).toHaveLength(1);
      expect(slots[0].categoryId).toBe("cat_vip");
    });
  });

  describe("parseSlotKey", () => {
    it("parses simple slot key", () => {
      const result = parseSlotKey("cat_vip_0");

      expect(result.categoryId).toBe("cat_vip");
      expect(result.index).toBe(0);
    });

    it("parses slot key with higher index", () => {
      const result = parseSlotKey("cat_vip_2");

      expect(result.categoryId).toBe("cat_vip");
      expect(result.index).toBe(2);
    });

    it("handles category IDs with underscores", () => {
      const result = parseSlotKey("cat_super_vip_1");

      expect(result.categoryId).toBe("cat_super_vip");
      expect(result.index).toBe(1);
    });

    it("throws on invalid format without underscore", () => {
      expect(() => parseSlotKey("catvip0")).toThrow("Invalid slot key format");
    });

    it("throws on invalid index", () => {
      expect(() => parseSlotKey("cat_vip_abc")).toThrow(
        "Invalid slot key index"
      );
    });
  });

  describe("updateSlotNikInput", () => {
    it("updates nikInput for matching slot", () => {
      const slots: TicketSlot[] = [
        {
          slotKey: "cat_vip_0",
          categoryId: "cat_vip",
          categoryName: "VIP",
          price: 1500000,
          nikInput: null,
        },
        {
          slotKey: "cat_vip_1",
          categoryId: "cat_vip",
          categoryName: "VIP",
          price: 1500000,
          nikInput: null,
        },
      ];

      const nikInput = { type: "raw" as const, nik: "3201020304050607" };
      const result = updateSlotNikInput(slots, "cat_vip_0", nikInput);

      expect(result[0].nikInput).toEqual(nikInput);
      expect(result[1].nikInput).toBeNull();
    });

    it("returns new array (immutable)", () => {
      const slots: TicketSlot[] = [
        {
          slotKey: "cat_vip_0",
          categoryId: "cat_vip",
          categoryName: "VIP",
          price: 1500000,
          nikInput: null,
        },
      ];

      const nikInput = { type: "raw" as const, nik: "3201020304050607" };
      const result = updateSlotNikInput(slots, "cat_vip_0", nikInput);

      expect(result).not.toBe(slots);
      expect(result[0]).not.toBe(slots[0]);
      expect(slots[0].nikInput).toBeNull(); // Original unchanged
    });

    it("can set nikInput to null", () => {
      const slots: TicketSlot[] = [
        {
          slotKey: "cat_vip_0",
          categoryId: "cat_vip",
          categoryName: "VIP",
          price: 1500000,
          nikInput: { type: "raw", nik: "3201020304050607" },
        },
      ];

      const result = updateSlotNikInput(slots, "cat_vip_0", null);

      expect(result[0].nikInput).toBeNull();
    });

    it("does not modify slots when key not found", () => {
      const slots: TicketSlot[] = [
        {
          slotKey: "cat_vip_0",
          categoryId: "cat_vip",
          categoryName: "VIP",
          price: 1500000,
          nikInput: null,
        },
      ];

      const nikInput = { type: "raw" as const, nik: "3201020304050607" };
      const result = updateSlotNikInput(slots, "cat_vip_99", nikInput);

      expect(result[0].nikInput).toBeNull();
    });

    it("handles saved NIK input", () => {
      const slots: TicketSlot[] = [
        {
          slotKey: "cat_vip_0",
          categoryId: "cat_vip",
          categoryName: "VIP",
          price: 1500000,
          nikInput: null,
        },
      ];

      const nikInput = { type: "saved" as const, savedNikId: "snik_001" };
      const result = updateSlotNikInput(slots, "cat_vip_0", nikInput);

      expect(result[0].nikInput).toEqual(nikInput);
    });

    it("handles account NIK input", () => {
      const slots: TicketSlot[] = [
        {
          slotKey: "cat_vip_0",
          categoryId: "cat_vip",
          categoryName: "VIP",
          price: 1500000,
          nikInput: null,
        },
      ];

      const nikInput = {
        type: "account" as const,
        useAccountNik: true as const,
      };
      const result = updateSlotNikInput(slots, "cat_vip_0", nikInput);

      expect(result[0].nikInput).toEqual(nikInput);
    });
  });
});
