# Implementation Plan — GH-3 Signal UI Foundation

## Overview

Integrate signal-ui-react-shared via Metro custom resolver. Configure TypeScript for type resolution. Create Signal UI wrapper module in core/presentation. Write render tests for Button, Text, TextField.

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
T1 ──► T2 ──► T3 ──► T4 ──► T5 ──► T6
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1"] },
    { "wave": 2, "tasks": ["T2"] },
    { "wave": 3, "tasks": ["T3"] },
    { "wave": 4, "tasks": ["T4"] },
    { "wave": 5, "tasks": ["T5"] },
    { "wave": 6, "tasks": ["T6"] }
  ]
}
```

---

## Tasks

### T1: Configure Metro Custom Resolver

**R-IDs:** R1

**Description:** Update metro.config.js to:

1. Add watchFolders for signal-ui-react-shared directory
2. Add custom resolveRequest for `signal-ui-react-shared` module resolution
3. Add extraNodeModules for react, react-native to ensure single runtime

**Files to create/modify:**

- `metro.config.js`

**Verification Gate:**

- `npx expo start` launches without resolution errors
- No red screen on initial load

**Commit:**

```
[GH-3][Rosyid] feat(metro): add signal-ui-react-shared custom resolver
```

---

### T2: Configure TypeScript Paths

**R-IDs:** R2

**Description:** Update tsconfig.json to:

1. Add paths mapping for signal-ui-react-shared
2. Map react and react-native to local node_modules for type resolution
3. Optionally add baseUrl if not already present

**Files to create/modify:**

- `tsconfig.json`

**Verification Gate:**

- `npm run typecheck` passes
- VSCode/IDE shows correct types for signal-ui imports

**Commit:**

```
[GH-3][Rosyid] chore(tsconfig): add signal-ui type resolution paths
```

---

### T3: Create Signal UI Wrapper Module

**R-IDs:** R3, R4, R5 (partial)

**Description:** Create core/presentation/components/signal/ directory with:

1. `index.ts` — barrel export for Button, Text, TextField
2. Direct re-exports from signal-ui-react-shared

**Files to create/modify:**

- `src/core/presentation/components/signal/index.ts` (create)

**Verification Gate:**

- `npm run lint` passes
- `npm run boundary-check` passes
- Import from `@/core/presentation/components/signal` resolves

**Commit:**

```
[GH-3][Rosyid] feat(signal): add Signal UI wrapper module with Button, Text, TextField
```

---

### T4: Add Button Render Test

**R-IDs:** R3, R6

**Description:** Create render test for Signal UI Button:

1. Test basic render
2. Test onPress fires
3. Test loading state renders
4. Verify no duplicate React runtime (hook call succeeds)

**Files to create/modify:**

- `__tests__/signal-ui/Button.test.tsx` (create)

**Verification Gate:**

- `npm test` passes with new test file
- Button renders without "Invalid hook call" error

**Commit:**

```
[GH-3][Rosyid] test(signal): add Button render tests
```

---

### T5: Add Text and TextField Render Tests

**R-IDs:** R4, R5, R6

**Description:** Create render tests for:

1. Text with variants (h1, body1, label)
2. TextField with input acceptance
3. TextField with error state

**Files to create/modify:**

- `__tests__/signal-ui/Text.test.tsx` (create)
- `__tests__/signal-ui/TextField.test.tsx` (create)

**Verification Gate:**

- `npm test` passes with all signal-ui tests
- Components render without errors

**Commit:**

```
[GH-3][Rosyid] test(signal): add Text and TextField render tests
```

---

### T6: Verify All CI Gates and DoD

**R-IDs:** R7, R8

**Description:** Run full verification suite and document DoD evidence:

1. lint — `npm run lint` exit 0
2. typecheck — `npm run typecheck` exit 0
3. test — `npm test` all pass including signal-ui tests
4. boundary-check — `npm run boundary-check` exit 0
5. expo-doctor — `npx expo-doctor` 20/20
6. expo export — `npx expo export` iOS/Android success
7. Document T3-06 warning status (present/absent) per ticket acceptance

If typecheck fails due to signal-ui type resolution, report BLOCKED — do not weaken the gate.

**Files to create/modify:**

- None (verification only)

**Verification Gate:**

- All 6 CI gates pass
- T3-06 warning documented (blocking: no per ticket)
- DoD checklist complete with evidence

**Commit:**

```
[GH-3][Rosyid] chore(ci): verify all gates pass for Signal UI integration
```

---

## Task Summary Table

| Task | R-IDs    | Files                                                     | Verification                     | Commit                                                    |
| ---- | -------- | --------------------------------------------------------- | -------------------------------- | --------------------------------------------------------- |
| T1   | R1       | metro.config.js                                           | expo start no errors             | `feat(metro): add signal-ui-react-shared custom resolver` |
| T2   | R2       | tsconfig.json                                             | typecheck passes                 | `chore(tsconfig): add signal-ui type resolution paths`    |
| T3   | R3,R4,R5 | src/core/presentation/components/signal/index.ts          | lint, boundary-check pass        | `feat(signal): add Signal UI wrapper module`              |
| T4   | R3,R6    | \_\_tests\_\_/signal-ui/Button.test.tsx                   | test passes                      | `test(signal): add Button render tests`                   |
| T5   | R4,R5,R6 | \_\_tests\_\_/signal-ui/Text.test.tsx, TextField.test.tsx | test passes                      | `test(signal): add Text and TextField render tests`       |
| T6   | R7,R8    | (none)                                                    | all 6 gates pass, DoD documented | `chore(ci): verify all gates pass`                        |

---

## Notes

### Metro Resolver Reference (from G-expo-spike.md)

```javascript
const path = require("path");

const signalUIPath = path.resolve(__dirname, "../signal-ui-react-shared");

config.watchFolders = [signalUIPath];

config.resolver.extraNodeModules = {
  react: path.resolve(__dirname, "node_modules/react"),
  "react-native": path.resolve(__dirname, "node_modules/react-native"),
};

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "signal-ui-react-shared") {
    return {
      filePath: path.join(signalUIPath, "src", "index.ts"),
      type: "sourceFile",
    };
  }
  if (moduleName.startsWith("signal-ui-react-shared/")) {
    const subPath = moduleName.replace("signal-ui-react-shared/", "");
    return {
      filePath: path.join(signalUIPath, "src", subPath),
      type: "sourceFile",
    };
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};
```

### Test Data Requirements

- No external fixtures needed
- Button: string children, onPress mock
- Text: variant prop values (h1, body1, label)
- TextField: placeholder, value, onChangeText mock, errorText

### Known Warnings to Document

1. **Button raw-string warning (T3-06)** — "Text strings must be rendered within a Text component" may appear. Per Ticket #3 Test Scenarios table, T3-06 is explicitly **Blocking: No**. The ticket states: "if warning appears, document as known limitation but do not block." This is a ticket-level acceptance decision, not a silent deferral. Document presence/absence in PR description.

### Typecheck Gate Policy

Per Supervisor A review: Do not pre-plan to weaken the typecheck gate. Attempt full typecheck with tsconfig paths configuration. If typecheck cannot pass, report BLOCKED and escalate for human decision rather than excluding signal-ui from typecheck.
