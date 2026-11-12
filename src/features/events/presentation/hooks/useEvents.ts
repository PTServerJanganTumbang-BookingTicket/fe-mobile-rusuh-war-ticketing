/**
 * useEvents Hook
 *
 * GH-16: React hook for fetching events with loading, error, and retry support.
 * Uses dependency injection for repository to support testing.
 *
 * Note: Repository must be injected via options parameter.
 * The feature barrel (index.ts) provides a pre-configured hook
 * with the appropriate repository wired.
 */

import { useState, useEffect, useCallback } from "react";
import type { Event, EventRepository } from "../../domain";

/**
 * Result type for useEvents hook
 */
export type UseEventsResult = {
  /** Array of fetched events */
  events: Event[];
  /** Whether data is currently loading */
  loading: boolean;
  /** Error if fetch failed, null otherwise */
  error: Error | null;
  /** Retry function to re-fetch events */
  retry: () => void;
};

/**
 * Hook for fetching and managing events data
 *
 * @param repository - EventRepository implementation to use for data fetching
 * @returns Object containing events, loading state, error, and retry function
 *
 * @example
 * ```tsx
 * // In feature barrel (index.ts), the repository is pre-wired:
 * const { events, loading, error, retry } = useEvents(repository);
 *
 * if (loading) return <LoadingState />;
 * if (error) return <ErrorState message={error.message} onRetry={retry} />;
 * if (events.length === 0) return <EmptyState />;
 * return <EventList events={events} />;
 * ```
 */
export function useEvents(repository: EventRepository): UseEventsResult {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await repository.getEvents();
      setEvents(data);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch events")
      );
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const retry = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    retry,
  };
}
