/**
 * Event Domain Entity
 *
 * GH-17: Evolved domain types for Events feature.
 * Matches real contract (sjtrbt20261112.openapi.json).
 *
 * Evolution from GH-16:
 * - QueueState: 4 values → 5 values (NOT_OPEN/DIRECT/OPEN/FULL → SCHEDULED/OPEN/FULL_QUEUE/FULL_BOOKED/CLOSED)
 * - EventStatus: REMOVED (not in GET /events list response)
 * - DisplayBlock: Simplified (only enabled; action/labelKey/badgeKey removed)
 * - Event.venue/city: Merged into location
 * - Event.saleStartsAt: Added (optional)
 *
 * Note: Queue-specific fields (ticket_no, now_serving, position) belong
 * to Queue feature domain, not Events.
 */

/**
 * Queue admission state
 *
 * GH-17: Evolved from GH-16 (NOT_OPEN/DIRECT/OPEN/FULL) to real contract values.
 *
 * SCHEDULED  → Sale not yet opened; display.enabled=false
 * OPEN       → Queue accepting participants; display.enabled=true
 * FULL_QUEUE → Queue capacity reached (temporary); display.enabled=false
 * FULL_BOOKED → Inventory exhaustion (reversible); display.enabled=true
 * CLOSED     → Terminal sale closure; display.enabled=false
 *
 * @see sjtrbt20261112.openapi.json GET /events
 */
export type QueueState =
  "SCHEDULED" | "OPEN" | "FULL_QUEUE" | "FULL_BOOKED" | "CLOSED";

/**
 * Server-computed display hints for UI rendering
 *
 * GH-17: Simplified from GH-16.
 * Real contract provides only `enabled`; action/labelKey/badgeKey removed.
 */
export type DisplayBlock = {
  /** Whether the CTA button is active/clickable */
  enabled: boolean;
};

/**
 * Event domain entity
 *
 * GH-17: Evolved for real contract.
 * - EventStatus removed (not in GET /events list response)
 * - venue/city merged into location
 * - saleStartsAt added (optional, for SCHEDULED)
 */
export type Event = {
  /** Unique event identifier */
  id: string;
  /** Event display name */
  name: string;
  /** Event category (e.g., "LIVE MUSIC") */
  category: string;
  /** Location string (combined venue/city) */
  location: string;
  /** Event date as ISO string */
  date: string;
  /** Event image URL */
  imageUrl: string;
  /** Queue admission state */
  queueState: QueueState;
  /** Server-computed display hints */
  display: DisplayBlock;
  /** When sale starts (optional, for SCHEDULED state) */
  saleStartsAt?: string;
};
