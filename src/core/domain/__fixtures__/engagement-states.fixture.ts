/**
 * Engagement State Test Fixtures
 *
 * Deterministic fixtures matching CONTRACT-BASELINE.md for all engagement states.
 * R13-AC2: Fixtures exist for all six engagement states
 *
 * @module core/domain/__fixtures__/engagement-states.fixture
 */

import type { EngagementState } from "../queue/engagement.types";

/**
 * Engagement state fixture with associated metadata.
 */
export interface EngagementStateFixture {
  state: EngagementState;
  isTerminal: boolean;
  isActive: boolean;
  description: string;
  nextStates: readonly EngagementState[];
}

/**
 * QUEUED state fixture.
 * CONTRACT-BASELINE.md §2.2: Waiting in queue
 */
export const ENGAGEMENT_STATE_QUEUED: EngagementStateFixture = {
  state: "QUEUED",
  isTerminal: false,
  isActive: false,
  description: "Waiting in queue",
  nextStates: ["GRANTED", "EXPIRED"],
};

/**
 * GRANTED state fixture.
 * CONTRACT-BASELINE.md §2.2: Slot granted, can proceed to booking
 */
export const ENGAGEMENT_STATE_GRANTED: EngagementStateFixture = {
  state: "GRANTED",
  isTerminal: false,
  isActive: true,
  description: "Slot granted, can proceed to booking",
  nextStates: ["SELECTING", "EXPIRED"],
};

/**
 * SELECTING state fixture.
 * CONTRACT-BASELINE.md §2.2: Selecting tickets
 */
export const ENGAGEMENT_STATE_SELECTING: EngagementStateFixture = {
  state: "SELECTING",
  isTerminal: false,
  isActive: true,
  description: "Selecting tickets",
  nextStates: ["AWAITING_PAYMENT", "EXPIRED"],
};

/**
 * AWAITING_PAYMENT state fixture.
 * CONTRACT-BASELINE.md §2.2: Payment pending
 */
export const ENGAGEMENT_STATE_AWAITING_PAYMENT: EngagementStateFixture = {
  state: "AWAITING_PAYMENT",
  isTerminal: false,
  isActive: true,
  description: "Payment pending",
  nextStates: ["CONFIRMED", "EXPIRED"],
};

/**
 * CONFIRMED state fixture.
 * CONTRACT-BASELINE.md §2.2: Booking confirmed
 */
export const ENGAGEMENT_STATE_CONFIRMED: EngagementStateFixture = {
  state: "CONFIRMED",
  isTerminal: true,
  isActive: false,
  description: "Booking confirmed",
  nextStates: [],
};

/**
 * EXPIRED state fixture.
 * CONTRACT-BASELINE.md §2.2: Grant expired
 */
export const ENGAGEMENT_STATE_EXPIRED: EngagementStateFixture = {
  state: "EXPIRED",
  isTerminal: true,
  isActive: false,
  description: "Grant expired",
  nextStates: [],
};

/**
 * All engagement state fixtures in flow order.
 * R13-AC6: Fixtures are exported for use in feature tests
 */
export const ALL_ENGAGEMENT_STATES: readonly EngagementStateFixture[] = [
  ENGAGEMENT_STATE_QUEUED,
  ENGAGEMENT_STATE_GRANTED,
  ENGAGEMENT_STATE_SELECTING,
  ENGAGEMENT_STATE_AWAITING_PAYMENT,
  ENGAGEMENT_STATE_CONFIRMED,
  ENGAGEMENT_STATE_EXPIRED,
];

/**
 * Terminal engagement state fixtures.
 */
export const TERMINAL_ENGAGEMENT_STATES: readonly EngagementStateFixture[] = [
  ENGAGEMENT_STATE_CONFIRMED,
  ENGAGEMENT_STATE_EXPIRED,
];

/**
 * Active (user interaction expected) engagement state fixtures.
 */
export const ACTIVE_ENGAGEMENT_STATES: readonly EngagementStateFixture[] = [
  ENGAGEMENT_STATE_GRANTED,
  ENGAGEMENT_STATE_SELECTING,
  ENGAGEMENT_STATE_AWAITING_PAYMENT,
];

/**
 * Successful flow state fixtures (happy path).
 */
export const SUCCESS_FLOW_STATES: readonly EngagementStateFixture[] = [
  ENGAGEMENT_STATE_QUEUED,
  ENGAGEMENT_STATE_GRANTED,
  ENGAGEMENT_STATE_SELECTING,
  ENGAGEMENT_STATE_AWAITING_PAYMENT,
  ENGAGEMENT_STATE_CONFIRMED,
];
