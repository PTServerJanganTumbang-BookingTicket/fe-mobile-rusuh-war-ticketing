/**
 * Queue State Types
 *
 * Discriminated union for queue poll/SSE states.
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.3
 *
 * @module core/domain/queue/queue-state.types
 */

/**
 * Queue/Poll States from /queue/serving response.
 *
 * IMPORTANT (CONTRACT-BASELINE.md §2.3):
 * - FULL_QUEUE (503) = Queue capacity reached; temporary/retryable
 * - FULL_BOOKED (409) = Inventory exhaustion; may recover if holds expire
 * - SOLD_OUT is NOT a queue state (ticket-category status only)
 *
 * R3-AC1: Exactly these 5 states
 * R3-AC2: FULL_QUEUE distinct from FULL_BOOKED
 * R3-AC3: SOLD_OUT is NOT a valid queue state
 */
export type QueueState =
  | "SCHEDULED" // Queue not yet open
  | "OPEN" // Queue accepting participants
  | "FULL_QUEUE" // Queue capacity reached (temporary, 503)
  | "FULL_BOOKED" // Inventory/ticket exhaustion (409)
  | "CLOSED"; // Terminal sale closure

/**
 * All valid queue state values as a readonly array.
 * Useful for validation and iteration.
 */
export const QUEUE_STATES = [
  "SCHEDULED",
  "OPEN",
  "FULL_QUEUE",
  "FULL_BOOKED",
  "CLOSED",
] as const satisfies readonly QueueState[];

/**
 * R3-AC4: CLOSED is terminal; others are non-terminal.
 */
export const TERMINAL_QUEUE_STATES: readonly QueueState[] = ["CLOSED"];

/**
 * Non-terminal queue states (sale may still proceed).
 */
export const NON_TERMINAL_QUEUE_STATES: readonly QueueState[] = [
  "SCHEDULED",
  "OPEN",
  "FULL_QUEUE",
  "FULL_BOOKED",
];

/**
 * Type guard for valid QueueState values.
 * R3-AC3: Returns false for SOLD_OUT and any invalid string.
 */
export function isValidQueueState(value: unknown): value is QueueState {
  return (
    typeof value === "string" && QUEUE_STATES.includes(value as QueueState)
  );
}

/**
 * Check if a queue state is terminal (sale cannot proceed).
 * R3-AC4: CLOSED is terminal
 */
export function isTerminalQueueState(state: QueueState): boolean {
  return TERMINAL_QUEUE_STATES.includes(state);
}

/**
 * R3-AC5: Type-safe comparison demonstrating FULL_QUEUE ≠ FULL_BOOKED.
 * These are distinct literal types in the union.
 */
export function isQueueFull(state: QueueState): state is "FULL_QUEUE" {
  return state === "FULL_QUEUE";
}

export function isFullBooked(state: QueueState): state is "FULL_BOOKED" {
  return state === "FULL_BOOKED";
}

/**
 * Check if queue is accepting new participants.
 */
export function isQueueOpen(state: QueueState): state is "OPEN" {
  return state === "OPEN";
}
