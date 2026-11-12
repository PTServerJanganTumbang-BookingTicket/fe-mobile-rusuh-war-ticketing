/**
 * FakeEventRepository
 *
 * GH-16: Repository implementation using FakeEventDataSource.
 * Implements EventRepository interface for testability and
 * future substitution with real HTTP adapter (GH-17).
 */

import type { Event, EventRepository } from "../domain";
import { FakeEventDataSource } from "./FakeEventDataSource";
import type { FakeEventDataSourceConfig } from "./FakeEventDataSource";

/**
 * Repository implementation using fake data source
 */
export class FakeEventRepository implements EventRepository {
  private dataSource: FakeEventDataSource;

  constructor(config?: FakeEventDataSourceConfig) {
    this.dataSource = new FakeEventDataSource(config);
  }

  /**
   * Fetch all events
   */
  async getEvents(): Promise<Event[]> {
    return this.dataSource.getEvents();
  }

  /**
   * Fetch single event by ID
   */
  async getEvent(eventId: string): Promise<Event> {
    return this.dataSource.getEvent(eventId);
  }

  /**
   * Update data source configuration (for testing)
   */
  updateConfig(config: Partial<FakeEventDataSourceConfig>): void {
    this.dataSource.updateConfig(config);
  }
}
