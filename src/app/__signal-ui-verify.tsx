/**
 * Signal UI Runtime Verification Screen
 *
 * This screen forces Metro to bundle the real signal-ui-react-shared source
 * files through the custom resolver, css-interop extraNodeModules mapping,
 * and @gluestack-ui/themed extraNodeModules mapping.
 *
 * Purpose: Verify GH-3 Signal UI integration works at runtime.
 * Scope: Button, Text, TextField (A3-min dependencies installed).
 *
 * This file should be removed or converted to a proper feature screen
 * after Ticket #3 is merged.
 */

import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";

// Import from the core/presentation wrapper - this is the approved architecture
import { Button, Text, TextField } from "@/core/presentation/components/signal";

export default function SignalUIVerifyScreen() {
  const [inputValue, setInputValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleButtonPress = () => {
    Alert.alert("Button Pressed", "Signal UI Button onPress works!");
  };

  const handleEmailChange = (value: string) => {
    setEmailValue(value);
    // Simple email validation for error state demonstration
    if (value && !value.includes("@")) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
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
            Ticket #3 Runtime Verification (A3-min Complete)
          </Text>
        </View>

        {/* Section: Button Component Verification */}
        <View className="mb-6">
          <Text variant="h2" className="mb-4">
            Button Tests
          </Text>

          {/* Primary button with string children */}
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

        {/* Section: TextField Component Verification */}
        <View className="mb-6">
          <Text variant="h2" className="mb-4">
            TextField Tests
          </Text>

          {/* Basic TextField */}
          <View className="mb-4">
            <TextField
              name="Username"
              placeholder="Enter username"
              value={inputValue}
              onChange={setInputValue}
              variant="primary"
            />
          </View>

          {/* TextField with error state */}
          <View className="mb-4">
            <TextField
              name="Email"
              placeholder="Enter email"
              value={emailValue}
              onChange={handleEmailChange}
              variant="primary"
              errorText={emailError || undefined}
            />
          </View>

          {/* Disabled TextField */}
          <View className="mb-4">
            <TextField
              name="Disabled Field"
              placeholder="Cannot edit"
              value="Disabled value"
              onChange={() => {}}
              variant="secondary"
              disabled
            />
          </View>
        </View>

        {/* Section: Verification Checklist */}
        <View className="mb-6 p-4 bg-gray-100 rounded-lg">
          <Text variant="h3" className="mb-2">
            Verification Checklist
          </Text>
          <Text variant="body2" className="mb-1">
            ✓ Text h1, h2, h3, body1, body2, label variants render
          </Text>
          <Text variant="body2" className="mb-1">
            ✓ Button renders with primary/secondary/valid variants
          </Text>
          <Text variant="body2" className="mb-1">
            ✓ Button press triggers Alert
          </Text>
          <Text variant="body2" className="mb-1">
            ✓ Button disabled state works
          </Text>
          <Text variant="body2" className="mb-1">
            ✓ TextField renders with label
          </Text>
          <Text variant="body2" className="mb-1">
            ✓ TextField accepts input
          </Text>
          <Text variant="body2" className="mb-1">
            ✓ TextField error state displays
          </Text>
          <Text variant="body2">✓ NativeWind classes apply</Text>
        </View>

        {/* Input echo for verification */}
        {(inputValue.length > 0 || emailValue.length > 0) && (
          <View className="p-4 bg-blue-50 rounded-lg">
            <Text variant="label" color="info-5">
              Input Values:
            </Text>
            {inputValue.length > 0 && (
              <Text variant="body2">Username: {inputValue}</Text>
            )}
            {emailValue.length > 0 && (
              <Text variant="body2">Email: {emailValue}</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
