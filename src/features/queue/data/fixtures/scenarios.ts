/**
 * Queue Scenario Fixtures
 *
 * GH-8 T4: Deterministic scenarios covering all Queue states.
 *
 * @module features/queue/data/fixtures/scenarios
 */

import type { QueueScenario, QueueUpdate } from "../../domain";

/**
 * Helper to create ISO timestamp with offset.
 */
function isoTime(offsetMinutes = 0): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + offsetMinutes);
  return date.toISOString();
}

/**
 * Base initial state for most scenarios.
 */
const baseInitialState: QueueUpdate = {
  position: 100,
  queueState: "OPEN",
  engagementState: "QUEUED",
  serverTime: isoTime(),
  ratePerMin: 20,
};

/**
 * SCENARIO_QUEUE_MOVING
 *
 * Normal queue progression from position 100 to GRANTED.
 * Demonstrates steady progress with rate updates.
 */
export const SCENARIO_QUEUE_MOVING: QueueScenario = {
  name: "queue-moving",
  description: "Normal queue progression with steady rate to GRANTED",
  initialState: {
    ...baseInitialState,
    position: 100,
    serverTime: isoTime(),
  },
  steps: [
    { delayMs: 1000, update: { position: 80, serverTime: isoTime(1) } },
    { delayMs: 1000, update: { position: 60, serverTime: isoTime(2) } },
    { delayMs: 1000, update: { position: 40, serverTime: isoTime(3) } },
    { delayMs: 1000, update: { position: 20, serverTime: isoTime(4) } },
    { delayMs: 1000, update: { position: 10, serverTime: isoTime(5) } },
    { delayMs: 1000, update: { position: 5, serverTime: isoTime(6) } },
    {
      delayMs: 1000,
      update: {
        position: 0,
        engagementState: "GRANTED",
        serverTime: isoTime(7),
        grant: {
          grant_token: "gt_fake_queue_moving",
          booking_expires_at: isoTime(22), // 15 min from grant
        },
      },
    },
  ],
};

/**
 * SCENARIO_QUEUE_STUCK
 *
 * Queue stalls at same position for a bounded number of updates.
 * Demonstrates rate=0 (or missing) during stall periods.
 */
export const SCENARIO_QUEUE_STUCK: QueueScenario = {
  name: "queue-stuck",
  description: "Queue stalls temporarily, then resumes and reaches GRANTED",
  initialState: {
    ...baseInitialState,
    position: 50,
    serverTime: isoTime(),
  },
  steps: [
    // Stalled updates (same position, no rate)
    {
      delayMs: 1000,
      update: { position: 50, serverTime: isoTime(1), ratePerMin: undefined },
    },
    {
      delayMs: 1000,
      update: { position: 50, serverTime: isoTime(2), ratePerMin: undefined },
    },
    {
      delayMs: 1000,
      update: { position: 50, serverTime: isoTime(3), ratePerMin: undefined },
    },
    // Resumes
    {
      delayMs: 1000,
      update: { position: 30, serverTime: isoTime(4), ratePerMin: 15 },
    },
    { delayMs: 1000, update: { position: 15, serverTime: isoTime(5) } },
    {
      delayMs: 1000,
      update: {
        position: 0,
        engagementState: "GRANTED",
        serverTime: isoTime(6),
        grant: {
          grant_token: "gt_fake_queue_stuck",
          booking_expires_at: isoTime(21),
        },
      },
    },
  ],
};

/**
 * SCENARIO_FULL_BOOKED_THEN_OPEN
 *
 * Inventory exhaustion (FULL_BOOKED) followed by recovery.
 * Demonstrates 409 state is temporary and can recover.
 */
export const SCENARIO_FULL_BOOKED_THEN_OPEN: QueueScenario = {
  name: "full-booked-then-open",
  description: "Inventory exhaustion (FULL_BOOKED), then recovery to GRANTED",
  initialState: {
    ...baseInitialState,
    position: 30,
    serverTime: isoTime(),
  },
  steps: [
    { delayMs: 1000, update: { position: 20, serverTime: isoTime(1) } },
    // FULL_BOOKED state
    {
      delayMs: 1000,
      update: {
        position: 15,
        queueState: "FULL_BOOKED",
        serverTime: isoTime(2),
      },
    },
    // Still FULL_BOOKED
    {
      delayMs: 2000,
      update: {
        position: 15,
        queueState: "FULL_BOOKED",
        serverTime: isoTime(4),
      },
    },
    // Recovery - back to OPEN
    {
      delayMs: 2000,
      update: { position: 10, queueState: "OPEN", serverTime: isoTime(6) },
    },
    { delayMs: 1000, update: { position: 5, serverTime: isoTime(7) } },
    {
      delayMs: 1000,
      update: {
        position: 0,
        engagementState: "GRANTED",
        serverTime: isoTime(8),
        grant: {
          grant_token: "gt_fake_full_booked",
          booking_expires_at: isoTime(23),
        },
      },
    },
  ],
};

/**
 * SCENARIO_CLOSED
 *
 * Queue closes during participation - terminal state.
 * Demonstrates CLOSED is terminal (no recovery).
 */
export const SCENARIO_CLOSED: QueueScenario = {
  name: "closed",
  description: "Sale closes during queue participation (terminal)",
  initialState: {
    ...baseInitialState,
    position: 40,
    serverTime: isoTime(),
  },
  steps: [
    { delayMs: 1000, update: { position: 30, serverTime: isoTime(1) } },
    { delayMs: 1000, update: { position: 20, serverTime: isoTime(2) } },
    // Queue closes
    {
      delayMs: 1000,
      update: {
        position: 20,
        queueState: "CLOSED",
        serverTime: isoTime(3),
      },
    },
  ],
};

/**
 * SCENARIO_FULL_QUEUE
 *
 * Queue capacity reached (503) - shows FULL_QUEUE state.
 * Demonstrates queue can be full but sale not closed.
 */
export const SCENARIO_FULL_QUEUE: QueueScenario = {
  name: "full-queue",
  description: "Queue capacity reached (FULL_QUEUE 503)",
  initialState: {
    position: 999,
    queueState: "FULL_QUEUE",
    engagementState: "QUEUED",
    serverTime: isoTime(),
    ratePerMin: 5,
  },
  steps: [
    // Stay in FULL_QUEUE
    {
      delayMs: 2000,
      update: {
        position: 999,
        queueState: "FULL_QUEUE",
        serverTime: isoTime(2),
      },
    },
    // Queue opens up
    {
      delayMs: 2000,
      update: { position: 800, queueState: "OPEN", serverTime: isoTime(4) },
    },
    { delayMs: 1000, update: { position: 600, serverTime: isoTime(5) } },
  ],
};

/**
 * SCENARIO_GRANTED_FAST
 *
 * Fast path to grant - minimal steps for happy path testing.
 */
export const SCENARIO_GRANTED_FAST: QueueScenario = {
  name: "granted-fast",
  description: "Fast grant for happy path testing",
  initialState: {
    position: 10,
    queueState: "OPEN",
    engagementState: "QUEUED",
    serverTime: isoTime(),
    ratePerMin: 100,
  },
  steps: [
    { delayMs: 500, update: { position: 5, serverTime: isoTime(0.5) } },
    {
      delayMs: 500,
      update: {
        position: 0,
        engagementState: "GRANTED",
        serverTime: isoTime(1),
        grant: {
          grant_token: "gt_fake_granted_fast",
          booking_expires_at: isoTime(16),
        },
      },
    },
  ],
};

/**
 * All available scenarios indexed by name.
 */
export const SCENARIOS: Record<string, QueueScenario> = {
  "queue-moving": SCENARIO_QUEUE_MOVING,
  "queue-stuck": SCENARIO_QUEUE_STUCK,
  "full-booked-then-open": SCENARIO_FULL_BOOKED_THEN_OPEN,
  closed: SCENARIO_CLOSED,
  "full-queue": SCENARIO_FULL_QUEUE,
  "granted-fast": SCENARIO_GRANTED_FAST,
};

/**
 * Default scenario for testing.
 */
export const DEFAULT_SCENARIO = SCENARIO_QUEUE_MOVING;
