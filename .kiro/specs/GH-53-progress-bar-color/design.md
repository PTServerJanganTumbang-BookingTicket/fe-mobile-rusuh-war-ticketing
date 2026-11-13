# Design — GH-53 Progress Bar Color Change

## Overview

Minimal styling change: update ProgressBar fill color from blue to brand red (#EC1C2E). No architectural changes.

---

## Architecture

### Domain Layer

Not applicable — this is a styling-only change.

### Data Layer

Not applicable.

### Presentation Layer

- **ProgressBar.tsx:** Update fill background color from `bg-blue-600` to `bg-[#EC1C2E]`

---

## Component Diagram

```
src/features/queue/presentation/components/ProgressBar.tsx
└── Fill View
    └── className: "bg-blue-600" → "bg-[#EC1C2E]"  ← CHANGE
```

---

## Data Flow

Not applicable — no data changes.

---

## Components and Interfaces

### Components

| Component   | Responsibility                          | Layer        |
| ----------- | --------------------------------------- | ------------ |
| ProgressBar | Displays progress fill with brand color | Presentation |

### Interfaces

No interface changes. Only style values are modified.

---

## Data Models

Not applicable — no domain entities.

---

## Correctness Properties

### Property 1: Brand Color Applied

**Validates: Requirements 1.1**

Progress bar fill must use #EC1C2E (brand red). (R1-AC1)

---

## Error Handling

Not applicable — no error states for this change.

---

## Testing Strategy

### Unit Tests

| Test                   | Description                        |
| ---------------------- | ---------------------------------- |
| ProgressBar renders    | Verify component renders with fill |
| Progress value clamped | Verify 0-100 range enforcement     |

### Integration Tests

Not required — covered by visual inspection in Expo Go.

### E2E Tests

Not required — trivial styling change.

---

## ADRs (Architecture Decision Records)

### ADR-GH53-01: Arbitrary Value vs Tailwind Config

**Context:** Brand red #EC1C2E is not in tailwind.config.js.

**Decision:** Use NativeWind arbitrary value `bg-[#EC1C2E]` for immediate fix.

**Consequences:**

- (+) No config changes needed
- (+) Consistent with approach in GH-52
- (-) Not reusable as semantic class (future: add to config)

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
