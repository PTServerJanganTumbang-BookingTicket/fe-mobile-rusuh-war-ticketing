/**
 * Queue Scenario Types
 *
 * Types for deterministic queue scenario definitions.
 * Used by FakeQueueDataSource to play scripted sequences.
 *
 * @module features/queue/domain/queue-scenario.types
 */

import type { QueueUpdate } from "./queue-update.types";

/**
 * A single step in a queue scenario.
 *
 * Each step defines when to emit an update (relative to previous step)
 * and what partial update to apply to the current state.
 */
export interface QueueScenarioStep {
  /** Delay in milliseconds before emitting this step's update */
  delayMs: number;
  /** Partial update to merge with current state */
  update: Partial<QueueUpdate>;
}

/**
 * A complete queue scenario definition.
 *
 * Scenarios are named sequences that exercise specific queue behaviors:
 * - queue-moving: Normal progression to GRANTED
 * - queue-stuck: Position stalls temporarily
 * - full-booked-then-open: Inventory exhaustion then recovery
 * - closed: Terminal sale closure
 * - full-queue: Queue capacity reached
 * - granted-fast: Quick grant for happy path testing
 */
export interface QueueScenario {
  /** Scenario identifier */
  name: string;
  /** Human-readable description of what the scenario tests */
  description: string;
  /** Initial state when scenario starts */
  initialState: QueueUpdate;
  /** Sequence of state transitions */
  steps: QueueScenarioStep[];
}

/**
 * Type guard for valid QueueScenarioStep.
 */
export function isValidScenarioStep(
  value: unknown
): value is QueueScenarioStep {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const step = value as Record<string, unknown>;

  return (
    typeof step.delayMs === "number" &&
    step.delayMs >= 0 &&
    typeof step.update === "object" &&
    step.update !== null
  );
}

/**
 * Type guard for valid QueueScenario.
 */
export function isValidScenario(value: unknown): value is QueueScenario {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const scenario = value as Record<string, unknown>;

  return (
    typeof scenario.name === "string" &&
    scenario.name.length > 0 &&
    typeof scenario.description === "string" &&
    typeof scenario.initialState === "object" &&
    scenario.initialState !== null &&
    Array.isArray(scenario.steps)
  );
}
