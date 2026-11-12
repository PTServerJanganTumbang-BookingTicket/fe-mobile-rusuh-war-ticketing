/**
 * Event Fixture Data
 *
 * GH-17: Deterministic fixtures for testing.
 * Evolved from GH-16 to match real contract (sjtrbt20261112.openapi.json).
 *
 * Coverage:
 * - All QueueState values: SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED
 * - Special case: FULL_BOOKED with enabled=true (reversible state)
 */

import type { Event } from "../../domain";

/**
 * Deterministic fixture events for testing and development
 */
export const FAKE_EVENTS: Event[] = [
  // Event 1: SCHEDULED (sale not yet opened)
  {
    id: "evt_konser_a",
    name: "Konser A",
    category: "LIVE MUSIC",
    location: "GBK, Jakarta",
    date: "2026-12-25",
    imageUrl: "/images/concert-placeholder.webp",
    queueState: "SCHEDULED",
    display: {
      enabled: false,
    },
    saleStartsAt: "2026-12-20T10:00:00Z",
  },

  // Event 2: OPEN (queue accepting participants)
  {
    id: "evt_konser_b",
    name: "Konser B",
    category: "LIVE MUSIC",
    location: "GOR Saparua, Bandung",
    date: "2027-01-10",
    imageUrl: "/images/concert-placeholder.webp",
    queueState: "OPEN",
    display: {
      enabled: true,
    },
  },

  // Event 3: FULL_QUEUE (queue capacity reached, temporary)
  {
    id: "evt_konser_c",
    name: "Konser C",
    category: "LIVE MUSIC",
    location: "Jatim Expo, Surabaya",
    date: "2027-02-02",
    imageUrl: "/images/concert-placeholder.webp",
    queueState: "FULL_QUEUE",
    display: {
      enabled: false,
    },
  },

  // Event 4: FULL_BOOKED (inventory exhaustion, reversible, enabled=true)
  {
    id: "evt_konser_d",
    name: "Konser D",
    category: "LIVE MUSIC",
    location: "Ancol Beach, Jakarta",
    date: "2027-03-15",
    imageUrl: "/images/concert-placeholder.webp",
    queueState: "FULL_BOOKED",
    display: {
      enabled: true, // Per R7-AC2: FULL_BOOKED has enabled=true
    },
  },

  // Event 5: CLOSED (terminal sale closure)
  {
    id: "evt_konser_e",
    name: "Konser E",
    category: "LIVE MUSIC",
    location: "Istora Senayan, Jakarta",
    date: "2026-11-30",
    imageUrl: "/images/concert-placeholder.webp",
    queueState: "CLOSED",
    display: {
      enabled: false,
    },
  },
];
