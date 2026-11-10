/**
 * Signal UI Component Re-exports
 *
 * This module serves as the single integration point for Signal UI components
 * in the application. All features should import Signal UI components from here,
 * not directly from signal-ui-react-shared.
 *
 * Scope: Button, Text, TextField (per Ticket #3)
 */

// Component exports
export { Button } from "signal-ui-react-shared";
export { Text } from "signal-ui-react-shared";
export { TextField } from "signal-ui-react-shared";

// Type exports
export type { ButtonProps } from "signal-ui-react-shared";
export type { TextProps } from "signal-ui-react-shared";
export type { TextFieldProps } from "signal-ui-react-shared";
