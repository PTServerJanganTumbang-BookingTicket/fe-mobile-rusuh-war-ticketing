/**
 * EventsHomeScreen
 *
 * GH-16: Main screen composing event list with loading, empty, and error states.
 * Uses useEvents hook for data fetching.
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import type { Event, EventRepository } from "../../domain";
import { useEvents } from "../hooks/useEvents";
import { EventList } from "../components/EventList";
import { LoadingState } from "../components/LoadingState";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";

export type EventsHomeScreenProps = {
  /** Repository implementation for data fetching */
  repository: EventRepository;
  /** Optional handler when an event card is pressed */
  onEventPress?: (event: Event) => void;
};

/**
 * Events Home screen with state handling
 * Renders exactly one of: LoadingState, EventList, EmptyState, or ErrorState
 */
export const EventsHomeScreen: React.FC<EventsHomeScreenProps> = ({
  repository,
  onEventPress,
}) => {
  const { events, loading, error, retry } = useEvents(repository);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <ErrorState message={error.message} onRetry={retry} />
      </View>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState />
      </View>
    );
  }

  // Populated state
  return (
    <View style={styles.container}>
      <EventList events={events} onEventPress={onEventPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
});
