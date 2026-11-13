/**
 * EventCard Render Tests
 *
 * GH-17: Verify EventCard renders all 5 queue states correctly.
 * Evolution from GH-16:
 * - 5 queue states instead of 4
 * - No status badge (EventStatus removed)
 * - CTA label derived from queueState, not display.action
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { EventCard } from "@/features/events/presentation";
import type { Event } from "@/features/events/domain";

describe("EventCard", () => {
  const baseEvent: Event = {
    id: "evt_test",
    name: "Test Concert",
    category: "LIVE MUSIC",
    location: "Test Venue, Jakarta", // GH-17: merged venue/city
    date: "2026-12-25",
    imageUrl: "/images/test.webp",
    queueState: "OPEN",
    display: {
      enabled: true,
    },
  };

  describe("Required fields display", () => {
    it("should render event name", async () => {
      const result = await render(<EventCard event={baseEvent} />);
      expect(result.getByText("Test Concert")).toBeTruthy();
    });

    it("should render category", async () => {
      const result = await render(<EventCard event={baseEvent} />);
      expect(result.getByText("LIVE MUSIC")).toBeTruthy();
    });

    it("should render location (GH-17: merged venue/city)", async () => {
      const result = await render(<EventCard event={baseEvent} />);
      expect(result.getByText("Test Venue, Jakarta")).toBeTruthy();
    });

    it("should render formatted date", async () => {
      const result = await render(<EventCard event={baseEvent} />);
      // Date format depends on locale, but should contain year
      expect(result.getByText(/2026/)).toBeTruthy();
    });

    it("should render event image with accessibility label", async () => {
      const result = await render(<EventCard event={baseEvent} />);
      expect(result.getByLabelText("Image for Test Concert")).toBeTruthy();
    });
  });

  describe("Queue state indicator (GH-17: 5 states)", () => {
    // RT-EVT17-01: SCHEDULED renders
    it('should display "Coming Soon" for SCHEDULED queue state', async () => {
      const event: Event = {
        ...baseEvent,
        queueState: "SCHEDULED",
        display: { enabled: false },
      };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Coming Soon")).toBeTruthy();
    });

    // RT-EVT17-02: OPEN renders
    it('should display "Queue Open" for OPEN queue state', async () => {
      const event: Event = {
        ...baseEvent,
        queueState: "OPEN",
        display: { enabled: true },
      };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Queue Open")).toBeTruthy();
    });

    // RT-EVT17-03: FULL_QUEUE renders
    it('should display "Queue Full" for FULL_QUEUE queue state', async () => {
      const event: Event = {
        ...baseEvent,
        queueState: "FULL_QUEUE",
        display: { enabled: false },
      };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Queue Full")).toBeTruthy();
    });

    // RT-EVT17-04: FULL_BOOKED renders
    it('should display "Full" for FULL_BOOKED queue state', async () => {
      const event: Event = {
        ...baseEvent,
        queueState: "FULL_BOOKED",
        display: { enabled: true }, // R7-AC2: FULL_BOOKED has enabled=true
      };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Full")).toBeTruthy();
    });

    // RT-EVT17-05: CLOSED renders
    it('should display "Closed" for CLOSED queue state', async () => {
      const event: Event = {
        ...baseEvent,
        queueState: "CLOSED",
        display: { enabled: false },
      };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Closed")).toBeTruthy();
    });
  });

  describe("CTA button", () => {
    it("should be enabled when display.enabled is true", async () => {
      const result = await render(<EventCard event={baseEvent} />);
      // Check the button text is "Join Queue →" (enabled state with arrow - GH-52)
      expect(result.getByText("Join Queue →")).toBeTruthy();
    });

    it("should be disabled when display.enabled is false", async () => {
      const event: Event = {
        ...baseEvent,
        display: { enabled: false },
      };
      const result = await render(<EventCard event={event} />);
      // Check the button text is "Unavailable" (disabled state, no arrow)
      expect(result.getByText("Unavailable")).toBeTruthy();
    });

    it('should display "Join Queue →" with arrow for OPEN with enabled=true (GH-52)', async () => {
      const event: Event = {
        ...baseEvent,
        queueState: "OPEN",
        display: { enabled: true },
      };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Join Queue →")).toBeTruthy();
    });

    it('should display "Notify Me →" with arrow for FULL_BOOKED with enabled=true (GH-52)', async () => {
      const event: Event = {
        ...baseEvent,
        queueState: "FULL_BOOKED",
        display: { enabled: true },
      };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Notify Me →")).toBeTruthy();
    });

    it('should display "Unavailable" without arrow when disabled (GH-52)', async () => {
      const event: Event = {
        ...baseEvent,
        display: { enabled: false },
      };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Unavailable")).toBeTruthy();
    });

    it("should call onPress when CTA is pressed and enabled", async () => {
      const onPress = jest.fn();
      const result = await render(
        <EventCard event={baseEvent} onPress={onPress} />
      );

      fireEvent.press(result.getByText("Join Queue →"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("should not call onPress when CTA is pressed and disabled", async () => {
      const onPress = jest.fn();
      const event: Event = {
        ...baseEvent,
        display: { enabled: false },
      };
      const result = await render(
        <EventCard event={event} onPress={onPress} />
      );

      fireEvent.press(result.getByText("Unavailable"));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe("Image handling", () => {
    it("should render image with provided URL", async () => {
      const result = await render(<EventCard event={baseEvent} />);
      const image = result.getByLabelText("Image for Test Concert");
      expect(image).toBeTruthy();
    });

    it("should handle empty imageUrl", async () => {
      const event: Event = { ...baseEvent, imageUrl: "" };
      const result = await render(<EventCard event={event} />);
      // Should still render with placeholder
      expect(result.getByLabelText("Image for Test Concert")).toBeTruthy();
    });
  });

  describe("FULL_BOOKED enabled=true (R7-AC2)", () => {
    it("should have CTA button enabled for FULL_BOOKED state", async () => {
      const event: Event = {
        ...baseEvent,
        queueState: "FULL_BOOKED",
        display: { enabled: true },
      };
      const onPress = jest.fn();
      const result = await render(
        <EventCard event={event} onPress={onPress} />
      );

      // CTA should be clickable (with arrow - GH-52)
      fireEvent.press(result.getByText("Notify Me →"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });
});
