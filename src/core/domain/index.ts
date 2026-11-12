/**
 * Core Domain Layer - Barrel Export
 *
 * All public types and functions for the domain layer.
 * R14-AC1: Domain files import only TypeScript built-ins and other core/domain files
 * R15-AC3: All public types are explicitly exported
 *
 * @module core/domain
 */

// =============================================================================
// API Types
// =============================================================================

// Envelope types
export type {
  ApiErrorData,
  ApiErrorEnvelope,
  ApiErrorMeta,
  ApiSuccessEnvelope,
  ApiSuccessMeta,
} from './api/envelope.types';

export {
  extractServerTime,
  isErrorEnvelope,
  isSuccessEnvelope,
} from './api/envelope.types';

// Error types
export type {
  ApiError,
  ApiErrorCode,
  ApiErrorStatus,
  KnownApiErrorCode,
} from './api/error.types';

export {
  createApiError,
  ERROR_STATUS_MAP,
  isAuthError,
  isDeviceRequiredError,
  isFullBookedError,
  isKnownErrorCode,
  isQueueFullError,
  KNOWN_API_ERROR_CODES,
} from './api/error.types';

// Pagination types
export type {
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
} from './api/pagination.types';

export {
  createPaginationParams,
  DEFAULT_PAGINATION,
  hasNextPage,
  hasPreviousPage,
} from './api/pagination.types';

// Rate limit types
export type { RateLimitInfo } from './api/rate-limit.types';

export {
  DEFAULT_RETRY_AFTER_MS,
  getRetryDelayMs,
  isRateLimited,
  parseRateLimitHeaders,
} from './api/rate-limit.types';

// =============================================================================
// Auth Types
// =============================================================================

// Token types
export type {
  AccessToken,
  Brand,
  DeviceId,
  ETicketToken,
  GrantToken,
  QueueToken,
} from './auth/tokens.types';

export {
  createAccessToken,
  createDeviceId,
  createETicketToken,
  createGrantToken,
  createQueueToken,
} from './auth/tokens.types';

// Header types
export type {
  AccountHeaders,
  AuthContext,
  AuthenticatedAuthContext,
  AuthenticatedGrantHeaders,
  GuestAuthContext,
  GuestDeviceHeaders,
  GuestGrantHeaders,
  QueueHeaders,
} from './auth/headers.types';

export {
  createAccountHeaders,
  createGrantHeaders,
  createGuestDeviceHeaders,
  createQueueHeaders,
  isAuthenticatedAuth,
  isGuestAuth,
} from './auth/headers.types';

// =============================================================================
// Queue Types
// =============================================================================

// Queue state types
export type { QueueState } from './queue/queue-state.types';

export {
  isFullBooked,
  isQueueFull,
  isQueueOpen,
  isTerminalQueueState,
  isValidQueueState,
  NON_TERMINAL_QUEUE_STATES,
  QUEUE_STATES,
  TERMINAL_QUEUE_STATES,
} from './queue/queue-state.types';

// Engagement state types
export type { EngagementState } from './queue/engagement.types';

export {
  ACTIVE_ENGAGEMENT_STATES,
  ENGAGEMENT_STATES,
  isActiveEngagementState,
  isConfirmed,
  isExpired,
  isGranted,
  isTerminalEngagementState,
  isValidEngagementState,
  TERMINAL_ENGAGEMENT_STATES,
} from './queue/engagement.types';

// Queue join types
export type {
  QueueJoinRequest,
  QueueJoinResponse,
  ValidatedQueueJoinRequest,
} from './queue/queue-join.types';

export {
  getJoinEngagementState,
  isAbsoluteSseUrl,
  isRejoin,
  validateQueueJoinRequest,
} from './queue/queue-join.types';

// Poll tiers types
export type { PollTier, PollTiers } from './queue/poll-tiers.types';

export {
  DEFAULT_POLL_INTERVAL_MS,
  getPollIntervalMs,
  isValidPollTiers,
  sortPollTiers,
} from './queue/poll-tiers.types';

// =============================================================================
// Time Types
// =============================================================================

export type { ExpiryInfo, ParsedServerTime } from './time/server-time.types';

export {
  getExpiryInfo,
  parseServerTime,
  remainingMs,
  serverOffsetMs,
} from './time/server-time.utils';

// =============================================================================
// Booking Types
// =============================================================================

// NIK types
export type {
  NikInput,
  NikInputAccount,
  NikInputRaw,
  NikInputSaved,
  NikValidationError,
  NikValidationResult,
} from './booking/nik.types';

export {
  isValidNikFormat,
  nikInputToRequest,
  normalizeNik,
  validateNikInput,
} from './booking/nik.types';
