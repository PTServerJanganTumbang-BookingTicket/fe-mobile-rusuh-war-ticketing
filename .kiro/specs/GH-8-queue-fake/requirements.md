# Requirements Document

## Introduction

GH-8 implements deterministic fake Queue capability for the Rusuh Booking Tiket mobile app. This feature enables development, testing, and demonstration of the Waiting Room screen without requiring the real backend Queue service.

The fake Queue capability provides:

- Deterministic Queue position updates through configurable scenarios
- Waiting Room screen matching Figma "Waiting Room — Mobile" frame
- ETA calculation and display
- Grant detection via deterministic state transitions
- All verifiable through unit, integration, and render tests

**Contract Reference:** `docs/CONTRACT-BASELINE.md` (2026-11-11)

## Glossary

| Term                | Definition                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------- |
| Queue Position      | User's numeric position in the virtual queue (1-based)                                      |
| Queue State         | Server state: SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED                              |
| Engagement State    | User state from /queue/me: QUEUED, GRANTED, SELECTING, AWAITING_PAYMENT, CONFIRMED, EXPIRED |
| ETA                 | Estimated Time of Admission — calculated as `ceil(position / ratePerMin)`                   |
| Grant               | Transition from QUEUED to GRANTED engagement state                                          |
| FakeQueueDataSource | Deterministic data source providing scripted Queue scenarios                                |
| Scenario            | Named sequence of Queue updates with deterministic timing and state                         |

## Requirements

### Functional Requirements

#### R1: Queue Feature Scaffold

**Description:** Create the Queue feature module following Clean Architecture patterns established in GH-16 (Events feature).

**Acceptance Criteria:**

- R1-AC1: Given the repository structure, when the Queue feature is created, then it follows `src/features/queue/{domain,data,presentation}/` layout
- R1-AC2: Given the Queue feature index.ts, when external code imports from it, then only public API is accessible
- R1-AC3: Given the Queue feature, when boundary-check runs, then no architecture violations exist

#### R2: FakeQueueDataSource

**Description:** Implement a deterministic data source that provides scripted Queue scenarios for testing and development.

**Acceptance Criteria:**

- R2-AC1: Given a FakeQueueDataSource with a configured scenario, when updates are requested, then they follow the scenario's scripted sequence
- R2-AC2: Given a FakeQueueDataSource, when start() is called, then it emits Queue updates at deterministic intervals
- R2-AC3: Given a FakeQueueDataSource, when stop() is called, then it stops emitting updates and cleans up resources
- R2-AC4: Given a FakeQueueDataSource, when a scenario completes, then it emits a terminal state (CLOSED or GRANTED)

#### R3: Queue Scenario Fixtures

**Description:** Provide named scenarios covering all Queue states and transitions defined in CONTRACT-BASELINE.md §2.3.

**Acceptance Criteria:**

- R3-AC1: Given the scenario "queue-moving", when played, then position decreases until GRANTED state is emitted
- R3-AC2: Given the scenario "queue-stuck", when played, then the same position is emitted for a defined number of updates (bounded), and the data source remains stable until explicitly stopped by the consumer
- R3-AC3: Given the scenario "full-booked-then-open", when played, then FULL_BOOKED is emitted followed by recovery to OPEN
- R3-AC4: Given the scenario "closed", when played, then CLOSED terminal state is emitted and stream terminates
- R3-AC5: Given the scenario "full-queue", when played, then FULL_QUEUE state (503) is emitted
- R3-AC6: Given any scenario, when it emits grant, then grant_token and booking_expires_at are included per CONTRACT-BASELINE.md §2.5

#### R4: ETA Calculation

**Description:** Calculate estimated time of admission from Queue position using the formula `ceil(position / ratePerMin)`.

**Acceptance Criteria:**

- R4-AC1: Given position=100 and ratePerMin=20, when ETA is calculated, then result is 5 minutes
- R4-AC2: Given position=1, when ETA is calculated, then result is 1 minute (minimum)
- R4-AC3: Given ETA > 180 minutes, when displayed, then "more than 3 hours" is shown instead of exact time
- R4-AC4: Given the ETA calculation function, when called, then it is a pure function with no side effects

#### R5: Progress Calculation

**Description:** Calculate Queue progress percentage from position and initial position.

**Acceptance Criteria:**

- R5-AC1: Given initialPosition=100 and currentPosition=50, when progress is calculated, then result is 50%
- R5-AC2: Given initialPosition=currentPosition, when progress is calculated, then result is 0%
- R5-AC3: Given currentPosition=0 (granted), when progress is calculated, then result is 100%

#### R6: Countdown Timer

**Description:** Display countdown timer for grant expiry (booking_expires_at).

**Acceptance Criteria:**

- R6-AC1: Given a grant with booking_expires_at, when displayed, then countdown shows remaining time
- R6-AC2: Given countdown reaches 0, when displayed, then EXPIRED state is indicated
- R6-AC3: Given countdown calculation, when performed, then it uses server-authoritative time via `remainingMs()` from GH-5

#### R7: Waiting Room Screen

**Description:** Implement Waiting Room screen matching Figma "Waiting Room — Mobile" frame.

**Acceptance Criteria:**

- R7-AC1: Given the Waiting Room screen, when rendered with QUEUED state, then it displays position, progress bar, and ETA
- R7-AC2: Given the Waiting Room screen, when Queue position updates, then display reflects new position and ETA
- R7-AC3: Given the Waiting Room screen, when FULL_BOOKED state is received, then appropriate message is displayed
- R7-AC4: Given the Waiting Room screen, when FULL_QUEUE state is received, then "Queue full, please wait" message is displayed
- R7-AC5: Given the Waiting Room screen, when CLOSED state is received, then terminal message is displayed
- R7-AC6: Given the Waiting Room screen, when GRANTED state is received, then grant info is displayed (for presentation; navigation is GH-16 deferred)

#### R8: ProgressBar Component

**Description:** Implement ProgressBar component for Queue progress visualization (Signal UI gap).

**Acceptance Criteria:**

- R8-AC1: Given progress=50, when ProgressBar renders, then visual fill is 50%
- R8-AC2: Given progress=0, when ProgressBar renders, then visual fill is 0%
- R8-AC3: Given progress=100, when ProgressBar renders, then visual fill is 100%
- R8-AC4: Given ProgressBar, when accessibility is checked, then it has appropriate React Native accessibility props (accessibilityRole, accessibilityValue, accessibilityLabel)

#### R9: useQueue Hook

**Description:** React hook that consumes FakeQueueDataSource and provides presentation state.

**Acceptance Criteria:**

- R9-AC1: Given useQueue hook with a scenario, when mounted, then it starts the scenario and returns initial state
- R9-AC2: Given useQueue hook, when Queue updates arrive, then state is updated reactively
- R9-AC3: Given useQueue hook, when unmounted, then scenario is stopped and resources cleaned up
- R9-AC4: Given useQueue hook, when error occurs, then error state is exposed

#### R10: Grant State Handling

**Description:** Handle deterministic grant-state transition for downstream Booking integration.

**Acceptance Criteria:**

- R10-AC1: Given the FakeQueueDataSource emits GRANTED, when consumed, then grant_token is available
- R10-AC2: Given the FakeQueueDataSource emits GRANTED, when consumed, then booking_expires_at is available
- R10-AC3: Given grant metadata, when exposed, then it matches CONTRACT-BASELINE.md §2.5 format
- R10-AC4: Given GRANTED state, when useQueue returns it, then presentation layer can detect and act on it

### Non-Functional Requirements

#### R11: Performance

**Description:** Fake Queue operations must be performant for smooth UI updates.

**Acceptance Criteria:**

- R11-AC1: Given Queue position updates, when processed, then UI updates within 16ms (60fps)
- R11-AC2: Given FakeQueueDataSource start/stop, when called, then operations complete within 10ms

#### R12: Testability

**Description:** All components must be testable without real backend or network.

**Acceptance Criteria:**

- R12-AC1: Given any GH-8 component, when tested, then no real HTTP/network calls are made
- R12-AC2: Given FakeQueueDataSource, when used in tests, then scenarios are deterministic and reproducible
- R12-AC3: Given test files, when run, then they complete without external dependencies

#### R13: Architecture Compliance

**Description:** All code must comply with Clean Architecture boundaries.

**Acceptance Criteria:**

- R13-AC1: Given domain layer code, when inspected, then it has no React/React Native imports
- R13-AC2: Given data layer code, when inspected, then it has no presentation layer imports
- R13-AC3: Given `npm run boundary-check`, when run, then no violations are reported

## Constraints

1. **No Real Networking:** GH-8 must not perform real HTTP, WebSocket, or SSE connections
2. **No Real Backend Dependency:** All functionality must work with FakeQueueDataSource alone
3. **Contract Compliance:** All types and states must match CONTRACT-BASELINE.md exactly
4. **GH-5 Reuse:** Must use existing Queue types from GH-5 (QueueState, EngagementState, etc.)
5. **GH-16 Patterns:** Must follow established feature patterns from Events feature

## Out of Scope

### GH-9 Scope (Real Queue Backend)

- Real HTTP queue/join integration
- Real SSE stream connection
- Real backend contract verification
- Network error handling for real requests

### GH-11 Scope (iOS SSE Lifecycle)

- Real iOS SSE integration
- App background/foreground lifecycle handling
- SSE disconnect/reconnect behavior
- Foreground /me recovery
- Slot-expiry behavior associated with lifecycle/recovery

### GH-16 Deferred (Queue Navigation)

- Navigation from Waiting Room to Booking screen on GRANTED
- Integration with app router for Queue flow
- This was explicitly deferred in GH-16 and is NOT remediated here

### Payment Scope

- Payment flow integration
- Payment state handling
- Any payment-related UI

### Other Exclusions

- CAPTCHA UI implementation (contract only requires captcha_token in request)
- Real /queue/me API calls
- Real /queue/serving polling
- Guest device ID generation (use fixture values)
