/**
 * EventDTO Schema
 *
 * GH-17: Raw API response types for GET /events endpoint.
 * Uses snake_case matching server contract (sjtrbt20261112.openapi.json).
 *
 * DTOs stay in data layer — presentation imports only domain Event.
 */

/**
 * Valid queue_state values from real contract
 * @see sjtrbt20261112.openapi.json GET /events
 */
export const VALID_QUEUE_STATES = [
  "SCHEDULED",
  "OPEN",
  "FULL_QUEUE",
  "FULL_BOOKED",
  "CLOSED",
] as const;

export type ValidQueueState = (typeof VALID_QUEUE_STATES)[number];

/**
 * Type guard for valid queue_state values
 * @param value - The queue_state string to validate
 * @returns True if value is a valid QueueState
 */
export function isValidQueueState(value: string): value is ValidQueueState {
  return VALID_QUEUE_STATES.includes(value as ValidQueueState);
}

/**
 * Raw API event structure (snake_case)
 * Matches GET /events response item schema
 */
export type EventDTO = {
  /** Unique event identifier */
  id: string;
  /** Event display name */
  name: string;
  /** Event category (e.g., "LIVE MUSIC") */
  category: string;
  /** Location string */
  location: string;
  /** Event date as ISO string */
  date: string;
  /** Event image URL (snake_case from server) */
  image_url: string;
  /** Queue admission state (validated against VALID_QUEUE_STATES) */
  queue_state: string;
  /** When sale starts (optional) */
  sale_starts_at?: string | null;
  /** Server-computed display hints */
  display: {
    /** Whether the CTA button is active/clickable */
    enabled: boolean;
  };
};

/**
 * GET /events response envelope
 * Matches API response structure
 */
export type EventsResponseDTO = {
  data: {
    items: EventDTO[];
  };
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
};
