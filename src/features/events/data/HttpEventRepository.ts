/**
 * HttpEventRepository
 *
 * GH-17: Repository implementation backed by RealEventDataSource.
 * Implements the EventRepository port against the real backend
 * (contract v2.27), so presentation code stays data-source agnostic.
 */

import type { Event, EventRepository } from "../domain";
import { RealEventDataSource } from "./RealEventDataSource";
import type { RealEventDataSourceConfig } from "./RealEventDataSource";

/**
 * Configuration for HttpEventRepository (passes through to RealEventDataSource)
 */
export type HttpEventRepositoryConfig = RealEventDataSourceConfig;

/**
 * Repository implementation using the real HTTP data source
 */
export class HttpEventRepository implements EventRepository {
  private dataSource: RealEventDataSource;

  constructor(config: HttpEventRepositoryConfig) {
    this.dataSource = new RealEventDataSource(config);
  }

  /**
   * Fetch list of events from the backend (GET /events)
   */
  async getEvents(): Promise<Event[]> {
    return this.dataSource.getEvents();
  }

  /**
   * Fetch a single event by ID (GET /events/{id})
   * @throws ApiError if the event is not found or the request fails
   */
  async getEvent(eventId: string): Promise<Event> {
    return this.dataSource.getEvent(eventId);
  }
}
