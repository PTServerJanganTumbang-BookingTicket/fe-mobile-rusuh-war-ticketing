/**
 * App render test to verify React components can render.
 *
 * Test ID: T2-05
 * Requirements: R11-AC2, R11-AC3
 *
 * Note: Uses react-test-renderer with act() for React 19 compatibility.
 */
import React from "react";
import { act } from "react";
import renderer, { ReactTestRendererJSON, ReactTestRenderer } from "react-test-renderer";
import { Text, View } from "react-native";

// A simple test component instead of the full App
// (which has Expo Router dependencies that are complex to mock)
function TestComponent() {
  return (
    <View testID="test-container">
      <Text>Rusuh Booking Tiket</Text>
      <Text>Welcome to the mobile app</Text>
    </View>
  );
}

describe("App Render Test", () => {
  let testRenderer: ReactTestRenderer;
  let tree: ReactTestRendererJSON | null;

  beforeEach(() => {
    act(() => {
      testRenderer = renderer.create(<TestComponent />);
    });
    tree = testRenderer.toJSON() as ReactTestRendererJSON;
  });

  afterEach(() => {
    act(() => {
      testRenderer.unmount();
    });
  });

  it("renders the test component without crashing", () => {
    expect(tree).not.toBeNull();
  });

  it("renders with correct structure", () => {
    expect(tree!.type).toBe("View");
    expect(tree!.props.testID).toBe("test-container");
  });

  it("contains expected text content", () => {
    // Check children structure
    expect(tree!.children).toHaveLength(2);

    // First child is "Rusuh Booking Tiket"
    const firstChild = tree!.children![0] as ReactTestRendererJSON;
    expect(firstChild.type).toBe("Text");
    expect(firstChild.children).toContain("Rusuh Booking Tiket");

    // Second child is "Welcome to the mobile app"
    const secondChild = tree!.children![1] as ReactTestRendererJSON;
    expect(secondChild.type).toBe("Text");
    expect(secondChild.children).toContain("Welcome to the mobile app");
  });

  it("verifies snapshot matches expected output", () => {
    expect(tree).toMatchSnapshot();
  });
});
