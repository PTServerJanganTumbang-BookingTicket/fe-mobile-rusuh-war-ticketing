/**
 * Queue Feature Data Layer
 *
 * GH-8: Data layer exports for Queue feature.
 * Data layer can import from domain layer.
 */

// Data sources
export { FakeQueueDataSource } from "./FakeQueueDataSource";
export type { FakeQueueDataSourceConfig } from "./FakeQueueDataSource";

// Fixtures (exported for testing)
export {
  SCENARIO_QUEUE_MOVING,
  SCENARIO_QUEUE_STUCK,
  SCENARIO_FULL_BOOKED_THEN_OPEN,
  SCENARIO_CLOSED,
  SCENARIO_FULL_QUEUE,
  SCENARIO_GRANTED_FAST,
  SCENARIOS,
  DEFAULT_SCENARIO,
} from "./fixtures";
