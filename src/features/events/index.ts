/**
 * Events Feature Module
 *
 * GH-17: Public API for Events feature.
 * All external imports should come through this barrel.
 *
 * Architecture:
 * - Domain: Event types and EventRepository interface
 * - Data: FakeEventRepository, RealEventDataSource (GH-17)
 * - Presentation: EventsHomeScreen, EventCard, hooks
 *
 * Boundary Rule: EventDTO stays in data layer; only domain Event is exported.
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

// GH-17: Real HTTP data source + repository
export { RealEventDataSource, ApiError, HttpEventRepository } from "./data";
export type {
  RealEventDataSourceConfig,
  GetEventsParams,
  ApiErrorCode,
  HttpEventRepositoryConfig,
} from "./data";

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
