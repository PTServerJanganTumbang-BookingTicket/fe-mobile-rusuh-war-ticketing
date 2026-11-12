# Design — GH-8 Queue Waiting Room with Fake Adapter

## Overview

GH-8 implements the Waiting Room screen with deterministic fake Queue capability. The design reuses GH-5's existing Queue domain types (QueueState, EngagementState, PollTiers, etc.) and follows the feature-first Clean Architecture pattern established in GH-16.

The core abstraction is `FakeQueueDataSource` — a deterministic data source that emits scripted Queue updates. This is NOT an "SSE adapter" or "Observer<T>" pattern; it is a simpler data source that follows the existing `FakeEventDataSource` pattern from GH-16.

**Key Design Decision:** No new Queue-update port/interface is introduced. The existing repository + data source pattern from GH-16 is sufficient. The `useQueue` hook consumes `FakeQueueDataSource` directly via dependency injection.

---

## Architecture

### Domain Layer

The domain layer reuses GH-5 types and adds Queue-specific presentation calculations.

**Reused from GH-5 (no changes):**

- `QueueState` — SCHEDULED | OPEN | FULL_QUEUE | FULL_BOOKED | CLOSED
- `EngagementState` — QUEUED | GRANTED | SELECTING | AWAITING_PAYMENT | CONFIRMED | EXPIRED
- `QueueJoinRequest` / `QueueJoinResponse`
- `PollTiers` / `getPollIntervalMs()` / `sortPollTiers()`
- `remainingMs()` / `serverOffsetMs()` / `getExpiryInfo()`
- Header creation utilities

**New in GH-8:**

- `QueueUpdate` — Queue position update event type
- `QueueScenario` — Scenario definition type
- `calculateEta()` — Pure function for ETA calculation
- `calculateProgress()` — Pure function for progress percentage

### Data Layer

- `FakeQueueDataSource` — Deterministic scenario player
- `QueueScenarioFixtures` — Named scenarios (queue-moving, queue-stuck, etc.)

### Presentation Layer

- `WaitingRoomScreen` — Main screen component
- `ProgressBar` — Progress visualization (Signal UI gap)
- `Countdown` — Grant expiry countdown (if needed beyond GH-5's utilities)
- `useQueue` — React hook consuming FakeQueueDataSource

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                               │
│  ┌───────────────────┐  ┌──────────────┐  ┌────────────────────────────┐│
│  │ WaitingRoomScreen │  │ ProgressBar  │  │ useQueue (hook)            ││
│  │                   │  │              │  │  - state: QueuePresentState││
│  │ - position        │  │ - progress % │  │  - error: Error | null     ││
│  │ - eta             │  │              │  │  - retry: () => void       ││
│  │ - progress        │  └──────────────┘  └─────────────┬──────────────┘│
│  │ - queueState      │                                  │               │
│  │ - grantInfo       │                                  │               │
│  └────────┬──────────┘                                  │               │
│           │                                             │               │
└───────────┼─────────────────────────────────────────────┼───────────────┘
            │                                             │
            │ uses                              subscribes │
            │                                             │
┌───────────┼─────────────────────────────────────────────┼───────────────┐
│           │              Data Layer                     │               │
│  ┌────────▼───────────────────────────────────────┐    │               │
│  │           FakeQueueDataSource                  │◄───┘               │
│  │                                                │                    │
│  │  - scenario: QueueScenario                     │                    │
│  │  - start(): void                               │                    │
│  │  - stop(): void                                │                    │
│  │  - onUpdate: (update: QueueUpdate) => void     │                    │
│  │  - onComplete: () => void                      │                    │
│  │  - onError: (error: Error) => void             │                    │
│  └────────────────────────┬───────────────────────┘                    │
│                           │                                            │
│  ┌────────────────────────▼───────────────────────┐                    │
│  │         QueueScenarioFixtures                  │                    │
│  │                                                │                    │
│  │  - SCENARIO_QUEUE_MOVING                       │                    │
│  │  - SCENARIO_QUEUE_STUCK                        │                    │
│  │  - SCENARIO_FULL_BOOKED_THEN_OPEN              │                    │
│  │  - SCENARIO_CLOSED                             │                    │
│  │  - SCENARIO_FULL_QUEUE                         │                    │
│  │  - SCENARIO_GRANTED                            │                    │
│  └────────────────────────────────────────────────┘                    │
└────────────────────────────────────────────────────────────────────────┘
            │
            │ imports types
            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Domain Layer                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    GH-5 Core Domain (Reused)                    │   │
│  │  QueueState, EngagementState, QueueJoinResponse, PollTiers     │   │
│  │  remainingMs(), serverOffsetMs(), createQueueHeaders()         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    GH-8 Queue Domain (New)                      │   │
│  │  QueueUpdate, QueueScenario, calculateEta(), calculateProgress()│   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Waiting Room Initialization

```
User navigates to Waiting Room
    ↓
WaitingRoomScreen mounts
    ↓
useQueue hook mounts with FakeQueueDataSource
    ↓
FakeQueueDataSource.start() called
    ↓
Scenario emits first QueueUpdate
    ↓
useQueue state updated with position, queueState, etc.
    ↓
WaitingRoomScreen renders with initial state
```

### 2. Queue Position Update

```
FakeQueueDataSource timer fires
    ↓
Scenario emits next QueueUpdate
    ↓
useQueue receives update via callback
    ↓
useQueue recalculates ETA, progress
    ↓
React state update triggers re-render
    ↓
WaitingRoomScreen shows new position/ETA
```

### 3. Grant Detection

```
FakeQueueDataSource emits GRANTED state
    ↓
useQueue receives update with engagementState: GRANTED
    ↓
useQueue exposes grant metadata (grant_token, booking_expires_at)
    ↓
WaitingRoomScreen detects grant and updates UI
    ↓
(Navigation is deferred to GH-16 — presentation only shows grant state)
```

---

## Components and Interfaces

### Components

| Component               | Responsibility                                 | Layer        |
| ----------------------- | ---------------------------------------------- | ------------ |
| `QueueUpdate`           | Type for Queue position/state update event     | Domain       |
| `QueueScenario`         | Type for scenario definition (steps, timing)   | Domain       |
| `calculateEta()`        | Pure function: position → ETA minutes          | Domain       |
| `calculateProgress()`   | Pure function: (initial, current) → percentage | Domain       |
| `FakeQueueDataSource`   | Plays scenarios, emits deterministic updates   | Data         |
| `QueueScenarioFixtures` | Named scenario definitions                     | Data         |
| `WaitingRoomScreen`     | Waiting Room UI screen                         | Presentation |
| `ProgressBar`           | Progress visualization component               | Presentation |
| `useQueue`              | React hook for Queue state management          | Presentation |

### Interfaces

```typescript
// Domain: Queue update event
interface QueueUpdate {
  /** Current queue position (1-based, 0 when granted) */
  position: number;
  /** Queue state from CONTRACT-BASELINE.md §2.3 */
  queueState: QueueState;
  /** Engagement state from CONTRACT-BASELINE.md §2.2 */
  engagementState: EngagementState;
  /** Server time for offset calculation */
  serverTime: string;
  /** Rate per minute for ETA calculation */
  ratePerMin?: number;
  /** Grant info when GRANTED (CONTRACT-BASELINE.md §2.5) */
  grant?: {
    grant_token: string;
    booking_expires_at: string;
  };
}

// Domain: Scenario step definition
interface QueueScenarioStep {
  /** Delay in ms before this step */
  delayMs: number;
  /** Update to emit */
  update: Partial<QueueUpdate>;
}

// Domain: Named scenario
interface QueueScenario {
  name: string;
  description: string;
  initialState: QueueUpdate;
  steps: QueueScenarioStep[];
}

// Data: FakeQueueDataSource callbacks
interface FakeQueueDataSourceCallbacks {
  onUpdate: (update: QueueUpdate) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
}

// Presentation: Hook result
interface UseQueueResult {
  /** Current queue position */
  position: number;
  /** Calculated ETA in minutes */
  etaMinutes: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current queue state */
  queueState: QueueState;
  /** Current engagement state */
  engagementState: EngagementState;
  /** Grant info when granted */
  grant: { token: string; expiresAt: string } | null;
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Restart scenario */
  retry: () => void;
}
```

---

## Data Models

```typescript
// Reused from GH-5 core/domain (no changes)
import type {
  QueueState,
  EngagementState,
  QueueJoinResponse,
  PollTiers,
} from "@/core/domain";

// New in GH-8 features/queue/domain
export interface QueueUpdate {
  position: number;
  queueState: QueueState;
  engagementState: EngagementState;
  serverTime: string;
  ratePerMin?: number;
  grant?: {
    grant_token: string;
    booking_expires_at: string;
  };
}

export interface QueueScenarioStep {
  delayMs: number;
  update: Partial<QueueUpdate>;
}

export interface QueueScenario {
  name: string;
  description: string;
  initialState: QueueUpdate;
  steps: QueueScenarioStep[];
}

// Presentation state (derived from QueueUpdate)
export interface QueuePresentationState {
  position: number;
  etaMinutes: number;
  etaDisplay: string; // "5 min" or "more than 3 hours"
  progress: number;
  queueState: QueueState;
  engagementState: EngagementState;
  isGranted: boolean;
  grant: { token: string; expiresAt: string } | null;
  grantExpiryMs: number | null;
}
```

---

## Correctness Properties

### Property 1: ETA Formula Correctness

**Validates: Requirements 4.1, 4.2, 4.3**

`calculateEta(position, ratePerMin)` returns `Math.ceil(position / ratePerMin)` with minimum 1. (R4-AC1, R4-AC2, R4-AC4)

### Property 2: Progress Calculation Bounds

**Validates: Requirements 5.1, 5.2, 5.3**

`calculateProgress(initial, current)` returns value in [0, 100], where 0 means no progress and 100 means granted. (R5-AC1, R5-AC2, R5-AC3)

### Property 3: Scenario Determinism

**Validates: Requirements 2.1, 2.2, 12.2**

Given the same scenario and timing, FakeQueueDataSource emits identical updates. No randomness is introduced. (R2-AC1, R2-AC2, R12-AC2)

### Property 4: Terminal State Semantics

**Validates: Requirements 2.4, 3.4**

Only CLOSED queue state and CONFIRMED/EXPIRED engagement states are terminal. FULL_QUEUE and FULL_BOOKED are recoverable. (R2-AC4, R3-AC4)

### Property 5: Grant Metadata Compliance

**Validates: Requirements 3.6, 10.1, 10.2, 10.3**

When engagementState is GRANTED, grant.grant_token and grant.booking_expires_at are present and match CONTRACT-BASELINE.md §2.5 format. (R3-AC6, R10-AC1, R10-AC2, R10-AC3)

### Property 6: No Network Operations

**Validates: Requirements 12.1**

FakeQueueDataSource performs zero HTTP, WebSocket, SSE, or other network operations. All data is in-memory fixture data. (R12-AC1)

---

## Error Handling

| Error Type               | Layer        | Handling Strategy    | User Feedback           |
| ------------------------ | ------------ | -------------------- | ----------------------- |
| Scenario not found       | Data         | Throw Error          | Error state in hook     |
| Scenario already running | Data         | No-op or warning     | None (idempotent)       |
| Invalid position value   | Domain       | Clamp to valid range | None (silent fix)       |
| Grant expiry passed      | Presentation | Show expired state   | "Your slot has expired" |

---

## Testing Strategy

### Unit Tests

| Test                        | File                     | Purpose                |
| --------------------------- | ------------------------ | ---------------------- |
| calculateEta edge cases     | `queue-eta.test.ts`      | R4-AC1, R4-AC2, R4-AC4 |
| calculateProgress bounds    | `queue-progress.test.ts` | R5-AC1, R5-AC2, R5-AC3 |
| QueueUpdate type validation | `queue-update.test.ts`   | Type safety            |
| QueueScenario structure     | `queue-scenario.test.ts` | Scenario validity      |

### Integration Tests

| Test                  | File                          | Purpose                |
| --------------------- | ----------------------------- | ---------------------- |
| queue-moving scenario | `FakeQueueDataSource.test.ts` | R3-AC1                 |
| queue-stuck scenario  | `FakeQueueDataSource.test.ts` | R3-AC2                 |
| full-booked-then-open | `FakeQueueDataSource.test.ts` | R3-AC3                 |
| closed terminal       | `FakeQueueDataSource.test.ts` | R3-AC4                 |
| grant metadata        | `FakeQueueDataSource.test.ts` | R3-AC6, R10-AC1-3      |
| useQueue hook flow    | `useQueue.test.ts`            | R9-AC1, R9-AC2, R9-AC3 |

### Render Tests

| Test                      | File                                | Purpose  |
| ------------------------- | ----------------------------------- | -------- |
| WaitingRoomScreen initial | `WaitingRoomScreen.render.test.tsx` | R7-AC1   |
| WaitingRoomScreen update  | `WaitingRoomScreen.render.test.tsx` | R7-AC2   |
| WaitingRoomScreen states  | `WaitingRoomScreen.render.test.tsx` | R7-AC3-6 |
| ProgressBar variants      | `ProgressBar.render.test.tsx`       | R8-AC1-4 |

---

## ADRs (Architecture Decision Records)

### ADR-1: FakeQueueDataSource over Observer<T> Pattern

**Context:** The earlier qualification proposed an `Observer<T>` abstraction inspired by web's SSE client architecture. This would add complexity for GH-8's deterministic fake capability.

**Decision:** Use a simpler `FakeQueueDataSource` class following the existing `FakeEventDataSource` pattern from GH-16. The data source has callbacks (`onUpdate`, `onComplete`, `onError`) rather than an Observer interface.

**Consequences:**

- ✅ Consistent with existing repository patterns
- ✅ Simpler API for deterministic scenarios
- ✅ YAGNI — no premature abstraction for real SSE
- ⚠️ GH-9/GH-11 may need to introduce a more sophisticated abstraction when real SSE is added

### ADR-2: No New Queue Port/Interface

**Context:** The qualification proposed a minimum Queue-update port interface. However, the existing pattern of data source + hook is already established.

**Decision:** No new port interface is introduced. The `useQueue` hook directly consumes `FakeQueueDataSource` via constructor injection, mirroring `useEvents` + `FakeEventDataSource`.

**Consequences:**

- ✅ Follows established patterns
- ✅ Reduces abstraction overhead
- ⚠️ GH-9 will need to introduce a QueueDataSource interface/port when implementing the real adapter

### ADR-3: Domain Layer Reuses GH-5 Types

**Context:** GH-5 already implemented comprehensive Queue domain types (QueueState, EngagementState, etc.) with full test coverage.

**Decision:** GH-8 imports and reuses all GH-5 Queue types. No duplication or extension unless specifically required.

**Consequences:**

- ✅ Single source of truth for Queue types
- ✅ Type changes propagate automatically
- ✅ No test duplication

### ADR-4: ProgressBar Built Locally

**Context:** Signal UI (signal-ui-react-shared) does not include a ProgressBar component. The Figma design shows a progress bar in the Waiting Room.

**Decision:** Build ProgressBar as a local component in `src/features/queue/presentation/components/`. This follows the GH-8 ticket guidance that notes "ProgressBar: **absent** — build locally in this feature".

**Consequences:**

- ✅ Unblocks GH-8 without external dependency
- ⚠️ May need to move to core/presentation if reused elsewhere
- ⚠️ Style consistency with Signal UI tokens should be maintained

### ADR-5: Grant Navigation Deferred to Future Ticket

**Context:** GH-16 explicitly deferred Queue navigation to Booking screen. GH-8 should not implement this.

**Decision:** GH-8 exposes grant state in presentation (useQueue returns `isGranted`, `grant`) but does NOT navigate. The WaitingRoomScreen shows grant information only. Navigation integration is a future ticket.

**Consequences:**

- ✅ Respects GH-16 scope boundary
- ✅ Grant detection is testable without navigation
- ⚠️ A future ticket must wire navigation

---

## Dependencies

### Internal Dependencies (GH-5 Core Domain)

- `@/core/domain/queue/queue-state.types` — QueueState
- `@/core/domain/queue/engagement.types` — EngagementState
- `@/core/domain/queue/queue-join.types` — QueueJoinResponse
- `@/core/domain/queue/poll-tiers.types` — PollTiers
- `@/core/domain/time/server-time.utils` — remainingMs, serverOffsetMs
- `@/core/domain/__fixtures__` — Queue state fixtures

### External Dependencies

- React, React Native (presentation layer only)
- NativeWind/Tailwind (styling)
- No new npm packages required

---

## Risks

| Risk                                       | Likelihood | Impact | Mitigation                                              |
| ------------------------------------------ | ---------- | ------ | ------------------------------------------------------- |
| Figma frame unavailable for detailed UI    | Low        | Medium | Use documented UI patterns from D-figma-state-report.md |
| FakeQueueDataSource timing issues in tests | Medium     | Low    | Use fake timers (jest.useFakeTimers)                    |
| GH-9 requires different abstraction        | Medium     | Medium | ADR documents decision; GH-9 can refactor               |
| Signal UI ProgressBar added later          | Low        | Low    | Can migrate from local to shared later                  |

---

## Open Questions

1. **Countdown Component:** Should GH-8 build a local Countdown component, or can the ETA display use simple text formatting with `remainingMs()` from GH-5?
   - **Proposed Resolution:** Start with simple text display; add Countdown component if Figma specifies animated countdown.

2. **Grant Detection Callback:** Should `useQueue` accept an `onGranted` callback for parent components to handle navigation?
   - **Proposed Resolution:** Yes, add optional `onGranted?: (grant) => void` callback for future navigation integration.
