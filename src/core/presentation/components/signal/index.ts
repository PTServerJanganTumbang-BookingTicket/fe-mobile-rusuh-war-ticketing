/**
 * Signal UI Component Re-exports
 *
 * This module serves as the single integration point for Signal UI components
 * in the application. All features should import Signal UI components from here,
 * not directly from signal-ui-react-shared.
 *
 * Scope: Button, Text, TextField (per Ticket #3)
 *
 * Note: We import directly from component paths (not the barrel export) to avoid
 * pulling in all 19 Signal UI components. Only components approved in Ticket #3
 * scope are exported here.
 *
 * Dependencies: @gluestack-ui/themed (for TextField's Input primitives),
 * react-native-svg (Gluestack peer), @types/react-native (peer metadata compat).
 */

// Component exports - direct imports to avoid barrel re-export tree
export { Button } from "signal-ui-react-shared/components/Button";
export { Text } from "signal-ui-react-shared/components/Text";
export { TextField } from "signal-ui-react-shared/components/TextField";

// Type exports
export type { ButtonProps } from "signal-ui-react-shared";
export type { TextProps } from "signal-ui-react-shared";
export type { TextFieldProps } from "signal-ui-react-shared";
