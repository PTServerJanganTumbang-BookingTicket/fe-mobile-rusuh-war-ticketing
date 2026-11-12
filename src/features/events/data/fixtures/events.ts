/**
 * Event Fixture Data
 *
 * GH-16: Deterministic fixtures for FakeEventDataSource.
 * Matches canonical contract schema (docs/CONTRACT-BASELINE.md) and web MSW fixtures.
 *
 * Coverage:
 * - All EventStatus values: AVAILABLE, SELLING_OUT_FAST, SOLD_OUT
 * - All QueueState values: NOT_OPEN, DIRECT, OPEN, FULL
 * - Special case: AVAILABLE + FULL (queue full but event not sold out)
 */

import type { Event } from "../../domain";

/**
 * Deterministic fixture events for testing and development
 */
export const FAKE_EVENTS: Event[] = [
  // Event 1: AVAILABLE + OPEN (standard queue join flow)
  {
    id: "evt_konser_a",
    name: "Konser A",
    category: "LIVE MUSIC",
    venue: "GBK",
    city: "Jakarta",
    date: "2026-12-25",
    imageUrl: "/images/concert-placeholder.webp",
    status: "AVAILABLE",
    queueState: "OPEN",
    display: {
      enabled: true,
      action: "JOIN_QUEUE",
      labelKey: "join_queue",
      badgeKey: null,
    },
  },

  // Event 2: SELLING_OUT_FAST + FULL (high demand, queue at capacity)
  {
    id: "evt_konser_b",
    name: "Konser B",
    category: "LIVE MUSIC",
    venue: "GOR Saparua",
    city: "Bandung",
    date: "2027-01-10",
    imageUrl: "/images/concert-placeholder.webp",
    status: "SELLING_OUT_FAST",
    queueState: "FULL",
    display: {
      enabled: false,
      action: "NONE",
      labelKey: "queue_full",
      badgeKey: "selling_out_fast",
    },
  },

  // Event 3: AVAILABLE + NOT_OPEN (sale not started yet)
  {
    id: "evt_konser_c",
    name: "Konser C",
    category: "LIVE MUSIC",
    venue: "Jatim Expo",
    city: "Surabaya",
    date: "2027-02-02",
    imageUrl: "/images/concert-placeholder.webp",
    status: "AVAILABLE",
    queueState: "NOT_OPEN",
    display: {
      enabled: false,
      action: "NONE",
      labelKey: "sale_not_open",
      badgeKey: "coming_soon",
    },
  },

  // Event 4: AVAILABLE + DIRECT (no queue, direct purchase)
  {
    id: "evt_konser_d",
    name: "Konser D",
    category: "LIVE MUSIC",
    venue: "Ancol Beach",
    city: "Jakarta",
    date: "2027-03-15",
    imageUrl: "/images/concert-placeholder.webp",
    status: "AVAILABLE",
    queueState: "DIRECT",
    display: {
      enabled: true,
      action: "GO_TO_TICKETS",
      labelKey: "buy_tickets",
      badgeKey: null,
    },
  },

  // Event 5: SOLD_OUT + OPEN (tickets exhausted, queue was open)
  {
    id: "evt_konser_e",
    name: "Konser E",
    category: "LIVE MUSIC",
    venue: "Istora Senayan",
    city: "Jakarta",
    date: "2026-11-30",
    imageUrl: "/images/concert-placeholder.webp",
    status: "SOLD_OUT",
    queueState: "OPEN",
    display: {
      enabled: false,
      action: "NONE",
      labelKey: "sold_out",
      badgeKey: "sold_out",
    },
  },

  // Event 6: AVAILABLE + FULL (queue full but event not sold out)
  // This demonstrates status and queueState independence
  {
    id: "evt_konser_f",
    name: "Konser F",
    category: "LIVE MUSIC",
    venue: "Tennis Indoor Senayan",
    city: "Jakarta",
    date: "2027-04-20",
    imageUrl: "/images/concert-placeholder.webp",
    status: "AVAILABLE",
    queueState: "FULL",
    display: {
      enabled: false,
      action: "NONE",
      labelKey: "queue_full",
      badgeKey: null,
    },
  },
];
