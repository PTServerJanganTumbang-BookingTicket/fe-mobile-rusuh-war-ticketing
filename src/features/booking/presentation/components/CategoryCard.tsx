/**
 * CategoryCard Component
 *
 * GH-12 T8: Category display with stepper controls.
 * R1-AC2: Shows name, description, price, and available stock.
 * R2: Stepper add/remove controls.
 *
 * @module features/booking/presentation/components/CategoryCard
 */

import React from "react";
import { View, Text, Pressable } from "react-native";
import type { BookingCategory } from "../../domain";

/**
 * Props for CategoryCard.
 */
export interface CategoryCardProps {
  /** Category data */
  category: BookingCategory;
  /** Current selected quantity */
  quantity: number;
  /** Whether add button is disabled */
  canAdd: boolean;
  /** Called when add button is pressed */
  onAdd: () => void;
  /** Called when remove button is pressed */
  onRemove: () => void;
}

/**
 * Format price in IDR.
 */
function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString("id-ID")}`;
}

/**
 * CategoryCard Component
 *
 * Displays a ticket category with stepper controls.
 */
export function CategoryCard({
  category,
  quantity,
  canAdd,
  onAdd,
  onRemove,
}: CategoryCardProps): React.JSX.Element {
  const isSoldOut = category.available === 0;
  const canRemove = quantity > 0;

  return (
    <View
      className="bg-white rounded-lg p-4 mb-3 border border-gray-200"
      testID={`category-card-${category.id}`}
    >
      {/* Header */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {category.name}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {category.description}
          </Text>
        </View>
        {isSoldOut && (
          <View className="bg-red-100 px-2 py-1 rounded">
            <Text className="text-red-700 text-xs font-medium">Sold Out</Text>
          </View>
        )}
      </View>

      {/* Price and stock */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-medium text-gray-900">
          {formatPrice(category.price)}
        </Text>
        <Text className="text-sm text-gray-500">
          {category.available} available
        </Text>
      </View>

      {/* Stepper */}
      {!isSoldOut && (
        <View className="flex-row items-center justify-end">
          <Pressable
            onPress={onRemove}
            disabled={!canRemove}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              canRemove ? "bg-gray-200" : "bg-gray-100"
            }`}
            accessibilityLabel={`Remove ${category.name} ticket`}
            accessibilityRole="button"
            testID={`remove-${category.id}`}
          >
            <Text
              className={`text-xl ${canRemove ? "text-gray-700" : "text-gray-400"}`}
            >
              −
            </Text>
          </Pressable>

          <Text
            className="mx-4 text-lg font-medium text-gray-900 min-w-[24px] text-center"
            accessibilityLabel={`${quantity} ${category.name} tickets selected`}
          >
            {quantity}
          </Text>

          <Pressable
            onPress={onAdd}
            disabled={!canAdd}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              canAdd ? "bg-primary-500" : "bg-gray-100"
            }`}
            accessibilityLabel={`Add ${category.name} ticket`}
            accessibilityRole="button"
            testID={`add-${category.id}`}
          >
            <Text
              className={`text-xl ${canAdd ? "text-white" : "text-gray-400"}`}
            >
              +
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
