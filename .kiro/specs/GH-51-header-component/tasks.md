# Implementation Plan

## Overview

Implement the shared Header component with brand mark and wordmark, then integrate into the root layout. Three tasks: component creation, layout integration, and tests.

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
T1 (BrandMark + Header) ──► T2 (Layout Integration) ──► T3 (Tests)
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

### T1: Create Header and BrandMark Components

**R-IDs:** R1, R3, R4

**Description:** Create the Header component with BrandMark subcomponent in core presentation layer.

**Files to create/modify:**

- `src/core/presentation/components/Header/BrandMark.tsx` — Logo icon component
- `src/core/presentation/components/Header/Header.tsx` — Main header component
- `src/core/presentation/components/Header/index.ts` — Barrel exports
- `src/core/presentation/components/index.ts` — Add Header export

**Implementation Details:**

1. BrandMark: Red (#EC1C2E) stylized icon using View shapes
2. Header: Horizontal layout with BrandMark + "rusuh." (bold) + "BOOKING TIKET" (subtitle)
3. Use NativeWind classes for styling
4. Add accessibility props

**Verification Gate:**

- `npm run typecheck` passes
- `npm run lint` passes
- Component exports correctly from `@/core/presentation/components`

**Commit:**

```
[GH-51][Rosyid] feat(core): add Header and BrandMark components
```

---

### T2: Integrate Header into Root Layout

**R-IDs:** R2

**Description:** Add Header component to `_layout.tsx` so it appears on all screens.

**Files to create/modify:**

- `src/app/_layout.tsx` — Import and render Header above Slot

**Implementation Details:**

1. Import Header from `@/core/presentation/components`
2. Wrap Stack/Slot with a View container
3. Render Header at top, Slot below
4. Ensure proper flex layout so content fills remaining space

**Verification Gate:**

- `npm run typecheck` passes
- `npx expo export` succeeds
- Header visible when running in Expo Go

**Commit:**

```
[GH-51][Rosyid] feat(app): integrate Header into root layout
```

---

### T3: Add Unit Tests for Header Component

**R-IDs:** R1, R3, R4

**Description:** Write unit tests verifying Header component structure and accessibility.

**Files to create/modify:**

- `__tests__/core/presentation/components/Header.test.tsx`

**Test Cases:**

1. Header renders without crashing
2. Header contains BrandMark
3. Header contains "rusuh." text
4. Header contains "BOOKING TIKET" text
5. Header has no login button or user icon
6. Header has accessibilityRole="header"
7. BrandMark has accessibilityLabel

**Verification Gate:**

- `npm test` passes
- All new tests pass

**Commit:**

```
[GH-51][Rosyid] test(core): add Header component unit tests
```

---

## Task Summary Table

| Task | R-IDs      | Files                  | Verification        | Commit                                    |
| ---- | ---------- | ---------------------- | ------------------- | ----------------------------------------- |
| T1   | R1, R3, R4 | Header/, BrandMark.tsx | typecheck, lint     | `feat(core): add Header and BrandMark`    |
| T2   | R2         | _layout.tsx            | expo export, visual | `feat(app): integrate Header into layout` |
| T3   | R1, R3, R4 | Header.test.tsx        | npm test            | `test(core): add Header unit tests`       |

---

## Notes

- BrandMark uses simple View shapes (no SVG dependency)
- Header height should be minimal (~48-56px) to maximize content area
- Use exact Figma colors: #EC1C2E (red), #1F2937 (dark), #6B7280 (gray), #FFFFFF (white)
- Test in Expo Go on physical device for guest mode verification
