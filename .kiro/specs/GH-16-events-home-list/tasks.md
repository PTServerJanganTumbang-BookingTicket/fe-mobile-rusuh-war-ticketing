# Implementation Plan — GH-16 Events Home and List (Fake Data Source)

## Overview

Implement the Events Home/List feature with a fake data source following Clean Architecture. Tasks progress layer by layer: domain types and interfaces first, then data layer implementation, and finally presentation layer with render tests.

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
T1 (Domain types) ──► T2 (Repository interface)
                           │
                           ├──► T3 (Fixtures)
                           │         │
                           │         └──► T4 (FakeEventDataSource)
                           │                    │
                           │                    └──► T5 (FakeEventRepository)
                           │
                           └──► T6 (EventCard)
                                     │
                                     ├──► T7 (State components)
                                     │         │
                                     │         └──► T8 (useEvents hook)
                                     │                    │
                                     │                    └──► T9 (EventsHomeScreen)
                                     │
                                     └──► T10 (Domain/Data unit tests)
                                               │
                                               └──► T11 (Render tests)
                                                         │
                                                         └──► T12 (Feature barrel + route)
```

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["T1"],
      "description": "Domain entity types"
    },
    {
      "wave": 2,
      "tasks": ["T2"],
      "description": "Repository interface"
    },
    {
      "wave": 3,
      "tasks": ["T3", "T6"],
      "description": "Fixtures and EventCard (parallel, independent)"
    },
    {
      "wave": 4,
      "tasks": ["T4", "T7"],
      "description": "FakeEventDataSource and state components"
    },
    {
      "wave": 5,
      "tasks": ["T5", "T8"],
      "description": "FakeEventRepository and useEvents hook"
    },
    {
      "wave": 6,
      "tasks": ["T9", "T10"],
      "description": "EventsHomeScreen and domain/data tests"
    },
    {
      "wave": 7,
      "tasks": ["T11"],
      "description": "Render tests"
    },
    {
      "wave": 8,
      "tasks": ["T12"],
      "description": "Feature barrel and app route"
    }
  ],
  "dependencies": {
    "T1": [],
    "T2": ["T1"],
    "T3": ["T1"],
    "T4": ["T3"],
    "T5": ["T2", "T4"],
    "T6": ["T1"],
    "T7": [],
    "T8": ["T2", "T5"],
    "T9": ["T6", "T7", "T8"],
    "T10": ["T1", "T2", "T3", "T4", "T5"],
    "T11": ["T6", "T7", "T9"],
    "T12": ["T9"]
  }
}
```

---

## Tasks

### T1: Define Event Domain Types

**R-IDs:** R3

**Description:** Create domain entity types for Event, EventStatus, QueueState, and DisplayBlock matching the canonical contract schema.

**Files to create/modify:**

- `src/features/events/domain/Event.ts`
- `src/features/events/domain/index.ts`

**Verification Gate:**

- `npm run typecheck` passes
- Types match docs/CONTRACT-BASELINE.md and web event.model.ts

**Commit:**

```
[GH-16][Rosyid] feat(events): add Event domain types
```

---

### T2: Define EventRepository Interface

**R-IDs:** R4

**Description:** Create the EventRepository port interface in the domain layer.

**Files to create/modify:**

- `src/features/events/domain/EventRepository.ts`
- `src/features/events/domain/index.ts` (update exports)

**Verification Gate:**

- `npm run typecheck` passes
- Interface is pure (no implementation details)
- `npm run boundary-check` passes

**Commit:**

```
[GH-16][Rosyid] feat(events): add EventRepository interface
```

---

### T3: Create Event Fixtures

**R-IDs:** R5, R11

**Description:** Create deterministic fixture data matching the canonical contract and web MSW fixtures.

**Files to create/modify:**

- `src/features/events/data/fixtures/events.ts`

**Verification Gate:**

- `npm run typecheck` passes
- Fixtures cover all EventStatus values
- Fixtures cover all QueueState values
- Fixtures include AVAILABLE + FULL combination

**Commit:**

```
[GH-16][Rosyid] feat(events): add event fixture data
```

---

### T4: Implement FakeEventDataSource

**R-IDs:** R5

**Description:** Create FakeEventDataSource that provides fixture data with optional delay and error simulation.

**Files to create/modify:**

- `src/features/events/data/FakeEventDataSource.ts`
- `src/features/events/data/index.ts`

**Verification Gate:**

- `npm run typecheck` passes
- Returns fixture data for getEvents()
- Returns specific event for getEvent(eventId)
- Supports delay configuration
- Supports error simulation mode

**Commit:**

```
[GH-16][Rosyid] feat(events): add FakeEventDataSource
```

---

### T5: Implement FakeEventRepository

**R-IDs:** R4, R5

**Description:** Create FakeEventRepository implementing EventRepository using FakeEventDataSource.

**Files to create/modify:**

- `src/features/events/data/FakeEventRepository.ts`
- `src/features/events/data/index.ts` (update exports)

**Verification Gate:**

- `npm run typecheck` passes
- Implements EventRepository interface
- `npm run boundary-check` passes

**Commit:**

```
[GH-16][Rosyid] feat(events): add FakeEventRepository
```

---

### T6: Create EventCard Component

**R-IDs:** R2, R9

**Description:** Create feature-local EventCard component displaying event summary information.

**Files to create/modify:**

- `src/features/events/presentation/components/EventCard.tsx`

**Verification Gate:**

- `npm run typecheck` passes
- `npm run lint` passes
- Displays: name, category, venue, city, date, image, status badge, queue state
- Handles display.enabled for button state

**Commit:**

```
[GH-16][Rosyid] feat(events): add EventCard component
```

---

### T7: Create State Components

**R-IDs:** R6, R7, R8

**Description:** Create feature-local LoadingState, EmptyState, and ErrorState components.

**Files to create/modify:**

- `src/features/events/presentation/components/LoadingState.tsx`
- `src/features/events/presentation/components/EmptyState.tsx`
- `src/features/events/presentation/components/ErrorState.tsx`

**Verification Gate:**

- `npm run typecheck` passes
- `npm run lint` passes
- LoadingState shows loading indicator
- EmptyState shows empty message
- ErrorState shows error message and retry button

**Commit:**

```
[GH-16][Rosyid] feat(events): add loading, empty, error state components
```

---

### T8: Create useEvents Hook

**R-IDs:** R1, R6, R7, R8

**Description:** Create React hook for fetching events with loading, error, and retry support.

**Files to create/modify:**

- `src/features/events/presentation/hooks/useEvents.ts`

**Verification Gate:**

- `npm run typecheck` passes
- Hook manages loading, events, error states
- Provides retry function
- Uses EventRepository dependency injection

**Commit:**

```
[GH-16][Rosyid] feat(events): add useEvents hook
```

---

### T9: Create EventsHomeScreen

**R-IDs:** R1, R6, R7, R8, R10

**Description:** Create main screen composing EventList, LoadingState, EmptyState, and ErrorState.

**Files to create/modify:**

- `src/features/events/presentation/components/EventList.tsx`
- `src/features/events/presentation/screens/EventsHomeScreen.tsx`
- `src/features/events/presentation/index.ts`

**Verification Gate:**

- `npm run typecheck` passes
- `npm run lint` passes
- Screen renders correct state based on hook result
- `npm run boundary-check` passes

**Commit:**

```
[GH-16][Rosyid] feat(events): add EventsHomeScreen
```

---

### T10: Add Domain and Data Unit Tests

**R-IDs:** R3, R4, R5, R11

**Description:** Write unit tests for domain types, fixtures, and data source.

**Files to create/modify:**

- `__tests__/features/events/domain/Event.test.ts`
- `__tests__/features/events/data/FakeEventDataSource.test.ts`
- `__tests__/features/events/data/fixtures.test.ts`

**Verification Gate:**

- `npm test` passes
- Tests verify fixture completeness (all EventStatus, all QueueState values)
- Tests verify getEvents() returns fixtures
- Tests verify getEvent(id) returns specific event
- Tests verify delay and error simulation
- Tests verify contract alignment

**Commit:**

```
[GH-16][Rosyid] test(events): add domain and data unit tests
```

---

### T11: Add Render Tests

**R-IDs:** R1, R2, R6, R7, R8, R9

**Description:** Write render tests for EventCard, state components, and EventsHomeScreen.

**Files to create/modify:**

- `__tests__/features/events/presentation/EventCard.test.tsx`
- `__tests__/features/events/presentation/StateComponents.test.tsx`
- `__tests__/features/events/presentation/EventsHomeScreen.test.tsx`

**Verification Gate:**

- `npm test` passes
- EventCard render tests pass
- State component tests pass
- Screen state rendering tests pass

**Commit:**

```
[GH-16][Rosyid] test(events): add presentation render tests
```

---

### T12: Export Feature Barrel and Add Route

**R-IDs:** R10, R12

**Description:** Export public API via feature barrel and add Events Home to app routing.

**Files to create/modify:**

- `src/features/events/index.ts`
- `src/app/(tabs)/index.tsx` (or appropriate route file)

**Verification Gate:**

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run boundary-check` passes
- `npx expo export` succeeds
- Events Home screen accessible in app

**Commit:**

```
[GH-16][Rosyid] feat(events): export feature barrel and add route
```

---

## Task Summary Table

| Task | R-IDs                  | Files                                            | Verification                           | Commit                                                     |
| ---- | ---------------------- | ------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------- |
| T1   | R3                     | Event.ts, domain/index.ts                        | typecheck                              | `feat(events): add Event domain types`                     |
| T2   | R4                     | EventRepository.ts, domain/index.ts              | typecheck, boundary-check              | `feat(events): add EventRepository interface`              |
| T3   | R5, R11                | fixtures/events.ts                               | typecheck, coverage check              | `feat(events): add event fixture data`                     |
| T4   | R5                     | FakeEventDataSource.ts, data/index.ts            | typecheck                              | `feat(events): add FakeEventDataSource`                    |
| T5   | R4, R5                 | FakeEventRepository.ts, data/index.ts            | typecheck, boundary-check              | `feat(events): add FakeEventRepository`                    |
| T6   | R2, R9                 | EventCard.tsx                                    | typecheck, lint                        | `feat(events): add EventCard component`                    |
| T7   | R6, R7, R8             | LoadingState.tsx, EmptyState.tsx, ErrorState.tsx | typecheck, lint                        | `feat(events): add loading, empty, error state components` |
| T8   | R1, R6, R7, R8         | useEvents.ts                                     | typecheck                              | `feat(events): add useEvents hook`                         |
| T9   | R1, R6, R7, R8, R10    | EventList.tsx, EventsHomeScreen.tsx              | typecheck, lint, boundary-check        | `feat(events): add EventsHomeScreen`                       |
| T10  | R3, R4, R5, R11        | domain/_.test.ts, data/_.test.ts                 | test pass                              | `test(events): add domain and data unit tests`             |
| T11  | R1, R2, R6, R7, R8, R9 | presentation/*.test.tsx                          | test pass                              | `test(events): add presentation render tests`              |
| T12  | R10, R12               | index.ts, app route                              | typecheck, boundary-check, expo export | `feat(events): export feature barrel and add route`        |

---

## Notes

1. **Feature-local only:** EventCard, LoadingState, EmptyState, ErrorState stay in features/events — do NOT add to core/presentation or Signal UI.

2. **React Native Image:** Use built-in Image component, not expo-image or react-native-fast-image.

3. **CTA placeholder:** EventCard button's onPress should be a placeholder (no-op or console.log) since queue join is out of scope.

4. **Deterministic fixtures:** Fixtures must be static data, not randomly generated, for reproducible tests.

5. **Delay/error simulation:** FakeEventDataSource should accept configuration for delay (ms) and error simulation mode to support testing all states.

6. **GH-17 boundary:** The EventRepository interface and Event types are the contract GH-17 will rely on. Do not add fields or methods that aren't needed.

7. **Routing placeholder:** The exact route file path depends on current app structure. T12 should integrate with existing Expo Router tabs or create appropriate route.
