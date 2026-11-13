# Implementation Plan

## Overview

Update EventCard CTA button styling: change blue to brand red, add arrow icon to enabled CTAs. Two tasks: implementation and test update.

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
T1 (Style + Arrow) ──► T2 (Test Update)
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

### T1: Update CTA Color and Add Arrow Icon

**R-IDs:** R1, R3

**Description:** Change CTA button backgroundColor from blue to red, add arrow suffix to enabled CTA labels.

**Files to modify:**

- `src/features/events/presentation/components/EventCard.tsx`

**Implementation Details:**

1. Change `ctaButton.backgroundColor` from `#3b82f6` to `#EC1C2E`
2. Update `getCTALabel()` to append " →" for enabled CTAs
3. Keep disabled styling unchanged

**Code Changes:**

```typescript
// In styles:
ctaButton: {
  backgroundColor: "#EC1C2E",  // Changed from #3b82f6
  // ... rest unchanged
}

// In getCTALabel():
function getCTALabel(queueState: Event["queueState"], enabled: boolean): string {
  if (!enabled) {
    return "Unavailable";  // No arrow for disabled
  }
  const label = queueState === "FULL_BOOKED" ? "Notify Me" : "Join Queue";
  return `${label} →`;  // Add arrow for enabled
}
```

**Verification Gate:**

- `npm run typecheck` passes
- `npm run lint` passes
- Visual: Red CTA buttons in Expo Go

**Commit:**

```
[GH-52][Rosyid] feat(events): change CTA color to brand red with arrow icon
```

---

### T2: Update EventCard Unit Tests

**R-IDs:** R1, R3, R4

**Description:** Update existing tests or add new tests to verify CTA color and arrow icon.

**Files to modify:**

- `__tests__/features/events/presentation/components/EventCard.test.tsx` (if exists)
- Or create new test file

**Test Cases:**

1. Enabled CTA label includes arrow (e.g., "Join Queue →")
2. Disabled CTA label has no arrow ("Unavailable")
3. (Optional) Verify style if testing framework supports it

**Verification Gate:**

- `npm test` passes
- New tests pass

**Commit:**

```
[GH-52][Rosyid] test(events): verify CTA arrow icon in EventCard tests
```

---

## Task Summary Table

| Task | R-IDs      | Files              | Verification            | Commit                           |
| ---- | ---------- | ------------------ | ----------------------- | -------------------------------- |
| T1   | R1, R3     | EventCard.tsx      | typecheck, lint, visual | `feat(events): change CTA color` |
| T2   | R1, R3, R4 | EventCard.test.tsx | npm test                | `test(events): verify CTA arrow` |

---

## Notes

- This is a minimal change — only 2 lines in styles, 1 line in getCTALabel()
- Arrow uses Unicode "→" (U+2192), not emoji
- Accessibility: White on #EC1C2E = 4.63:1 contrast (WCAG AA compliant)
