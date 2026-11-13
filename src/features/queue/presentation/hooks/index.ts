/**
 * Queue Feature Presentation Hooks
 *
 * GH-8: Hook exports for Queue feature.
 */

export { useQueue } from "./useQueue";
export type {
  UseQueueResult,
  UseQueueConfig,
  GrantPresentationInfo,
  QueueDataSource,
  QueueDataSourceFactory,
} from "./useQueue";

// GH-9 wiring: real-backend queue hook (SSE, with /queue/me polling fallback)
export { useRealQueue } from "./useRealQueue";
export type {
  UseRealQueueConfig,
  RealQueueDataSourcePort,
  QueuePollSnapshot,
  PollMeFn,
} from "./useRealQueue";
