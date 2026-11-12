/**
 * Queue Feature Domain Layer
 *
 * GH-8: Domain exports for Queue feature.
 * Domain layer imports ONLY TypeScript — no React, React Native, or external libs.
 *
 * Reuses core domain types (QueueState, EngagementState) from @/core/domain.
 */

// Queue update types
export type { QueueUpdate, GrantInfo } from "./queue-update.types";
export { isValidQueueUpdate, hasGrantInfo } from "./queue-update.types";

// Scenario types
export type { QueueScenario, QueueScenarioStep } from "./queue-scenario.types";
export { isValidScenario, isValidScenarioStep } from "./queue-scenario.types";

// ETA calculation utilities (T2)
export { calculateEta, formatEta } from "./queue-eta.utils";

// Progress calculation utilities (T3)
export { calculateProgress } from "./queue-progress.utils";

// Queue error types (GH-9 T1)
export type { QueueError, QueueErrorCode } from "./queue-error.types";
export {
  QUEUE_ERROR_CODES,
  RETRYABLE_ERROR_CODES,
  TERMINAL_ERROR_CODES,
  isValidQueueErrorCode,
  isRetryableError,
  isTerminalError,
  isTransportError,
  createQueueError,
  createNetworkError,
  createTimeoutError,
  createSseConnectionError,
  createUnknownError,
} from "./queue-error.types";
