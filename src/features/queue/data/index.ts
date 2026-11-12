/**
 * Queue Feature Data Layer
 *
 * GH-8: Data layer exports for Queue feature.
 * GH-9: Added RealQueueDataSource and factory.
 * Data layer can import from domain layer.
 */

// Data sources
export { FakeQueueDataSource } from "./FakeQueueDataSource";
export type { FakeQueueDataSourceConfig } from "./FakeQueueDataSource";

export { RealQueueDataSource } from "./RealQueueDataSource";
export type { RealQueueDataSourceConfig } from "./RealQueueDataSource";

// Factory
export {
  createQueueDataSource,
  createFakeQueueDataSource,
  createRealQueueDataSource,
  isFakeConfig,
  isRealConfig,
} from "./queue-data-source.factory";
export type {
  QueueDataSourceMode,
  QueueDataSourceCallbacks,
  QueueDataSourceConfig,
  QueueDataSourceLike,
  FakeQueueConfig,
  RealQueueConfig,
} from "./queue-data-source.factory";

// DTOs
export type {
  QueueJoinRequestDto,
  QueueJoinResponseDto,
  QueueMeResponseDto,
  QueueErrorResponseDto,
} from "./dtos";
export {
  isQueueJoinResponse,
  isQueueMeResponse,
  isQueueErrorResponse,
  extractQueueToken,
  extractSseUrl,
  extractGrantMetadata,
} from "./dtos";

// Mappers
export {
  mapHttpError,
  mapNetworkError,
  mapTimeoutError,
  hasQueueStateTransition,
  getErrorQueueState,
  parseSseMessage,
  isHeartbeat,
  isErrorMessage,
  extractErrorDetails,
} from "./mappers";
export type { SseEventType } from "./mappers";

// HTTP Client
export type {
  QueueHttpClientPort,
  QueueHttpResult,
  QueueJoinRequest,
  QueueMeRequest,
  QueueHttpClientConfig,
} from "./http";
export { QueueHttpClient, createQueueHttpClient } from "./http";

// SSE Client
export type {
  SseClientPort,
  SseConnectionConfig,
  SseCallbacks,
  SseEventData,
  SseClientConfig,
} from "./sse";
export { SseClient, createSseClient } from "./sse";

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
