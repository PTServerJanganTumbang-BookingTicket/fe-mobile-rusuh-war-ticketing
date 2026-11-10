/**
 * Jest mock for signal-ui-react-shared/components/Button
 */
import React from "react";
import { Pressable, Text as RNText, type PressableProps } from "react-native";

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

export default Button;
