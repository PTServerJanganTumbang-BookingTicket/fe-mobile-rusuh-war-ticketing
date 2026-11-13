/**
 * Booking Feature Module
 *
 * GH-12: Public API for Booking feature.
 * All external imports should come through this barrel.
 *
 * Architecture:
 * - Domain: BookingCategory, TicketSlot, BookingError types, utils
 * - Data: FakeBookingDataSource (deterministic data provider)
 * - Presentation: TicketSelectionScreen, useBooking hook, components
 *
 * Boundary Rule: Internal implementation stays in layer folders;
 * only public API types and components are exported.
 */

// ============================================================================
// Domain Exports (types only, pure TypeScript)
// ============================================================================
export type {
  BookingAccount,
  BookingCategory,
  BookingError,
  BookingErrorCode,
  BookingRequest,
  BookingResponse,
  BookingSession,
  NikValidationResponse,
  SavedNik,
  TicketPageEvent,
  TicketPageResponse,
  TicketSelection,
  TicketSlot,
} from "./domain";

export {
  MAX_TICKETS_PER_ORDER,
  buildSlots,
  canAddTicket,
  canRemoveTicket,
  isRecoverableError,
  isSlotError,
  parseSlotKey,
  requiresQueueReturn,
  totalSelectedCount,
  updateSlotNikInput,
} from "./domain";

// ============================================================================
// Data Exports (data sources and fixtures)
// ============================================================================
export { FakeBookingDataSource } from "./data";
export type { BookingScenario, FakeBookingDataSourceConfig } from "./data";

// Fixtures for testing
export {
  CATEGORIES,
  CATEGORIES_WITH_SOLD_OUT,
  CATEGORY_FESTIVAL,
  CATEGORY_SOLD_OUT,
  CATEGORY_TRIBUNE,
  CATEGORY_VIP,
  EVENT_FIXTURE,
  EVENT_FIXTURE_ALT,
  lookupNik,
  NIK_ALREADY_USED,
  NIK_DIRECTORY,
  NIK_INACTIVE,
  NIK_NOT_FOUND,
  NIK_VALID_1,
  NIK_VALID_2,
  NIK_VALID_3,
  SAVED_NIKS,
} from "./data";

// ============================================================================
// Presentation Exports (screens, components, hooks)
// ============================================================================

// Hooks
export { useBooking, useSelectionReducer } from "./presentation";
export type {
  BookingDataSourceInterface,
  NikCheckState,
  NikCheckStatus,
  SelectionAction,
  SelectionState,
  UseBookingConfig,
  UseBookingResult,
} from "./presentation";

// Components
export {
  buildOrderLines,
  CategoryCard,
  CountdownBanner,
  NikInputField,
  OrderSummary,
} from "./presentation";
export type {
  CategoryCardProps,
  CountdownBannerProps,
  NikInputFieldProps,
  OrderLine,
  OrderSummaryProps,
} from "./presentation";

// Screens
export { TicketSelectionScreen } from "./presentation";
export type { TicketSelectionScreenProps } from "./presentation";
