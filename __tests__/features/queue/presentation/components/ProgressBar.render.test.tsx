/**
 * ProgressBar Render Tests
 *
 * GH-8 T7: Tests for ProgressBar component.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { ProgressBar } from "@/features/queue/presentation/components/ProgressBar";

describe("ProgressBar", () => {
  describe("render states", () => {
    it("renders empty bar for progress=0", async () => {
      const { getByTestId } = await render(<ProgressBar progress={0} />);

      const fill = getByTestId("progress-bar-fill");
      expect(fill.props.style).toEqual(
        expect.objectContaining({ width: "0%" })
      );
    });

    it("renders half-filled bar for progress=50", async () => {
      const { getByTestId } = await render(<ProgressBar progress={50} />);

      const fill = getByTestId("progress-bar-fill");
      expect(fill.props.style).toEqual(
        expect.objectContaining({ width: "50%" })
      );
    });

    it("renders full bar for progress=100", async () => {
      const { getByTestId } = await render(<ProgressBar progress={100} />);

      const fill = getByTestId("progress-bar-fill");
      expect(fill.props.style).toEqual(
        expect.objectContaining({ width: "100%" })
      );
    });

    it("clamps progress above 100 to 100%", async () => {
      const { getByTestId } = await render(<ProgressBar progress={150} />);

      const fill = getByTestId("progress-bar-fill");
      expect(fill.props.style).toEqual(
        expect.objectContaining({ width: "100%" })
      );
    });

    it("clamps negative progress to 0%", async () => {
      const { getByTestId } = await render(<ProgressBar progress={-10} />);

      const fill = getByTestId("progress-bar-fill");
      expect(fill.props.style).toEqual(
        expect.objectContaining({ width: "0%" })
      );
    });
  });

  describe("accessibility", () => {
    it('has accessibilityRole="progressbar"', async () => {
      const { getByRole } = await render(<ProgressBar progress={50} />);

      const progressBar = getByRole("progressbar");
      expect(progressBar).toBeTruthy();
    });

    it("has accessibilityValue with min/max/now", async () => {
      const { getByRole } = await render(<ProgressBar progress={75} />);

      const progressBar = getByRole("progressbar");
      expect(progressBar.props.accessibilityValue).toEqual({
        min: 0,
        max: 100,
        now: 75,
      });
    });

    it("has default accessibilityLabel", async () => {
      const { getByRole } = await render(<ProgressBar progress={50} />);

      const progressBar = getByRole("progressbar");
      expect(progressBar.props.accessibilityLabel).toBe("Queue progress");
    });

    it("accepts custom accessibilityLabel", async () => {
      const { getByRole } = await render(
        <ProgressBar progress={50} accessibilityLabel="Custom progress label" />
      );

      const progressBar = getByRole("progressbar");
      expect(progressBar.props.accessibilityLabel).toBe(
        "Custom progress label"
      );
    });
  });

  describe("custom height", () => {
    it("uses default height of 8", async () => {
      const { getByRole } = await render(<ProgressBar progress={50} />);

      const progressBar = getByRole("progressbar");
      expect(progressBar.props.style).toEqual(
        expect.objectContaining({ height: 8 })
      );
    });

    it("accepts custom height", async () => {
      const { getByRole } = await render(
        <ProgressBar progress={50} height={16} />
      );

      const progressBar = getByRole("progressbar");
      expect(progressBar.props.style).toEqual(
        expect.objectContaining({ height: 16 })
      );
    });
  });
});
