# Requirements Document

## GH-3 Signal UI Foundation

## Introduction

Integrate signal-ui-react-shared library via custom Metro resolver. Verify that **Button**, **Text**, and **TextField** components render correctly. This ticket establishes the Signal UI foundation for the mobile application.

**Scope limitation:** Only Button, Text, and TextField are acceptance criteria. All other 16 Signal UI components are out of scope.

---

## Glossary

| Term               | Definition                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Metro Resolver     | Custom resolution logic in metro.config.js that redirects signal-ui-react-shared imports to library source files |
| Signal UI          | Design system implemented as signal-ui-react-shared React Native component library                               |
| NativeWind         | Tailwind CSS implementation for React Native, v4 compatible with Expo SDK 58                                     |
| Source Consumption | Importing directly from library's `src/` files instead of built `dist/` output                                   |
| extraNodeModules   | Metro configuration that forces specific modules to resolve from app's node_modules                              |
| A1 Repair          | Metro mapping fix for react-native-css-interop jsx-runtime resolution                                            |
| A3-min Repair      | Minimal dependency installation for TextField's @gluestack-ui/themed requirement                                 |

---

## Requirements

### Functional Requirements

#### R1: Metro Resolver Configuration

**Description:** Configure Metro bundler to resolve signal-ui-react-shared imports from the library's source files since the dist/ folder does not exist.

**Acceptance Criteria:**

- R1-AC1: `metro.config.js` contains custom resolver that maps `signal-ui-react-shared` to `../signal-ui-react-shared/src/index.ts`
- R1-AC2: `metro.config.js` includes `watchFolders` entry for signal-ui-react-shared directory
- R1-AC3: `metro.config.js` includes `extraNodeModules` for react, react-native, react-native-css-interop, @gluestack-ui/themed, @gluestack-style/react
- R1-AC4: Starting Metro bundler (`npx expo start`) produces no resolution errors for signal-ui imports

#### R2: TypeScript Resolution

**Description:** Configure TypeScript to resolve signal-ui-react-shared imports without errors.

**Acceptance Criteria:**

- R2-AC1: `src/signal-ui-react-shared.d.ts` provides ambient module declarations for Button, Text, TextField types
- R2-AC2: `npm run typecheck` passes without errors on Button, Text, TextField imports from signal-ui-react-shared

**Note:** The implementation uses a declaration file approach rather than tsconfig paths. This is a design decision documented in ADR-GH3-02.

#### R3: Button Component Verification

**Description:** Signal UI Button component renders and functions correctly.

**Acceptance Criteria:**

- R3-AC1: Button component imports without runtime errors
- R3-AC2: Button renders with correct Signal UI styling (primary variant)
- ~~R3-AC3: Button loading state renders correctly~~ **REMOVED** — Signal UI Button API has no loading prop
- R3-AC4: Button onPress handler fires when pressed

**Specification Correction Required:** R3-AC3 mandated a `loading` prop that does not exist in the signal-ui-react-shared Button API. This criterion is removed as unsatisfiable without library modification.

#### R4: Text Component Verification

**Description:** Signal UI Text component renders with variant support.

**Acceptance Criteria:**

- R4-AC1: Text component imports without runtime errors
- R4-AC2: Text renders with variant="h1" correctly
- R4-AC3: Text renders with variant="body1" correctly
- R4-AC4: Text renders with variant="label" correctly

#### R5: TextField Component Verification

**Description:** Signal UI TextField component accepts input and shows error state.

**Acceptance Criteria:**

- R5-AC1: TextField component imports without runtime errors
- R5-AC2: TextField renders and accepts text input
- R5-AC3: TextField displays error state when `errorText` prop is provided

**Note:** TextField API uses `name` (not `label`), `onChange` (not `onChangeText`), `errorText` (not `error`).

#### R6: No Duplicate React Runtime

**Description:** Metro resolver must ensure single React/React Native runtime instance when consuming signal-ui-react-shared.

**Acceptance Criteria:**

- R6-AC1: Signal UI render tests execute without "Invalid hook call" errors
- R6-AC2: `npm ls react` shows single react@19.3.1 version
- R6-AC3: `npm ls react-native` shows single react-native@0.88.1 version
- R6-AC4: `npm ls @react-native/virtualized-lists` shows single version (0.88.1)

### Non-Functional Requirements

#### R7: Type Safety

**Description:** TypeScript must pass without suppression for the three accepted components.

**Acceptance Criteria:**

- R7-AC1: No `@ts-ignore` or `@ts-expect-error` on Button, Text, TextField imports

#### R8: CI Gate Compliance

**Description:** All existing CI gates must continue passing after Signal UI integration.

**Acceptance Criteria:**

- R8-AC1: `npm run lint` passes
- R8-AC2: `npm run typecheck` passes
- R8-AC3: `npm test` passes
- R8-AC4: `npm run boundary-check` passes
- R8-AC5: `npx expo-doctor` — ACCEPTED GH-3 EXCEPTION (18/20, exit 1; human adjudicated)
- R8-AC6: `npx expo export` succeeds for iOS and Android

**Note on R8-AC5:** expo-doctor 18/20 is ACCEPTED GH-3 EXCEPTION — HUMAN ADJUDICATED. Supervisor A / Rosyid granted exception for:

1. @types/react-native@0.73.0 — peer metadata containment to avoid duplicate virtualized-lists
2. Missing react-dom/react-native-web — web-only Gluestack peers not needed for mobile

This exception covers ONLY these two findings. No other expo-doctor failures are accepted.

---

## Constraints

1. **Source Consumption Only:** signal-ui-react-shared has no dist/ folder. Must use custom Metro resolver to consume source files directly.

2. **No Library Modifications:** Cannot modify signal-ui-react-shared repository as part of this ticket.

3. **Clean Architecture Boundaries:** Signal UI components must be imported via core/presentation layer, not directly in feature presentation layers.

4. **No External Dependencies on Ticket #4:** This ticket uses Metro resolver only. The future Git URL dependency switch (#4) is explicitly out of scope.

5. **Relative Path Dependency:** signal-ui-react-shared is a sibling directory in the parent workspace at `../signal-ui-react-shared`.

6. **Peer Dependency Containment:** @types/react-native@0.73.0 is installed ONLY for peer metadata satisfaction, not as the app's canonical RN type source. React Native 0.88+ ships its own types.

---

## Out of Scope

**Explicitly excluded from acceptance criteria:**

1. Other 16 Signal UI components (Badges, BottomSheet, Breadcrumb, Callout, Checkbox, CheckboxGroup, Chips, Icon, Label, Modal, OTP, Radio, Snackbar, Switch, Tab, TextArea)
2. White token replacement (signal-ui-react-shared white token PR)
3. dist/ build consumption (signal-ui-react-shared compatibility PR)
4. Full component integration testing beyond render verification
5. Any Ticket #4 scope (Git URL install switch)
6. Production-level error boundaries for Signal UI components
7. Button loading prop (does not exist in library)

---

## Known Issues (Non-Blocking per Ticket #3)

1. **Button raw-string warning (T3-06):** "Text strings must be rendered within a Text component" — Button component returns raw string children without Text wrapper. **Ticket #3 explicitly designates T3-06 as Blocking: No.** Document presence/absence.

2. **expo-doctor warnings:** Two expected warnings:
   - @types/react-native installation warning (peer containment)
   - Missing react-dom/react-native-web peers (web-only)

3. **Declaration drift risk:** `src/signal-ui-react-shared.d.ts` must be manually updated when signal-ui APIs change.

---

## Definition of Done (DoD) Criteria

### Implementation Quality

| Criterion                   | Verification Method | Evidence Required                                |
| --------------------------- | ------------------- | ------------------------------------------------ |
| All acceptance criteria met | Checklist review    | Each R1-R8 AC verified with specific evidence    |
| Metro resolver configured   | T3-01               | `npx expo start` produces no resolution errors   |
| TypeScript resolves imports | T3-02, T3-07        | `npm run typecheck` passes (exit 0)              |
| Button renders              | T3-03               | Jest test passes                                 |
| Text renders                | T3-04               | Jest test passes                                 |
| TextField renders           | T3-05               | Jest test passes                                 |
| No duplicate React runtime  | T3-09               | Render tests pass + npm ls shows single versions |

### CI Gates (AGENTS.md §5-6)

| Gate           | Command                  | Evidence                                 |
| -------------- | ------------------------ | ---------------------------------------- |
| lint           | `npm run lint`           | Exit 0, no errors                        |
| typecheck      | `npm run typecheck`      | Exit 0, no errors                        |
| test           | `npm test`               | All tests pass including signal-ui tests |
| boundary-check | `npm run boundary-check` | Exit 0, no violations                    |
| expo-doctor    | `npx expo-doctor`        | 18/20 checks pass (2 known warnings)     |
| expo-export    | `npx expo export`        | iOS and Android bundles created          |

### Git/PR Requirements (AGENTS.md §4, §7, §9)

| Criterion      | Verification                                    |
| -------------- | ----------------------------------------------- |
| Branch naming  | `story/GH-3-signal-ui-foundation`               |
| Commit format  | `[GH-3][Rosyid] <type>(<scope>): <description>` |
| No hook bypass | No `--no-verify` used                           |
| Clean diff     | `git diff` reviewed, no unintended changes      |
