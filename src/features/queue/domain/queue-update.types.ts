/**
 * Queue Update Types
 *
 * Types for queue position update events from the waiting room.
 * Reuses QueueState and EngagementState from core/domain.
 *
 * @module features/queue/domain/queue-update.types
 */

import type { QueueState, EngagementState } from "@/core/domain";

/**
 * Grant metadata when engagement state is GRANTED.
 * CONTRACT-BASELINE.md §2.5
 */
export interface GrantInfo {
  /** Grant token for booking API authorization */
  grant_token: string;
  /** ISO 8601 timestamp when grant expires */
  booking_expires_at: string;
}

/**
 * Queue position update event.
 *
 * Represents a point-in-time snapshot of queue state.
 * Emitted by FakeQueueDataSource (GH-8) and will be emitted by
 * real SSE adapter (GH-9) with same structure.
 */
export interface QueueUpdate {
  /** Current queue position (1-based when queued, 0 when granted) */
  position: number;
  /** Queue state from CONTRACT-BASELINE.md §2.3 */
  queueState: QueueState;
  /** Engagement state from CONTRACT-BASELINE.md §2.2 */
  engagementState: EngagementState;
  /** ISO 8601 server time for offset calculation */
  serverTime: string;
  /** Rate per minute for ETA calculation (optional during stalls) */
  ratePerMin?: number;
  /** Grant info when engagementState is GRANTED */
  grant?: GrantInfo;
}

/**
 * Type guard for valid QueueUpdate.
 * Validates required fields are present and correctly typed.
 */
export function isValidQueueUpdate(value: unknown): value is QueueUpdate {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const update = value as Record<string, unknown>;

  return (
    typeof update.position === "number" &&
    update.position >= 0 &&
    typeof update.queueState === "string" &&
    typeof update.engagementState === "string" &&
    typeof update.serverTime === "string"
  );
}

/**
 * Type guard for QueueUpdate with grant info.
 */
export function hasGrantInfo(
  update: QueueUpdate
): update is QueueUpdate & { grant: GrantInfo } {
  return (
    update.grant !== undefined &&
    typeof update.grant.grant_token === "string" &&
    typeof update.grant.booking_expires_at === "string"
  );
}
