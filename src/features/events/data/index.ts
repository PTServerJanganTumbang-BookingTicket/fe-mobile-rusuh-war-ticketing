/**
 * Events Feature Data Layer
 *
 * GH-16: Data layer exports for Events feature.
 * Data layer can import from domain layer.
 */

// Data sources
export { FakeEventDataSource } from "./FakeEventDataSource";
export type { FakeEventDataSourceConfig } from "./FakeEventDataSource";

// Repository implementations
export { FakeEventRepository } from "./FakeEventRepository";

// Fixtures (exported for testing)
export { FAKE_EVENTS } from "./fixtures/events";
