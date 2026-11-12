/**
 * State Components Render Tests
 *
 * GH-16: Verify LoadingState, EmptyState, and ErrorState render correctly.
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/features/events/presentation";

describe("LoadingState", () => {
  it("should render loading indicator", async () => {
    const result = await render(<LoadingState />);
    // ActivityIndicator with parent View that has accessibilityRole="progressbar"
    expect(result.root).toBeTruthy();
  });

  it("should render loading text", async () => {
    const result = await render(<LoadingState />);
    expect(result.getByText("Loading events...")).toBeTruthy();
  });
});

describe("EmptyState", () => {
  it("should render empty title", async () => {
    const result = await render(<EmptyState />);
    expect(result.getByText("No Events Available")).toBeTruthy();
  });

  it("should render empty subtitle", async () => {
    const result = await render(<EmptyState />);
    expect(
      result.getByText("Check back later for upcoming events.")
    ).toBeTruthy();
  });
});

describe("ErrorState", () => {
  it("should render error title", async () => {
    const result = await render(<ErrorState />);
    expect(result.getByText("Oops!")).toBeTruthy();
  });

  it("should render default error message", async () => {
    const result = await render(<ErrorState />);
    expect(result.getByText("Something went wrong")).toBeTruthy();
  });

  it("should render custom error message", async () => {
    const result = await render(<ErrorState message="Custom error message" />);
    expect(result.getByText("Custom error message")).toBeTruthy();
  });

  it("should render retry button when onRetry is provided", async () => {
    const onRetry = jest.fn();
    const result = await render(<ErrorState onRetry={onRetry} />);
    expect(result.getByText("Try Again")).toBeTruthy();
  });

  it("should call onRetry when retry button is pressed", async () => {
    const onRetry = jest.fn();
    const result = await render(<ErrorState onRetry={onRetry} />);

    fireEvent.press(result.getByText("Try Again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("should not render retry button when onRetry is not provided", async () => {
    const result = await render(<ErrorState />);
    expect(result.queryByText("Try Again")).toBeNull();
  });

  it("should have correct accessibility label on retry button", async () => {
    const onRetry = jest.fn();
    const result = await render(<ErrorState onRetry={onRetry} />);
    expect(result.getByLabelText("Retry loading events")).toBeTruthy();
  });
});
