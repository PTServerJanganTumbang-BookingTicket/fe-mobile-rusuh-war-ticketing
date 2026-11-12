/**
 * Events Home Route
 *
 * GH-16: Expo Router screen for Events Home.
 * Wires up EventsHomeScreen with FakeEventRepository.
 */
import React from "react";
import { EventsHomeScreen, FakeEventRepository } from "@/features/events";

// Create repository instance for the app
// In GH-17, this will be replaced with HttpEventRepository
const eventRepository = new FakeEventRepository();

export default function EventsScreen() {
  const handleEventPress = (event: { id: string; name: string }) => {
    // Placeholder: Event detail navigation is out of scope for GH-16
    // eslint-disable-next-line no-console
    console.log(`Navigate to event detail: ${event.id} - ${event.name}`);
  };

  return (
    <EventsHomeScreen
      repository={eventRepository}
      onEventPress={handleEventPress}
    />
  );
}
