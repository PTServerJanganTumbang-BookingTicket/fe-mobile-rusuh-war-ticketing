/**
 * Type declarations for signal-ui-react-shared
 *
 * This file provides TypeScript type declarations for the Signal UI components
 * consumed via Metro custom resolver. The actual runtime code comes from the
 * source files resolved by Metro, but TypeScript needs these declarations
 * since the library source cannot be directly type-checked (missing dependencies).
 *
 * Scope: Button, Text, TextField (per Ticket #3)
 */

declare module "signal-ui-react-shared" {
  import { ReactNode } from "react";
  import {
    StyleProp,
    ViewStyle,
    TextStyle,
    KeyboardTypeOptions,
  } from "react-native";

  // ============================================================================
  // Button Component
  // ============================================================================

  export type ButtonVariant = "primary" | "secondary" | "tertiary";
  export type ButtonColor =
    "primary" | "secondary" | "valid" | "warning" | "info";
  export type ButtonSize = "small" | "medium" | "large";
  export type ButtonJustify = "center" | "space-between";

  export interface ButtonProps {
    children: ReactNode;
    variant?: ButtonVariant;
    color?: ButtonColor;
    size?: ButtonSize;
    disabled?: boolean;
    full?: boolean;
    justify?: ButtonJustify;
    onPress: () => void;
    testID?: string;
    accessibilityLabel?: string;
    className?: string;
  }

  export const Button: React.FC<ButtonProps>;

  // ============================================================================
  // Text Component
  // ============================================================================

  export type TextVariant =
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "title"
    | "body1"
    | "body2"
    | "label";

  export type FontWeight = "regular" | "semibold" | "bold";

  export type Color =
    | `primary-${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
    | `secondary-${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
    | `valid-${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
    | `info-${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
    | `warning-${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
    | `error-${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
    | `neutral-${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;

  export interface TextProps {
    children: ReactNode;
    variant?: TextVariant;
    fontWeight?: FontWeight;
    color?: Color;
    strikethrough?: boolean;
    style?: StyleProp<TextStyle>;
    testID?: string;
    accessibilityLabel?: string;
    accessibilityRole?: string;
    accessibilityLiveRegion?: "none" | "polite" | "assertive";
    nativeID?: string;
    className?: string;
  }

  export const Text: React.FC<TextProps>;

  // ============================================================================
  // TextField Component
  // ============================================================================

  export type TextFieldVariant = "primary" | "secondary";

  export interface TextFieldProps {
    value?: string;
    placeholder?: string;
    name?: string;
    variant?: TextFieldVariant;
    required?: boolean;
    disabled?: boolean;
    supportText?: string;
    errorText?: string;
    success?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    style?: StyleProp<ViewStyle>;
    inputStyle?: StyleProp<TextStyle>;
    accessibilityHint?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    onLeftIconPress?: () => void;
    onRightIconPress?: () => void;
    secureTextEntry?: boolean;
    keyboardType?: KeyboardTypeOptions;
    autoCapitalize?: "none" | "sentences" | "words" | "characters";
    autoComplete?:
      | "off"
      | "username"
      | "password"
      | "email"
      | "name"
      | "tel"
      | "street-address"
      | "postal-code"
      | "cc-number";
    maxLength?: number;
    testID?: string;
    accessibilityLabel?: string;
    className?: string;
  }

  export const TextField: React.FC<TextFieldProps>;
}
