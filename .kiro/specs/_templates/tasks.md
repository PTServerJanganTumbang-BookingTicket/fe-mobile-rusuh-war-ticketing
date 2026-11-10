# Implementation Plan

## Overview
a
<!-- Brief description of implementation approach -->

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
<!-- ASCII diagram showing task dependencies -->
T1 ──► T2 ──► T3
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1"] },
    { "wave": 2, "tasks": ["T2"] },
    { "wave": 3, "tasks": ["T3"] }
  ]
}
```

---

## Tasks

### T1: <Task Name>

**R-IDs:** R<n>

**Description:** <!-- What to implement -->

**Files to create/modify:**
- `path/to/file.ts`

**Verification Gate:** <!-- How to verify completion -->

**Commit:**
```
[GH-<n>][Actor] <type>(<scope>): <description>
```

---

### T2: <Task Name>

**R-IDs:** R<n>

**Description:** <!-- ... -->

**Files to create/modify:**
- `path/to/file.ts`

**Verification Gate:** <!-- ... -->

**Commit:**
```
[GH-<n>][Actor] <type>(<scope>): <description>
```

---

## Task Summary Table

| Task | R-IDs | Files | Verification | Commit |
|------|-------|-------|--------------|--------|
| T1 | R<n> | file.ts | Gate description | `[GH-<n>][Actor] type(scope): desc` |
| T2 | R<n> | file.ts | Gate description | `[GH-<n>][Actor] type(scope): desc` |

---

## Notes

<!-- Any additional guidance for implementation -->
