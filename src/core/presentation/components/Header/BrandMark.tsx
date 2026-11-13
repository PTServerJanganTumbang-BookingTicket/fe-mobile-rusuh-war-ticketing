/**
 * BrandMark Component
 *
 * Renders the Rusuh brand mark (red stylized logo icon)
 * using View shapes per ADR-GH51-01.
 *
 * Requirements: R1-AC1, R3-AC1
 */
import React from "react";
import { View } from "react-native";

export interface BrandMarkProps {
  size?: number;
  color?: string;
}

export function BrandMark({
  size = 32,
  color = "#EC1C2E",
}: BrandMarkProps): React.JSX.Element {
  // Scale factor for proportional sizing
  const scale = size / 32;

  return (
    <View
      accessibilityLabel="Rusuh logo"
      accessibilityRole="image"
      style={{ width: size, height: size }}
      testID="brand-mark"
    >
      {/* Stylized ticket/sound wave icon using simple shapes */}
      <View
        style={{
          position: "absolute",
          left: 2 * scale,
          top: 4 * scale,
          width: 8 * scale,
          height: 24 * scale,
          backgroundColor: color,
          borderRadius: 4 * scale,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 12 * scale,
          top: 8 * scale,
          width: 8 * scale,
          height: 16 * scale,
          backgroundColor: color,
          borderRadius: 4 * scale,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 22 * scale,
          top: 4 * scale,
          width: 8 * scale,
          height: 24 * scale,
          backgroundColor: color,
          borderRadius: 4 * scale,
        }}
      />
    </View>
  );
}
