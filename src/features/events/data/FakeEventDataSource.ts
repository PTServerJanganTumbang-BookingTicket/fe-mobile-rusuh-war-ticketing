/**
 * FakeEventDataSource
 *
 * GH-16: Provides deterministic fixture data for testing and development.
 * Supports configurable delay and error simulation.
 */

import type { Event } from "../domain";
import { FAKE_EVENTS } from "./fixtures/events";

export type FakeEventDataSourceConfig = {
  /** Delay in milliseconds before returning data (default: 0) */
  delayMs?: number;
  /** If true, throws an error instead of returning data */
  shouldError?: boolean;
  /** Custom error message when shouldError is true */
  errorMessage?: string;
};

/**
 * Fake data source for events
 * Provides deterministic fixture data with optional delay/error simulation
 */
export class FakeEventDataSource {
  private config: Required<FakeEventDataSourceConfig>;

  constructor(config: FakeEventDataSourceConfig = {}) {
    this.config = {
      delayMs: config.delayMs ?? 0,
      shouldError: config.shouldError ?? false,
      errorMessage: config.errorMessage ?? "Failed to fetch events",
    };
  }

  /**
   * Simulates network delay if configured
   */
  private async maybeDelay(): Promise<void> {
    if (this.config.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delayMs));
    }
  }

  /**
   * Throws error if error simulation is enabled
   */
  private maybeThrowError(): void {
    if (this.config.shouldError) {
      throw new Error(this.config.errorMessage);
    }
  }

  /**
   * Update configuration at runtime (useful for tests)
   */
  updateConfig(config: Partial<FakeEventDataSourceConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Fetch all events
   * @returns Array of event fixtures
   * @throws Error if error simulation is enabled
   */
  async getEvents(): Promise<Event[]> {
    await this.maybeDelay();
    this.maybeThrowError();
    return [...FAKE_EVENTS];
  }

  /**
   * Fetch single event by ID
   * @param eventId - Event identifier
   * @returns The matching event
   * @throws Error if event not found or error simulation is enabled
   */
  async getEvent(eventId: string): Promise<Event> {
    await this.maybeDelay();
    this.maybeThrowError();

    const event = FAKE_EVENTS.find((e) => e.id === eventId);
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    return { ...event };
  }
}
