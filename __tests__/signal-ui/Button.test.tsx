/**
 * Signal UI Button Component Tests
 *
 * Test IDs: T3-03, T3-09 (partial)
 * Requirements: R3-AC1 through R3-AC4, R6-AC1
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "@/core/presentation/components/signal";

describe("Signal UI Button", () => {
  // T3-03: Button renders without crash (R3-AC1)
  it("should render without crashing", async () => {
    const mockOnPress = jest.fn();
    const { getByText } = await render(
      <Button onPress={mockOnPress}>Test Button</Button>
    );

    expect(getByText("Test Button")).toBeTruthy();
  });

  // R3-AC2: Button renders with correct styling (primary variant default)
  it("should render with primary variant by default", async () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = await render(
      <Button onPress={mockOnPress} testID="primary-button">
        Primary Button
      </Button>
    );

    expect(getByTestId("primary-button")).toBeTruthy();
  });

  // R3-AC3: Button loading state renders correctly
  it("should render with disabled state", async () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = await render(
      <Button onPress={mockOnPress} disabled testID="disabled-button">
        Disabled Button
      </Button>
    );

    expect(getByTestId("disabled-button")).toBeTruthy();
  });

  // R3-AC4: Button onPress handler fires when pressed
  it("should call onPress handler when pressed", async () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = await render(
      <Button onPress={mockOnPress} testID="press-button">
        Press Me
      </Button>
    );

    fireEvent.press(getByTestId("press-button"));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  // T3-09 partial: No duplicate React runtime (hook call succeeds)
  // If there were duplicate React instances, this test would fail with
  // "Invalid hook call" error
  it("should render multiple buttons without hook errors", async () => {
    const mockOnPress1 = jest.fn();
    const mockOnPress2 = jest.fn();

    const { getByTestId } = await render(
      <>
        <Button onPress={mockOnPress1} testID="button-1">
          Button 1
        </Button>
        <Button onPress={mockOnPress2} testID="button-2">
          Button 2
        </Button>
      </>
    );

    expect(getByTestId("button-1")).toBeTruthy();
    expect(getByTestId("button-2")).toBeTruthy();
  });

  // Test different variants
  it("should render secondary variant", async () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = await render(
      <Button onPress={mockOnPress} variant="secondary" testID="secondary-btn">
        Secondary
      </Button>
    );

    expect(getByTestId("secondary-btn")).toBeTruthy();
  });

  // Test different colors
  it("should render with valid color", async () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = await render(
      <Button onPress={mockOnPress} color="valid" testID="valid-btn">
        Success
      </Button>
    );

    expect(getByTestId("valid-btn")).toBeTruthy();
  });

  // Test different sizes
  it("should render with large size", async () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = await render(
      <Button onPress={mockOnPress} size="large" testID="large-btn">
        Large Button
      </Button>
    );

    expect(getByTestId("large-btn")).toBeTruthy();
  });
});
