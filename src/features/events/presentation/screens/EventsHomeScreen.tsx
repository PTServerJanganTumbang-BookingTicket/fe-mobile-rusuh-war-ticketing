/**
 * EventsHomeScreen
 *
 * GH-16: Main screen composing event list with loading, empty, and error states.
 * Uses useEvents hook for data fetching.
 * Section header (title + subtitle) mirrors the web HomeView event list header.
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/core/presentation/components/signal";
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

  return (
    <View style={styles.container}>
      {/* Section header (web HomeView pattern: title + subtitle above the list) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upcoming Events</Text>
        <Text style={styles.headerSubtitle}>
          Find exciting experiences waiting for you
        </Text>
      </View>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error.message} onRetry={retry} />
      ) : events.length === 0 ? (
        <EmptyState />
      ) : (
        <EventList events={events} onEventPress={onEventPress} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
    color: "#6b7280",
  },
});
