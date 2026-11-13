/**
 * Events Feature Data Layer
 *
 * GH-16/GH-17: Data layer exports for Events feature.
 * Data layer can import from domain layer.
 */

// DTO types (GH-17: Raw API response types)
export type { EventDTO, EventsResponseDTO, ValidQueueState } from "./dto";
export { VALID_QUEUE_STATES, isValidQueueState } from "./dto";

// Mappers (GH-17: DTO to domain mapping)
export type { EventDTOValidationResult } from "./mappers";
export { mapEventDTO, mapEventDTOs } from "./mappers";

// Data sources
export { FakeEventDataSource } from "./FakeEventDataSource";
export type { FakeEventDataSourceConfig } from "./FakeEventDataSource";

// GH-17: Real HTTP data source
export { RealEventDataSource, ApiError } from "./RealEventDataSource";
export type {
  RealEventDataSourceConfig,
  GetEventsParams,
  ApiErrorCode,
} from "./RealEventDataSource";

// Repository implementations
export { FakeEventRepository } from "./FakeEventRepository";

// GH-17: Real HTTP repository (contract v2.27)
export { HttpEventRepository } from "./HttpEventRepository";
export type { HttpEventRepositoryConfig } from "./HttpEventRepository";

// Fixtures (exported for testing)
export { FAKE_EVENTS } from "./fixtures/events";
