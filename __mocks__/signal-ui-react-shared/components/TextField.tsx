/**
 * Jest mock for signal-ui-react-shared/components/TextField
 */
import React from "react";
import { View, Text as RNText, TextInput } from "react-native";

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

export default TextField;
