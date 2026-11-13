/**
 * Header Component Unit Tests
 *
 * Test ID: T3
 * Requirements: R1, R3, R4
 *
 * Tests verify:
 * - Header renders without crashing
 * - BrandMark is present
 * - "rusuh." text is present
 * - "BOOKING TIKET" text is present
 * - No login button or user icon (guest mode)
 * - Accessibility attributes are correct
 */
import React from "react";
import { render } from "@testing-library/react-native";
import { Header, BrandMark } from "@/core/presentation/components";

describe("Header", () => {
  // T3-1: Header renders without crashing
  // R1: Header Component Structure
  it("should render without crashing", async () => {
    const { getByTestId } = await render(<Header />);
    expect(getByTestId("header")).toBeTruthy();
  });

  // T3-2: Header contains BrandMark
  // R1-AC1: Header contains brand mark icon on the left
  it("should contain BrandMark", async () => {
    const { getByTestId } = await render(<Header />);
    expect(getByTestId("brand-mark")).toBeTruthy();
  });

  // T3-3: Header contains "rusuh." text
  // R1-AC2: Header contains "rusuh." text (bold) adjacent to brand mark
  it('should contain "rusuh." text', async () => {
    const { getByText } = await render(<Header />);
    expect(getByText("rusuh.")).toBeTruthy();
  });

  // T3-4: Header contains "BOOKING TIKET" text
  // R1-AC3: Header contains "BOOKING TIKET" subtitle below/adjacent to wordmark
  it('should contain "BOOKING TIKET" text', async () => {
    const { getByText } = await render(<Header />);
    expect(getByText("BOOKING TIKET")).toBeTruthy();
  });

  // T3-5: Header has no login button or user icon (guest mode)
  // R1-AC4: No login button or user-related UI elements (guest mode)
  it("should have no login button or user icon", async () => {
    const { queryByText, queryByTestId } = await render(<Header />);
    expect(queryByText("Login")).toBeNull();
    expect(queryByText("Sign In")).toBeNull();
    expect(queryByTestId("login-button")).toBeNull();
    expect(queryByTestId("user-icon")).toBeNull();
  });

  // T3-6: Header has accessibilityRole="header"
  // R4-AC2: Header region has accessibilityRole="header"
  it('should have accessibilityRole="header"', async () => {
    const { getByTestId } = await render(<Header />);
    const header = getByTestId("header");
    expect(header.props.accessibilityRole).toBe("header");
  });

  // T3-7: Header accepts custom testID
  it("should accept custom testID", async () => {
    const { getByTestId } = await render(<Header testID="custom-header" />);
    expect(getByTestId("custom-header")).toBeTruthy();
  });
});

describe("BrandMark", () => {
  // T3-8: BrandMark renders without crashing
  it("should render without crashing", async () => {
    const { getByTestId } = await render(<BrandMark />);
    expect(getByTestId("brand-mark")).toBeTruthy();
  });

  // T3-9: BrandMark has accessibilityLabel
  // R4-AC1: Brand mark has appropriate accessibilityLabel
  it("should have accessibilityLabel", async () => {
    const { getByTestId } = await render(<BrandMark />);
    const brandMark = getByTestId("brand-mark");
    expect(brandMark.props.accessibilityLabel).toBe("Rusuh logo");
  });

  // T3-10: BrandMark has accessibilityRole="image"
  it('should have accessibilityRole="image"', async () => {
    const { getByTestId } = await render(<BrandMark />);
    const brandMark = getByTestId("brand-mark");
    expect(brandMark.props.accessibilityRole).toBe("image");
  });

  // T3-11: BrandMark accepts custom size
  it("should accept custom size", async () => {
    const { getByTestId } = await render(<BrandMark size={48} />);
    const brandMark = getByTestId("brand-mark");
    expect(brandMark.props.style).toMatchObject({ width: 48, height: 48 });
  });

  // T3-12: BrandMark uses default values
  it("should use default values", async () => {
    const { getByTestId } = await render(<BrandMark />);
    const brandMark = getByTestId("brand-mark");
    expect(brandMark.props.style).toMatchObject({ width: 32, height: 32 });
  });
});
