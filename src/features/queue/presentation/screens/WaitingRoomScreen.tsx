/**
 * WaitingRoomScreen
 *
 * GH-8 T9: Main screen for Queue waiting room.
 * Composes useQueue, ProgressBar, and state views.
 *
 * @module features/queue/presentation/screens/WaitingRoomScreen
 */

import React from "react";
import { View, Text, SafeAreaView } from "react-native";
import type { QueueState } from "@/core/domain";
import { ProgressBar } from "../components/ProgressBar";
import {
  QueuedView,
  FullBookedView,
  FullQueueView,
  ClosedView,
  GrantedView,
} from "../components/QueueStateViews";
import type { UseQueueResult } from "../hooks";

/**
 * Props for WaitingRoomScreen.
 * Receives queue state from parent (allows DI pattern).
 */
export interface WaitingRoomScreenProps {
  /** Queue state from useQueue hook */
  queueState: UseQueueResult;
}

/**
 * Renders the appropriate view based on queue and engagement state.
 */
function QueueStateRenderer({
  queueState,
  engagementState,
  position,
  etaDisplay,
  grant,
}: {
  queueState: QueueState;
  engagementState: string;
  position: number;
  etaDisplay: string;
  grant: UseQueueResult["grant"];
}): React.ReactElement {
  // Grant takes precedence
  if (engagementState === "GRANTED" && grant) {
    return <GrantedView token={grant.token} expiresAt={grant.expiresAt} />;
  }

  // Queue state-specific views
  switch (queueState) {
    case "FULL_BOOKED":
      return <FullBookedView />;
    case "FULL_QUEUE":
      return <FullQueueView />;
    case "CLOSED":
      return <ClosedView />;
    case "OPEN":
    case "SCHEDULED":
    default:
      return <QueuedView position={position} etaDisplay={etaDisplay} />;
  }
}

/**
 * WaitingRoomScreen
 *
 * Displays the queue waiting room with progress bar and state-specific views.
 * Navigation to booking screen is deferred (GH-16).
 */
export function WaitingRoomScreen({
  queueState,
}: WaitingRoomScreenProps): React.ReactElement {
  const {
    position,
    etaDisplay,
    progress,
    queueState: qState,
    engagementState,
    isGranted,
    grant,
    loading,
  } = queueState;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" testID="waiting-room-screen">
      <View className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-center text-2xl font-bold text-gray-900">
            Waiting Room
          </Text>
          <Text className="mt-2 text-center text-gray-600">
            {isGranted
              ? "You're ready to purchase!"
              : "Please wait for your turn"}
          </Text>
        </View>

        {/* Progress Bar (not shown when granted or terminal) */}
        {!isGranted && qState !== "CLOSED" && (
          <View className="mb-8">
            <ProgressBar
              progress={progress}
              accessibilityLabel={`Queue progress: ${progress}%`}
            />
            <Text
              className="mt-2 text-center text-sm text-gray-500"
              testID="progress-text"
            >
              {progress}% complete
            </Text>
          </View>
        )}

        {/* State-specific content */}
        <View className="flex-1 items-center justify-center">
          <QueueStateRenderer
            queueState={qState}
            engagementState={engagementState}
            position={position}
            etaDisplay={etaDisplay}
            grant={grant}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
