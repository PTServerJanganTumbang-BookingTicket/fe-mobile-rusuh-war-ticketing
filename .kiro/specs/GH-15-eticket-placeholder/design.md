# Design — GH-15 E-Ticket Coming-Soon Placeholder

## Overview

A minimal presentation-only feature module containing a static placeholder screen. No domain or data layers required — the placeholder has no business logic or data dependencies.

---

## Architecture

### Domain Layer

**N/A** — Placeholder has no business logic or domain models. Creating an empty domain layer would violate YAGNI.

### Data Layer

**N/A** — Placeholder has no data dependencies, API calls, or repositories. Creating an empty data layer or fake adapters would add architectural overhead with no responsibility.

### Presentation Layer

Single screen component using Signal UI Text.

```
src/features/eticket/
├── presentation/
│   └── screens/
│       └── ETicketPlaceholderScreen.tsx
└── index.ts
```

---

## Component Diagram

```
┌─────────────────────────────────────────────┐
│     src/features/eticket/index.ts           │
│     export { ETicketPlaceholderScreen }     │
└─────────────────────┬───────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│  src/features/eticket/presentation/screens/ │
│  ETicketPlaceholderScreen.tsx               │
│    └── uses Signal UI Text                  │
└─────────────────────────────────────────────┘
```

**Note:** Route composition (e.g., `src/app/eticket.tsx`) is outside GH-15. Routing/navigation integration remains owned by the future flow that has an approved contract.

---

## Data Flow

**N/A** — Static presentation only, no data flow.

---

## Components and Interfaces

### Components

| Component                | Responsibility                | Layer        |
| ------------------------ | ----------------------------- | ------------ |
| ETicketPlaceholderScreen | Display "Coming Soon" message | Presentation |

### Interfaces

```typescript
// No props required - static placeholder
export const ETicketPlaceholderScreen: React.FC = () => { ... };
```

---

## Data Models

**N/A** — No domain entities for placeholder scope.

---

## Correctness Properties

### Property 1: Placeholder Does Not Imply Real Functionality

**Validates: Requirements 1.3**

The placeholder screen displays only a "Coming Soon" message and does not render any UI that implies e-ticket functionality is available. (R1-AC3)

---

## Error Handling

**N/A** — Static component with no error states. No network calls, no data dependencies, no user input.

---

## Testing Strategy

### Unit Tests

**N/A** — No business logic to unit test. The placeholder contains no conditional logic, no computations, and no domain rules. Creating unit tests would require manufacturing logic solely to satisfy a test category.

### Integration Tests

**N/A** — GH-15 introduces no integration boundary. The placeholder does not integrate with any API, data source, or cross-feature dependency.

### Render Tests

| Test Case                         | Method                        | Expected Result               |
| --------------------------------- | ----------------------------- | ----------------------------- |
| Placeholder renders without error | @testing-library/react-native | Component mounts successfully |
| "Coming Soon" message displays    | @testing-library/react-native | Text content present          |

### Test Classification Summary

| Category    | Applicable | Rationale                                               |
| ----------- | ---------- | ------------------------------------------------------- |
| unit        | N/A        | No business logic to test                               |
| integration | N/A        | No integration boundaries                               |
| render      | Yes        | Verifies component mounts and displays expected content |

### Edge-Case Tests

**N/A** — Static placeholder has no edge cases. There is no input, no state, and no conditional logic that could produce different outcomes.

### Error-Case Tests

**N/A** — Static component with no error states. There are no network calls, no data dependencies, and no operations that can fail.

---

## ADRs (Architecture Decision Records)

### ADR-GH15-01: Presentation-Only Feature Module

**Context:** E-ticket placeholder has no Figma frame, no QR code component, and no backend contract. Creating domain/data layers would add architectural overhead with no responsibility.

**Decision:** Create feature module with presentation layer only. Domain and data layers are explicitly omitted.

**Consequences:**

- (+) YAGNI compliance — no empty architectural layers
- (+) Clear signal that this is a placeholder, not a foundation for real e-ticket
- (-) Future e-ticket implementation will need to add domain/data layers when scope expands

### ADR-GH15-02: Route Composition Outside GH-15

**Context:** Routing/navigation integration is outside GH-15 and remains owned by the future flow that has an approved contract. Payment hand-off and navigation behavior are unresolved.

**Decision:** GH-15 creates the screen component and feature export only. Route composition is out of scope.

**Consequences:**

- (+) Placeholder can be implemented independently
- (+) No speculative routing or payment flow decisions
- (-) Screen is not navigable until a future ticket with approved routing contract adds the route

---

## Dependencies

| Dependency                | Type      | Status                      |
| ------------------------- | --------- | --------------------------- |
| GH-3 Signal UI Foundation | Ticket    | ✅ Merged to main (87e74d7) |
| Signal UI Text component  | Component | ✅ Qualified via GH-3       |

---

## Risks

| Risk            | Likelihood | Impact | Mitigation                 |
| --------------- | ---------- | ------ | -------------------------- |
| None identified | —          | —      | Minimal scope reduces risk |

---

## Open Questions

**None** — Placeholder scope is fully defined. No unresolved decisions.
