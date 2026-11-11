/**
 * Jest mock for signal-ui-react-shared/components/Text
 */
import React from "react";
import { Text as RNText, type TextProps as RNTextProps } from "react-native";

interface MockTextProps {
  children: React.ReactNode;
  variant?: string;
  fontWeight?: string;
  color?: string;
  strikethrough?: boolean;
  style?: RNTextProps["style"];
  testID?: string;
  className?: string;
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

export default Text;
