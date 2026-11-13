/**
 * Booking Data Layer
 *
 * GH-12: Public exports for booking data sources and fixtures.
 *
 * @module features/booking/data
 */

// FakeBookingDataSource (T6)
export { FakeBookingDataSource } from "./FakeBookingDataSource";
export type {
  BookingScenario,
  FakeBookingDataSourceConfig,
} from "./FakeBookingDataSource";

// Fixtures
export * from "./fixtures";
