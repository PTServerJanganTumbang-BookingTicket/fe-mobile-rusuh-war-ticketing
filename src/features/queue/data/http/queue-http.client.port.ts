/**
 * Queue HTTP Client Port
 *
 * GH-9 T5: Port interface for Queue HTTP operations.
 * Enables testing with transport doubles.
 *
 * @module features/queue/data/http/queue-http.client.port
 */

import type { AuthContext } from "@/core/domain";
import type { QueueError } from "@/features/queue/domain";
import type {
  QueueJoinResponseDto,
  QueueMeResponseDto,
} from "@/features/queue/data/dtos";

/**
 * Result type for Queue HTTP operations.
 * Either success with data or failure with QueueError.
 */
export type QueueHttpResult<T> =
  { ok: true; data: T } | { ok: false; error: QueueError };

/**
 * Queue join request parameters.
 */
export interface QueueJoinRequest {
  /** Event ID to join queue for */
  eventId: string;
  /** CAPTCHA verification token */
  captchaToken: string;
  /** Auth context for header composition */
  authContext: AuthContext;
}

/**
 * Queue me (status) request parameters.
 */
export interface QueueMeRequest {
  /** Event ID */
  eventId: string;
  /** Queue token from join response */
  queueToken: string;
}

/**
 * Port interface for Queue HTTP client.
 * Abstracts HTTP transport for testability.
 */
export interface QueueHttpClientPort {
  /**
   * Join the queue for an event.
   *
   * CONTRACT-BASELINE.md §2.6:
   * - POST /events/{eventId}/queue/join
   * - Body: { captcha_token: string }
   * - Headers: X-Device-Id (guest) OR Authorization (authenticated)
   *
   * @returns Result with queue_token, sse_url, ticket_no, joined_at
   */
  join(
    request: QueueJoinRequest
  ): Promise<QueueHttpResult<QueueJoinResponseDto>>;

  /**
   * Get current queue status.
   *
   * CONTRACT-BASELINE.md §2.2:
   * - GET /events/{eventId}/queue/me
   * - Headers: X-Queue-Token
   *
   * @returns Result with state, grant_token (if GRANTED), position, etc.
   */
  getMe(request: QueueMeRequest): Promise<QueueHttpResult<QueueMeResponseDto>>;
}
