/**
 * Queue Feature Presentation Layer
 *
 * GH-8: Presentation layer exports for Queue feature.
 */

// Hooks
export { useQueue, useRealQueue } from "./hooks";
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
} from "./hooks";

// Components
export {
  ProgressBar,
  QueuedView,
  FullBookedView,
  FullQueueView,
  ClosedView,
  GrantedView,
} from "./components";
export type {
  ProgressBarProps,
  QueuedViewProps,
  GrantedViewProps,
} from "./components";

// Screens
export { WaitingRoomScreen } from "./screens";
export type { WaitingRoomScreenProps } from "./screens";
