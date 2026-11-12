/**
 * Queue Data Mappers Barrel
 *
 * @module features/queue/data/mappers
 */

export {
  mapHttpError,
  mapNetworkError,
  mapTimeoutError,
  hasQueueStateTransition,
  getErrorQueueState,
} from "./queue-error.mapper";

export {
  parseSseMessage,
  isHeartbeat,
  isErrorMessage,
  extractErrorDetails,
  type SseEventType,
} from "./sse-message.parser";
