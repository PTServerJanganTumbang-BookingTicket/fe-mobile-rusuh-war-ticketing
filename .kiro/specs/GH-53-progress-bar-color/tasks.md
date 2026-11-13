# Implementation Plan

## Overview

Single-line color change in ProgressBar component. Minimal change with test verification.

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
T1 (Color Change) ──► T2 (Test Verification)
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1"] },
    { "wave": 2, "tasks": ["T2"] }
  ]
}
```

---

## Tasks

### T1: Change ProgressBar Fill Color

**R-IDs:** R1

**Description:** Update the progress bar fill from blue to brand red.

**Files to modify:**

- `src/features/queue/presentation/components/ProgressBar.tsx`

**Implementation:**

```diff
- className="h-full rounded-full bg-blue-600"
+ className="h-full rounded-full bg-[#EC1C2E]"
```

**Verification Gate:**

- `npm run typecheck` passes
- `npm run lint` passes

**Commit:**

```
[GH-53][Rosyid] feat(queue): change progress bar color to brand red
```

---

### T2: Verify Tests Pass

**R-IDs:** R1, R2

**Description:** Run existing tests to ensure no regressions. Add test if none exists.

**Files to check:**

- `__tests__/features/queue/presentation/components/ProgressBar.test.tsx` (if exists)

**Verification Gate:**

- `npm test` passes

**Commit:**

```
[GH-53][Rosyid] test(queue): verify progress bar color change
```

---

## Task Summary Table

| Task | R-IDs  | Files                | Verification    | Commit                                   |
| ---- | ------ | -------------------- | --------------- | ---------------------------------------- |
| T1   | R1     | ProgressBar.tsx      | typecheck, lint | `feat(queue): change progress bar color` |
| T2   | R1, R2 | ProgressBar.test.tsx | npm test        | `test(queue): verify progress bar`       |

---

## Notes

- This is a 1-line change
- NativeWind supports arbitrary colors via `bg-[#hexcode]` syntax
- No visual regression expected — color change only
