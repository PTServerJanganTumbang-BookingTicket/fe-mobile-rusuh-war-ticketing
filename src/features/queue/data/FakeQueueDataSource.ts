/**
 * FakeQueueDataSource
 *
 * GH-8 T5: Deterministic scenario player for Queue waiting room.
 * Plays scripted QueueScenario sequences with real timing.
 *
 * @module features/queue/data/FakeQueueDataSource
 */

import type { QueueScenario, QueueScenarioStep, QueueUpdate } from "../domain";
import { DEFAULT_SCENARIO } from "./fixtures";

/**
 * Configuration for FakeQueueDataSource.
 */
export interface FakeQueueDataSourceConfig {
  /** Scenario to play. Defaults to DEFAULT_SCENARIO (queue-moving). */
  scenario?: QueueScenario;
  /** Callback for state updates. */
  onUpdate?: (update: QueueUpdate) => void;
  /** Callback when scenario completes. */
  onComplete?: () => void;
  /** Callback on error. */
  onError?: (error: Error) => void;
}

/**
 * FakeQueueDataSource
 *
 * Plays a QueueScenario deterministically. Emits QueueUpdate events
 * at scripted intervals. No network operations.
 */
export class FakeQueueDataSource {
  private scenario: QueueScenario;
  private currentState: QueueUpdate;
  private stepIndex: number = 0;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private isRunning: boolean = false;

  private onUpdate: ((update: QueueUpdate) => void) | null;
  private onComplete: (() => void) | null;
  private onError: ((error: Error) => void) | null;

  constructor(config: FakeQueueDataSourceConfig = {}) {
    this.scenario = config.scenario ?? DEFAULT_SCENARIO;
    this.currentState = { ...this.scenario.initialState };
    this.onUpdate = config.onUpdate ?? null;
    this.onComplete = config.onComplete ?? null;
    this.onError = config.onError ?? null;
  }

  /**
   * Start playing the scenario.
   * Emits initial state immediately, then schedules subsequent steps.
   */
  start(): void {
    if (this.isRunning) {
      return; // Idempotent
    }

    this.isRunning = true;
    this.stepIndex = 0;
    this.currentState = { ...this.scenario.initialState };

    // Emit initial state immediately
    this.emitUpdate(this.currentState);

    // Schedule first step if any
    this.scheduleNextStep();
  }

  /**
   * Stop playing the scenario.
   * Cancels any scheduled updates.
   */
  stop(): void {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Reset and restart the scenario.
   */
  retry(): void {
    this.stop();
    this.start();
  }

  /**
   * Get current state (for testing/debugging).
   */
  getCurrentState(): QueueUpdate {
    return { ...this.currentState };
  }

  /**
   * Check if scenario is currently running.
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Update callbacks at runtime.
   */
  setCallbacks(callbacks: Partial<FakeQueueDataSourceConfig>): void {
    if (callbacks.onUpdate !== undefined) {
      this.onUpdate = callbacks.onUpdate;
    }
    if (callbacks.onComplete !== undefined) {
      this.onComplete = callbacks.onComplete;
    }
    if (callbacks.onError !== undefined) {
      this.onError = callbacks.onError;
    }
  }

  /**
   * Switch scenario (stops current if running).
   */
  setScenario(scenario: QueueScenario): void {
    this.stop();
    this.scenario = scenario;
    this.currentState = { ...scenario.initialState };
    this.stepIndex = 0;
  }

  private emitUpdate(update: QueueUpdate): void {
    if (this.onUpdate) {
      try {
        this.onUpdate(update);
      } catch (error) {
        this.emitError(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  private emitComplete(): void {
    if (this.onComplete) {
      try {
        this.onComplete();
      } catch (error) {
        this.emitError(
          error instanceof Error ? error : new Error(String(error))
        );
      }
    }
  }

  private emitError(error: Error): void {
    if (this.onError) {
      this.onError(error);
    }
  }

  private scheduleNextStep(): void {
    if (!this.isRunning) {
      return;
    }

    if (this.stepIndex >= this.scenario.steps.length) {
      // Scenario complete
      this.isRunning = false;
      this.emitComplete();
      return;
    }

    const step = this.scenario.steps[this.stepIndex];
    this.timerId = setTimeout(() => {
      this.executeStep(step);
    }, step.delayMs);
  }

  private executeStep(step: QueueScenarioStep): void {
    if (!this.isRunning) {
      return;
    }

    // Merge partial update with current state
    this.currentState = {
      ...this.currentState,
      ...step.update,
    };

    this.emitUpdate(this.currentState);
    this.stepIndex++;
    this.scheduleNextStep();
  }
}
