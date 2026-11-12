/**
 * E-Ticket Placeholder Screen
 *
 * GH-15: Static "Coming Soon" placeholder for e-ticket functionality.
 * Presentation-only — no domain/data layers per ADR-GH15-01.
 */
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/core/presentation/components/signal";

export const ETicketPlaceholderScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text variant="h1">Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
