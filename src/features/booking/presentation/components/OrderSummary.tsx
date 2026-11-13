/**
 * OrderSummary Component
 *
 * GH-12 T10: Selection summary with totals.
 * R10: Real-time order summary as selections change.
 *
 * @module features/booking/presentation/components/OrderSummary
 */

import React from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import type { TicketSlot } from "../../domain";

/**
 * Line item for order summary.
 */
export interface OrderLine {
  categoryName: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Props for OrderSummary.
 */
export interface OrderSummaryProps {
  /** Line items */
  lines: OrderLine[];
  /** Subtotal amount */
  subtotal: number;
  /** Whether submit is disabled */
  disabled: boolean;
  /** Whether submission is in progress */
  busy: boolean;
  /** Called when submit button is pressed */
  onSubmit: () => void;
}

/**
 * Format price in IDR.
 */
function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString("id-ID")}`;
}

/**
 * Build order lines from slots.
 */
export function buildOrderLines(slots: TicketSlot[]): OrderLine[] {
  const byCategory = new Map<string, OrderLine>();

  for (const slot of slots) {
    const existing = byCategory.get(slot.categoryId);
    if (existing) {
      existing.quantity += 1;
    } else {
      byCategory.set(slot.categoryId, {
        categoryName: slot.categoryName,
        quantity: 1,
        unitPrice: slot.price,
      });
    }
  }

  return Array.from(byCategory.values());
}

/**
 * OrderSummary Component
 *
 * Shows line items, subtotal, and submit button.
 */
export function OrderSummary({
  lines,
  subtotal,
  disabled,
  busy,
  onSubmit,
}: OrderSummaryProps): React.JSX.Element {
  const isEmpty = lines.length === 0;

  return (
    <View className="bg-white rounded-lg p-4 border border-gray-200">
      <Text className="text-lg font-semibold text-gray-900 mb-3">
        Order Summary
      </Text>

      {isEmpty ? (
        <Text className="text-gray-500 italic mb-4">No tickets selected</Text>
      ) : (
        <>
          {/* Line items */}
          {lines.map((line, index) => (
            <View
              key={`line-${index}`}
              className="flex-row justify-between mb-2"
            >
              <Text className="text-gray-700">
                {line.categoryName} × {line.quantity}
              </Text>
              <Text className="text-gray-900 font-medium">
                {formatPrice(line.unitPrice * line.quantity)}
              </Text>
            </View>
          ))}

          {/* Divider */}
          <View className="h-px bg-gray-200 my-3" />

          {/* Subtotal */}
          <View className="flex-row justify-between mb-4">
            <Text className="text-gray-900 font-semibold">Subtotal</Text>
            <Text className="text-gray-900 font-bold text-lg">
              {formatPrice(subtotal)}
            </Text>
          </View>

          <Text className="text-gray-500 text-xs mb-3">
            Service fee will be calculated at checkout
          </Text>
        </>
      )}

      {/* Submit button */}
      <Pressable
        onPress={onSubmit}
        disabled={disabled || busy || isEmpty}
        className={`py-4 rounded-lg items-center ${
          disabled || busy || isEmpty
            ? "bg-gray-300"
            : "bg-primary-500 active:bg-primary-600"
        }`}
        accessibilityRole="button"
        accessibilityLabel="Proceed to payment"
        testID="submit-booking"
      >
        {busy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text
            className={`font-semibold text-base ${
              disabled || isEmpty ? "text-gray-500" : "text-white"
            }`}
          >
            Pay
          </Text>
        )}
      </Pressable>
    </View>
  );
}
