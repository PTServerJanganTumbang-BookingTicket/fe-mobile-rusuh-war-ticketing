/**
 * Booking Fixtures
 *
 * GH-12 T5: Deterministic fixtures for FakeBookingDataSource.
 *
 * @module features/booking/data/fixtures
 */

// Category fixtures
export {
  CATEGORIES,
  CATEGORIES_WITH_SOLD_OUT,
  CATEGORY_FESTIVAL,
  CATEGORY_SOLD_OUT,
  CATEGORY_TRIBUNE,
  CATEGORY_VIP,
} from "./categories";

// Event fixtures
export { EVENT_FIXTURE, EVENT_FIXTURE_ALT } from "./events";

// NIK fixtures
export {
  ACCOUNT_EMAIL,
  ACCOUNT_NIK_MASKED,
  lookupNik,
  NIK_ALREADY_USED,
  NIK_ALREADY_USED_NAME,
  NIK_DIRECTORY,
  NIK_INACTIVE,
  NIK_NOT_FOUND,
  NIK_VALID_1,
  NIK_VALID_1_MASKED,
  NIK_VALID_1_NAME,
  NIK_VALID_2,
  NIK_VALID_2_MASKED,
  NIK_VALID_2_NAME,
  NIK_VALID_3,
  NIK_VALID_3_MASKED,
  NIK_VALID_3_NAME,
  SAVED_NIK_1,
  SAVED_NIK_2,
  SAVED_NIKS,
} from "./niks";
export type { NikDirectoryEntry } from "./niks";
