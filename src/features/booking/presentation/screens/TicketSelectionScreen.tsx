/**
 * TicketSelectionScreen
 *
 * GH-12 T11: Main screen composing all ticket selection components.
 * R1, R7, R8: Category selection, booking, and countdown.
 *
 * @module features/booking/presentation/screens/TicketSelectionScreen
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useBooking, type BookingDataSourceInterface } from "../hooks";
import {
  CategoryCard,
  CountdownBanner,
  NikInputField,
  OrderSummary,
  buildOrderLines,
} from "../components";

/**
 * Props for TicketSelectionScreen.
 */
export interface TicketSelectionScreenProps {
  /** Event ID */
  eventId: string;
  /** Grant token for authentication */
  grantToken?: string;
  /** Data source via DI */
  dataSource: BookingDataSourceInterface;
  /** Called when booking succeeds */
  onBookingSuccess?: (bookingId: string) => void;
}

/**
 * TicketSelectionScreen Component
 *
 * Composes: CountdownBanner, CategoryCard list, NikInputField per slot, OrderSummary.
 */
export function TicketSelectionScreen({
  eventId,
  dataSource,
  onBookingSuccess,
}: TicketSelectionScreenProps): React.JSX.Element {
  const {
    // Data
    categories,
    event,
    // Selection
    slots,
    canAdd,
    addTicket,
    removeTicket,
    selection,
    // NIK
    nikChecks,
    setSlotNik,
    validateSlotNik,
    // Summary
    subtotal,
    // Countdown
    remainingTimeMs,
    isExpired,
    // Submission
    contactEmail: _contactEmail,
    setContactEmail: _setContactEmail,
    submitBooking,
    isSubmitting,
    // Loading/Error
    isLoading,
    error,
    // Validation
    validationErrors,
    isValid,
  } = useBooking({ eventId, dataSource });

  const handleSubmit = useCallback(async () => {
    try {
      const response = await submitBooking();
      onBookingSuccess?.(response.bookingId);
    } catch {
      // Error is handled by hook
    }
  }, [submitBooking, onBookingSuccess]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-600">Loading tickets...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-red-600 text-lg font-semibold mb-2">Error</Text>
          <Text className="text-gray-700 text-center">{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const orderLines = buildOrderLines(slots);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        {/* Event info */}
        {event && (
          <View className="mb-4">
            <Text className="text-xl font-bold text-gray-900">
              {event.name}
            </Text>
            <Text className="text-gray-600">{event.venue}</Text>
          </View>
        )}

        {/* Countdown */}
        <CountdownBanner remainingMs={remainingTimeMs} isExpired={isExpired} />

        {/* Categories */}
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Select Tickets
        </Text>
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            quantity={selection[category.id] ?? 0}
            canAdd={canAdd(category)}
            onAdd={() => addTicket(category)}
            onRemove={() => removeTicket(category.id)}
          />
        ))}

        {/* NIK inputs */}
        {slots.length > 0 && (
          <>
            <Text className="text-lg font-semibold text-gray-900 mt-4 mb-3">
              Ticket Holders
            </Text>
            {slots.map((slot, index) => (
              <NikInputField
                key={slot.slotKey}
                title={`Ticket ${index + 1} - ${slot.categoryName}`}
                value={slot.nikInput}
                checkStatus={nikChecks.get(slot.slotKey)?.status ?? "idle"}
                errorMessage={
                  validationErrors.get(slot.slotKey) ??
                  nikChecks.get(slot.slotKey)?.message
                }
                onChange={(nikInput) => setSlotNik(slot.slotKey, nikInput)}
                onValidate={(nik) => validateSlotNik(slot.slotKey, nik)}
                slotKey={slot.slotKey}
              />
            ))}
          </>
        )}

        {/* Order summary */}
        <View className="mt-4 mb-8">
          <OrderSummary
            lines={orderLines}
            subtotal={subtotal}
            disabled={!isValid || isExpired}
            busy={isSubmitting}
            onSubmit={handleSubmit}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
