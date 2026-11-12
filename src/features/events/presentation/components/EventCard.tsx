/**
 * EventCard Component
 *
 * GH-17: Feature-local event card displaying event summary information.
 * Evolved from GH-16: 5 queue states, no status badge.
 *
 * Note: CTA button onPress is a placeholder — queue join is out of scope.
 */
import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Pressable,
} from "react-native";
import { Text } from "@/core/presentation/components/signal";
import type { Event } from "../../domain";

/**
 * Maps QueueState to user-friendly display text
 * GH-17: 5 states (SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED)
 */
const QUEUE_STATE_LABELS: Record<Event["queueState"], string> = {
  SCHEDULED: "Coming Soon",
  OPEN: "Queue Open",
  FULL_QUEUE: "Queue Full",
  FULL_BOOKED: "Full (May Return)", // PRODUCT_COPY_CONFIRMATION_REQUIRED
  CLOSED: "Closed",
};

/**
 * Maps QueueState to indicator colors
 */
const QUEUE_STATE_COLORS: Record<
  Event["queueState"],
  { indicator: string; text: string }
> = {
  SCHEDULED: { indicator: "#9ca3af", text: "#6b7280" }, // Gray
  OPEN: { indicator: "#22c55e", text: "#16a34a" }, // Green
  FULL_QUEUE: { indicator: "#f97316", text: "#ea580c" }, // Orange
  FULL_BOOKED: { indicator: "#ef4444", text: "#dc2626" }, // Red
  CLOSED: { indicator: "#6b7280", text: "#4b5563" }, // Dark gray
};

export type EventCardProps = {
  /** Event data to display */
  event: Event;
  /** Optional press handler (placeholder for future navigation) */
  onPress?: () => void;
};

/**
 * Placeholder image for when imageUrl is empty or fails to load
 */
const PLACEHOLDER_IMAGE: ImageSourcePropType = {
  uri: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+",
};

/**
 * Formats date string for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Derives CTA button text from queue state and enabled flag
 * GH-17: Labels derived from queueState, not display.action
 */
function getCTALabel(
  queueState: Event["queueState"],
  enabled: boolean
): string {
  if (!enabled) {
    return "Unavailable";
  }
  // OPEN or FULL_BOOKED with enabled=true
  return queueState === "FULL_BOOKED" ? "Notify Me" : "Join Queue";
}

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCTAPress = () => {
    // Placeholder: Queue join is out of scope for GH-17
    // eslint-disable-next-line no-console
    console.log(`CTA pressed for event: ${event.id}`);
    onPress?.();
  };

  const imageSource =
    event.imageUrl && !imageError ? { uri: event.imageUrl } : PLACEHOLDER_IMAGE;

  const queueStateStyle = QUEUE_STATE_COLORS[event.queueState];

  return (
    <View style={styles.card}>
      {/* Event Image */}
      <Image
        source={imageSource}
        style={styles.image}
        onError={handleImageError}
        accessibilityLabel={`Image for ${event.name}`}
      />

      {/* Event Details */}
      <View style={styles.content}>
        {/* Category */}
        <Text style={styles.category}>{event.category}</Text>

        {/* Event Name */}
        <Text style={styles.name}>{event.name}</Text>

        {/* Location */}
        <Text style={styles.location}>{event.location}</Text>

        {/* Date */}
        <Text style={styles.date}>{formatDate(event.date)}</Text>

        {/* Queue State Indicator */}
        <View style={styles.queueStateContainer}>
          <View
            style={[
              styles.queueStateIndicator,
              { backgroundColor: queueStateStyle.indicator },
            ]}
          />
          <Text
            style={[styles.queueStateText, { color: queueStateStyle.text }]}
          >
            {QUEUE_STATE_LABELS[event.queueState]}
          </Text>
        </View>

        {/* CTA Button */}
        <Pressable
          style={[
            styles.ctaButton,
            !event.display.enabled && styles.ctaButtonDisabled,
          ]}
          onPress={handleCTAPress}
          disabled={!event.display.enabled}
          accessibilityRole="button"
          accessibilityState={{ disabled: !event.display.enabled }}
        >
          <Text
            style={[
              styles.ctaButtonText,
              !event.display.enabled && styles.ctaButtonTextDisabled,
            ]}
          >
            {getCTALabel(event.queueState, event.display.enabled)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: "#e5e7eb",
  },
  content: {
    padding: 16,
  },
  category: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  location: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
  },
  queueStateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  queueStateIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  queueStateText: {
    fontSize: 13,
    fontWeight: "500",
  },
  ctaButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  ctaButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
  ctaButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  ctaButtonTextDisabled: {
    color: "#9ca3af",
  },
});
