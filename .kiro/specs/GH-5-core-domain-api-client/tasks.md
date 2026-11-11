# Implementation Plan

## Overview

Implement pure-TypeScript domain primitives for the Rusuh Booking Tiket mobile application. All code lives in `src/core/domain/` with zero external dependencies. Tests verify type safety and domain logic.

**Branch:** `story/GH-5-core-domain-api-client`

---

## Task Dependency Graph

```
T1 ──► T2 ──► T12
 │            ▲
 └──► T3 ─────┘

T4 ──► T5 ──► T16

T6 ──► T8 ◄── T7
 │            │
 └────────────┴──► T17

T9 ──► T14

T10 ──► T15

T11 ──► T12

T12, T13 ──► T18
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1", "T4", "T6", "T7", "T9", "T10", "T11"] },
    { "wave": 2, "tasks": ["T2", "T3", "T5", "T8"] },
    { "wave": 3, "tasks": ["T12", "T13"] },
    { "wave": 4, "tasks": ["T14", "T15", "T16", "T17"] },
    { "wave": 5, "tasks": ["T18"] }
  ]
}
```

---

## Tasks

### T1: API Envelope Types

**R-IDs:** R1

**Description:** Create API success/error envelope types with generic payload support.

**Files to create/modify:**

- `src/core/domain/api/envelope.types.ts`

**Verification Gate:** `npm run typecheck` passes

**Commit:**

```
[GH-5][Rosyid] feat(domain): add API envelope types
```

---

### T2: API Error Types

**R-IDs:** R2

**Description:** Create API error code union and structured error type with forward-compatibility.

**Files to create/modify:**

- `src/core/domain/api/error.types.ts`

**Verification Gate:** `npm run typecheck` passes; known error codes have autocompletion

**Commit:**

```
[GH-5][Rosyid] feat(domain): add API error types
```

---

### T3: Pagination and Rate Limit Types

**R-IDs:** R11, R12

**Description:** Create pagination params/response and rate limit info types.

**Files to create/modify:**

- `src/core/domain/api/pagination.types.ts`
- `src/core/domain/api/rate-limit.types.ts`

**Verification Gate:** `npm run typecheck` passes

**Commit:**

```
[GH-5][Rosyid] feat(domain): add pagination and rate-limit types
```

---

### T4: Token Branded Types

**R-IDs:** R6

**Description:** Create branded string types for QueueToken, GrantToken, DeviceId, ETicketToken, AccessToken with factory functions.

**Files to create/modify:**

- `src/core/domain/auth/tokens.types.ts`

**Verification Gate:** `npm run typecheck` passes; raw string assignment to branded type produces error

**Commit:**

```
[GH-5][Rosyid] feat(domain): add branded token types
```

---

### T5: Header Policy Types

**R-IDs:** R7

**Description:** Create header composition functions for queue, grant, guest, and authenticated requests.

**Files to create/modify:**

- `src/core/domain/auth/headers.types.ts`

**Verification Gate:** `npm run typecheck` passes; authenticated grant headers require BOTH X-Grant-Token AND Authorization

**Commit:**

```
[GH-5][Rosyid] feat(domain): add authentication header policy types
```

---

### T6: Queue State Types

**R-IDs:** R3

**Description:** Create QueueState discriminated union with SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED. No SOLD_OUT.

**Files to create/modify:**

- `src/core/domain/queue/queue-state.types.ts`

**Verification Gate:** `npm run typecheck` passes; SOLD_OUT is NOT a valid QueueState

**Commit:**

```
[GH-5][Rosyid] feat(domain): add queue state types
```

---

### T7: Engagement State Types

**R-IDs:** R4

**Description:** Create EngagementState discriminated union for /queue/me states.

**Files to create/modify:**

- `src/core/domain/queue/engagement.types.ts`

**Verification Gate:** `npm run typecheck` passes; all 6 states defined

**Commit:**

```
[GH-5][Rosyid] feat(domain): add engagement state types
```

---

### T8: Queue Join Types

**R-IDs:** R9

**Description:** Create QueueJoinRequest (with required captcha_token) and QueueJoinResponse DTOs.

**Files to create/modify:**

- `src/core/domain/queue/queue-join.types.ts`

**Verification Gate:** `npm run typecheck` passes; captcha_token is required (not optional)

**Commit:**

```
[GH-5][Rosyid] feat(domain): add queue join request/response types
```

---

### T9: Server Time Utilities

**R-IDs:** R5

**Description:** Implement serverOffsetMs and remainingMs pure functions for server-authoritative time handling.

**Files to create/modify:**

- `src/core/domain/time/server-time.utils.ts`
- `src/core/domain/time/server-time.types.ts`

**Verification Gate:** `npm run typecheck` passes; remainingMs returns 0 for expired times

**Commit:**

```
[GH-5][Rosyid] feat(domain): add server time utilities
```

---

### T10: NIK Types

**R-IDs:** R8

**Description:** Create NikInput discriminated union and validateNikInput function enforcing exactly-one-of constraint.

**Files to create/modify:**

- `src/core/domain/booking/nik.types.ts`

**Verification Gate:** `npm run typecheck` passes; validateNikInput returns typed errors

**Commit:**

```
[GH-5][Rosyid] feat(domain): add NIK exactly-one-of types
```

---

### T11: Poll Tiers Types

**R-IDs:** R10

**Description:** Create PollTier type and getPollIntervalMs function.

**Files to create/modify:**

- `src/core/domain/queue/poll-tiers.types.ts`

**Verification Gate:** `npm run typecheck` passes; null max_position represents unbounded tier

**Commit:**

```
[GH-5][Rosyid] feat(domain): add poll tiers types
```

---

### T12: Deterministic Fixtures

**R-IDs:** R13

**Description:** Create test fixtures matching CONTRACT-BASELINE.md for all states and error codes.

**Files to create/modify:**

- `src/core/domain/__fixtures__/queue-states.fixture.ts`
- `src/core/domain/__fixtures__/engagement-states.fixture.ts`
- `src/core/domain/__fixtures__/api-responses.fixture.ts`
- `src/core/domain/__fixtures__/api-errors.fixture.ts`

**Verification Gate:** `npm run typecheck` passes; no SOLD_OUT in queue state fixtures

**Commit:**

```
[GH-5][Rosyid] feat(domain): add deterministic test fixtures
```

---

### T13: Barrel Export Index

**R-IDs:** R14, R15

**Description:** Create index.ts barrel export for all public types and functions.

**Files to create/modify:**

- `src/core/domain/index.ts`

**Verification Gate:** `npm run typecheck` passes; all public types importable from `@/core/domain`

**Commit:**

```
[GH-5][Rosyid] feat(domain): add barrel export index
```

---

### T14: Server Time Unit Tests

**R-IDs:** R5, R16

**Description:** Unit tests for serverOffsetMs and remainingMs covering edge cases.

**Files to create/modify:**

- `__tests__/core/domain/time/server-time.test.ts`

**Verification Gate:** `npm test` passes

**Commit:**

```
[GH-5][Rosyid] test(domain): add server time unit tests
```

---

### T15: NIK Validation Unit Tests

**R-IDs:** R8, R16

**Description:** Unit tests for validateNikInput covering all valid and invalid cases.

**Files to create/modify:**

- `__tests__/core/domain/booking/nik.test.ts`

**Verification Gate:** `npm test` passes

**Commit:**

```
[GH-5][Rosyid] test(domain): add NIK validation unit tests
```

---

### T16: Token/Header Unit Tests

**R-IDs:** R6, R7, R16

**Description:** Unit tests for branded token factories and header composition functions.

**Files to create/modify:**

- `__tests__/core/domain/auth/tokens.test.ts`
- `__tests__/core/domain/auth/headers.test.ts`

**Verification Gate:** `npm test` passes

**Commit:**

```
[GH-5][Rosyid] test(domain): add token and header unit tests
```

---

### T17: Queue State Unit Tests

**R-IDs:** R3, R4, R16

**Description:** Unit tests for queue state and engagement state type guards and helpers.

**Files to create/modify:**

- `__tests__/core/domain/queue/queue-state.test.ts`
- `__tests__/core/domain/queue/engagement.test.ts`

**Verification Gate:** `npm test` passes

**Commit:**

```
[GH-5][Rosyid] test(domain): add queue and engagement state unit tests
```

---

### T18: Final Verification

**R-IDs:** R14, R15, R17

**Description:** Run all CI gates and verify Clean Architecture compliance.

**Files to create/modify:**

- None (verification only)

**Verification Gate:** All 6 CI gates pass

**Commit:**

```
[GH-5][Rosyid] chore(domain): final verification complete
```

---

## Task Summary Table

| Task | R-IDs       | Files                                            | Verification | Commit                                                    |
| ---- | ----------- | ------------------------------------------------ | ------------ | --------------------------------------------------------- |
| T1   | R1          | api/envelope.types.ts                            | typecheck    | `feat(domain): add API envelope types`                    |
| T2   | R2          | api/error.types.ts                               | typecheck    | `feat(domain): add API error types`                       |
| T3   | R11,R12     | api/pagination.types.ts, api/rate-limit.types.ts | typecheck    | `feat(domain): add pagination and rate-limit types`       |
| T4   | R6          | auth/tokens.types.ts                             | typecheck    | `feat(domain): add branded token types`                   |
| T5   | R7          | auth/headers.types.ts                            | typecheck    | `feat(domain): add authentication header policy types`    |
| T6   | R3          | queue/queue-state.types.ts                       | typecheck    | `feat(domain): add queue state types`                     |
| T7   | R4          | queue/engagement.types.ts                        | typecheck    | `feat(domain): add engagement state types`                |
| T8   | R9          | queue/queue-join.types.ts                        | typecheck    | `feat(domain): add queue join request/response types`     |
| T9   | R5          | time/server-time.*.ts                            | typecheck    | `feat(domain): add server time utilities`                 |
| T10  | R8          | booking/nik.types.ts                             | typecheck    | `feat(domain): add NIK exactly-one-of types`              |
| T11  | R10         | queue/poll-tiers.types.ts                        | typecheck    | `feat(domain): add poll tiers types`                      |
| T12  | R13         | **fixtures**/*.fixture.ts                        | typecheck    | `feat(domain): add deterministic test fixtures`           |
| T13  | R14,R15     | index.ts                                         | typecheck    | `feat(domain): add barrel export index`                   |
| T14  | R5,R16      | **tests**/time/server-time.test.ts               | test         | `test(domain): add server time unit tests`                |
| T15  | R8,R16      | **tests**/booking/nik.test.ts                    | test         | `test(domain): add NIK validation unit tests`             |
| T16  | R6,R7,R16   | **tests**/auth/*.test.ts                         | test         | `test(domain): add token and header unit tests`           |
| T17  | R3,R4,R16   | **tests**/queue/*.test.ts                        | test         | `test(domain): add queue and engagement state unit tests` |
| T18  | R14,R15,R17 | —                                                | all gates    | `chore(domain): final verification complete`              |

---

## Notes

1. **Domain purity:** All files in `src/core/domain/` must be pure TypeScript with no external dependencies.

2. **No SOLD_OUT:** `SOLD_OUT` is intentionally absent from `QueueState`. See CONTRACT-BASELINE.md §2.3.

3. **Expo Doctor:** GH-5 inherits the GH-3 narrow exception (18/20 accepted).

4. **DoR Status:** APPROVED by Supervisor A / Rosyid on 2026-11-12. Implementation authorization pending.
