/**
 * EventCard Render Tests
 *
 * GH-16: Verify EventCard renders all required fields and states correctly.
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
    venue: "Test Venue",
    city: "Jakarta",
    date: "2026-12-25",
    imageUrl: "/images/test.webp",
    status: "AVAILABLE",
    queueState: "OPEN",
    display: {
      enabled: true,
      action: "JOIN_QUEUE",
      labelKey: "join_queue",
      badgeKey: null,
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

    it("should render venue and city", async () => {
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

  describe("Status badge", () => {
    it('should display "Available" for AVAILABLE status', async () => {
      const result = await render(<EventCard event={baseEvent} />);
      expect(result.getByText("Available")).toBeTruthy();
    });

    it('should display "Selling Out Fast" for SELLING_OUT_FAST status', async () => {
      const event: Event = { ...baseEvent, status: "SELLING_OUT_FAST" };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Selling Out Fast")).toBeTruthy();
    });

    it('should display "Sold Out" for SOLD_OUT status', async () => {
      const event: Event = { ...baseEvent, status: "SOLD_OUT" };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Sold Out")).toBeTruthy();
    });
  });

  describe("Queue state indicator", () => {
    it('should display "Coming Soon" for NOT_OPEN queue state', async () => {
      const event: Event = { ...baseEvent, queueState: "NOT_OPEN" };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Coming Soon")).toBeTruthy();
    });

    it('should display "Direct Purchase" for DIRECT queue state', async () => {
      const event: Event = { ...baseEvent, queueState: "DIRECT" };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Direct Purchase")).toBeTruthy();
    });

    it('should display "Open" for OPEN queue state', async () => {
      const event: Event = { ...baseEvent, queueState: "OPEN" };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Open")).toBeTruthy();
    });

    it('should display "Queue Full" for FULL queue state', async () => {
      const event: Event = { ...baseEvent, queueState: "FULL" };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Queue Full")).toBeTruthy();
    });
  });

  describe("CTA button", () => {
    it("should be enabled when display.enabled is true", async () => {
      const result = await render(<EventCard event={baseEvent} />);
      // Check the button text is "Join Queue" (enabled state)
      expect(result.getByText("Join Queue")).toBeTruthy();
    });

    it("should be disabled when display.enabled is false", async () => {
      const event: Event = {
        ...baseEvent,
        display: { ...baseEvent.display, enabled: false },
      };
      const result = await render(<EventCard event={event} />);
      // Check the button text is "Unavailable" (disabled state)
      expect(result.getByText("Unavailable")).toBeTruthy();
    });

    it('should display "Join Queue" text for JOIN_QUEUE action', async () => {
      const result = await render(<EventCard event={baseEvent} />);
      expect(result.getByText("Join Queue")).toBeTruthy();
    });

    it('should display "Buy Tickets" for GO_TO_TICKETS action', async () => {
      const event: Event = {
        ...baseEvent,
        display: { ...baseEvent.display, action: "GO_TO_TICKETS" },
      };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Buy Tickets")).toBeTruthy();
    });

    it('should display "Unavailable" when disabled', async () => {
      const event: Event = {
        ...baseEvent,
        display: { ...baseEvent.display, enabled: false },
      };
      const result = await render(<EventCard event={event} />);
      expect(result.getByText("Unavailable")).toBeTruthy();
    });

    it("should call onPress when CTA is pressed and enabled", async () => {
      const onPress = jest.fn();
      const result = await render(
        <EventCard event={baseEvent} onPress={onPress} />
      );

      fireEvent.press(result.getByText("Join Queue"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("should not call onPress when CTA is pressed and disabled", async () => {
      const onPress = jest.fn();
      const event: Event = {
        ...baseEvent,
        display: { ...baseEvent.display, enabled: false },
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
});
