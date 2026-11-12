/**
 * Queue Feature Presentation Layer
 *
 * GH-8: Presentation layer exports for Queue feature.
 */

// Hooks
export { useQueue } from "./hooks";
export type {
  UseQueueResult,
  UseQueueConfig,
  GrantPresentationInfo,
  QueueDataSource,
  QueueDataSourceFactory,
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
