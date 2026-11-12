/**
 * Events Feature Module
 *
 * GH-16: Public API for Events feature.
 * All external imports should come through this barrel.
 *
 * Architecture:
 * - Domain: Event types and EventRepository interface
 * - Data: FakeEventRepository (to be replaced by HttpEventRepository in GH-17)
 * - Presentation: EventsHomeScreen, EventCard, hooks
 */

// ============================================================================
// Domain Exports (types only, pure TypeScript)
// ============================================================================
export type {
  Event,
  QueueState,
  DisplayBlock,
  EventRepository,
} from "./domain";

// ============================================================================
// Data Exports (repository implementations)
// ============================================================================
export { FakeEventRepository, FakeEventDataSource } from "./data";
export type { FakeEventDataSourceConfig } from "./data";

// Fixtures (for testing purposes)
export { FAKE_EVENTS } from "./data";

// ============================================================================
// Presentation Exports (screens, components, hooks)
// ============================================================================
export {
  EventsHomeScreen,
  EventCard,
  EventList,
  LoadingState,
  EmptyState,
  ErrorState,
  useEvents,
} from "./presentation";

export type {
  EventsHomeScreenProps,
  EventCardProps,
  EventListProps,
  ErrorStateProps,
  UseEventsResult,
} from "./presentation";
