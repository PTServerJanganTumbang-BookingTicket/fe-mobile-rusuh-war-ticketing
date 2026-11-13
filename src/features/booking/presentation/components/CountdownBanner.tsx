/**
 * CountdownBanner Component
 *
 * GH-12 T11: TTL countdown display.
 * R8: Countdown timer showing remaining time.
 *
 * @module features/booking/presentation/components/CountdownBanner
 */

import React from "react";
import { View, Text } from "react-native";

/**
 * Props for CountdownBanner.
 */
export interface CountdownBannerProps {
  /** Remaining time in milliseconds */
  remainingMs: number;
  /** Whether the timer has expired */
  isExpired: boolean;
}

/**
 * Format milliseconds to MM:SS.
 */
function formatTime(ms: number): string {
  if (ms <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * CountdownBanner Component
 *
 * Displays remaining time for selection window.
 * R8-AC2: Time decrements each second.
 * R8-AC3: Shows expired state when countdown reaches 0.
 */
export function CountdownBanner({
  remainingMs,
  isExpired,
}: CountdownBannerProps): React.JSX.Element {
  const isWarning = remainingMs <= 60 * 1000 && !isExpired; // Last minute
  const timeDisplay = formatTime(remainingMs);

  if (isExpired) {
    return (
      <View className="bg-red-100 px-4 py-3 rounded-lg mb-4">
        <View className="flex-row items-center justify-center">
          <Text className="text-red-700 font-semibold text-base">
            ⏱ Time's up! Your session has expired
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className={`px-4 py-3 rounded-lg mb-4 ${
        isWarning ? "bg-orange-100" : "bg-blue-100"
      }`}
      accessibilityLabel={`Time remaining: ${timeDisplay}`}
      accessibilityRole="timer"
    >
      <View className="flex-row items-center justify-between">
        <Text
          className={`font-medium ${isWarning ? "text-orange-700" : "text-blue-700"}`}
        >
          Time remaining
        </Text>
        <Text
          className={`text-xl font-bold ${
            isWarning ? "text-orange-700" : "text-blue-700"
          }`}
        >
          {timeDisplay}
        </Text>
      </View>
    </View>
  );
}
