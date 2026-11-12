/**
 * API Response Test Fixtures
 *
 * Deterministic fixtures matching CONTRACT-BASELINE.md for API responses.
 * R13-AC3: Fixtures exist for success envelope with server_time
 *
 * @module core/domain/__fixtures__/api-responses.fixture
 */

import type {
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
} from "../api/envelope.types";
import type { QueueJoinResponse } from "../queue/queue-join.types";

/**
 * Sample server_time value for fixtures.
 * Fixed timestamp for deterministic testing.
 */
export const FIXTURE_SERVER_TIME = "2026-11-12T00:00:00.000Z";

/**
 * Sample server_time as milliseconds.
 */
export const FIXTURE_SERVER_TIME_MS = Date.parse(FIXTURE_SERVER_TIME);

/**
 * Success envelope with server_time.
 * R13-AC3: Fixture for success envelope with server_time
 */
export const SUCCESS_ENVELOPE_WITH_SERVER_TIME: ApiSuccessEnvelope<{
  message: string;
}> = {
  data: { message: "Success" },
  meta: { server_time: FIXTURE_SERVER_TIME },
};

/**
 * Success envelope without server_time.
 */
export const SUCCESS_ENVELOPE_WITHOUT_SERVER_TIME: ApiSuccessEnvelope<{
  message: string;
}> = {
  data: { message: "Success" },
};

/**
 * Error envelope with QUEUE_FULL.
 * CONTRACT-BASELINE.md §6.3: Includes queue_state in data
 */
export const ERROR_ENVELOPE_QUEUE_FULL: ApiErrorEnvelope = {
  meta: {
    error_code: "QUEUE_FULL",
    message: "Queue capacity has been reached",
  },
  data: {
    queue_state: "FULL_QUEUE",
  },
};

/**
 * Error envelope with DEVICE_ID_REQUIRED.
 */
export const ERROR_ENVELOPE_DEVICE_ID_REQUIRED: ApiErrorEnvelope = {
  meta: {
    error_code: "DEVICE_ID_REQUIRED",
    message: "Device ID is required for guest requests",
  },
};

/**
 * Error envelope with CAPTCHA_REQUIRED.
 */
export const ERROR_ENVELOPE_CAPTCHA_REQUIRED: ApiErrorEnvelope = {
  meta: {
    error_code: "CAPTCHA_REQUIRED",
    message: "CAPTCHA verification is required",
  },
};

/**
 * Queue join response fixture (new join).
 * CONTRACT-BASELINE.md §2.5
 */
export const QUEUE_JOIN_RESPONSE_NEW: QueueJoinResponse = {
  queue_token: "qt_abc123",
  sse_url: "https://events.rusuh.io/queue/stream/abc123",
};

/**
 * Queue join response fixture (rejoin with QUEUED state).
 * CONTRACT-BASELINE.md §2.5: rejoined=true, state present
 */
export const QUEUE_JOIN_RESPONSE_REJOIN_QUEUED: QueueJoinResponse = {
  queue_token: "qt_abc123",
  sse_url: "https://events.rusuh.io/queue/stream/abc123",
  rejoined: true,
  state: "QUEUED",
};

/**
 * Queue join response fixture (rejoin with GRANTED state).
 * User already granted, rejoining recovers state.
 */
export const QUEUE_JOIN_RESPONSE_REJOIN_GRANTED: QueueJoinResponse = {
  queue_token: "qt_abc123",
  sse_url: "https://events.rusuh.io/queue/stream/abc123",
  rejoined: true,
  state: "GRANTED",
};

/**
 * Queue join response fixture (rejoin with SELECTING state).
 */
export const QUEUE_JOIN_RESPONSE_REJOIN_SELECTING: QueueJoinResponse = {
  queue_token: "qt_abc123",
  sse_url: "https://events.rusuh.io/queue/stream/abc123",
  rejoined: true,
  state: "SELECTING",
};

/**
 * All queue join response fixtures.
 */
export const ALL_QUEUE_JOIN_RESPONSES: readonly QueueJoinResponse[] = [
  QUEUE_JOIN_RESPONSE_NEW,
  QUEUE_JOIN_RESPONSE_REJOIN_QUEUED,
  QUEUE_JOIN_RESPONSE_REJOIN_GRANTED,
  QUEUE_JOIN_RESPONSE_REJOIN_SELECTING,
];

/**
 * Paginated response fixture.
 */
export const PAGINATED_RESPONSE_FIXTURE = {
  data: [{ id: "1" }, { id: "2" }],
  pagination: {
    current_page: 1,
    per_page: 20,
    total_pages: 5,
    total_items: 100,
  },
};

/**
 * Create a success envelope with custom data.
 */
export function createSuccessEnvelope<T>(
  data: T,
  serverTime?: string
): ApiSuccessEnvelope<T> {
  if (serverTime) {
    return { data, meta: { server_time: serverTime } };
  }
  return { data };
}

/**
 * Create an error envelope with custom error.
 */
export function createErrorEnvelope(
  errorCode: string,
  message: string,
  data?: Record<string, unknown>
): ApiErrorEnvelope {
  return {
    meta: { error_code: errorCode, message },
    data,
  };
}
