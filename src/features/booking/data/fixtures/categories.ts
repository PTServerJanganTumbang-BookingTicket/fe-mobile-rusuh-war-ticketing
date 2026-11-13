/**
 * Category Fixtures
 *
 * GH-12 T5: Deterministic ticket category fixtures.
 *
 * @module features/booking/data/fixtures/categories
 */

import type { BookingCategory } from "../../domain";

/**
 * VIP category fixture.
 * Price: Rp 1,500,000
 */
export const CATEGORY_VIP: BookingCategory = {
  id: "cat_vip",
  name: "VIP",
  description: "Premium seating with best view and complimentary drinks",
  price: 1500000,
  available: 100,
  maxPerOrder: 3,
};

/**
 * Festival category fixture.
 * Price: Rp 850,000
 */
export const CATEGORY_FESTIVAL: BookingCategory = {
  id: "cat_festival",
  name: "Festival",
  description: "Standing area close to the stage",
  price: 850000,
  available: 500,
  maxPerOrder: 3,
};

/**
 * Tribune category fixture.
 * Price: Rp 500,000
 */
export const CATEGORY_TRIBUNE: BookingCategory = {
  id: "cat_tribune",
  name: "Tribune",
  description: "Seated tribune area with good visibility",
  price: 500000,
  available: 1000,
  maxPerOrder: 3,
};

/**
 * Sold out category fixture (for testing).
 */
export const CATEGORY_SOLD_OUT: BookingCategory = {
  id: "cat_soldout",
  name: "VVIP",
  description: "Exclusive VVIP area - SOLD OUT",
  price: 2500000,
  available: 0,
  maxPerOrder: 0,
};

/**
 * Default categories for ticket selection.
 */
export const CATEGORIES: BookingCategory[] = [
  CATEGORY_VIP,
  CATEGORY_FESTIVAL,
  CATEGORY_TRIBUNE,
];

/**
 * Categories including sold out (for testing).
 */
export const CATEGORIES_WITH_SOLD_OUT: BookingCategory[] = [
  CATEGORY_SOLD_OUT,
  CATEGORY_VIP,
  CATEGORY_FESTIVAL,
  CATEGORY_TRIBUNE,
];
