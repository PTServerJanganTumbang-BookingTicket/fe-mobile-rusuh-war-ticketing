/**
 * NikInputField Component
 *
 * GH-12 T9: NIK input with validation state indicators.
 * R3: NIK holder input with three input modes.
 *
 * @module features/booking/presentation/components/NikInputField
 */

import React, { useState, useCallback } from "react";
import { View, Text, TextInput, ActivityIndicator } from "react-native";
import { normalizeNik, isValidNikFormat, type NikInput } from "@/core/domain";
import type { NikCheckStatus } from "../hooks";

/**
 * Props for NikInputField.
 */
export interface NikInputFieldProps {
  /** Slot title (e.g., "Ticket 1 - VIP") */
  title: string;
  /** Current NIK input value */
  value: NikInput | null;
  /** Current validation status */
  checkStatus: NikCheckStatus;
  /** Error message if any */
  errorMessage?: string;
  /** Called when NIK changes */
  onChange: (nikInput: NikInput | null) => void;
  /** Called when NIK should be validated (on blur with 16 digits) */
  onValidate?: (nik: string) => void;
  /** Unique key for accessibility */
  slotKey: string;
}

/**
 * NikInputField Component
 *
 * Provides NIK input with real-time validation feedback.
 */
export function NikInputField({
  title,
  value,
  checkStatus,
  errorMessage,
  onChange,
  onValidate,
  slotKey,
}: NikInputFieldProps): React.JSX.Element {
  const [inputValue, setInputValue] = useState(() => {
    if (value?.type === "raw") {
      return value.nik;
    }
    return "";
  });

  const handleChangeText = useCallback(
    (text: string) => {
      const normalized = normalizeNik(text);
      setInputValue(normalized);

      if (normalized.length === 0) {
        onChange(null);
      } else {
        onChange({ type: "raw", nik: normalized });
      }
    },
    [onChange]
  );

  const handleBlur = useCallback(() => {
    if (isValidNikFormat(inputValue) && onValidate) {
      onValidate(inputValue);
    }
  }, [inputValue, onValidate]);

  const isReadOnly = value?.type === "saved" || value?.type === "account";
  const displayValue = isReadOnly
    ? value?.type === "saved"
      ? "••••••••••••••••"
      : "Using account NIK"
    : inputValue;

  return (
    <View className="mb-4" testID={`nik-field-${slotKey}`}>
      {/* Label */}
      <Text
        className="text-sm font-medium text-gray-700 mb-1"
        accessibilityLabel={`NIK input for ${title}`}
      >
        {title}
      </Text>

      {/* Input container */}
      <View className="relative">
        <TextInput
          value={displayValue}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          editable={!isReadOnly}
          keyboardType="number-pad"
          maxLength={16}
          placeholder="Enter 16-digit NIK"
          placeholderTextColor="#9CA3AF"
          className={`border rounded-lg px-4 py-3 text-base ${
            checkStatus === "error"
              ? "border-red-500 bg-red-50"
              : checkStatus === "valid"
                ? "border-green-500 bg-green-50"
                : "border-gray-300 bg-white"
          } ${isReadOnly ? "bg-gray-100" : ""}`}
          accessibilityLabel={`NIK input ${title}`}
          testID={`nik-input-${slotKey}`}
        />

        {/* Status indicator */}
        <View className="absolute right-3 top-3">
          {checkStatus === "checking" && (
            <ActivityIndicator size="small" color="#6B7280" />
          )}
          {checkStatus === "valid" && (
            <Text className="text-green-600 text-lg">✓</Text>
          )}
          {checkStatus === "error" && (
            <Text className="text-red-600 text-lg">✗</Text>
          )}
        </View>
      </View>

      {/* Error message */}
      {errorMessage && (
        <Text className="text-red-600 text-sm mt-1">{errorMessage}</Text>
      )}

      {/* Character count */}
      {!isReadOnly && (
        <Text className="text-gray-500 text-xs mt-1 text-right">
          {inputValue.length}/16
        </Text>
      )}
    </View>
  );
}
