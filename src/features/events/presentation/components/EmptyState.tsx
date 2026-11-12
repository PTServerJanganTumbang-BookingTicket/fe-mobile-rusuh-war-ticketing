/**
 * EmptyState Component
 *
 * GH-16: Feature-local empty state for Events Home.
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/core/presentation/components/signal";

export const EmptyState: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No Events Available</Text>
      <Text style={styles.subtitle}>Check back later for upcoming events.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
});
