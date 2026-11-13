# Design — GH-51 Shared Header Component (Guest Mode)

## Overview

Create a reusable Header component in the core presentation layer that displays the Rusuh brand identity. The header is minimal (brand only, no login) to support guest mode operation. It integrates into the root layout to appear on all screens.

---

## Architecture

### Domain Layer

Not applicable — Header is purely presentational with no business logic.

### Data Layer

Not applicable — Header has no data dependencies.

### Presentation Layer

- **Header component:** Reusable component in `src/core/presentation/components/`
- **Layout integration:** Added to `src/app/_layout.tsx`

---

## Component Diagram

```
src/app/_layout.tsx
└── Stack (Expo Router)
    └── Screen
        └── View (container)
            ├── Header ← NEW
            └── Slot (screen content)

src/core/presentation/components/
├── Header/
│   ├── Header.tsx      ← Main component
│   ├── BrandMark.tsx   ← Logo icon
│   └── index.ts        ← Exports
└── index.ts            ← Re-export Header
```

---

## Data Flow

No data flow — Header is static UI with no state or props.

---

## Components and Interfaces

### Components

| Component | Responsibility               | Layer        |
| --------- | ---------------------------- | ------------ |
| Header    | Container for brand elements | Presentation |
| BrandMark | Renders the red logo icon    | Presentation |

### Interfaces

```typescript
// No props needed for guest mode header
export interface HeaderProps {
  testID?: string;
}

// BrandMark is self-contained
export interface BrandMarkProps {
  size?: number;
  color?: string;
}
```

---

## Data Models

Not applicable — no domain entities.

---

## Correctness Properties

### Property 1: Header always visible

**Validates: Requirements 2.1**

Header is rendered in `_layout.tsx` outside the `Slot`, ensuring it appears on every screen regardless of navigation state. (R2-AC1)

### Property 2: No authentication UI in guest mode

**Validates: Requirements 1.4**

Header component has no login button, user icon, or authentication-related elements. This is enforced by component structure. (R1-AC4)

---

## Error Handling

Not applicable — Header has no error states.

---

## Testing Strategy

### Unit Tests

| Test                         | Description                                     |
| ---------------------------- | ----------------------------------------------- |
| Header renders brand mark    | Verify BrandMark component is present           |
| Header renders wordmark text | Verify "rusuh." and "BOOKING TIKET" text        |
| Header has no login button   | Verify absence of login-related elements        |
| Accessibility labels present | Verify accessibilityRole and accessibilityLabel |

### Integration Tests

| Test                            | Description                             |
| ------------------------------- | --------------------------------------- |
| Header visible on home screen   | Navigate to `/` and verify header       |
| Header visible on events screen | Navigate to `/events` and verify header |

### E2E Tests

Not required for this component — covered by integration tests.

---

## ADRs (Architecture Decision Records)

### ADR-GH51-01: BrandMark as Styled View vs SVG

**Context:** Need to render the brand mark icon. Options: (1) SVG component, (2) styled View with shapes, (3) PNG image.

**Decision:** Use styled View with simple shapes (circles/rectangles). This avoids adding SVG dependencies and keeps bundle small for a simple logo.

**Consequences:**

- (+) No new dependencies
- (+) Easy to customize colors via props
- (-) Complex logos would be harder; OK for simple geometric shape

### ADR-GH51-02: Header in Root Layout vs Per-Screen

**Context:** Header needs to appear on all screens. Options: (1) Add to `_layout.tsx`, (2) Add to each screen.

**Decision:** Add to `_layout.tsx` root layout.

**Consequences:**

- (+) Single source of truth, guaranteed consistency
- (+) Screens don't need to know about header
- (-) Screens that don't want header need explicit handling (none currently)

---

## Dependencies

- NativeWind (already installed)
- React Native View, Text (core)
- Expo Router Slot (for layout)

---

## Risks

| Risk                                 | Likelihood | Impact | Mitigation                                |
| ------------------------------------ | ---------- | ------ | ----------------------------------------- |
| Header takes too much vertical space | Low        | Medium | Use compact design, test on small screens |
| Brand colors not exact match         | Low        | Low    | Use exact hex values from Figma           |

---

## Open Questions

None — requirements are well-defined from Figma analysis.
