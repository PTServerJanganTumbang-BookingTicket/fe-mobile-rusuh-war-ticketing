/**
 * LoadingState Component
 *
 * GH-16: Feature-local loading indicator for Events Home.
 */
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Text } from "@/core/presentation/components/signal";

export const LoadingState: React.FC = () => {
  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={styles.text}>Loading events...</Text>
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
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
});
