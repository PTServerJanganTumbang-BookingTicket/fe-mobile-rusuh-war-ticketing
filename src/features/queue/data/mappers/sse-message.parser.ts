/**
 * SSE Message Parser
 *
 * GH-9 T4: Parses SSE event data strings into QueueUpdate domain types.
 * Handles malformed and unsupported messages gracefully.
 *
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.5
 *
 * @module features/queue/data/mappers/sse-message.parser
 */

import type { QueueState, EngagementState } from "@/core/domain";
import { QUEUE_STATES, ENGAGEMENT_STATES } from "@/core/domain";
import type { QueueUpdate, GrantInfo } from "@/features/queue/domain";

/**
 * Supported SSE event types from backend.
 * CONTRACT-BASELINE.md §2.5
 */
export type SseEventType =
  | "position" // Position update in queue
  | "state" // Queue state change (OPEN → FULL_QUEUE, etc.)
  | "grant" // Grant issued, time to book
  | "heartbeat" // Keep-alive (no data change)
  | "error"; // Server-side error

/**
 * Raw SSE message structure from backend.
 */
interface RawSseMessage {
  /** Event type */
  event?: string;
  /** Current position (1-based) */
  position?: number;
  /** Queue state string */
  queue_state?: string;
  /** Engagement state string */
  engagement_state?: string;
  /** Server timestamp */
  server_time?: string;
  /** Rate per minute for ETA */
  rate_per_min?: number;
  /** Grant token (grant event) */
  grant_token?: string;
  /** Grant expiration (grant event) */
  booking_expires_at?: string;
}

/**
 * Validate that a string is a valid QueueState.
 */
function isValidQueueState(value: string): value is QueueState {
  return QUEUE_STATES.includes(value as QueueState);
}

/**
 * Validate that a string is a valid EngagementState.
 */
function isValidEngagementState(value: string): value is EngagementState {
  return ENGAGEMENT_STATES.includes(value as EngagementState);
}

/**
 * Safely parse JSON without throwing.
 * @returns Parsed object or null if invalid JSON
 */
function safeJsonParse(data: string): RawSseMessage | null {
  try {
    const parsed = JSON.parse(data);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as RawSseMessage;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract event type from raw message or event field.
 * Only returns a type if it's explicitly specified via eventField or message.event.
 * Field inference is only used when no explicit event type is given.
 */
function extractEventType(
  message: RawSseMessage,
  eventField?: string
): SseEventType | null {
  const validTypes: SseEventType[] = [
    "position",
    "state",
    "grant",
    "heartbeat",
    "error",
  ];

  // Use explicit event field if provided (from SSE "event:" line)
  if (eventField) {
    if (validTypes.includes(eventField as SseEventType)) {
      return eventField as SseEventType;
    }
    // Unknown event type from SSE header - reject
    return null;
  }

  // Infer from message content's event field
  if (message.event) {
    if (validTypes.includes(message.event as SseEventType)) {
      return message.event as SseEventType;
    }
    // Unknown event type in message body - reject
    return null;
  }

  // No explicit event type - infer from fields present
  // Grant inference takes priority (most specific)
  if (message.grant_token && message.booking_expires_at) {
    return "grant";
  }
  if (message.position !== undefined) {
    return "position";
  }
  if (message.queue_state) {
    return "state";
  }

  return null;
}

/**
 * Build GrantInfo from raw message.
 */
function buildGrantInfo(message: RawSseMessage): GrantInfo | undefined {
  if (message.grant_token && message.booking_expires_at) {
    return {
      grant_token: message.grant_token,
      booking_expires_at: message.booking_expires_at,
    };
  }
  return undefined;
}

/**
 * Parse SSE position event into QueueUpdate.
 */
function parsePositionEvent(message: RawSseMessage): QueueUpdate | null {
  // Required fields for position event
  if (
    typeof message.position !== "number" ||
    typeof message.server_time !== "string"
  ) {
    return null;
  }

  // Validate states
  const queueState = message.queue_state ?? "OPEN";
  const engagementState = message.engagement_state ?? "QUEUED";

  if (!isValidQueueState(queueState)) {
    return null;
  }
  if (!isValidEngagementState(engagementState)) {
    return null;
  }

  return {
    position: message.position,
    queueState,
    engagementState,
    serverTime: message.server_time,
    ratePerMin: message.rate_per_min,
    grant: buildGrantInfo(message),
  };
}

/**
 * Parse SSE state event into QueueUpdate.
 */
function parseStateEvent(message: RawSseMessage): QueueUpdate | null {
  // Required fields for state event
  if (
    typeof message.queue_state !== "string" ||
    typeof message.server_time !== "string"
  ) {
    return null;
  }

  if (!isValidQueueState(message.queue_state)) {
    return null;
  }

  const engagementState = message.engagement_state ?? "QUEUED";
  if (!isValidEngagementState(engagementState)) {
    return null;
  }

  return {
    position: message.position ?? 0,
    queueState: message.queue_state,
    engagementState,
    serverTime: message.server_time,
    ratePerMin: message.rate_per_min,
    grant: buildGrantInfo(message),
  };
}

/**
 * Parse SSE grant event into QueueUpdate.
 */
function parseGrantEvent(message: RawSseMessage): QueueUpdate | null {
  // Required fields for grant event
  if (
    typeof message.grant_token !== "string" ||
    typeof message.booking_expires_at !== "string" ||
    typeof message.server_time !== "string"
  ) {
    return null;
  }

  const queueState = message.queue_state ?? "OPEN";
  if (!isValidQueueState(queueState)) {
    return null;
  }

  return {
    position: 0, // Granted users have position 0
    queueState,
    engagementState: "GRANTED",
    serverTime: message.server_time,
    ratePerMin: message.rate_per_min,
    grant: {
      grant_token: message.grant_token,
      booking_expires_at: message.booking_expires_at,
    },
  };
}

/**
 * Parse SSE event data string into QueueUpdate.
 *
 * @param data - SSE event data (JSON string)
 * @param eventType - Optional SSE event type from "event:" line
 * @returns QueueUpdate or null if parsing fails
 *
 * Graceful handling:
 * - Malformed JSON → null (no throw)
 * - Unsupported event type → null (ignored)
 * - Missing required fields → null
 * - Invalid QueueState/EngagementState → null
 */
export function parseSseMessage(
  data: string,
  eventType?: string
): QueueUpdate | null {
  // Handle empty or whitespace data
  if (!data || !data.trim()) {
    return null;
  }

  // Parse JSON
  const message = safeJsonParse(data);
  if (!message) {
    return null;
  }

  // Determine event type
  const type = extractEventType(message, eventType);
  if (!type) {
    return null;
  }

  // Parse based on event type
  switch (type) {
    case "position":
      return parsePositionEvent(message);
    case "state":
      return parseStateEvent(message);
    case "grant":
      return parseGrantEvent(message);
    case "heartbeat":
      // Heartbeats don't produce updates
      return null;
    case "error":
      // Errors are handled via onError callback, not as updates
      return null;
    default:
      return null;
  }
}

/**
 * Check if an SSE message represents a heartbeat (keep-alive).
 */
export function isHeartbeat(data: string, eventType?: string): boolean {
  if (eventType === "heartbeat") {
    return true;
  }

  const message = safeJsonParse(data);
  if (!message) {
    return false;
  }

  return message.event === "heartbeat";
}

/**
 * Check if an SSE message represents an error.
 */
export function isErrorMessage(data: string, eventType?: string): boolean {
  if (eventType === "error") {
    return true;
  }

  const message = safeJsonParse(data);
  if (!message) {
    return false;
  }

  return message.event === "error";
}

/**
 * Extract error details from an error SSE message.
 */
export function extractErrorDetails(
  data: string
): { code?: string; message?: string } | null {
  const message = safeJsonParse(data);
  if (!message) {
    return null;
  }

  return {
    code: (message as Record<string, unknown>).error_code as string | undefined,
    message: (message as Record<string, unknown>).message as string | undefined,
  };
}
