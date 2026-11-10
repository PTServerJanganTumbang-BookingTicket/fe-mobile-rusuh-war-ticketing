/**
 * Jest mock for signal-ui-react-shared
 *
 * This mock provides minimal implementations of Signal UI components
 * for testing purposes. The actual runtime components are resolved
 * by Metro bundler from the library source.
 *
 * Tests verify:
 * - Components can be imported without errors
 * - Component props are passed correctly
 * - Event handlers fire when triggered
 */
import React from "react";
import {
  View,
  Text as RNText,
  Pressable,
  TextInput,
  type TextProps as RNTextProps,
  type PressableProps,
} from "react-native";

// ============================================================================
// Button Mock
// ============================================================================
interface MockButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  testID?: string;
  variant?: string;
  color?: string;
  size?: string;
  disabled?: boolean;
  full?: boolean;
  justify?: string;
}

export const Button: React.FC<MockButtonProps> = ({
  children,
  onPress,
  testID,
  disabled,
  ...props
}) => {
  return (
    <Pressable
      testID={testID}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      {...(props as PressableProps)}
    >
      {typeof children === "string" ? <RNText>{children}</RNText> : children}
    </Pressable>
  );
};

// ============================================================================
// Text Mock
// ============================================================================
interface MockTextProps {
  children: React.ReactNode;
  variant?: string;
  fontWeight?: string;
  color?: string;
  strikethrough?: boolean;
  style?: RNTextProps["style"];
  testID?: string;
}

export const Text: React.FC<MockTextProps> = ({
  children,
  testID,
  style,
  ...props
}) => {
  return (
    <RNText testID={testID} style={style} {...(props as RNTextProps)}>
      {children}
    </RNText>
  );
};

// ============================================================================
// TextField Mock
// ============================================================================
interface MockTextFieldProps {
  value?: string;
  placeholder?: string;
  name?: string;
  variant?: string;
  required?: boolean;
  disabled?: boolean;
  supportText?: string;
  errorText?: string;
  success?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  testID?: string;
  secureTextEntry?: boolean;
}

export const TextField: React.FC<MockTextFieldProps> = ({
  value,
  placeholder,
  name,
  required,
  disabled,
  supportText,
  errorText,
  success,
  onChange,
  onBlur,
  onFocus,
  testID,
  secureTextEntry,
}) => {
  return (
    <View>
      {name && (
        <RNText>
          {name}
          {required && "*"}
        </RNText>
      )}
      <TextInput
        testID={testID}
        value={value}
        placeholder={placeholder}
        editable={!disabled}
        onChangeText={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        secureTextEntry={secureTextEntry}
      />
      {supportText && <RNText>{supportText}</RNText>}
      {errorText && <RNText>{errorText}</RNText>}
      {success && <RNText>{success}</RNText>}
    </View>
  );
};

// Type exports for compatibility
export type ButtonProps = MockButtonProps;
export type TextProps = MockTextProps;
export type TextFieldProps = MockTextFieldProps;
