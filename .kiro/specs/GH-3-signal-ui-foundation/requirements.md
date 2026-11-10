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
| Signal UI          | Telkomsel's design system implemented as signal-ui-react-shared React Native component library                   |
| Nativewind         | Tailwind CSS implementation for React Native, v4 compatible with Expo SDK 58                                     |
| Source Consumption | Importing directly from library's `src/` files instead of built `dist/` output                                   |

---

## Requirements

### Functional Requirements

#### R1: Metro Resolver Configuration

**Description:** Configure Metro bundler to resolve signal-ui-react-shared imports from the library's source files since the dist/ folder does not exist.

**Acceptance Criteria:**

- R1-AC1: `metro.config.js` contains custom resolver that maps `signal-ui-react-shared` to `../signal-ui-react-shared/src/index.ts`
- R1-AC2: `metro.config.js` includes `watchFolders` entry for signal-ui-react-shared directory
- R1-AC3: Starting Metro bundler (`npx expo start`) produces no resolution errors for signal-ui imports

#### R2: TypeScript Path Configuration

**Description:** Configure TypeScript to resolve react and react-native imports from the app's node_modules when following signal-ui source files.

**Acceptance Criteria:**

- R2-AC1: `tsconfig.json` contains paths mapping for react and react-native to the app's node_modules copies
- R2-AC2: `npm run typecheck` passes without errors on Button, Text, TextField imports from signal-ui-react-shared

**Note:** The ticket mentions a fallback of limiting typecheck to app code only. Per repository governance, this fallback requires explicit human approval before implementation. If R2-AC2 cannot be achieved, the ticket is BLOCKED pending human decision — do not unilaterally weaken the typecheck gate.

#### R3: Button Component Verification

**Description:** Signal UI Button component renders and functions correctly.

**Acceptance Criteria:**

- R3-AC1: Button component imports without runtime errors
- R3-AC2: Button renders with correct Signal UI styling (primary variant)
- R3-AC3: Button loading state renders correctly
- R3-AC4: Button onPress handler fires when pressed

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
- R5-AC3: TextField displays error state when errorText prop is provided

#### R6: No Duplicate React Runtime

**Description:** Metro resolver must ensure single React/React Native runtime instance when consuming signal-ui-react-shared.

**Acceptance Criteria:**

- R6-AC1: Signal UI render tests execute without "Invalid hook call" errors
- R6-AC2: Bundler resolves React and React Native through the app's dependency graph (verified via test or bundler output)

### Non-Functional Requirements

#### R7: Type Safety

**Description:** TypeScript must pass without suppression for the three accepted components.

**Acceptance Criteria:**

- R7-AC1: No `@ts-ignore` or `@ts-expect-error` on Button, Text, TextField imports (unless documented limitation applies per R2-AC3)

#### R8: CI Gate Compliance

**Description:** All existing CI gates must continue passing after Signal UI integration.

**Acceptance Criteria:**

- R8-AC1: `npm run lint` passes
- R8-AC2: `npm run typecheck` passes
- R8-AC3: `npm test` passes
- R8-AC4: `npm run boundary-check` passes
- R8-AC5: `npx expo-doctor` passes (20/20 checks)
- R8-AC6: `npx expo export` succeeds for iOS and Android

---

## Constraints

1. **Source Consumption Only:** signal-ui-react-shared has no dist/ folder. Must use custom Metro resolver to consume source files directly.

2. **No Library Modifications:** Cannot modify signal-ui-react-shared repository as part of this ticket.

3. **Clean Architecture Boundaries:** Signal UI components must be imported via core/presentation layer, not directly in feature presentation layers.

4. **No External Dependencies on Ticket #4:** This ticket uses Metro resolver only. The future Git URL dependency switch (#4) is explicitly out of scope.

5. **Relative Path Dependency:** signal-ui-react-shared is a sibling directory in the parent workspace at `../signal-ui-react-shared`.

---

## Out of Scope

**Explicitly excluded from acceptance criteria:**

1. Other 16 Signal UI components (Badges, BottomSheet, Breadcrumb, Callout, Checkbox, CheckboxGroup, Chips, Icon, Label, Modal, OTP, Radio, Snackbar, Switch, Tab, TextArea)
2. White token replacement (signal-ui-react-shared white token PR)
3. dist/ build consumption (signal-ui-react-shared compatibility PR)
4. Full component integration testing beyond render verification
5. Any Ticket #4 scope (Git URL install switch)
6. Production-level error boundaries for Signal UI components

---

## Known Issues (Non-Blocking per Ticket #3)

Per `G-expo-spike.md` and Ticket #3 Test Scenarios table:

1. **Button raw-string warning (T3-06):** "Text strings must be rendered within a Text component" — Button component returns raw string children without Text wrapper. **Ticket #3 explicitly designates T3-06 as Blocking: No.** The ticket states: "if warning appears, document as known limitation but do not block." This is an accepted limitation for #3, not a silent deferral. The warning originates in signal-ui-react-shared, which is out of scope for modification.

2. **@gluestack-ui/themed peer deps:** Outdated @react-aria/checkbox peer dependency conflict with React 19. Install succeeds; monitor for runtime issues.

3. **White token gap:** Figma has 71 tokens, library has 70 (no white). 12 hardcoded #FFFFFF instances exist. Not blocking this ticket.

---

## Definition of Done (DoD) Criteria

Per AGENTS.md §5-6 and repository governance, the following must be individually verified before requesting merge approval:

### Implementation Quality

| Criterion                   | Verification Method | Evidence Required                              |
| --------------------------- | ------------------- | ---------------------------------------------- |
| All acceptance criteria met | Checklist review    | Each R1-R8 AC verified with specific evidence  |
| Metro resolver configured   | T3-01               | `npx expo start` produces no resolution errors |
| TypeScript resolves imports | T3-02, T3-07        | `npm run typecheck` passes (exit 0)            |
| Button renders              | T3-03               | Jest test passes                               |
| Text renders                | T3-04               | Jest test passes                               |
| TextField renders           | T3-05               | Jest test passes                               |
| No duplicate React runtime  | T3-09               | Render tests pass without "Invalid hook call"  |

### CI Gates (AGENTS.md §5-6)

| Gate           | Command                  | Evidence                                     |
| -------------- | ------------------------ | -------------------------------------------- |
| lint           | `npm run lint`           | Exit 0, no errors                            |
| typecheck      | `npm run typecheck`      | Exit 0, no errors                            |
| test           | `npm test`               | All tests pass including new signal-ui tests |
| boundary-check | `npm run boundary-check` | Exit 0, no violations                        |
| expo-doctor    | `npx expo-doctor`        | 20/20 checks pass                            |
| expo-export    | `npx expo export`        | iOS and Android bundles created              |

### Git/PR Requirements (AGENTS.md §4, §7, §9)

| Criterion      | Verification                                    |
| -------------- | ----------------------------------------------- |
| Branch naming  | `story/GH-3-signal-ui-foundation`               |
| Commit format  | `[GH-3][Rosyid] <type>(<scope>): <description>` |
| No hook bypass | No `--no-verify` used                           |
| Clean diff     | `git diff` reviewed, no unintended changes      |
| PR created     | PR targets main, all CI green                   |

### Lifecycle Events (Post-Implementation)

| Event                          | Trigger                       |
| ------------------------------ | ----------------------------- |
| Project #2 → In Review         | After PR created and CI green |
| Supervisor A / Rosyid approval | Human review of PR            |
| Merge to main                  | After approval                |
| Project #2 → Done              | After merge (automated)       |
