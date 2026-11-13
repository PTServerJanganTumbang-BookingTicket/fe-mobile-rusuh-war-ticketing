/**
 * ProgressBar Component
 *
 * GH-8 T7: Progress visualization for Queue waiting room.
 * Built locally as Signal UI does not include this component.
 *
 * @module features/queue/presentation/components/ProgressBar
 */

import React from "react";
import { View } from "react-native";

export interface ProgressBarProps {
  /** Progress value (0-100) */
  progress: number;
  /** Height of the progress bar. Defaults to 8. */
  height?: number;
  /** Accessible label for screen readers */
  accessibilityLabel?: string;
}

/**
 * Horizontal progress bar showing queue progress.
 *
 * Accessibility:
 * - Uses progressbar role
 * - Provides min/max/now values
 * - Custom label for context
 */
export function ProgressBar({
  progress,
  height = 8,
  accessibilityLabel = "Queue progress",
}: ProgressBarProps): React.ReactElement {
  // Clamp progress to valid range
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View
      className="w-full rounded-full bg-gray-200"
      style={{ height }}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clampedProgress,
      }}
      accessibilityLabel={accessibilityLabel}
    >
      <View
        className="h-full rounded-full bg-[#EC1C2E]"
        style={{ width: `${clampedProgress}%` }}
        testID="progress-bar-fill"
      />
    </View>
  );
}
