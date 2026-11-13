/**
 * EventCard Component
 *
 * GH-17: Feature-local event card displaying event summary information.
 * Evolved from GH-16: 5 queue states, no status badge.
 * UI aligned with the web EventCard (Signal DS): status badge overlaid on the
 * image, "location · category" meta row in brand red, full-width CTA, and an
 * outline-style disabled CTA.
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
  FULL_BOOKED: "Full", // PRODUCT_COPY_REQUIRED: neutral label pending final copy
  CLOSED: "Closed",
};

/**
 * Maps QueueState to status badge tones.
 * Aligned with the web EventCard Badge (Signal DS status palette):
 * SCHEDULED → info, OPEN → success, FULL_QUEUE/FULL_BOOKED → warning, CLOSED → error.
 */
const QUEUE_STATE_TONES: Record<
  Event["queueState"],
  { background: string; text: string }
> = {
  SCHEDULED: { background: "#e7f5fc", text: "#0050ae" }, // info
  OPEN: { background: "#edfcf0", text: "#008e53" }, // success
  FULL_QUEUE: { background: "#fef3d4", text: "#d9801f" }, // warning
  FULL_BOOKED: { background: "#fef3d4", text: "#d9801f" }, // warning
  CLOSED: { background: "#fdddd4", text: "#bc1d42" }, // error
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
  const label = queueState === "FULL_BOOKED" ? "Notify Me" : "Join Queue";
  return `${label} →`;
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

  const queueStateTone = QUEUE_STATE_TONES[event.queueState];

  return (
    <View style={styles.card}>
      {/* Event Image with status badge overlay (web-aligned) */}
      <View style={styles.imageWrap}>
        <Image
          source={imageSource}
          style={styles.image}
          onError={handleImageError}
          accessibilityLabel={`Image for ${event.name}`}
        />
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: queueStateTone.background },
          ]}
        >
          <Text
            style={[styles.statusBadgeText, { color: queueStateTone.text }]}
          >
            {QUEUE_STATE_LABELS[event.queueState]}
          </Text>
        </View>
      </View>

      {/* Event Details */}
      <View style={styles.content}>
        {/* Meta row: location · category (web-aligned) */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{event.location}</Text>
          <Text style={styles.metaSeparator}>·</Text>
          <Text style={styles.metaText}>{event.category}</Text>
        </View>

        {/* Event Name */}
        <Text style={styles.name}>{event.name}</Text>

        {/* Date */}
        <Text style={styles.date}>{formatDate(event.date)}</Text>

        {/* CTA Button (full width, web-aligned) */}
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
  imageWrap: {
    position: "relative",
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#e5e7eb",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 8,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EC1C2E",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaSeparator: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EC1C2E",
    marginHorizontal: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: "#EC1C2E",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  ctaButtonDisabled: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ctaButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  ctaButtonTextDisabled: {
    color: "#9ca3af",
  },
});
