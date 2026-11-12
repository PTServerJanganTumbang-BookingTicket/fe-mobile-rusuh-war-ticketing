/**
 * Queue State Test Fixtures
 *
 * Deterministic fixtures matching CONTRACT-BASELINE.md for all queue states.
 * R13-AC1: Fixtures exist for all five queue states
 * R13-AC5: No SOLD_OUT as queue state (it's a ticket-category status only)
 *
 * @module core/domain/__fixtures__/queue-states.fixture
 */

import type { QueueState } from "../queue/queue-state.types";

/**
 * Queue state fixture with associated metadata.
 */
export interface QueueStateFixture {
  state: QueueState;
  httpStatus: number;
  errorCode?: string;
  isTerminal: boolean;
  description: string;
}

/**
 * SCHEDULED state fixture.
 * Queue not yet open.
 */
export const QUEUE_STATE_SCHEDULED: QueueStateFixture = {
  state: "SCHEDULED",
  httpStatus: 200,
  isTerminal: false,
  description: "Queue not yet open",
};

/**
 * OPEN state fixture.
 * Queue accepting participants.
 */
export const QUEUE_STATE_OPEN: QueueStateFixture = {
  state: "OPEN",
  httpStatus: 200,
  isTerminal: false,
  description: "Queue accepting participants",
};

/**
 * FULL_QUEUE state fixture.
 * Queue capacity reached (temporary, retryable).
 * CONTRACT-BASELINE.md §2.3, §2.4: 503 QUEUE_FULL
 */
export const QUEUE_STATE_FULL_QUEUE: QueueStateFixture = {
  state: "FULL_QUEUE",
  httpStatus: 503,
  errorCode: "QUEUE_FULL",
  isTerminal: false,
  description: "Queue capacity reached (temporary)",
};

/**
 * FULL_BOOKED state fixture.
 * Inventory/ticket exhaustion (may recover if holds expire).
 * CONTRACT-BASELINE.md §2.3, §2.4: 409 FULL_BOOKED
 */
export const QUEUE_STATE_FULL_BOOKED: QueueStateFixture = {
  state: "FULL_BOOKED",
  httpStatus: 409,
  errorCode: "FULL_BOOKED",
  isTerminal: false,
  description: "Inventory exhaustion (may recover)",
};

/**
 * CLOSED state fixture.
 * Terminal sale closure.
 * CONTRACT-BASELINE.md §2.3: Terminal state
 */
export const QUEUE_STATE_CLOSED: QueueStateFixture = {
  state: "CLOSED",
  httpStatus: 410,
  isTerminal: true,
  description: "Terminal sale closure",
};

/**
 * All queue state fixtures in order.
 * R13-AC6: Fixtures are exported for use in feature tests
 */
export const ALL_QUEUE_STATES: readonly QueueStateFixture[] = [
  QUEUE_STATE_SCHEDULED,
  QUEUE_STATE_OPEN,
  QUEUE_STATE_FULL_QUEUE,
  QUEUE_STATE_FULL_BOOKED,
  QUEUE_STATE_CLOSED,
];

/**
 * Non-terminal queue state fixtures.
 */
export const NON_TERMINAL_QUEUE_STATES: readonly QueueStateFixture[] = [
  QUEUE_STATE_SCHEDULED,
  QUEUE_STATE_OPEN,
  QUEUE_STATE_FULL_QUEUE,
  QUEUE_STATE_FULL_BOOKED,
];

/**
 * Terminal queue state fixtures.
 */
export const TERMINAL_QUEUE_STATES: readonly QueueStateFixture[] = [
  QUEUE_STATE_CLOSED,
];
