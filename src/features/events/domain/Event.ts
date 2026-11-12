/**
 * Event Domain Entity
 *
 * GH-16: Domain types for Events feature.
 * Matches canonical contract schema in docs/CONTRACT-BASELINE.md
 *
 * Note: Queue-specific fields (ticket_no, now_serving, position) belong
 * to Queue feature domain, not Events.
 */

/**
 * Ticket availability status
 * @see CONTRACT-BASELINE.md §6.1
 */
export type EventStatus = "AVAILABLE" | "SELLING_OUT_FAST" | "SOLD_OUT";

/**
 * Queue admission state
 * NOT_OPEN → Queue not accepting participants yet
 * DIRECT → No queue, direct ticket purchase
 * OPEN → Queue accepting participants
 * FULL → Queue capacity reached (temporary)
 *
 * @see CONTRACT-BASELINE.md §2.3
 */
export type QueueState = "NOT_OPEN" | "DIRECT" | "OPEN" | "FULL";

/**
 * Server-computed display hints for UI rendering
 * Matches web MSW fixtures structure
 */
export type DisplayBlock = {
  /** Whether the CTA button is active/clickable */
  enabled: boolean;
  /** Action type for the CTA */
  action: "JOIN_QUEUE" | "GO_TO_TICKETS" | "NONE";
  /** i18n key for button label */
  labelKey: string;
  /** i18n key for status badge (optional) */
  badgeKey: string | null;
};

/**
 * Event domain entity
 * Represents a concert/event with status and queue_state
 */
export type Event = {
  /** Unique event identifier */
  id: string;
  /** Event display name */
  name: string;
  /** Event category (e.g., "LIVE MUSIC") */
  category: string;
  /** Venue name */
  venue: string;
  /** City name */
  city: string;
  /** Event date as ISO string */
  date: string;
  /** Event image URL */
  imageUrl: string;
  /** Ticket availability status */
  status: EventStatus;
  /** Queue admission state */
  queueState: QueueState;
  /** Server-computed display hints */
  display: DisplayBlock;
};
