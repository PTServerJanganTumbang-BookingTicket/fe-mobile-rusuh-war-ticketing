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
 * pulling in all 19 Signal UI components. Some components (Checkbox, Icon, etc.)
 * have dependencies (@gluestack-ui/themed) that are not installed in this app.
 *
 * LIMITATION: TextField requires @gluestack-ui/themed which is not installed.
 * TextField is temporarily excluded pending dependency resolution (see BLOCKED note).
 */

// Component exports - direct imports to avoid barrel re-export tree
export { Button } from "signal-ui-react-shared/components/Button";
export { Text } from "signal-ui-react-shared/components/Text";
// TextField excluded - requires @gluestack-ui/themed dependency
// export { TextField } from "signal-ui-react-shared/components/TextField";

// Type exports
export type { ButtonProps } from "signal-ui-react-shared";
export type { TextProps } from "signal-ui-react-shared";
export type { TextFieldProps } from "signal-ui-react-shared";
