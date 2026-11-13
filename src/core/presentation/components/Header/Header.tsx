/**
 * Header Component
 *
 * Shared header displaying Rusuh brand identity (brand mark + wordmark).
 * Operates in guest mode - no login button per requirements.
 *
 * Requirements: R1, R3, R4
 */
import React from "react";
import { View, Text } from "react-native";
import { BrandMark } from "./BrandMark";

export interface HeaderProps {
  testID?: string;
}

export function Header({ testID = "header" }: HeaderProps): React.JSX.Element {
  return (
    <View
      accessibilityRole="header"
      accessibilityLabel="Rusuh Booking Tiket header"
      className="flex-row items-center bg-white px-4 py-3"
      testID={testID}
    >
      {/* Brand Mark - Logo icon */}
      <BrandMark size={32} color="#EC1C2E" />

      {/* Wordmark - Brand name and subtitle */}
      <View className="ml-2">
        <Text
          className="text-lg font-bold"
          style={{ color: "#1F2937" }}
          testID="header-brand-name"
        >
          rusuh.
        </Text>
        <Text
          className="text-xs"
          style={{ color: "#6B7280" }}
          testID="header-subtitle"
        >
          BOOKING TIKET
        </Text>
      </View>
    </View>
  );
}
