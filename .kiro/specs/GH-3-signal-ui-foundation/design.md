# Design — GH-3 Signal UI Foundation

## Overview

Integrate signal-ui-react-shared by configuring Metro bundler to resolve imports from the library's source files (since dist/ does not exist). TypeScript paths must resolve react/react-native through the app's node_modules to avoid duplicate runtime instances.

The design follows the established Clean Architecture: Signal UI components are wrapped and re-exported from `core/presentation/` as the single entry point for the rest of the application.

---

## Architecture

### Layer Placement

```
src/
├── core/
│   └── presentation/
│       └── components/
│           └── signal/           # Signal UI re-exports
│               ├── index.ts      # Barrel export
│               ├── Button.tsx    # Thin wrapper (optional)
│               ├── Text.tsx      # Thin wrapper (optional)
│               └── TextField.tsx # Thin wrapper (optional)
```

**Rationale:** Core/presentation is the correct home for design system components. Features import from `@/core/presentation/components/signal` rather than directly from signal-ui-react-shared, preserving a single integration point.

### Domain Layer

Not affected. Signal UI is pure presentation-layer concern.

### Data Layer

Not affected.

### Presentation Layer

Signal UI components live in `core/presentation/components/signal/`. Direct imports from signal-ui-react-shared are restricted to this directory only.

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
│  │ src/core/presentation/components/signal/                 │    │
│  │   ├── index.ts  ──────────► re-exports Button, Text, TF │    │
│  │   ├── Button.tsx                                         │    │
│  │   ├── Text.tsx                                           │    │
│  │   └── TextField.tsx                                      │    │
│  └───────────────────────────┬─────────────────────────────┘    │
└──────────────────────────────┼──────────────────────────────────┘
                               │ imports from
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│            External: signal-ui-react-shared/src/                │
│  (Resolved via Metro custom resolver from sibling directory)    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Button, Text, TextField components + theme exports       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

**Import Resolution Flow:**

1. App code imports `@/core/presentation/components/signal`
2. Barrel re-exports from signal-ui-react-shared
3. Metro resolver intercepts `signal-ui-react-shared` import
4. Resolves to `../signal-ui-react-shared/src/index.ts`
5. Signal UI component code uses React/React Native
6. Metro resolves react/react-native to app's node_modules (via extraNodeModules)

**TypeScript Resolution Flow:**

1. TypeScript follows import to signal-ui source file
2. tsconfig paths redirect react/react-native to app's node_modules
3. Types resolve without traversing into signal-ui's (missing) node_modules

---

## Components and Interfaces

### Components

| Component              | Responsibility                                     | Layer             |
| ---------------------- | -------------------------------------------------- | ----------------- |
| `signal/index.ts`      | Barrel export for Button, Text, TextField          | core/presentation |
| `signal/Button.tsx`    | (Optional) Thin wrapper around signal-ui Button    | core/presentation |
| `signal/Text.tsx`      | (Optional) Thin wrapper around signal-ui Text      | core/presentation |
| `signal/TextField.tsx` | (Optional) Thin wrapper around signal-ui TextField | core/presentation |

### Interfaces

```typescript
// Re-export from signal-ui-react-shared
export { Button } from "signal-ui-react-shared";
export type { ButtonProps } from "signal-ui-react-shared";

export { Text } from "signal-ui-react-shared";
export type { TextProps } from "signal-ui-react-shared";

export { TextField } from "signal-ui-react-shared";
export type { TextFieldProps } from "signal-ui-react-shared";
```

---

## Data Models

No domain models required. Signal UI is pure presentation.

---

## Correctness Properties

### Property 1: Single React Runtime

**Validates: Requirements 6.1, 6.2**

Metro's `extraNodeModules` ensures all React/React Native imports resolve to the app's node_modules, preventing duplicate runtime instances that would cause hook errors.

**Enforced by:** Metro resolver configuration + render tests that would fail with "Invalid hook call" if duplicates existed.

### Property 2: Clean Architecture Boundary

**Validates: Requirements 8.4**

Direct signal-ui-react-shared imports are restricted to `core/presentation/components/signal/`. Feature layers import from `@/core/presentation/components/signal`.

**Enforced by:** eslint-plugin-boundaries rules (boundary-check gate).

### Property 3: Type Resolution Consistency

**Validates: Requirements 2.2, 7.1**

TypeScript resolves types for Button, Text, TextField without errors or suppressions.

**Enforced by:** `npm run typecheck` gate.

---

## Error Handling

| Error Type                    | Layer   | Handling Strategy                 | User Feedback                  |
| ----------------------------- | ------- | --------------------------------- | ------------------------------ |
| Metro resolution failure      | Build   | Fail build with clear error       | Build error message            |
| TypeScript resolution failure | Build   | BLOCKED — requires human decision | N/A (build-time)               |
| Component render failure      | Runtime | React error boundary (future)     | Crash/blank screen (temporary) |

---

## Testing Strategy

### Unit Tests

| Test File                                | Purpose                                       | Coverage Target       |
| ---------------------------------------- | --------------------------------------------- | --------------------- |
| `__tests__/signal-ui/Button.test.tsx`    | Button renders, press works, loading state    | R3-AC1 through R3-AC4 |
| `__tests__/signal-ui/Text.test.tsx`      | Text renders with variants h1, body1, label   | R4-AC1 through R4-AC4 |
| `__tests__/signal-ui/TextField.test.tsx` | TextField renders, accepts input, shows error | R5-AC1 through R5-AC3 |

### Integration Tests

| Test                | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| T3-01 (from ticket) | Metro bundler starts without resolution errors       |
| T3-09 (from ticket) | No duplicate React runtime (single React resolution) |

### E2E Tests

Not required for this ticket. Manual QA in Expo Go is verification method.

---

## ADRs (Architecture Decision Records)

### ADR-GH3-01: Metro Custom Resolver over npm Link

**Context:** signal-ui-react-shared has no dist/ folder and cannot be installed as a standard npm dependency.

**Decision:** Use custom Metro resolver to point imports at library source files, with watchFolders for hot reload.

**Consequences:**

- (+) No library modifications required
- (+) Changes in signal-ui source hot-reload during development
- (-) Tighter coupling to library source structure
- (-) TypeScript needs path aliases for transitive dependencies

### ADR-GH3-02: Core/Presentation as Signal UI Host

**Context:** Signal UI components could be imported directly by features, or centralized in core/presentation.

**Decision:** All Signal UI imports flow through `core/presentation/components/signal/`.

**Consequences:**

- (+) Single point of modification if library API changes
- (+) Can add app-specific wrappers/defaults if needed
- (+) Clean Architecture boundary enforcement is straightforward
- (-) Slight indirection for imports

### ADR-GH3-03: Thin Wrappers vs Direct Re-export

**Context:** Signal UI components could be re-exported directly or wrapped with app-specific defaults.

**Decision:** Start with direct re-exports. Add thin wrappers only if app-specific defaults emerge.

**Consequences:**

- (+) Minimal code to maintain
- (+) Signal UI API is fully exposed
- (-) No place for app-wide defaults until wrappers are added

---

## Dependencies

### External Packages

| Package                | Purpose                   | Already Installed  |
| ---------------------- | ------------------------- | ------------------ |
| signal-ui-react-shared | Design system components  | No (source-linked) |
| @gluestack-ui/themed   | Signal UI peer dependency | No (transitive)    |

### Internal Modules

- `src/app/_layout.tsx` — May need Nativewind preset update for Signal UI theme
- `metro.config.js` — Requires custom resolver addition
- `tsconfig.json` — Requires paths configuration
- `tailwind.config.js` — May need Signal UI preset integration

---

## Risks

| Risk                                                         | Likelihood | Impact | Mitigation                                                                       |
| ------------------------------------------------------------ | ---------- | ------ | -------------------------------------------------------------------------------- |
| @gluestack-ui/themed React 19 incompatibility                | Medium     | High   | Monitor runtime; fallback to wrapping with try/catch                             |
| TypeScript cannot resolve signal-ui transitive deps          | Medium     | Medium | Attempt tsconfig paths first; if unresolvable, report BLOCKED for human decision |
| Metro resolver breaks on signal-ui internal structure change | Low        | Medium | Pin to known-working commit; test on CI                                          |
| Duplicate React runtime despite extraNodeModules             | Low        | High   | T3-09 test catches this; fail loudly                                             |

---

## Open Questions

**RESOLVED:**

1. ~~Where does signal-ui-react-shared live?~~ → `../signal-ui-react-shared` (sibling in SemestralAssessment workspace)

2. ~~Does signal-ui-react-shared have dist/?~~ → No. Source consumption required.

3. ~~Which components are in scope?~~ → Button, Text, TextField only.

**NO UNRESOLVED QUESTIONS** — Ticket #3 scope is fully defined.
