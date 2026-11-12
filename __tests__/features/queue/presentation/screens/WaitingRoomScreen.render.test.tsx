/**
 * WaitingRoomScreen Render Tests
 *
 * GH-8 T9: Tests for WaitingRoomScreen component.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { WaitingRoomScreen } from "@/features/queue/presentation/screens/WaitingRoomScreen";
import type { UseQueueResult } from "@/features/queue/presentation";

// Helper to create mock queue state
function createMockQueueState(
  overrides: Partial<UseQueueResult> = {}
): UseQueueResult {
  return {
    position: 42,
    initialPosition: 100,
    etaMinutes: 5,
    etaDisplay: "5 min",
    progress: 58,
    queueState: "OPEN",
    engagementState: "QUEUED",
    isGranted: false,
    grant: null,
    loading: false,
    error: null,
    retry: jest.fn(),
    isRunning: true,
    ...overrides,
  };
}

describe("WaitingRoomScreen", () => {
  describe("initial QUEUED state", () => {
    it("renders screen with position, progress, and ETA", async () => {
      const mockState = createMockQueueState();
      const { getByTestId, getByText } = await render(
        <WaitingRoomScreen queueState={mockState} />
      );

      expect(getByTestId("waiting-room-screen")).toBeTruthy();
      expect(getByTestId("queue-position")).toHaveTextContent("#42");
      expect(getByTestId("queue-eta")).toHaveTextContent(
        "Estimated wait: 5 min"
      );
      expect(getByTestId("progress-text")).toHaveTextContent("58% complete");
      expect(getByText("Waiting Room")).toBeTruthy();
    });
  });

  describe("position update", () => {
    it("reflects new position values", async () => {
      const mockState = createMockQueueState({
        position: 20,
        progress: 80,
        etaDisplay: "2 min",
      });
      const { getByTestId } = await render(
        <WaitingRoomScreen queueState={mockState} />
      );

      expect(getByTestId("queue-position")).toHaveTextContent("#20");
      expect(getByTestId("progress-text")).toHaveTextContent("80% complete");
      expect(getByTestId("queue-eta")).toHaveTextContent(
        "Estimated wait: 2 min"
      );
    });
  });

  describe("FULL_BOOKED state", () => {
    it("shows appropriate view", async () => {
      const mockState = createMockQueueState({
        queueState: "FULL_BOOKED",
      });
      const { getByTestId } = await render(
        <WaitingRoomScreen queueState={mockState} />
      );

      expect(getByTestId("full-booked-view")).toBeTruthy();
    });
  });

  describe("FULL_QUEUE state", () => {
    it("shows queue full view", async () => {
      const mockState = createMockQueueState({
        queueState: "FULL_QUEUE",
      });
      const { getByTestId } = await render(
        <WaitingRoomScreen queueState={mockState} />
      );

      expect(getByTestId("full-queue-view")).toBeTruthy();
    });
  });

  describe("CLOSED state", () => {
    it("shows terminal view", async () => {
      const mockState = createMockQueueState({
        queueState: "CLOSED",
      });
      const { getByTestId, queryByTestId } = await render(
        <WaitingRoomScreen queueState={mockState} />
      );

      expect(getByTestId("closed-view")).toBeTruthy();
      // Progress bar not shown for terminal state
      expect(queryByTestId("progress-text")).toBeNull();
    });
  });

  describe("GRANTED state", () => {
    it("shows grant info view", async () => {
      const mockState = createMockQueueState({
        position: 0,
        engagementState: "GRANTED",
        isGranted: true,
        grant: {
          token: "gt_test_token_123",
          expiresAt: "2026-01-15T10:15:00Z",
        },
      });
      const { getByTestId, queryByTestId, getByText } = await render(
        <WaitingRoomScreen queueState={mockState} />
      );

      expect(getByTestId("granted-view")).toBeTruthy();
      expect(getByText("🎉 You're In!")).toBeTruthy();
      // Progress bar not shown when granted
      expect(queryByTestId("progress-text")).toBeNull();
    });

    it("shows ready message in header", async () => {
      const mockState = createMockQueueState({
        position: 0,
        engagementState: "GRANTED",
        isGranted: true,
        grant: {
          token: "gt_test_token_123",
          expiresAt: "2026-01-15T10:15:00Z",
        },
      });
      const { getByText } = await render(
        <WaitingRoomScreen queueState={mockState} />
      );

      expect(getByText("You're ready to purchase!")).toBeTruthy();
    });
  });

  describe("loading state", () => {
    it("shows loading indicator", async () => {
      const mockState = createMockQueueState({
        loading: true,
      });
      const { getByText, queryByTestId } = await render(
        <WaitingRoomScreen queueState={mockState} />
      );

      expect(getByText("Loading...")).toBeTruthy();
      expect(queryByTestId("queue-position")).toBeNull();
    });
  });
});
