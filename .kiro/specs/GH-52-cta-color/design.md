# Design — GH-52 CTA Color Change

## Overview

Simple styling change in EventCard.tsx to update the CTA button color from blue (#3b82f6) to brand red (#EC1C2E). No architectural changes needed.

---

## Architecture

### Domain Layer

Not applicable — this is a styling-only change.

### Data Layer

Not applicable.

### Presentation Layer

- **EventCard.tsx:** Update `ctaButton` and `ctaButtonText` styles

---

## Component Diagram

```
EventCard.tsx
└── styles.ctaButton
    ├── backgroundColor: "#3b82f6" → "#EC1C2E"  ← CHANGE
    └── (disabled: "#e5e7eb" → unchanged)
```

---

## Data Flow

Not applicable — no data changes.

---

## Components and Interfaces

No interface changes. Only style values are modified.

---

## Data Models

Not applicable.

---

## Correctness Properties

### Property 1: Brand Color Applied

**Validates: Requirements 1.1**

CTA button backgroundColor must be exactly #EC1C2E for enabled state. (R1-AC1)

### Property 2: Arrow Icon Present

**Validates: Requirements 3.1**

CTA label for enabled buttons must end with " →" suffix. (R3-AC1)

---

## Error Handling

Not applicable — no error states for this change.

---

## Testing Strategy

### Unit Tests

| Test                   | Description                                    |
| ---------------------- | ---------------------------------------------- |
| CTA uses brand red     | Verify enabled CTA has backgroundColor #EC1C2E |
| Arrow in enabled label | Verify "Join Queue →" includes arrow           |
| No arrow in disabled   | Verify "Unavailable" has no arrow              |

### Integration Tests

Not required — covered by visual inspection in Expo Go.

---

## ADRs (Architecture Decision Records)

### ADR-GH52-01: Inline Style vs Tailwind Config

**Context:** Brand color #EC1C2E is not in tailwind.config.js.

**Decision:** Use inline `backgroundColor: "#EC1C2E"` in StyleSheet, matching existing pattern in EventCard.

**Consequences:**

- (+) Immediate, no config changes
- (+) Consistent with existing color usage pattern in file
- (-) Color not reusable via Tailwind classes (future enhancement)

---

## Dependencies

None — self-contained change.

---

## Risks

| Risk                  | Likelihood | Impact | Mitigation               |
| --------------------- | ---------- | ------ | ------------------------ |
| Color not exact match | Low        | Low    | Use exact hex from Figma |

---

## Open Questions

None.
