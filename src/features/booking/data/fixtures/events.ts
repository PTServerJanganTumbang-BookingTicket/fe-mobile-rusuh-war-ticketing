/**
 * Event Fixtures
 *
 * GH-12 T5: Deterministic event fixtures.
 *
 * @module features/booking/data/fixtures/events
 */

import type { TicketPageEvent } from "../../domain";

/**
 * Default event fixture for testing.
 */
export const EVENT_FIXTURE: TicketPageEvent = {
  id: "evt_jkt_istora_nightfall",
  name: "Nightfall Concert 2026",
  date: "2026-12-20T19:00:00+07:00",
  venue: "Istora Senayan, Jakarta",
  imageUrl: "https://example.com/events/nightfall-2026.jpg",
};

/**
 * Alternative event fixture.
 */
export const EVENT_FIXTURE_ALT: TicketPageEvent = {
  id: "evt_sby_gbk_sunrise",
  name: "Sunrise Festival 2026",
  date: "2026-12-25T08:00:00+07:00",
  venue: "GBK Stadium, Jakarta",
  imageUrl: "https://example.com/events/sunrise-2026.jpg",
};
