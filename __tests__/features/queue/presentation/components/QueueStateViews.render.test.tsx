/**
 * Queue State Views Render Tests
 *
 * GH-8 T8: Tests for Queue state display components.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import {
  QueuedView,
  FullBookedView,
  FullQueueView,
  ClosedView,
  GrantedView,
} from "@/features/queue/presentation/components/QueueStateViews";

describe("QueueStateViews", () => {
  describe("QueuedView", () => {
    it("renders position and ETA", async () => {
      const { getByTestId } = await render(
        <QueuedView position={42} etaDisplay="5 min" />
      );

      expect(getByTestId("queued-view")).toBeTruthy();
      expect(getByTestId("queue-position")).toHaveTextContent("#42");
      expect(getByTestId("queue-eta")).toHaveTextContent(
        "Estimated wait: 5 min"
      );
    });

    it("shows position label", async () => {
      const { getByText } = await render(
        <QueuedView position={100} etaDisplay="10 min" />
      );

      expect(getByText("Your position in queue")).toBeTruthy();
    });
  });

  describe("FullBookedView", () => {
    it("renders inventory message", async () => {
      const { getByTestId, getByText } = await render(<FullBookedView />);

      expect(getByTestId("full-booked-view")).toBeTruthy();
      expect(getByText("Inventory Temporarily Exhausted")).toBeTruthy();
    });

    it("shows recovery hint", async () => {
      const { getByText } = await render(<FullBookedView />);

      expect(getByText(/slots may open if others don't complete/)).toBeTruthy();
    });
  });

  describe("FullQueueView", () => {
    it("renders queue full message", async () => {
      const { getByTestId, getByText } = await render(<FullQueueView />);

      expect(getByTestId("full-queue-view")).toBeTruthy();
      expect(getByText("Queue is Full")).toBeTruthy();
    });

    it("shows retry hint", async () => {
      const { getByText } = await render(<FullQueueView />);

      expect(getByText(/try again later/)).toBeTruthy();
    });
  });

  describe("ClosedView", () => {
    it("renders terminal message", async () => {
      const { getByTestId, getByText } = await render(<ClosedView />);

      expect(getByTestId("closed-view")).toBeTruthy();
      expect(getByText("Sale Closed")).toBeTruthy();
    });

    it("shows thank you message", async () => {
      const { getByText } = await render(<ClosedView />);

      expect(getByText(/sale has ended/)).toBeTruthy();
    });
  });

  describe("GrantedView", () => {
    const grantProps = {
      token: "gt_fake_test_token_12345",
      expiresAt: "2026-01-15T10:15:00Z",
    };

    it("renders grant info", async () => {
      const { getByTestId, getByText } = await render(
        <GrantedView {...grantProps} />
      );

      expect(getByTestId("granted-view")).toBeTruthy();
      expect(getByText("🎉 You're In!")).toBeTruthy();
    });

    it("shows expiry time", async () => {
      const { getByText } = await render(<GrantedView {...grantProps} />);

      // Time format depends on locale, just check it includes "by"
      expect(getByText(/Complete your purchase by/)).toBeTruthy();
    });

    it("shows truncated token", async () => {
      const { getByTestId } = await render(<GrantedView {...grantProps} />);

      expect(getByTestId("grant-token")).toHaveTextContent(
        "Token: gt_fake_..."
      );
    });

    it("has accessibility label for token", async () => {
      const { getByTestId } = await render(<GrantedView {...grantProps} />);

      const tokenElement = getByTestId("grant-token");
      expect(tokenElement.props.accessibilityLabel).toBe("Grant token");
    });
  });
});
