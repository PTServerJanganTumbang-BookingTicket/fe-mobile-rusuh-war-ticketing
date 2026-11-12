/**
 * EventCard Component
 *
 * GH-16: Feature-local event card displaying event summary information.
 * Matches Figma "Home — Mobile" frame patterns.
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
 */
const QUEUE_STATE_LABELS: Record<Event["queueState"], string> = {
  NOT_OPEN: "Coming Soon",
  DIRECT: "Direct Purchase",
  OPEN: "Open",
  FULL: "Queue Full",
};

/**
 * Maps EventStatus to user-friendly display text
 */
const STATUS_LABELS: Record<Event["status"], string> = {
  AVAILABLE: "Available",
  SELLING_OUT_FAST: "Selling Out Fast",
  SOLD_OUT: "Sold Out",
};

/**
 * Maps EventStatus to badge style
 */
const STATUS_COLORS: Record<
  Event["status"],
  { backgroundColor: string; color: string }
> = {
  AVAILABLE: { backgroundColor: "#22c55e", color: "#ffffff" },
  SELLING_OUT_FAST: { backgroundColor: "#f97316", color: "#ffffff" },
  SOLD_OUT: { backgroundColor: "#ef4444", color: "#ffffff" },
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

export const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCTAPress = () => {
    // Placeholder: Queue join is out of scope for GH-16
    // eslint-disable-next-line no-console
    console.log(`CTA pressed for event: ${event.id}`);
    onPress?.();
  };

  const imageSource =
    event.imageUrl && !imageError ? { uri: event.imageUrl } : PLACEHOLDER_IMAGE;

  const statusStyle = STATUS_COLORS[event.status];

  return (
    <View style={styles.card}>
      {/* Event Image */}
      <Image
        source={imageSource}
        style={styles.image}
        onError={handleImageError}
        accessibilityLabel={`Image for ${event.name}`}
      />

      {/* Status Badge */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusStyle.backgroundColor },
        ]}
      >
        <Text style={[styles.statusText, { color: statusStyle.color }]}>
          {STATUS_LABELS[event.status]}
        </Text>
      </View>

      {/* Event Details */}
      <View style={styles.content}>
        {/* Category */}
        <Text style={styles.category}>{event.category}</Text>

        {/* Event Name */}
        <Text style={styles.name}>{event.name}</Text>

        {/* Location */}
        <Text style={styles.location}>
          {event.venue}, {event.city}
        </Text>

        {/* Date */}
        <Text style={styles.date}>{formatDate(event.date)}</Text>

        {/* Queue State Indicator */}
        <View style={styles.queueStateContainer}>
          <View style={styles.queueStateIndicator} />
          <Text style={styles.queueStateText}>
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
            {event.display.enabled
              ? event.display.action === "JOIN_QUEUE"
                ? "Join Queue"
                : "Buy Tickets"
              : "Unavailable"}
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
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
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
    backgroundColor: "#3b82f6",
    marginRight: 8,
  },
  queueStateText: {
    fontSize: 13,
    color: "#3b82f6",
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
