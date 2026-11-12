/**
 * EventList Component
 *
 * GH-16: FlatList wrapper for rendering event cards.
 */
import React from "react";
import { FlatList, StyleSheet } from "react-native";
import type { Event } from "../../domain";
import { EventCard } from "./EventCard";

export type EventListProps = {
  /** Array of events to display */
  events: Event[];
  /** Optional handler when an event card is pressed */
  onEventPress?: (event: Event) => void;
};

/**
 * Renders a scrollable list of EventCard components
 */
export const EventList: React.FC<EventListProps> = ({
  events,
  onEventPress,
}) => {
  const renderItem = ({ item }: { item: Event }) => (
    <EventCard event={item} onPress={() => onEventPress?.(item)} />
  );

  const keyExtractor = (item: Event) => item.id;

  return (
    <FlatList
      data={events}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
  },
});
