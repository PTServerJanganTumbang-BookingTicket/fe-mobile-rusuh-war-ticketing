# Implementation Plan — GH-15 E-Ticket Placeholder

## Overview

Create minimal e-ticket feature module with presentation-only placeholder screen. Two tasks: feature structure setup with screen component, and render test.

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
T1 (Feature module + screen) ──► T2 (Render test)
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1"] },
    { "wave": 2, "tasks": ["T2"] }
  ],
  "dependencies": {
    "T1": [],
    "T2": ["T1"]
  }
}
```

---

## Tasks

### T1: Create E-Ticket Feature Module with Placeholder Screen

**R-IDs:** R1, R2

**Description:** Create feature directory structure and placeholder screen component using Signal UI Text.

**Files to create:**

- `src/features/eticket/index.ts`
- `src/features/eticket/presentation/screens/ETicketPlaceholderScreen.tsx`

**Verification Gate:**

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run boundary-check` passes

**Commit:**

```
[GH-15][Rosyid] feat(eticket): add coming-soon placeholder screen
```

---

### T2: Add Placeholder Render Test

**R-IDs:** R1, R3

**Description:** Add render test verifying placeholder mounts and displays expected "Coming Soon" content.

**Files to create:**

- `__tests__/features/eticket/ETicketPlaceholderScreen.render.test.tsx`

**Verification Gate:**

- `npm test` passes
- New test included in test count
- All 6 CI gates pass

**Commit:**

```
[GH-15][Rosyid] test(eticket): add placeholder screen render test
```

---

## Task Summary Table

| Task | R-IDs  | Files                                    | Verification                    | Commit                                              |
| ---- | ------ | ---------------------------------------- | ------------------------------- | --------------------------------------------------- |
| T1   | R1, R2 | index.ts, ETicketPlaceholderScreen.tsx   | typecheck, lint, boundary-check | `feat(eticket): add coming-soon placeholder screen` |
| T2   | R1, R3 | ETicketPlaceholderScreen.render.test.tsx | npm test passes, all 6 CI gates | `test(eticket): add placeholder screen render test` |

---

## Test Plan

### Render Tests (Required)

| Test ID | Description                       | Acceptance Criteria                           | Classification |
| ------- | --------------------------------- | --------------------------------------------- | -------------- |
| RT-1    | Placeholder renders without error | Component mounts successfully                 | render         |
| RT-2    | Coming Soon message displays      | "Coming Soon" text present in rendered output | render         |

### Unit Tests

**N/A** — No business logic to test. Placeholder contains no conditional logic, computations, or domain rules.

### Integration Tests

**N/A** — GH-15 introduces no integration boundary.

### Edge-Case Tests

**N/A** — Static placeholder has no edge cases (no input, no state, no conditional logic).

### Error-Case Tests

**N/A** — Static component with no error states (no network calls, no data dependencies).

### Test Data / Fakes / Fixtures

**N/A** — Static placeholder has no data dependencies. No fakes, mocks, or fixtures required beyond the standard Jest/React Native Testing Library setup already in the repository.

---

## Verification Gates Checklist

Future implementation must verify:

- [ ] `npm run lint` — exit 0
- [ ] `npm run typecheck` — exit 0
- [ ] `npm test` — all pass including new render test
- [ ] `npm run boundary-check` — exit 0
- [ ] `npx expo-doctor` — same baseline as main
- [ ] `npx expo export` — iOS/Android bundles succeed

---

## Assessment Mapping

| Focus Area            | Evidence                                                | Acceptance / Trade-off                    | Verification |
| --------------------- | ------------------------------------------------------- | ----------------------------------------- | ------------ |
| UI Implementation     | Placeholder screen with "Coming Soon" message           | No Figma frame exists (intentional)       | Code review  |
| Software Design       | Presentation-only feature module, no domain/data layers | YAGNI — placeholder has no business logic | Code review  |
| Software Construction | Uses Signal UI Text component                           | GH-3 qualified                            | Code review  |
| Software Quality      | Render test for placeholder                             | Minimal scope, confirms component mounts  | Test passes  |
| Software Deployment   | N/A                                                     | No deployment-specific work               | N/A          |
| Software Security     | N/A                                                     | No security surface                       | N/A          |

---

## Notes

1. **No domain/data layers** — Intentionally omitted per ADR-GH15-01. Creating empty layers would violate YAGNI.

2. **No route composition** — Routing/navigation integration is outside GH-15 and remains owned by the future flow that has an approved contract.

3. **Signal UI Text only** — Button component is not required for this placeholder. The Assessment Mapping reflects actual component usage.

4. **Test categories** — Unit/integration/edge/error tests are N/A with explicit technical rationale. Render testing is the only applicable category.
