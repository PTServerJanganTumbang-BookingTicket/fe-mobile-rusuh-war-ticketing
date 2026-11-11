# Design — GH-3 Signal UI Foundation

## Overview

Integrate signal-ui-react-shared by configuring Metro bundler to resolve imports from the library's source files (since dist/ does not exist). The integration required two bounded repair paths:

1. **A1 Metro Mapping Repair:** Add `react-native-css-interop` to `extraNodeModules` because NativeWind's babel jsxImportSource transforms JSX to require this runtime.

2. **A3-min Dependency Repair:** Install `@gluestack-ui/themed`, `react-native-svg`, and `@types/react-native@0.73.0` as peer-satisfying dependencies for TextField's Gluestack imports.

The design follows Clean Architecture: Signal UI components are wrapped and re-exported from `core/presentation/` as the single entry point for the rest of the application.

---

## Architecture

### Layer Placement

```
src/
├── core/
│   └── presentation/
│       └── components/
│           └── signal/
│               └── index.ts      # Barrel re-export for Button, Text, TextField
```

**Rationale:** Core/presentation is the correct home for design system components. Features import from `@/core/presentation/components/signal` rather than directly from signal-ui-react-shared, preserving a single integration point.

### Metro Resolver Configuration

```javascript
// Key extraNodeModules mappings
config.resolver.extraNodeModules = {
  react: path.resolve(__dirname, "node_modules/react"),
  "react-native": path.resolve(__dirname, "node_modules/react-native"),
  "react-native-css-interop": path.resolve(
    __dirname,
    "node_modules/react-native-css-interop"
  ),
  "@gluestack-ui/themed": path.resolve(
    __dirname,
    "node_modules/@gluestack-ui/themed"
  ),
  "@gluestack-style/react": path.resolve(
    __dirname,
    "node_modules/@gluestack-style/react"
  ),
};
```

**Why each mapping exists:**

| Module                     | Reason                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| `react`                    | Prevent duplicate React runtime when bundling sibling source                                            |
| `react-native`             | Prevent duplicate RN runtime when bundling sibling source                                               |
| `react-native-css-interop` | NativeWind's babel jsxImportSource transforms JSX to import from `react-native-css-interop/jsx-runtime` |
| `@gluestack-ui/themed`     | TextField imports Input/InputField/InputSlot/InputIcon from this package                                |
| `@gluestack-style/react`   | Peer dependency of @gluestack-ui/themed, auto-resolved                                                  |

### TypeScript Resolution

TypeScript resolution uses a **declaration file approach** rather than tsconfig paths:

```
src/
├── signal-ui-react-shared.d.ts   # Ambient module declarations
```

The declaration file provides type definitions for:

- `signal-ui-react-shared` main module
- `signal-ui-react-shared/components/*` component subpaths

**Why not tsconfig paths?** The sibling signal-ui-react-shared source files import from their own `node_modules` (which doesn't exist) and from paths that don't exist in the app's context. A declaration file cleanly provides types without requiring TypeScript to traverse the actual source files.

**Declaration Drift Risk:** The declaration file must be manually updated when signal-ui-react-shared component APIs change. Until signal-ui-react-shared provides a proper dist/ build with types, this is an accepted maintenance burden.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     App Layer (src/app/)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Screens import from @/core/presentation/components/signal│    │
│  └───────────────────────────┬─────────────────────────────┘    │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                Core Presentation Layer                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ src/core/presentation/components/signal/index.ts         │    │
│  │   └── re-exports Button, Text, TextField                 │    │
│  └───────────────────────────┬─────────────────────────────┘    │
└──────────────────────────────┼──────────────────────────────────┘
                               │ imports from
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│            External: signal-ui-react-shared/src/                │
│  (Resolved via Metro custom resolver from sibling directory)    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Button, Text, TextField components                       │    │
│  │ └── TextField imports from @gluestack-ui/themed          │    │
│  │     └── Input, InputField, InputSlot, InputIcon          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

**Metro Bundle Resolution Flow:**

1. App code imports `@/core/presentation/components/signal`
2. Barrel re-exports from `signal-ui-react-shared/components/*`
3. Metro resolver intercepts these imports via custom `resolveRequest`
4. Resolves to `../signal-ui-react-shared/src/components/*/index.tsx`
5. Signal UI component code uses React/React Native/Gluestack
6. Metro resolves all via `extraNodeModules` to app's node_modules

**TypeScript Resolution Flow:**

1. TypeScript follows import to `signal-ui-react-shared`
2. `src/signal-ui-react-shared.d.ts` provides ambient module declarations
3. Types resolve without traversing signal-ui source files

---

## ADRs (Architecture Decision Records)

### ADR-GH3-01: Metro Custom Resolver over npm Link

**Context:** signal-ui-react-shared has no dist/ folder and cannot be installed as a standard npm dependency.

**Decision:** Use custom Metro resolver to point imports at library source files, with watchFolders for hot reload.

**Consequences:**

- (+) No library modifications required
- (+) Changes in signal-ui source hot-reload during development
- (-) Requires extraNodeModules for all dependencies signal-ui uses
- (-) TypeScript needs declaration file or path aliases

### ADR-GH3-02: Declaration File TypeScript Resolution

**Context:** tsconfig paths mapping was investigated but would require TypeScript to traverse signal-ui source files with missing transitive dependencies.

**Decision:** Use ambient module declarations in `src/signal-ui-react-shared.d.ts` to provide types.

**Consequences:**

- (+) Clean typecheck without signal-ui source traversal
- (+) Works with Metro's runtime resolution
- (-) Declaration file must be manually maintained
- (-) API changes in signal-ui require matching declaration updates

**Drift Mitigation:** When signal-ui-react-shared provides proper dist/ with types (Ticket #4 or later), the declaration file should be removed in favor of real types.

### ADR-GH3-03: A3-min Dependency Installation

**Context:** TextField requires @gluestack-ui/themed which has peer dependencies on react-native-svg and @types/react-native.

**Decision:** Install exactly three packages to satisfy peers without runtime duplicates:

- `@gluestack-ui/themed@1.1.73` — Runtime requirement for TextField
- `react-native-svg@15.16.0` — Expo SDK 58 pinned version (bundledNativeModules.json)
- `@types/react-native@0.73.0` — Peer metadata containment (no runtime deps, prevents npm from auto-resolving to 0.72.8 which drags in duplicate virtualized-lists)

**Consequences:**

- (+) TextField works with real Gluestack Input components
- (+) Zero duplicate runtimes (verified: single react, react-native, css-interop, virtualized-lists)
- (-) @types/react-native@0.73.0 is deprecated (types built into RN 0.88+), present only for peer satisfaction
- (-) expo-doctor warns about @types/react-native installation (non-blocking)

### ADR-GH3-04: react-native-css-interop extraNodeModules Mapping

**Context:** After adding Signal UI source via watchFolders, Metro bundling failed with "Unable to resolve react-native-css-interop/jsx-runtime".

**Root Cause:** NativeWind v4's babel preset uses `jsxImportSource: 'react-native-css-interop'`, which transforms JSX in ALL watched files (including signal-ui source) to import from `react-native-css-interop/jsx-runtime`. Signal-ui source files cannot resolve this through standard node_modules traversal because they're outside the app's node_modules tree.

**Decision:** Add `react-native-css-interop` to Metro's `extraNodeModules` mapping.

**Consequences:**

- (+) All watched source files can resolve css-interop runtime
- (+) No modifications to signal-ui-react-shared required
- (-) Couples app's Metro config to NativeWind's internal babel behavior

---

## Dependencies

### External Packages (Installed)

| Package                | Version  | Purpose                            | Added by Repair     |
| ---------------------- | -------- | ---------------------------------- | ------------------- |
| @gluestack-ui/themed   | ^1.1.73  | TextField Input primitives         | A3-min              |
| @gluestack-style/react | 1.0.57   | Auto-resolved Gluestack peer       | A3-min (transitive) |
| react-native-svg       | ^15.16.0 | Gluestack peer, Expo SDK 58 pinned | A3-min              |
| @types/react-native    | ^0.73.0  | Peer metadata containment          | A3-min              |

### External Packages (Already Present)

| Package                        | Purpose                                                |
| ------------------------------ | ------------------------------------------------------ |
| nativewind@4.2.7               | Tailwind CSS for RN, provides react-native-css-interop |
| react-native-css-interop@0.2.7 | NativeWind peer, jsx-runtime provider                  |

### Internal Modules Modified

- `metro.config.js` — Custom resolver + extraNodeModules
- `src/signal-ui-react-shared.d.ts` — Type declarations
- `src/core/presentation/components/signal/index.ts` — Component wrapper
- `src/app/__signal-ui-verify.tsx` — Runtime verification screen

---

## Risks

| Risk                                                | Likelihood | Impact | Mitigation                                                    |
| --------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------- |
| Declaration drift when signal-ui API changes        | High       | Medium | Document maintenance expectation; remove when dist/ available |
| @gluestack-ui/themed React 19 peer warning          | Low        | Low    | Peer warning only, runtime works                              |
| expo-doctor @types/react-native warning             | Certain    | None   | Expected; non-blocking warning                                |
| Metro resolver breaks on signal-ui structure change | Low        | Medium | Test on CI; pin to known-working commit                       |

---

## Known Limitations

1. **Button has no loading prop:** Signal UI Button API does not include a loading prop. R3-AC3 ("Button loading state renders correctly") cannot be satisfied by the current library. This requires specification correction.

2. **TextField API differs from common patterns:** Uses `name` (not `label`), `onChange` (not `onChangeText`), `errorText` (not `error`).

3. **expo-doctor warnings:** Two non-blocking warnings expected:
   - @types/react-native should not be installed directly
   - Missing peer dependencies react-dom and react-native-web (web-only)

---

## Components and Interfaces

### Signal UI Components (Re-exported)

| Component   | Source Path                                   | Props Interface                                                                                                    |
| ----------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `Button`    | `signal-ui-react-shared/components/Button`    | `children: ReactNode`, `variant?: string`, `onPress?: () => void`                                                  |
| `Text`      | `signal-ui-react-shared/components/Text`      | `children: ReactNode`, `variant?: string`, `className?: string`                                                    |
| `TextField` | `signal-ui-react-shared/components/TextField` | `name: string`, `value: string`, `onChange: (value: string) => void`, `errorText?: string`, `placeholder?: string` |

### Internal Interfaces

```typescript
// src/core/presentation/components/signal/index.ts
export { Button } from "signal-ui-react-shared/components/Button";
export { Text } from "signal-ui-react-shared/components/Text";
export { TextField } from "signal-ui-react-shared/components/TextField";
```

### Metro Resolver Interface

```typescript
// metro.config.js resolveRequest signature
resolveRequest: (
  context: ResolutionContext,
  moduleName: string,
  platform: string | null
) => Resolution | null;
```

---

## Data Models

This integration is primarily configuration-based and does not introduce new data models. The components are stateless presentation primitives that receive props from consuming features.

### Type Declarations

```typescript
// src/signal-ui-react-shared.d.ts
declare module "signal-ui-react-shared" {
  export { Button } from "signal-ui-react-shared/components/Button";
  export { Text } from "signal-ui-react-shared/components/Text";
  export { TextField } from "signal-ui-react-shared/components/TextField";
}

declare module "signal-ui-react-shared/components/Button" {
  import { FC, ReactNode } from "react";
  export interface ButtonProps {
    children: ReactNode;
    variant?: string;
    onPress?: () => void;
  }
  export const Button: FC<ButtonProps>;
}

declare module "signal-ui-react-shared/components/Text" {
  import { FC, ReactNode } from "react";
  export interface TextProps {
    children: ReactNode;
    variant?: string;
    className?: string;
  }
  export const Text: FC<TextProps>;
}

declare module "signal-ui-react-shared/components/TextField" {
  import { FC } from "react";
  export interface TextFieldProps {
    name: string;
    value: string;
    onChange: (value: string) => void;
    errorText?: string;
    placeholder?: string;
  }
  export const TextField: FC<TextFieldProps>;
}
```

---

## Correctness Properties

### Property 1: Single Runtime Instance

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

Only one instance of React, React Native, and react-native-css-interop exists in the bundle.

**Verification:** `npm ls react react-native react-native-css-interop` returns exactly one resolved path per package.

### Property 2: Metro Resolution Completeness

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

All imports from `signal-ui-react-shared/*` resolve to valid source files at bundle time.

**Verification:** Metro bundler completes without "Unable to resolve module" errors.

### Property 3: TypeScript Type Coverage

**Validates: Requirements 2.1, 2.2, 7.1**

All re-exported components have type definitions that match their runtime behavior.

**Verification:** `npm run typecheck` passes with no errors on files importing from `@/core/presentation/components/signal`.

### Property 4: Clean Architecture Boundary

**Validates: Requirements 8.4**

No feature or app layer code imports directly from `signal-ui-react-shared`; all access goes through `@/core/presentation/components/signal`.

**Verification:** `grep -r "from ['\"]signal-ui-react-shared" src/` returns only hits in `src/core/presentation/components/signal/` and `src/signal-ui-react-shared.d.ts`.

---

## Error Handling

### Build-Time Errors

| Error                                                          | Cause                                            | Resolution                                                             |
| -------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| `Unable to resolve module "signal-ui-react-shared"`            | Metro resolver misconfigured                     | Verify `resolveRequest` in metro.config.js handles the module prefix   |
| `Unable to resolve module "react-native-css-interop"`          | Missing extraNodeModules entry                   | Add mapping in metro.config.js extraNodeModules                        |
| `Unable to resolve module "@gluestack-ui/themed"`              | Package not installed or not in extraNodeModules | Run `npm install @gluestack-ui/themed` and add to extraNodeModules     |
| TypeScript error "Cannot find module 'signal-ui-react-shared'" | Declaration file missing or malformed            | Verify `src/signal-ui-react-shared.d.ts` exists and has correct syntax |

### Runtime Errors

| Error                                             | Cause                                    | Resolution                                                      |
| ------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `Invalid hook call` or `Multiple React instances` | Duplicate React in bundle                | Verify extraNodeModules maps react to single location           |
| Gluestack styling not applied                     | @gluestack-style/react not resolving     | Verify extraNodeModules includes @gluestack-style/react mapping |
| TextField Input not rendering                     | @gluestack-ui/themed Input import failed | Verify package installed and extraNodeModules configured        |

### Development Workflow Errors

| Error                                      | Cause                                        | Resolution                                |
| ------------------------------------------ | -------------------------------------------- | ----------------------------------------- |
| Hot reload not detecting signal-ui changes | watchFolders not including sibling directory | Verify metro.config.js watchFolders array |
| expo-doctor peer dependency warnings       | @types/react-native installed                | Expected; non-blocking (see ADR-GH3-03)   |

---

## Testing Strategy

### Unit Tests

Not applicable for this integration ticket. Signal UI components are tested within the signal-ui-react-shared repository. This ticket's scope is configuration and re-export only.

### Integration Tests

| Test Case                                | Method                            | Expected Result                                |
| ---------------------------------------- | --------------------------------- | ---------------------------------------------- |
| Metro bundles without errors             | `npx expo export --platform ios`  | Exit code 0, no "Unable to resolve" errors     |
| TypeScript compiles without errors       | `npm run typecheck`               | Exit code 0                                    |
| Components render in verification screen | Manual: navigate to verify screen | Button, Text, TextField visible and functional |

### Verification Screen

A dedicated verification screen at `src/app/__signal-ui-verify.tsx` provides runtime verification:

```typescript
// Renders all three components with interactive state
- Button: pressable, logs to console
- Text: displays styled content
- TextField: accepts input, shows value
```

### Acceptance Criteria Verification

| AC  | Verification Method                 | Pass Criteria                                     |
| --- | ----------------------------------- | ------------------------------------------------- |
| AC1 | `npm run typecheck`                 | Exit 0                                            |
| AC2 | Metro bundler log                   | No duplicate runtime warnings                     |
| AC3 | ~~Render Button with loading=true~~ | **Blocked:** Button has no loading prop           |
| AC4 | Render TextField, trigger onChange  | Value updates, no console errors                  |
| AC5 | Import path grep                    | All feature imports use `@/core/presentation/...` |

### CI Integration

Recommended CI steps for regression protection:

```yaml
- npm run typecheck
- npm run lint
- npx expo export --platform ios --output-dir /tmp/export-check
```
