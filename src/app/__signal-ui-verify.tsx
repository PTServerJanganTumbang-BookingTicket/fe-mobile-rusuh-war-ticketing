/**
 * Signal UI Runtime Verification Screen
 *
 * This screen forces Metro to bundle the real signal-ui-react-shared source
 * files through the custom resolver and css-interop extraNodeModules mapping.
 *
 * Purpose: Verify GH-3 Signal UI integration works at runtime.
 * Scope: Button, Text verification (TextField BLOCKED - requires @gluestack-ui/themed).
 *
 * This file should be removed or converted to a proper feature screen
 * after Ticket #3 is merged.
 */

import { useState } from "react";
import { View, ScrollView, Alert, TextInput } from "react-native";

// Import from the core/presentation wrapper - this is the approved architecture
import { Button, Text } from "@/core/presentation/components/signal";

export default function SignalUIVerifyScreen() {
  const [inputValue, setInputValue] = useState("");

  const handleButtonPress = () => {
    Alert.alert("Button Pressed", "Signal UI Button onPress works!");
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-4">
        {/* Section: Text Component Verification */}
        <View className="mb-6">
          <Text variant="h1" className="mb-2">
            Signal UI Verify
          </Text>
          <Text variant="body1" className="mb-2">
            This screen verifies real Signal UI source bundling.
          </Text>
          <Text variant="label" color="neutral-5">
            Ticket #3 Runtime Verification
          </Text>
        </View>

        {/* Section: Button Component Verification */}
        <View className="mb-6">
          <Text variant="h2" className="mb-4">
            Button Tests
          </Text>

          {/* Primary button with string children - T3-06 warning trigger */}
          <View className="mb-3">
            <Button
              variant="primary"
              color="primary"
              onPress={handleButtonPress}
            >
              Primary Button
            </Button>
          </View>

          {/* Secondary button */}
          <View className="mb-3">
            <Button
              variant="secondary"
              color="secondary"
              onPress={handleButtonPress}
            >
              Secondary Button
            </Button>
          </View>

          {/* Full width button */}
          <View className="mb-3">
            <Button
              variant="primary"
              color="valid"
              full
              onPress={handleButtonPress}
            >
              Full Width Button
            </Button>
          </View>

          {/* Disabled button */}
          <View className="mb-3">
            <Button variant="primary" disabled onPress={handleButtonPress}>
              Disabled Button
            </Button>
          </View>
        </View>

        {/* Section: TextField Note - BLOCKED */}
        <View className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <Text variant="h3" className="mb-2">
            TextField - BLOCKED
          </Text>
          <Text variant="body2" className="mb-2">
            TextField requires @gluestack-ui/themed dependency which is not
            installed. Using RN TextInput as placeholder for input verification.
          </Text>
          <TextInput
            className="border border-gray-300 rounded p-2"
            placeholder="Enter text here"
            value={inputValue}
            onChangeText={setInputValue}
          />
        </View>

        {/* Section: Verification Checklist */}
        <View className="mb-6 p-4 bg-gray-100 rounded-lg">
          <Text variant="h3" className="mb-2">
            Verification Checklist
          </Text>
          <Text variant="body2" className="mb-1">
            ✓ Text h1, body1, label variants render
          </Text>
          <Text variant="body2" className="mb-1">
            ✓ Button renders with variants
          </Text>
          <Text variant="body2" className="mb-1">
            ✓ Button press triggers Alert
          </Text>
          <Text variant="body2" className="mb-1">
            ⚠ TextField BLOCKED - needs @gluestack-ui/themed
          </Text>
          <Text variant="body2">✓ NativeWind classes apply</Text>
        </View>

        {/* Input echo for verification */}
        {inputValue.length > 0 && (
          <View className="p-4 bg-blue-50 rounded-lg">
            <Text variant="label" color="info-5">
              Input Value:
            </Text>
            <Text variant="body1">{inputValue}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
