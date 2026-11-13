/**
 * EventDTO Schema
 *
 * GH-17: Raw API response types for GET /events endpoint.
 * Uses snake_case matching server contract.
 * Updated for contract v2.27 (deployed backend):
 * - `data` is the event array directly (no `items` wrapper)
 * - `location` is an object `{ venue, city }` (was a flat string in v2.12)
 *
 * DTOs stay in data layer — presentation imports only domain Event.
 */

/**
 * Valid queue_state values from real contract
 * @see GET /events (deployed backend, contract v2.27)
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
 * Raw API event location (snake_case object, contract v2.27)
 */
export type EventLocationDTO = {
  /** Venue name and address (e.g. "Istora Gelora Bung Karno, Senayan") */
  venue: string;
  /** City name (e.g. "Jakarta") */
  city: string;
};

/**
 * Raw API event structure (snake_case)
 * Matches GET /events response item schema (contract v2.27)
 */
export type EventDTO = {
  /** Unique event identifier */
  id: string;
  /** Event display name */
  name: string;
  /** Event category (e.g., "LIVE MUSIC") */
  category: string;
  /** Event location (object with venue + city, contract v2.27) */
  location: EventLocationDTO;
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
 * Response meta (contract v2.27)
 */
export type EventsResponseMetaDTO = {
  code?: number;
  message?: string;
  pagination?: {
    totalData?: number;
    totalPage?: number;
    limit?: number;
    offset?: number;
  };
  server_time?: string;
};

/**
 * GET /events response envelope (contract v2.27)
 * `data` is the event array directly (no `items` wrapper)
 */
export type EventsResponseDTO = {
  data: EventDTO[];
  meta?: EventsResponseMetaDTO;
};
