/**
 * EventRepository Interface (Port)
 *
 * GH-16: Domain interface for event data access.
 * Pure port — no implementation details, no external dependencies.
 * Data layer implements this interface.
 */

import type { Event } from "./Event";

/**
 * Repository port for accessing event data
 * Independent of data source (fake, HTTP, etc.)
 */
export interface EventRepository {
  /**
   * Fetch list of events
   * @returns Promise resolving to array of events
   */
  getEvents(): Promise<Event[]>;

  /**
   * Fetch single event by ID
   * @param eventId - The event's unique identifier
   * @returns Promise resolving to the event
   * @throws Error if event not found
   */
  getEvent(eventId: string): Promise<Event>;
}
