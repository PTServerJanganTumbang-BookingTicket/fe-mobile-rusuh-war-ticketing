/**
 * Slot Builder Utility
 *
 * GH-12 T3: Build TicketSlot array from selection and categories.
 * ADR-4: Slot-based NIK management with keys like `cat_vip_0`.
 *
 * @module features/booking/domain/slot.utils
 */

import type {
  BookingCategory,
  TicketSelection,
  TicketSlot,
} from "./booking.types";

/**
 * Build TicketSlot array from selection map and categories.
 *
 * R2-AC5: Selection changes → NIK holder slots dynamically added/removed.
 *
 * @param selection - Current selection state
 * @param categories - Available categories
 * @returns Array of TicketSlot with unique slotKeys
 */
export function buildSlots(
  selection: TicketSelection,
  categories: BookingCategory[]
): TicketSlot[] {
  const slots: TicketSlot[] = [];

  for (const category of categories) {
    const count = selection[category.id] ?? 0;

    for (let i = 0; i < count; i++) {
      slots.push({
        slotKey: `${category.id}_${i}`,
        categoryId: category.id,
        categoryName: category.name,
        price: category.price,
        nikInput: null,
      });
    }
  }

  return slots;
}

/**
 * Get slot key parts.
 *
 * @param slotKey - Slot key in format `${categoryId}_${index}`
 * @returns Object with categoryId and index
 */
export function parseSlotKey(slotKey: string): {
  categoryId: string;
  index: number;
} {
  const lastUnderscoreIndex = slotKey.lastIndexOf("_");
  if (lastUnderscoreIndex === -1) {
    throw new Error(`Invalid slot key format: ${slotKey}`);
  }

  const categoryId = slotKey.substring(0, lastUnderscoreIndex);
  const index = parseInt(slotKey.substring(lastUnderscoreIndex + 1), 10);

  if (Number.isNaN(index)) {
    throw new Error(`Invalid slot key index: ${slotKey}`);
  }

  return { categoryId, index };
}

/**
 * Update a slot's nikInput in the slots array (immutable).
 *
 * @param slots - Current slots array
 * @param slotKey - Key of slot to update
 * @param nikInput - New NIK input value
 * @returns New slots array with updated slot
 */
export function updateSlotNikInput(
  slots: TicketSlot[],
  slotKey: string,
  nikInput: TicketSlot["nikInput"]
): TicketSlot[] {
  return slots.map((slot) =>
    slot.slotKey === slotKey ? { ...slot, nikInput } : slot
  );
}
