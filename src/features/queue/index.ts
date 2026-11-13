/**
 * Queue Feature Module
 *
 * GH-8: Public API for Queue feature.
 * All external imports should come through this barrel.
 *
 * Architecture:
 * - Domain: QueueUpdate, QueueScenario types
 * - Data: FakeQueueDataSource (deterministic scenario player)
 * - Presentation: WaitingRoomScreen, useQueue hook, components
 *
 * Boundary Rule: Internal implementation stays in layer folders;
 * only public API types and components are exported.
 */

// ============================================================================
// Domain Exports (types only, pure TypeScript)
// ============================================================================
export type {
  QueueUpdate,
  GrantInfo,
  QueueScenario,
  QueueScenarioStep,
} from "./domain";

export {
  isValidQueueUpdate,
  hasGrantInfo,
  isValidScenario,
  isValidScenarioStep,
  calculateEta,
  formatEta,
  calculateProgress,
} from "./domain";

// ============================================================================
// Data Exports (data sources and fixtures)
// ============================================================================
export { FakeQueueDataSource } from "./data";
export type { FakeQueueDataSourceConfig } from "./data";

// GH-9 wiring: real queue runtime — the app layer constructs these and
// injects them into useRealQueue (presentation cannot import data directly).
export { RealQueueDataSource, QueueHttpClient } from "./data";
export type {
  RealQueueDataSourceConfig,
  QueueHttpClientConfig,
  QueueMeRequest,
} from "./data";

// Scenarios for testing and development
export {
  SCENARIO_QUEUE_MOVING,
  SCENARIO_QUEUE_STUCK,
  SCENARIO_FULL_BOOKED_THEN_OPEN,
  SCENARIO_CLOSED,
  SCENARIO_FULL_QUEUE,
  SCENARIO_GRANTED_FAST,
  SCENARIOS,
  DEFAULT_SCENARIO,
} from "./data";

// ============================================================================
// Presentation Exports (screens, components, hooks)
// ============================================================================

// Hooks
export { useQueue, useRealQueue } from "./presentation";
export type {
  UseQueueResult,
  UseQueueConfig,
  GrantPresentationInfo,
  QueueDataSource,
  QueueDataSourceFactory,
  UseRealQueueConfig,
  RealQueueDataSourcePort,
  QueuePollSnapshot,
  PollMeFn,
} from "./presentation";

// Components
export {
  ProgressBar,
  QueuedView,
  FullBookedView,
  FullQueueView,
  ClosedView,
  GrantedView,
} from "./presentation/components";
export type {
  ProgressBarProps,
  QueuedViewProps,
  GrantedViewProps,
} from "./presentation/components";

// Screens
export { WaitingRoomScreen } from "./presentation/screens";
export type { WaitingRoomScreenProps } from "./presentation/screens";
