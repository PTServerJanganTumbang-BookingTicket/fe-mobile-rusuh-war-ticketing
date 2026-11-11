/**
 * Engagement State Types
 *
 * Discriminated union for queue engagement states from /queue/me.
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.2
 *
 * @module core/domain/queue/engagement.types
 */

/**
 * Engagement States from /queue/me response (data.state).
 *
 * R4-AC1: Exactly these 6 states
 * R4-AC2: Types compile without React/React Native dependencies
 * R4-AC3: State transitions documented via comments
 *
 * State Transition Flow:
 * QUEUED -> GRANTED -> SELECTING -> AWAITING_PAYMENT -> CONFIRMED
 *                                                    -> EXPIRED (timeout)
 *           GRANTED -> EXPIRED (grant timeout)
 */
export type EngagementState =
  | "QUEUED" // Waiting in queue
  | "GRANTED" // Slot granted, can proceed to booking
  | "SELECTING" // Selecting tickets
  | "AWAITING_PAYMENT" // Payment pending
  | "CONFIRMED" // Booking confirmed
  | "EXPIRED"; // Grant expired

/**
 * All valid engagement state values as a readonly array.
 * Useful for validation and iteration.
 */
export const ENGAGEMENT_STATES = [
  "QUEUED",
  "GRANTED",
  "SELECTING",
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "EXPIRED",
] as const satisfies readonly EngagementState[];

/**
 * Terminal engagement states (no further progression).
 */
export const TERMINAL_ENGAGEMENT_STATES: readonly EngagementState[] = [
  "CONFIRMED",
  "EXPIRED",
];

/**
 * Active engagement states (user interaction expected).
 */
export const ACTIVE_ENGAGEMENT_STATES: readonly EngagementState[] = [
  "GRANTED",
  "SELECTING",
  "AWAITING_PAYMENT",
];

/**
 * Type guard for valid EngagementState values.
 */
export function isValidEngagementState(
  value: unknown
): value is EngagementState {
  return (
    typeof value === "string" &&
    ENGAGEMENT_STATES.includes(value as EngagementState)
  );
}

/**
 * Check if engagement state is terminal (no further actions possible).
 */
export function isTerminalEngagementState(state: EngagementState): boolean {
  return TERMINAL_ENGAGEMENT_STATES.includes(state);
}

/**
 * Check if engagement state requires active user interaction.
 */
export function isActiveEngagementState(state: EngagementState): boolean {
  return ACTIVE_ENGAGEMENT_STATES.includes(state);
}

/**
 * Check if user has been granted a slot and can proceed to booking.
 */
export function isGranted(state: EngagementState): state is "GRANTED" {
  return state === "GRANTED";
}

/**
 * Check if booking is confirmed successfully.
 */
export function isConfirmed(state: EngagementState): state is "CONFIRMED" {
  return state === "CONFIRMED";
}

/**
 * Check if grant has expired.
 */
export function isExpired(state: EngagementState): state is "EXPIRED" {
  return state === "EXPIRED";
}
