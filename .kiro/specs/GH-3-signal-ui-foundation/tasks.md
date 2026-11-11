# Implementation Plan — GH-3 Signal UI Foundation

## Overview

Integrate signal-ui-react-shared via Metro custom resolver. Configure TypeScript via declaration file. Create Signal UI wrapper module in core/presentation. Write render tests for Button, Text, TextField. Required two bounded repairs (A1 Metro mapping, A3-min dependencies).

**Completed:** 9 commits on branch `story/GH-3-signal-ui-foundation`

---

## Task Summary Table

| Task | R-IDs       | Status  | Files                                            | Commit                                                    |
| ---- | ----------- | ------- | ------------------------------------------------ | --------------------------------------------------------- |
| T1   | R1          | ✅ Done | metro.config.js                                  | `feat(metro): add signal-ui-react-shared custom resolver` |
| T2   | R2          | ✅ Done | signal-ui-react-shared.d.ts                      | `chore(types): add signal-ui type declarations`           |
| T3   | R3,R4,R5    | ✅ Done | signal/index.ts                                  | `feat(signal): add Signal UI wrapper module`              |
| T4   | R3,R6       | ✅ Done | Button.test.tsx                                  | `test(signal): add Button render tests`                   |
| T5   | R4,R5,R6    | ✅ Done | Text.test.tsx, TextField.test.tsx                | `test(signal): add Text and TextField render tests`       |
| T6   | R7,R8       | ✅ Done | Jest mock                                        | `chore(test): add Jest mock for signal-ui-react-shared`   |
| T7   | R1          | ✅ Done | metro.config.js                                  | `fix(metro): resolve css-interop for Signal UI source`    |
| T8   | R1,R5       | ✅ Done | package.json, package-lock.json, metro.config.js | `feat(deps): add Gluestack dependencies for TextField`    |
| T9   | R3,R4,R5,R8 | ✅ Done | __signal-ui-verify.tsx, spec files               | `docs(spec): reconcile GH-3 spec with implementation`     |

---

## Completed Tasks Detail

### T1: Configure Metro Custom Resolver

**R-IDs:** R1 | **Commit:** f1fc8ca

Added custom Metro resolver with:

- `watchFolders` for signal-ui-react-shared directory
- Custom `resolveRequest` for signal-ui module resolution
- Initial `extraNodeModules` for react, react-native

### T2: Configure TypeScript Declarations

**R-IDs:** R2 | **Commit:** (included in T3)

Created `src/signal-ui-react-shared.d.ts` with ambient module declarations for:

- Main module types (ButtonProps, TextProps, TextFieldProps)
- Component subpath declarations

**Design Decision:** Declaration file approach chosen over tsconfig paths because signal-ui source files have transitive dependencies that don't exist in the app's node_modules.

### T3: Create Signal UI Wrapper Module

**R-IDs:** R3, R4, R5 | **Commit:** f1fc8ca

Created `src/core/presentation/components/signal/index.ts` with:

- Direct component imports (not barrel) to avoid pulling all 19 components
- Re-exports for Button, Text, TextField
- Type exports for ButtonProps, TextProps, TextFieldProps

### T4: Add Button Render Tests

**R-IDs:** R3, R6 | **Commit:** 1979d1c

Created `__tests__/signal-ui/Button.test.tsx`:

- Basic render test
- onPress handler test
- Variant tests (primary, secondary)
- Disabled state test
- Color variant tests

**Note:** No loading test — Button API has no loading prop.

### T5: Add Text and TextField Render Tests

**R-IDs:** R4, R5, R6 | **Commit:** 1979d1c

Created:

- `__tests__/signal-ui/Text.test.tsx` — variant tests (h1, body1, label, h2, h3, body2)
- `__tests__/signal-ui/TextField.test.tsx` — render, input, error state, disabled state

### T6: Add Jest Mock

**R-IDs:** R7, R8 | **Commit:** c802640

Created Jest mock for signal-ui-react-shared to enable render testing without Metro bundling.

### T7: A1 Metro Mapping Repair

**R-IDs:** R1 | **Commit:** 5596dff

**Problem:** Metro failed bundling real signal-ui source with "Unable to resolve react-native-css-interop/jsx-runtime"

**Root Cause:** NativeWind v4's babel `jsxImportSource` transforms JSX in watched signal-ui files to import from css-interop, but signal-ui source can't resolve it through standard traversal.

**Fix:** Added `react-native-css-interop` to `extraNodeModules` mapping.

### T8: A3-min Dependency Repair

**R-IDs:** R1, R5 | **Commit:** (current)

**Problem:** TextField requires @gluestack-ui/themed which was not installed.

**Fix:** Installed exactly 3 packages:

- `@gluestack-ui/themed@1.1.73` — TextField's Input primitives
- `react-native-svg@15.16.0` — Expo SDK 58 pinned version
- `@types/react-native@0.73.0` — Peer metadata containment

Added to `extraNodeModules`:

- `@gluestack-ui/themed`
- `@gluestack-style/react`

**Verification:** npm ls confirms single versions of react, react-native, css-interop, virtualized-lists.

### T9: Specification Reconciliation

**R-IDs:** R3, R4, R5, R8 | **Commit:** (current)

Updated spec files to reflect actual implementation:

- Documented A1 and A3-min repairs
- Documented declaration file TypeScript approach
- Documented react-native-css-interop extraNodeModules requirement
- Documented @types/react-native peer metadata containment
- Removed obsolete R3-AC3 (Button loading) — API doesn't exist
- Updated expo-doctor expectation to 18/20 (known warnings)
- Added declaration drift risk documentation

---

## Verification Evidence

### CI Gates

| Gate           | Status                                      | Evidence                        |
| -------------- | ------------------------------------------- | ------------------------------- |
| lint           | ✅ PASS                                     | `npm run lint` exit 0           |
| typecheck      | ✅ PASS                                     | `npm run typecheck` exit 0      |
| test           | ✅ PASS                                     | 36/36 tests pass                |
| boundary-check | ✅ PASS                                     | `npm run boundary-check` exit 0 |
| expo-doctor    | ACCEPTED GH-3 EXCEPTION — HUMAN ADJUDICATED | 18/20, exit 1 (not PASS)        |
| expo-export    | ✅ PASS                                     | iOS/Android/Web bundles created |

### Duplicate Runtime Check

| Runtime                         | Version | Status    |
| ------------------------------- | ------- | --------- |
| react                           | 19.3.1  | ✅ SINGLE |
| react-native                    | 0.88.1  | ✅ SINGLE |
| react-native-css-interop        | 0.2.7   | ✅ SINGLE |
| @react-native/virtualized-lists | 0.88.1  | ✅ SINGLE |

### Bundle Verification

| Platform | Modules | Size                        |
| -------- | ------- | --------------------------- |
| Web      | 2053    | 1.2MB (verification screen) |
| iOS      | 2637    | 5.2MB HBC                   |
| Android  | 2634    | 5.2MB HBC                   |

---

## Button Loading Criterion Resolution

**Original R3-AC3:** "Button loading state renders correctly"

**Investigation Result:** The actual signal-ui-react-shared Button component API (in `src/components/Button/Button.types.ts`) has NO `loading` prop. The ButtonProps interface includes:

- variant, color, size, full, disabled, children, onPress, leftIcon, rightIcon, testID, className, style

**Resolution:** R3-AC3 is removed from acceptance criteria as it mandates unsupported library behavior. This is a specification correction, not a weakening of criteria — the criterion was always unsatisfiable without library modification.

---

## Known Warnings

### expo-doctor (ACCEPTED GH-3 EXCEPTION — HUMAN ADJUDICATED)

**Result:** 18/20, exit code 1

**This is NOT a PASS.** Supervisor A / Rosyid granted a narrow GH-3 exception covering ONLY:

**A. @types/react-native@0.73.0**

- Exists solely to satisfy legacy @gluestack-ui/themed@1.1.73 peer metadata
- Prevents npm resolution to @types/react-native@0.72.8 which causes duplicate @react-native/virtualized-lists@0.72.x
- Application uses React Native 0.88.1's built-in types as actual RN type source

**B. Missing react-dom / react-native-web Gluestack peer metadata**

- Web-only peers not required for mobile GH-3 integration
- Not installed to avoid adding unnecessary web dependencies

1. **@types/react-native warning:** "should not be installed directly" — Present for peer metadata containment only
2. **Missing react-dom/react-native-web:** Web-only Gluestack peers, not required for mobile runtime

### T3-06 Button Raw String Warning

**Status:** UNVERIFIED — Requires actual runtime observation in Expo Go which is not available in this environment. Bundle success does not prove warning absence.
