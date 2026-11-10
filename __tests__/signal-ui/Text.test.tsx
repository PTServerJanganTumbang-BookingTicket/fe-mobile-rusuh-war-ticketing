/**
 * Signal UI Text Component Tests
 *
 * Test ID: T3-04
 * Requirements: R4-AC1 through R4-AC4
 */
import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "@/core/presentation/components/signal";

describe("Signal UI Text", () => {
  // R4-AC1: Text component imports without runtime errors
  it("should render without crashing", async () => {
    const { getByText } = await render(<Text>Hello World</Text>);
    expect(getByText("Hello World")).toBeTruthy();
  });

  // R4-AC2: Text renders with variant="h1" correctly
  it('should render with variant="h1"', async () => {
    const { getByText } = await render(<Text variant="h1">Heading 1</Text>);
    expect(getByText("Heading 1")).toBeTruthy();
  });

  // R4-AC3: Text renders with variant="body1" correctly
  it('should render with variant="body1"', async () => {
    const { getByText } = await render(<Text variant="body1">Body text</Text>);
    expect(getByText("Body text")).toBeTruthy();
  });

  // R4-AC4: Text renders with variant="label" correctly
  it('should render with variant="label"', async () => {
    const { getByText } = await render(<Text variant="label">Label text</Text>);
    expect(getByText("Label text")).toBeTruthy();
  });

  // Additional variant tests
  it('should render with variant="h2"', async () => {
    const { getByText } = await render(<Text variant="h2">Heading 2</Text>);
    expect(getByText("Heading 2")).toBeTruthy();
  });

  it('should render with variant="body2"', async () => {
    const { getByText } = await render(<Text variant="body2">Small body</Text>);
    expect(getByText("Small body")).toBeTruthy();
  });

  // Test fontWeight prop
  it("should render with bold fontWeight", async () => {
    const { getByText } = await render(
      <Text fontWeight="bold">Bold text</Text>
    );
    expect(getByText("Bold text")).toBeTruthy();
  });

  // Test color prop
  it("should render with custom color", async () => {
    const { getByText } = await render(
      <Text color="primary-5">Colored text</Text>
    );
    expect(getByText("Colored text")).toBeTruthy();
  });

  // Test strikethrough prop
  it("should render with strikethrough", async () => {
    const { getByText } = await render(
      <Text strikethrough>Strikethrough text</Text>
    );
    expect(getByText("Strikethrough text")).toBeTruthy();
  });

  // Test nested text
  it("should render nested text children", async () => {
    const { getByText } = await render(
      <Text>
        Parent <Text variant="label">nested</Text> text
      </Text>
    );
    expect(getByText(/Parent/)).toBeTruthy();
    expect(getByText("nested")).toBeTruthy();
  });
});
