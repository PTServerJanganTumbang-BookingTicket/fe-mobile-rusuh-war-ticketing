/**
 * Queue Join Types
 *
 * Queue join request/response contract DTOs.
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.5, §2.6
 *
 * @module core/domain/queue/queue-join.types
 */

import type { EngagementState } from "./engagement.types";

/**
 * Queue join request body.
 * R9-AC1: captcha_token is REQUIRED, not optional
 * R9-AC5: Omitting captcha_token is a compile-time error
 */
export interface QueueJoinRequest {
  /** CAPTCHA verification token (REQUIRED) */
  captcha_token: string;
}

/**
 * Queue join response from POST /events/{event_id}/queue/join.
 * R9-AC2: Includes queue_token, sse_url, rejoined?, state?
 */
export interface QueueJoinResponse {
  /** Queue position token, send as X-Queue-Token */
  queue_token: string;
  /** Absolute SSE URL (host may differ from API host) */
  sse_url: string;
  /** Present when recovering existing engagement */
  rejoined?: boolean;
  /** Engagement state on rejoin (may not be QUEUED) */
  state?: EngagementState;
}

/**
 * Validated queue join request (domain model).
 */
export interface ValidatedQueueJoinRequest {
  /** Validated CAPTCHA token (non-empty) */
  captchaToken: string;
}

/**
 * Validate queue join request.
 * Returns error if captcha_token is missing or empty.
 */
export function validateQueueJoinRequest(request: {
  captcha_token?: string;
}):
  | { valid: true; request: ValidatedQueueJoinRequest }
  | { valid: false; error: "CAPTCHA_REQUIRED" } {
  if (!request.captcha_token || request.captcha_token.trim() === "") {
    return { valid: false, error: "CAPTCHA_REQUIRED" };
  }

  return {
    valid: true,
    request: {
      captchaToken: request.captcha_token.trim(),
    },
  };
}

/**
 * Check if queue join response indicates a rejoin.
 */
export function isRejoin(response: QueueJoinResponse): boolean {
  return response.rejoined === true;
}

/**
 * Get engagement state from queue join response (if rejoining).
 * Returns undefined if not a rejoin or state not provided.
 */
export function getJoinEngagementState(
  response: QueueJoinResponse
): EngagementState | undefined {
  if (!response.rejoined) {
    return undefined;
  }
  return response.state;
}

/**
 * R9-AC3: sse_url is typed as absolute URL string.
 * Validate that sse_url is an absolute URL.
 */
export function isAbsoluteSseUrl(sseUrl: string): boolean {
  try {
    const url = new URL(sseUrl);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
