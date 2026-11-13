/**
 * Selection Utility Functions
 *
 * GH-12 T2: Pure functions for ticket selection validation.
 * R2: Category quantity control logic.
 *
 * @module features/booking/domain/selection.utils
 */

import type { BookingCategory, TicketSelection } from "./booking.types";
import { MAX_TICKETS_PER_ORDER } from "./booking.types";

/**
 * Calculate total selected ticket count across all categories.
 *
 * @param selection - Current selection state
 * @returns Total number of tickets selected
 */
export function totalSelectedCount(selection: TicketSelection): number {
  return Object.values(selection).reduce((sum, qty) => sum + qty, 0);
}

/**
 * Check if a ticket can be added to a category.
 *
 * R2-AC1: Adding ticket increments quantity
 * R2-AC3: Total = MAX_TICKETS_PER_ORDER blocks add
 * R2-AC4: Category available = current blocks add
 *
 * @param selection - Current selection state
 * @param category - Category to check
 * @returns true if ticket can be added
 */
export function canAddTicket(
  selection: TicketSelection,
  category: BookingCategory
): boolean {
  const total = totalSelectedCount(selection);
  const current = selection[category.id] ?? 0;

  // R2-AC3: Cannot exceed max total
  if (total >= MAX_TICKETS_PER_ORDER) {
    return false;
  }

  // R2-AC4: Cannot exceed category maxPerOrder
  if (current >= category.maxPerOrder) {
    return false;
  }

  // Cannot exceed available stock
  if (current >= category.available) {
    return false;
  }

  return true;
}

/**
 * Check if a ticket can be removed from a category.
 *
 * R2-AC2: Quantity > 0 allows remove
 *
 * @param selection - Current selection state
 * @param categoryId - Category ID to check
 * @returns true if ticket can be removed
 */
export function canRemoveTicket(
  selection: TicketSelection,
  categoryId: string
): boolean {
  const current = selection[categoryId] ?? 0;
  return current > 0;
}
