/**
 * Queue State Display Views
 *
 * GH-8 T8: Display components for different Queue states.
 * Composition-ready for WaitingRoomScreen.
 *
 * @module features/queue/presentation/components/QueueStateViews
 */

import React from "react";
import { View, Text } from "react-native";

/**
 * Props for QueuedView - normal queue state
 */
export interface QueuedViewProps {
  position: number;
  etaDisplay: string;
}

/**
 * Normal queued state view showing position and ETA.
 */
export function QueuedView({
  position,
  etaDisplay,
}: QueuedViewProps): React.ReactElement {
  return (
    <View className="items-center" testID="queued-view">
      <Text
        className="text-4xl font-bold text-gray-900"
        testID="queue-position"
      >
        #{position}
      </Text>
      <Text className="mt-2 text-lg text-gray-600">Your position in queue</Text>
      <Text className="mt-4 text-base text-gray-500" testID="queue-eta">
        Estimated wait: {etaDisplay}
      </Text>
    </View>
  );
}

/**
 * FULL_BOOKED state view - inventory exhausted
 */
export function FullBookedView(): React.ReactElement {
  return (
    <View className="items-center" testID="full-booked-view">
      <Text className="text-2xl font-semibold text-amber-600">
        Inventory Temporarily Exhausted
      </Text>
      <Text className="mt-2 text-center text-gray-600">
        All tickets are currently held. Stay in queue — slots may open if others
        don&apos;t complete their purchase.
      </Text>
    </View>
  );
}

/**
 * FULL_QUEUE state view - queue capacity reached
 */
export function FullQueueView(): React.ReactElement {
  return (
    <View className="items-center" testID="full-queue-view">
      <Text className="text-2xl font-semibold text-orange-600">
        Queue is Full
      </Text>
      <Text className="mt-2 text-center text-gray-600">
        The queue has reached maximum capacity. Please try again later.
      </Text>
    </View>
  );
}

/**
 * CLOSED state view - terminal state
 */
export function ClosedView(): React.ReactElement {
  return (
    <View className="items-center" testID="closed-view">
      <Text className="text-2xl font-semibold text-red-600">Sale Closed</Text>
      <Text className="mt-2 text-center text-gray-600">
        This ticket sale has ended. Thank you for your interest.
      </Text>
    </View>
  );
}

/**
 * Props for GrantedView
 */
export interface GrantedViewProps {
  /** Grant token (for display/debugging) */
  token: string;
  /** Expiry timestamp */
  expiresAt: string;
}

/**
 * GRANTED state view - user received a slot
 */
export function GrantedView({
  token,
  expiresAt,
}: GrantedViewProps): React.ReactElement {
  // Format expiry time for display
  const expiryDate = new Date(expiresAt);
  const expiryTime = expiryDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <View className="items-center" testID="granted-view">
      <Text className="text-2xl font-semibold text-green-600">
        🎉 You&apos;re In!
      </Text>
      <Text className="mt-2 text-center text-gray-600">
        You&apos;ve been granted access to purchase tickets.
      </Text>
      <Text className="mt-4 text-sm text-gray-500">
        Complete your purchase by {expiryTime}
      </Text>
      <Text
        className="mt-2 text-xs text-gray-400"
        testID="grant-token"
        accessibilityLabel="Grant token"
      >
        Token: {token.slice(0, 8)}...
      </Text>
    </View>
  );
}
