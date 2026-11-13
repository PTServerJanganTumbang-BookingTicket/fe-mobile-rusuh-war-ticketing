/**
 * Home Route — Events Home
 *
 * The app opens directly on the events list (GH-16/GH-17 wiring).
 * Uses the real HTTP repository when EXPO_PUBLIC_API_BASE_URL is set
 * (deployed backend, contract v2.27); falls back to deterministic
 * FakeEventRepository fixtures otherwise (local dev / CI without env).
 * Pressing an enabled event card navigates to the queue waiting room.
 */
import React, { useCallback } from "react";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  EventsHomeScreen,
  FakeEventRepository,
  HttpEventRepository,
} from "@/features/events";
import type { Event } from "@/features/events";

// Expo inlines EXPO_PUBLIC_* env vars into the bundle at build time (SDK 49+)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// Real repository when a backend URL is configured; fixtures otherwise
const eventRepository = API_BASE_URL
  ? new HttpEventRepository({ baseUrl: API_BASE_URL })
  : new FakeEventRepository();

export default function HomeScreen() {
  const router = useRouter();

  // Enabled event cards navigate to the queue waiting room (queue join flow).
  // Disabled cards cannot be pressed (EventCard disables the CTA).
  const handleEventPress = useCallback(
    (event: Event) => {
      router.push(`/queue/${event.id}`);
    },
    [router]
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <EventsHomeScreen
        repository={eventRepository}
        onEventPress={handleEventPress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
});
