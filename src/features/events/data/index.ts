/**
 * Events Feature Data Layer
 *
 * GH-16/GH-17: Data layer exports for Events feature.
 * Data layer can import from domain layer.
 */

// DTO types (GH-17: Raw API response types)
export type { EventDTO, EventsResponseDTO, ValidQueueState } from "./dto";
export { VALID_QUEUE_STATES, isValidQueueState } from "./dto";

// Data sources
export { FakeEventDataSource } from "./FakeEventDataSource";
export type { FakeEventDataSourceConfig } from "./FakeEventDataSource";

// Repository implementations
export { FakeEventRepository } from "./FakeEventRepository";

// Fixtures (exported for testing)
export { FAKE_EVENTS } from "./fixtures/events";
