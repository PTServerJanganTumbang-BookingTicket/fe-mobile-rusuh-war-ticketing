# Implementation Plan

## Overview

GH-8 implements the Waiting Room screen with deterministic fake Queue capability. Implementation follows TDD approach: domain calculations → data source → hooks → components → screen.

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
                    T1 (Domain Types)
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         T2 (ETA)   T3 (Progress)  T4 (Scenarios)
              │          │          │
              └──────────┼──────────┘
                         ▼
                 T5 (FakeQueueDataSource)
                         │
                         ▼
                  T6 (useQueue Hook)
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
      T7 (ProgressBar)  T8 (QueueStates)  T9 (WaitingRoom)
              │          │          │
              └──────────┼──────────┘
                         ▼
                 T10 (Feature Barrel)
                         │
                         ▼
                 T11 (Integration Tests)
                         │
                         ▼
                 T12 (Verification)
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1"] },
    { "wave": 2, "tasks": ["T2", "T3", "T4"] },
    { "wave": 3, "tasks": ["T5"] },
    { "wave": 4, "tasks": ["T6"] },
    { "wave": 5, "tasks": ["T7", "T8", "T9"] },
    { "wave": 6, "tasks": ["T10"] },
    { "wave": 7, "tasks": ["T11"] },
    { "wave": 8, "tasks": ["T12"] }
  ]
}
```

---

## Tasks

### T1: Queue Feature Domain Types

**R-IDs:** R1, R2, R3

**Description:** Create Queue feature folder structure and define domain types (QueueUpdate, QueueScenario, QueueScenarioStep). Types must be pure TypeScript with no React dependencies.

**Files to create/modify:**

- `src/features/queue/domain/queue-update.types.ts`
- `src/features/queue/domain/queue-scenario.types.ts`
- `src/features/queue/domain/index.ts`
- `__tests__/features/queue/domain/queue-update.test.ts`
- `__tests__/features/queue/domain/queue-scenario.test.ts`

**Planned Tests:**

- Unit: QueueUpdate type validation
- Unit: QueueScenario structure validation
- Unit: QueueScenarioStep structure validation

**Verification Gate:** `npm run typecheck` passes, `npm test` passes for new tests, `npm run boundary-check` passes

**Commit:**

```
[GH-8][Rosyid] feat(queue): add Queue domain types
```

---

### T2: ETA Calculation Function

**R-IDs:** R4

**Description:** Implement pure `calculateEta(position, ratePerMin)` function with formula `Math.ceil(position / ratePerMin)`, minimum 1. Add `formatEta(minutes)` for display formatting with ">3 hours" threshold.

**Files to create/modify:**

- `src/features/queue/domain/queue-eta.utils.ts`
- `src/features/queue/domain/index.ts` (export)
- `__tests__/features/queue/domain/queue-eta.test.ts`

**Planned Tests:**

- Unit: calculateEta(100, 20) = 5
- Unit: calculateEta(1, 20) = 1 (minimum)
- Unit: calculateEta(10, 3) = 4 (ceiling)
- Unit: formatEta(180) = "more than 3 hours"
- Unit: formatEta(45) = "45 min"
- Unit: formatEta(1) = "1 min"

**Verification Gate:** `npm test __tests__/features/queue/domain/queue-eta.test.ts` passes

**Commit:**

```
[GH-8][Rosyid] feat(queue): add ETA calculation utilities
```

---

### T3: Progress Calculation Function

**R-IDs:** R5

**Description:** Implement pure `calculateProgress(initialPosition, currentPosition)` function returning percentage (0-100). Handle edge cases: same position = 0%, position 0 = 100%.

**Files to create/modify:**

- `src/features/queue/domain/queue-progress.utils.ts`
- `src/features/queue/domain/index.ts` (export)
- `__tests__/features/queue/domain/queue-progress.test.ts`

**Planned Tests:**

- Unit: calculateProgress(100, 50) = 50
- Unit: calculateProgress(100, 100) = 0
- Unit: calculateProgress(100, 0) = 100
- Unit: calculateProgress(50, 25) = 50
- Unit: calculateProgress(1, 1) = 0

**Verification Gate:** `npm test __tests__/features/queue/domain/queue-progress.test.ts` passes

**Commit:**

```
[GH-8][Rosyid] feat(queue): add progress calculation utilities
```

---

### T4: Queue Scenario Fixtures

**R-IDs:** R3

**Description:** Create deterministic scenario fixtures covering all Queue states: queue-moving, queue-stuck, full-booked-then-open, closed, full-queue, granted-fast.

**Files to create/modify:**

- `src/features/queue/data/fixtures/scenarios.ts`
- `src/features/queue/data/fixtures/index.ts`
- `__tests__/features/queue/data/fixtures/scenarios.test.ts`

**Planned Tests:**

- Unit: SCENARIO_QUEUE_MOVING has correct structure
- Unit: SCENARIO_QUEUE_STUCK emits bounded updates at same position
- Unit: SCENARIO_FULL_BOOKED_THEN_OPEN has recovery step
- Unit: SCENARIO_CLOSED ends with CLOSED state
- Unit: SCENARIO_FULL_QUEUE has FULL_QUEUE state
- Unit: SCENARIO_GRANTED includes grant metadata

**Verification Gate:** `npm test __tests__/features/queue/data/fixtures/scenarios.test.ts` passes

**Commit:**

```
[GH-8][Rosyid] feat(queue): add deterministic scenario fixtures
```

---

### T5: FakeQueueDataSource Implementation

**R-IDs:** R2, R10

**Description:** Implement FakeQueueDataSource class that plays scenarios with deterministic timing. Supports start(), stop(), and callback-based updates. Must handle grant metadata correctly.

**Files to create/modify:**

- `src/features/queue/data/FakeQueueDataSource.ts`
- `src/features/queue/data/index.ts`
- `__tests__/features/queue/data/FakeQueueDataSource.test.ts`

**Planned Tests:**

- Integration: start() emits initial state
- Integration: updates arrive at correct intervals (fake timers)
- Integration: stop() stops updates
- Integration: onComplete called on scenario end
- Integration: queue-moving progresses to GRANTED
- Integration: grant metadata included when GRANTED
- Integration: full-booked-then-open recovers correctly
- Integration: closed terminates stream

**Verification Gate:** `npm test __tests__/features/queue/data/FakeQueueDataSource.test.ts` passes

**Commit:**

```
[GH-8][Rosyid] feat(queue): implement FakeQueueDataSource
```

---

### T6: useQueue Hook Implementation

**R-IDs:** R9, R6

**Description:** Implement React hook that consumes FakeQueueDataSource. Returns presentation state including position, eta, progress, queueState, engagementState, grant info. Handles mount/unmount lifecycle.

**Files to create/modify:**

- `src/features/queue/presentation/hooks/useQueue.ts`
- `src/features/queue/presentation/hooks/index.ts`
- `src/features/queue/presentation/index.ts`
- `__tests__/features/queue/presentation/hooks/useQueue.test.ts`

**Planned Tests:**

- Integration: hook returns initial state after mount
- Integration: state updates on QueueUpdate events
- Integration: calculates ETA correctly
- Integration: calculates progress correctly
- Integration: exposes grant info when GRANTED
- Integration: cleanup on unmount (stop called)
- Integration: error state on source error

**Verification Gate:** `npm test __tests__/features/queue/presentation/hooks/useQueue.test.ts` passes

**Commit:**

```
[GH-8][Rosyid] feat(queue): implement useQueue hook
```

---

### T7: ProgressBar Component

**R-IDs:** R8

**Description:** Implement ProgressBar component for Queue progress visualization. Must support 0-100% progress, React Native accessibility props (accessibilityRole, accessibilityValue, accessibilityLabel), NativeWind styling.

**Files to create/modify:**

- `src/features/queue/presentation/components/ProgressBar.tsx`
- `src/features/queue/presentation/components/index.ts`
- `__tests__/features/queue/presentation/components/ProgressBar.render.test.tsx`

**Planned Tests:**

- Render: progress=0 renders empty bar
- Render: progress=50 renders half-filled bar
- Render: progress=100 renders full bar
- Render: has accessibilityRole="progressbar"
- Render: has accessibilityValue with min/max/now
- Render: has accessibilityLabel for screen readers

**Verification Gate:** `npm test __tests__/features/queue/presentation/components/ProgressBar.render.test.tsx` passes

**Commit:**

```
[GH-8][Rosyid] feat(queue): implement ProgressBar component
```

---

### T8: Queue State Display Components

**R-IDs:** R7

**Description:** Create display components/views for different Queue states: QueuedView, FullBookedView, FullQueueView, ClosedView, GrantedView. These are composition-ready for WaitingRoomScreen.

**Files to create/modify:**

- `src/features/queue/presentation/components/QueueStateViews.tsx`
- `__tests__/features/queue/presentation/components/QueueStateViews.render.test.tsx`

**Planned Tests:**

- Render: QueuedView shows position and ETA
- Render: FullBookedView shows inventory message
- Render: FullQueueView shows queue full message
- Render: ClosedView shows terminal message
- Render: GrantedView shows grant info

**Verification Gate:** `npm test __tests__/features/queue/presentation/components/QueueStateViews.render.test.tsx` passes

**Commit:**

```
[GH-8][Rosyid] feat(queue): implement Queue state display views
```

---

### T9: WaitingRoomScreen Implementation

**R-IDs:** R7

**Description:** Implement WaitingRoomScreen that composes useQueue, ProgressBar, and state views. Matches Figma "Waiting Room — Mobile" frame structure.

**Files to create/modify:**

- `src/features/queue/presentation/screens/WaitingRoomScreen.tsx`
- `src/features/queue/presentation/screens/index.ts`
- `__tests__/features/queue/presentation/screens/WaitingRoomScreen.render.test.tsx`

**Planned Tests:**

- Render: initial QUEUED state shows position, progress, ETA
- Render: position update reflects new values
- Render: FULL_BOOKED state shows appropriate view
- Render: FULL_QUEUE state shows queue full view
- Render: CLOSED state shows terminal view
- Render: GRANTED state shows grant info view

**Verification Gate:** `npm test __tests__/features/queue/presentation/screens/WaitingRoomScreen.render.test.tsx` passes

**Commit:**

```
[GH-8][Rosyid] feat(queue): implement WaitingRoomScreen
```

---

### T10: Queue Feature Barrel Export

**R-IDs:** R1

**Description:** Create feature barrel index.ts exporting public API. Only types and public components/hooks should be exported. Follow GH-16 Events feature pattern.

**Files to create/modify:**

- `src/features/queue/index.ts`

**Planned Tests:**

- Verify exports compile and are accessible from outside feature

**Verification Gate:** `npm run typecheck` passes, `npm run boundary-check` passes

**Commit:**

```
[GH-8][Rosyid] feat(queue): add feature barrel exports
```

---

### T11: Integration Tests for Full Scenarios

**R-IDs:** R12

**Description:** Add integration tests covering full scenario flows: queue-moving → GRANTED, full-booked → recovery, closed terminal. Verify no network calls are made.

**Files to create/modify:**

- `__tests__/features/queue/integration/queue-scenarios.integration.test.ts`

**Planned Tests:**

- Integration: queue-moving scenario completes with GRANTED
- Integration: full-booked-then-open scenario recovers correctly
- Integration: closed scenario terminates
- Integration: useQueue + WaitingRoomScreen integration
- Integration: no network calls (mock fetch to throw)

**Verification Gate:** `npm test __tests__/features/queue/integration` passes

**Commit:**

```
[GH-8][Rosyid] test(queue): add scenario integration tests
```

---

### T12: Full Verification and Cleanup

**R-IDs:** R11, R12, R13

**Description:** Run all verification gates, ensure no regressions, verify architecture boundaries. Clean up any test-only code. Document any deferred items.

**Files to create/modify:**

- None (verification only)

**Planned Tests:**

- All existing tests pass
- All new tests pass
- boundary-check passes
- lint passes
- typecheck passes

**Verification Gate:**

1. `npm run lint` — passes
2. `npm run typecheck` — passes
3. `npm test` — all tests pass
4. `npm run boundary-check` — no violations
5. `npx expo-doctor` — passes (with known exceptions)
6. `npx expo export` — builds successfully

**Commit:**

```
[GH-8][Rosyid] chore(queue): verify all gates pass
```

---

## Task Summary Table

| Task | R-IDs    | Files                   | Verification      | Commit                                             |
| ---- | -------- | ----------------------- | ----------------- | -------------------------------------------------- |
| T1   | R1,R2,R3 | domain types            | typecheck, tests  | `feat(queue): add Queue domain types`              |
| T2   | R4       | queue-eta.utils.ts      | unit tests        | `feat(queue): add ETA calculation utilities`       |
| T3   | R5       | queue-progress.utils.ts | unit tests        | `feat(queue): add progress calculation utilities`  |
| T4   | R3       | scenarios fixtures      | unit tests        | `feat(queue): add deterministic scenario fixtures` |
| T5   | R2,R10   | FakeQueueDataSource     | integration tests | `feat(queue): implement FakeQueueDataSource`       |
| T6   | R9,R6    | useQueue hook           | integration tests | `feat(queue): implement useQueue hook`             |
| T7   | R8       | ProgressBar             | render tests      | `feat(queue): implement ProgressBar component`     |
| T8   | R7       | QueueStateViews         | render tests      | `feat(queue): implement Queue state display views` |
| T9   | R7       | WaitingRoomScreen       | render tests      | `feat(queue): implement WaitingRoomScreen`         |
| T10  | R1       | index.ts barrel         | boundary-check    | `feat(queue): add feature barrel exports`          |
| T11  | R12      | integration tests       | test pass         | `test(queue): add scenario integration tests`      |
| T12  | R11-13   | —                       | all 6 gates       | `chore(queue): verify all gates pass`              |

---

## Notes

1. **GH-5 Reuse:** Tasks T1-T6 import types from `@/core/domain` (QueueState, EngagementState, etc.). No duplication.

2. **Fake Timers:** Tests in T5-T6 should use `jest.useFakeTimers()` for deterministic timing tests.

3. **Navigation Deferred:** WaitingRoomScreen (T9) shows grant state but does NOT navigate. Navigation is GH-16 deferred scope.

4. **Signal UI Gap:** ProgressBar (T7) is built locally because signal-ui-react-shared lacks this component.

5. **No Observer<T>:** Per ADR-1, FakeQueueDataSource uses callbacks instead of Observer pattern. This is intentional YAGNI.
