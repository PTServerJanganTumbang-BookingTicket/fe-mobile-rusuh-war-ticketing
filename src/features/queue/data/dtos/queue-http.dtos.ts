/**
 * Queue HTTP DTOs
 *
 * GH-9 T2: Data Transfer Objects for Queue HTTP endpoints.
 * Maps contract request/response shapes.
 *
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.5, §2.6, §2.7
 *
 * @module features/queue/data/dtos/queue-http.dtos
 */

/**
 * Queue Join Request DTO.
 * CONTRACT-BASELINE.md §2.6
 */
export interface QueueJoinRequestDto {
  /** CAPTCHA verification token */
  captcha_token: string;
}

/**
 * Queue Join Response DTO (success).
 * CONTRACT-BASELINE.md §2.5
 */
export interface QueueJoinResponseDto {
  /** Queue position token for subsequent requests */
  queue_token: string;
  /** Absolute SSE URL for real-time updates (host may differ from API) */
  sse_url: string;
  /** Current queue position (1-based) */
  ticket_no: number;
  /** ISO 8601 timestamp of join */
  joined_at: string;
  /** True if this is a rejoin (user already in queue) */
  rejoined?: boolean;
  /** Current engagement state if rejoined */
  state?: string;
}

/**
 * Queue Me Response DTO.
 * CONTRACT-BASELINE.md §2.2 - /queue/me endpoint
 */
export interface QueueMeResponseDto {
  /** Current engagement state */
  state: string;
  /** Grant token when state is GRANTED */
  grant_token?: string;
  /** ISO 8601 timestamp when grant expires */
  booking_expires_at?: string;
  /** Server time for offset calculation */
  server_time: string;
  /** Current queue position if still queued */
  position?: number;
  /** Rate per minute for ETA calculation */
  rate_per_min?: number;
}

/**
 * Queue Error Response DTO.
 * Standard error response format.
 */
export interface QueueErrorResponseDto {
  /** Error code (e.g., CAPTCHA_REQUIRED, DEVICE_ID_REQUIRED) */
  error_code: string;
  /** Human-readable error message */
  message?: string;
  /** Additional error data */
  data?: {
    /** Queue state if error includes it (e.g., FULL_QUEUE) */
    queue_state?: string;
    /** Retry-after hint in seconds */
    retry_after?: number;
  };
}

/**
 * Type guard for QueueJoinResponseDto.
 */
export function isQueueJoinResponse(
  value: unknown
): value is QueueJoinResponseDto {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const dto = value as Record<string, unknown>;

  return (
    typeof dto.queue_token === "string" &&
    typeof dto.sse_url === "string" &&
    typeof dto.ticket_no === "number" &&
    typeof dto.joined_at === "string"
  );
}

/**
 * Type guard for QueueMeResponseDto.
 */
export function isQueueMeResponse(value: unknown): value is QueueMeResponseDto {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const dto = value as Record<string, unknown>;

  return typeof dto.state === "string" && typeof dto.server_time === "string";
}

/**
 * Type guard for QueueErrorResponseDto.
 */
export function isQueueErrorResponse(
  value: unknown
): value is QueueErrorResponseDto {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const dto = value as Record<string, unknown>;

  return typeof dto.error_code === "string";
}

/**
 * Extract queue_token from join response.
 */
export function extractQueueToken(response: QueueJoinResponseDto): string {
  return response.queue_token;
}

/**
 * Extract sse_url from join response.
 */
export function extractSseUrl(response: QueueJoinResponseDto): string {
  return response.sse_url;
}

/**
 * Extract grant metadata from /me response when GRANTED.
 */
export function extractGrantMetadata(
  response: QueueMeResponseDto
): { grantToken: string; expiresAt: string } | null {
  if (
    response.state === "GRANTED" &&
    response.grant_token &&
    response.booking_expires_at
  ) {
    return {
      grantToken: response.grant_token,
      expiresAt: response.booking_expires_at,
    };
  }
  return null;
}
