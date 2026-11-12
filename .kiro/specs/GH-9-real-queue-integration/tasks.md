# Implementation Plan

## Overview

GH-9 implements real backend Queue integration by adding `RealQueueDataSource` alongside the existing `FakeQueueDataSource`. Implementation follows TDD approach: domain error types → HTTP client → SSE client → data source → adapter composition.

**Rule: One task = one commit.**

**External Prerequisite:** Deployed-environment verification tasks are BLOCKED pending backend deployment evidence.

---

## Task Dependency Graph

```
                    T1 (Domain Error Types)
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         T2 (DTOs)  T3 (ErrorMapper)  T4 (SseParser)
              │          │          │
              └──────────┼──────────┘
                         ▼
              ┌──────────┴──────────┐
              ▼                     ▼
      T5 (QueueHttpClient)   T6 (SseClient)
              │                     │
              └──────────┬──────────┘
                         ▼
                 T7 (RealQueueDataSource)
                         │
                         ▼
                 T8 (Adapter Selection)
                         │
                         ▼
                 T9 (Integration Tests Local)
                         │
                         ▼
                 T10 (Boundary Validation)
                         │
                         ▼
                 T11 (Full Verification)
                         │
                         ▼
           T12 (Deployed-Environment Tests) [BLOCKED]
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1"] },
    { "wave": 2, "tasks": ["T2", "T3", "T4"] },
    { "wave": 3, "tasks": ["T5", "T6"] },
    { "wave": 4, "tasks": ["T7"] },
    { "wave": 5, "tasks": ["T8"] },
    { "wave": 6, "tasks": ["T9"] },
    { "wave": 7, "tasks": ["T10"] },
    { "wave": 8, "tasks": ["T11"] },
    { "wave": 9, "tasks": ["T12"], "blocked": "Pending deployed environment" }
  ]
}
```

---

## Tasks

### T1: Queue Domain Error Types

**R-IDs:** R3, R12

**Description:** Define `QueueError` discriminated union and `QueueErrorCode` type for domain-level transport errors. Types must be pure TypeScript with no network imports.

**Files to create/modify:**

- `src/features/queue/domain/queue-error.types.ts`
- `src/features/queue/domain/index.ts` (export)
- `__tests__/features/queue/domain/queue-error.test.ts`

**Prerequisites:** None

**Planned Tests:**

- Unit: QueueError structure validation
- Unit: isRetryableError type guard
- Unit: Error code completeness

**Verification Gate:** `npm run typecheck` passes, `npm test` passes for new tests

**Non-Goals:** No HTTP or SSE imports in domain types

**Commit:**

```
[GH-9][Rosyid] feat(queue): add Queue error domain types
```

---

### T2: Queue HTTP DTOs

**R-IDs:** R2, R6

**Description:** Define DTO types for HTTP request/response mapping: `QueueJoinRequestDto`, `QueueJoinResponseDto`, `QueueMeResponseDto`, `QueueErrorResponseDto`.

**Files to create/modify:**

- `src/features/queue/data/dtos/queue-http.dtos.ts`
- `src/features/queue/data/dtos/index.ts`
- `__tests__/features/queue/data/dtos/queue-http.dtos.test.ts`

**Prerequisites:** T1

**Planned Tests:**

- Unit: DTO type validation
- Unit: Response field extraction
- Unit: Error response structure

**Verification Gate:** `npm run typecheck` passes, `npm test` passes

**Non-Goals:** No network calls in DTOs

**Commit:**

```
[GH-9][Rosyid] feat(queue): add Queue HTTP DTOs
```

---

### T3: Queue Error Mapper

**R-IDs:** R3

**Description:** Implement `QueueErrorMapper` that maps HTTP status codes and error bodies to `QueueError` domain types. Cover all CONTRACT-BASELINE.md error codes.

**Files to create/modify:**

- `src/features/queue/data/mappers/queue-error.mapper.ts`
- `src/features/queue/data/mappers/index.ts`
- `__tests__/features/queue/data/mappers/queue-error.mapper.test.ts`

**Prerequisites:** T1, T2

**Planned Tests:**

- Unit: mapHttpError(400, CAPTCHA_REQUIRED) → QueueError
- Unit: mapHttpError(400, CAPTCHA_FAILED) → QueueError
- Unit: mapHttpError(400, DEVICE_ID_REQUIRED) → QueueError
- Unit: mapHttpError(503, QUEUE_FULL) → QueueError with FULL_QUEUE
- Unit: mapHttpError(409, FULL_BOOKED) → QueueError with FULL_BOOKED
- Unit: mapHttpError(410, _) → QueueError with CLOSED
- Unit: mapHttpError(401, UNAUTHORIZED) → QueueError
- Unit: mapHttpError(401, TOKEN_INVALID) → QueueError
- Unit: mapHttpError(404, _) → EVENT_NOT_FOUND
- Unit: mapNetworkError() → NETWORK_ERROR
- Unit: mapTimeoutError() → TIMEOUT_ERROR

**Verification Gate:** `npm test __tests__/features/queue/data/mappers/queue-error.mapper.test.ts` passes

**Non-Goals:** No actual HTTP calls

**Commit:**

```
[GH-9][Rosyid] feat(queue): implement Queue error mapper
```

---

### T4: SSE Message Parser

**R-IDs:** R5

**Description:** Implement `SseMessageParser` that parses SSE event data strings into `QueueUpdate` domain types. Handle malformed and unsupported messages gracefully.

**Files to create/modify:**

- `src/features/queue/data/mappers/sse-message.parser.ts`
- `__tests__/features/queue/data/mappers/sse-message.parser.test.ts`

**Prerequisites:** T1, (QueueUpdate exists from GH-8)

**Planned Tests:**

- Unit: parse position event → QueueUpdate.position
- Unit: parse state event → QueueUpdate.queueState
- Unit: parse grant event → QueueUpdate with engagementState GRANTED
- Unit: parse malformed JSON → null (no throw)
- Unit: parse unsupported event type → null
- Unit: parse missing required fields → null
- Unit: validate QueueState against union
- Unit: validate EngagementState against union

**Verification Gate:** `npm test __tests__/features/queue/data/mappers/sse-message.parser.test.ts` passes

**Non-Goals:** No SSE connection logic

**Commit:**

```
[GH-9][Rosyid] feat(queue): implement SSE message parser
```

---

### T5: Queue HTTP Client

**R-IDs:** R2, R6, R11

**Description:** Implement `QueueHttpClient` for `/events/{id}/queue/join` and `/queue/me` endpoints. Use existing header utilities from GH-5. Return `Result<T, QueueError>`.

**Files to create/modify:**

- `src/features/queue/data/http/queue-http.client.ts`
- `src/features/queue/data/http/queue-http.client.port.ts`
- `src/features/queue/data/http/index.ts`
- `__tests__/features/queue/data/http/queue-http.client.test.ts`

**Prerequisites:** T2, T3

**Planned Tests:**

- Integration: join() with captcha_token success
- Integration: join() with guest X-Device-Id header
- Integration: join() with authenticated Authorization header
- Integration: join() missing captcha returns CAPTCHA_REQUIRED
- Integration: join() guest missing device ID returns DEVICE_ID_REQUIRED
- Integration: join() HTTP 503 returns QUEUE_FULL
- Integration: join() HTTP 409 returns FULL_BOOKED
- Integration: join() HTTP 410 returns CLOSED
- Integration: getMe() success returns QueueMeResponse
- Integration: getMe() with GRANTED returns grant metadata
- Integration: getMe() HTTP 401 returns TOKEN_INVALID
- Integration: Network failure returns NETWORK_ERROR
- Integration: Timeout returns TIMEOUT_ERROR

**Verification Gate:** `npm test __tests__/features/queue/data/http/queue-http.client.test.ts` passes

**Non-Goals:** No real network calls (use transport doubles)

**Commit:**

```
[GH-9][Rosyid] feat(queue): implement Queue HTTP client
```

---

### T6: SSE Client Wrapper

**R-IDs:** R4, R12, R13

**Description:** Implement `SseClient` wrapper that manages SSE connection lifecycle. Abstract over actual SSE implementation for testability. Handle connection, message, error, and close events.

**Files to create/modify:**

- `src/features/queue/data/sse/sse.client.ts`
- `src/features/queue/data/sse/sse.client.port.ts`
- `src/features/queue/data/sse/index.ts`
- `__tests__/features/queue/data/sse/sse.client.test.ts`

**Prerequisites:** T4

**Planned Tests:**

- Integration: connect(sse_url, headers) establishes connection
- Integration: onMessage receives server events
- Integration: onError receives connection errors
- Integration: close() disconnects cleanly
- Integration: reconnect uses same sse_url and queue_token
- Integration: reconnect limit reached emits error
- Unit: headers include X-Queue-Token

**Verification Gate:** `npm test __tests__/features/queue/data/sse/sse.client.test.ts` passes

**Non-Goals:** No actual SSE connection (use mock)

**Commit:**

```
[GH-9][Rosyid] feat(queue): implement SSE client wrapper
```

---

### T7: RealQueueDataSource Implementation

**R-IDs:** R1, R9, R10

**Description:** Implement `RealQueueDataSource` class that orchestrates QueueHttpClient and SseClient. Implements the existing `QueueDataSource` interface from GH-8.

**Files to create/modify:**

- `src/features/queue/data/RealQueueDataSource.ts`
- `src/features/queue/data/index.ts` (export)
- `__tests__/features/queue/data/RealQueueDataSource.test.ts`

**Prerequisites:** T5, T6

**Planned Tests:**

- Integration: start() calls join then connects SSE
- Integration: SSE message triggers onUpdate
- Integration: Grant detection triggers getMe then onUpdate with grant
- Integration: stop() closes SSE and cleans up
- Integration: retry() stops then starts
- Integration: join error triggers onError
- Integration: SSE error triggers onError
- Integration: CLOSED state triggers onComplete
- Integration: Implements QueueDataSource interface

**Verification Gate:** `npm test __tests__/features/queue/data/RealQueueDataSource.test.ts` passes

**Non-Goals:** No real network (use mocks for HTTP and SSE)

**Commit:**

```
[GH-9][Rosyid] feat(queue): implement RealQueueDataSource
```

---

### T8: Adapter Selection/Composition

**R-IDs:** R10

**Description:** Create adapter factory or composition mechanism that enables selection between FakeQueueDataSource and RealQueueDataSource. Ensure FakeQueueDataSource remains intact.

**Files to create/modify:**

- `src/features/queue/data/queue-data-source.factory.ts`
- `src/features/queue/index.ts` (export factory)
- `__tests__/features/queue/data/queue-data-source.factory.test.ts`

**Prerequisites:** T7

**Planned Tests:**

- Unit: createQueueDataSource('fake', scenario) returns FakeQueueDataSource
- Unit: createQueueDataSource('real', config) returns RealQueueDataSource
- Unit: FakeQueueDataSource unchanged from GH-8
- Unit: Both implement QueueDataSource interface

**Verification Gate:** `npm test __tests__/features/queue/data/queue-data-source.factory.test.ts` passes

**Non-Goals:** No runtime environment detection (explicit config)

**Commit:**

```
[GH-9][Rosyid] feat(queue): add Queue data source factory
```

---

### T9: Integration Tests with Local Transport Doubles

**R-IDs:** R16

**Description:** Add integration tests covering full scenarios with deterministic local transport doubles (mock HTTP, mock SSE). Verify no real network calls.

**Files to create/modify:**

- `__tests__/features/queue/integration/real-queue-local.integration.test.ts`

**Prerequisites:** T7, T8

**Planned Tests:**

- Integration: Full guest join → SSE → position updates → grant
- Integration: Full authenticated join → SSE → grant
- Integration: Rejoin response handling
- Integration: FULL_QUEUE error recovery
- Integration: FULL_BOOKED state handling
- Integration: CLOSED terminal state
- Integration: Network failure handling
- Integration: useQueue hook with RealQueueDataSource mock
- Integration: No real HTTP/SSE calls (mock fetch to throw)

**Verification Gate:** `npm test __tests__/features/queue/integration/real-queue-local.integration.test.ts` passes

**Non-Goals:** No deployed environment

**Commit:**

```
[GH-9][Rosyid] test(queue): add real queue local integration tests
```

---

### T10: Architecture Boundary Validation

**R-IDs:** R15

**Description:** Verify all new code complies with Clean Architecture boundaries. Ensure no domain imports from data, no presentation imports from data.

**Files to create/modify:**

- None (validation only)

**Prerequisites:** T9

**Planned Tests:**

- boundary-check passes
- Domain layer has no HTTP/SSE/network imports
- Data layer has no presentation imports
- Cross-feature imports use index.ts only

**Verification Gate:**

1. `npm run boundary-check` — no violations
2. Manual review of imports

**Non-Goals:** N/A

**Commit:**

```
[GH-9][Rosyid] chore(queue): verify architecture boundaries
```

---

### T11: Full Verification Gates

**R-IDs:** R14, R15, R16

**Description:** Run all 6 CI gates. Verify no test fixtures contain real NIK/PII. Verify no tokens in logs.

**Files to create/modify:**

- None (verification only)

**Prerequisites:** T10

**Planned Tests:**

- All existing tests pass
- All new tests pass
- Lint passes
- Typecheck passes
- boundary-check passes
- expo-doctor passes
- expo-export passes

**Verification Gate:**

1. `npm run lint` — passes
2. `npm run typecheck` — passes
3. `npm test` — all tests pass
4. `npm run boundary-check` — no violations
5. `npx expo-doctor` — passes
6. `npx expo export` — passes

**Non-Goals:** No deployed-environment verification

**Commit:**

```
[GH-9][Rosyid] chore(queue): verify all CI gates pass
```

---

### T12: Deployed-Environment Integration Tests

**R-IDs:** R16 (partial)

**Description:** Define and execute integration tests against deployed backend environment. Verify real Queue endpoint reachability, real SSE connection, real position events.

**Files to create/modify:**

- `__tests__/features/queue/integration/real-queue-deployed.e2e.test.ts`

**Prerequisites:** T11, **External: Deployed backend environment**

**Status:** ❌ BLOCKED — Backend deployment unverified

**Planned Tests:**

- E2E: Real Queue endpoint reachable
- E2E: Real guest join succeeds
- E2E: Real SSE connection opens
- E2E: Real position event received
- E2E: Real /me behavior works
- E2E: Real FULL_QUEUE behavior (if test environment supports)
- E2E: Real FULL_BOOKED behavior (if test environment supports)
- E2E: Real CLOSED behavior (if test environment supports)

**Verification Gate:** Tests pass against deployed environment

**Stop Condition:** This task remains BLOCKED until deployment evidence is provided by Supervisor A / Rosyid.

**Non-Goals:** Do NOT use production data; require test environment with safe fixtures

**Commit:**

```
[GH-9][Rosyid] test(queue): add deployed environment integration tests
```

---

## Task Summary Table

| Task | R-IDs        | Files                                | Verification      | Commit                                                    | Blocked |
| ---- | ------------ | ------------------------------------ | ----------------- | --------------------------------------------------------- | ------- |
| T1   | R3, R12      | queue-error.types.ts                 | typecheck, tests  | `feat(queue): add Queue error domain types`               | No      |
| T2   | R2, R6       | queue-http.dtos.ts                   | typecheck, tests  | `feat(queue): add Queue HTTP DTOs`                        | No      |
| T3   | R3           | queue-error.mapper.ts                | unit tests        | `feat(queue): implement Queue error mapper`               | No      |
| T4   | R5           | sse-message.parser.ts                | unit tests        | `feat(queue): implement SSE message parser`               | No      |
| T5   | R2, R6, R11  | queue-http.client.ts                 | integration tests | `feat(queue): implement Queue HTTP client`                | No      |
| T6   | R4, R12, R13 | sse.client.ts                        | integration tests | `feat(queue): implement SSE client wrapper`               | No      |
| T7   | R1, R9, R10  | RealQueueDataSource.ts               | integration tests | `feat(queue): implement RealQueueDataSource`              | No      |
| T8   | R10          | queue-data-source.factory.ts         | unit tests        | `feat(queue): add Queue data source factory`              | No      |
| T9   | R16          | real-queue-local.integration.test.ts | test pass         | `test(queue): add real queue local integration tests`     | No      |
| T10  | R15          | —                                    | boundary-check    | `chore(queue): verify architecture boundaries`            | No      |
| T11  | R14-R16      | —                                    | all 6 gates       | `chore(queue): verify all CI gates pass`                  | No      |
| T12  | R16          | real-queue-deployed.e2e.test.ts      | deployed env      | `test(queue): add deployed environment integration tests` | **YES** |

---

## Test Matrix

### Unit Tests

| Test ID | R-ID    | Given                         | When             | Then                                       | Type | Environment |
| ------- | ------- | ----------------------------- | ---------------- | ------------------------------------------ | ---- | ----------- |
| UT-01   | R3-AC1  | HTTP 400 + CAPTCHA_REQUIRED   | mapped           | QueueError code=CAPTCHA_REQUIRED           | unit | local       |
| UT-02   | R3-AC2  | HTTP 400 + CAPTCHA_FAILED     | mapped           | QueueError code=CAPTCHA_FAILED             | unit | local       |
| UT-03   | R3-AC3  | HTTP 400 + DEVICE_ID_REQUIRED | mapped           | QueueError code=DEVICE_ID_REQUIRED         | unit | local       |
| UT-04   | R3-AC4  | HTTP 503 + QUEUE_FULL         | mapped           | QueueError with FULL_QUEUE, retryable=true | unit | local       |
| UT-05   | R3-AC5  | HTTP 409 + FULL_BOOKED        | mapped           | QueueError with FULL_BOOKED                | unit | local       |
| UT-06   | R3-AC6  | HTTP 410                      | mapped           | QueueError with CLOSED terminal            | unit | local       |
| UT-07   | R3-AC7  | HTTP 401 + UNAUTHORIZED       | mapped           | QueueError code=UNAUTHORIZED               | unit | local       |
| UT-08   | R3-AC8  | HTTP 404                      | mapped           | QueueError code=EVENT_NOT_FOUND            | unit | local       |
| UT-09   | R5-AC1  | SSE position event            | parsed           | QueueUpdate.position extracted             | unit | local       |
| UT-10   | R5-AC2  | SSE state event               | parsed           | QueueUpdate.queueState validated           | unit | local       |
| UT-11   | R5-AC3  | SSE grant event               | parsed           | QueueUpdate with GRANTED + grant           | unit | local       |
| UT-12   | R5-AC4  | malformed SSE JSON            | parsed           | returns null, no throw                     | unit | local       |
| UT-13   | R5-AC5  | unsupported event type        | parsed           | returns null, ignored                      | unit | local       |
| UT-14   | R11-AC1 | guest auth context            | headers composed | X-Device-Id included                       | unit | local       |
| UT-15   | R11-AC2 | authenticated context         | headers composed | Authorization: Bearer included             | unit | local       |
| UT-16   | R11-AC4 | authenticated grant request   | headers composed | X-Grant-Token AND Authorization            | unit | local       |
| UT-17   | R7-AC5  | FULL_QUEUE vs FULL_BOOKED     | compared         | distinct states                            | unit | local       |

### Integration Tests (Local Deterministic)

| Test ID | R-ID           | Given                      | When                        | Then                            | Type        | Environment |
| ------- | -------------- | -------------------------- | --------------------------- | ------------------------------- | ----------- | ----------- |
| IT-01   | R2-AC2         | guest join, no X-Device-Id | join() called               | DEVICE_ID_REQUIRED error        | integration | local mock  |
| IT-02   | R2-AC1, R2-AC5 | guest join, valid request  | join() called               | queue_token + sse_url returned  | integration | local mock  |
| IT-03   | R2-AC4         | rejoined=true response     | processed                   | existing state honored          | integration | local mock  |
| IT-04   | R4-AC1         | successful join            | SSE connect                 | uses sse_url exactly            | integration | local mock  |
| IT-05   | R6-AC1, R6-AC2 | queue_token available      | getMe() called              | EngagementState extracted       | integration | local mock  |
| IT-06   | R6-AC3         | GRANTED from /me           | processed                   | grant_token + expires extracted | integration | local mock  |
| IT-07   | R6-AC4         | invalid queue token        | getMe() called              | TOKEN_INVALID error             | integration | local mock  |
| IT-08   | R9-AC3, R9-AC4 | SSE message                | RealQueueDataSource running | onUpdate invoked                | integration | local mock  |
| IT-09   | R7-AC2         | FULL_QUEUE state           | handled                     | retryable, temporary            | integration | local mock  |
| IT-10   | R7-AC3         | FULL_BOOKED state          | handled                     | recoverable                     | integration | local mock  |
| IT-11   | R7-AC4         | CLOSED state               | handled                     | terminal, onComplete            | integration | local mock  |
| IT-12   | R12-AC3        | SSE connection failure     | error                       | SSE_CONNECTION_ERROR            | integration | local mock  |
| IT-13   | R13-AC1        | SSE disconnect             | reconnect                   | same sse_url + queue_token      | integration | local mock  |
| IT-14   | R10-AC1        | real mode config           | factory called              | RealQueueDataSource             | integration | local       |
| IT-15   | R10-AC2        | fake mode config           | factory called              | FakeQueueDataSource             | integration | local       |
| IT-16   | R10-AC4        | FakeQueueDataSource        | inspected                   | unchanged from GH-8             | integration | local       |

### Integration Tests (Deployed Environment) — BLOCKED

| Test ID | R-ID   | Given                    | When            | Then                      | Type | Environment | Prerequisite             |
| ------- | ------ | ------------------------ | --------------- | ------------------------- | ---- | ----------- | ------------------------ |
| DT-01   | R2     | deployed Queue service   | endpoint called | reachable                 | e2e  | deployed    | Backend deployment       |
| DT-02   | R2     | valid guest request      | join()          | real queue_token returned | e2e  | deployed    | Backend deployment       |
| DT-03   | R4     | real sse_url             | connect()       | SSE opens                 | e2e  | deployed    | SSE server deployment    |
| DT-04   | R5     | SSE stream               | waiting         | position event received   | e2e  | deployed    | SSE server deployment    |
| DT-05   | R6     | real queue_token         | /me called      | state returned            | e2e  | deployed    | Backend deployment       |
| DT-06   | R7-AC2 | test capacity reached    | join            | FULL_QUEUE returned       | e2e  | deployed    | Test environment control |
| DT-07   | R7-AC3 | test inventory exhausted | state           | FULL_BOOKED               | e2e  | deployed    | Test environment control |
| DT-08   | R7-AC4 | test sale closed         | state           | CLOSED                    | e2e  | deployed    | Test environment control |

---

## Ticket #9 Verification Checklist Classification

| Checkbox Item                                   | Classification                                                  | Evidence                                            | Status                |
| ----------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------- | --------------------- |
| Backend queue service exists and is deployed    | deployed-integration-stage                                      | Backend origin/main has code; deployment NOT proven | ❌ NOT EVIDENCED      |
| Real SSE stream connects                        | deployed-integration-stage                                      | Requires deployed SSE server                        | ❌ NOT EVIDENCED      |
| Position updates from real events               | deployed-integration-stage                                      | Requires deployed SSE server                        | ❌ NOT EVIDENCED      |
| Grant detection via /me works with real backend | deployed-integration-stage                                      | Requires deployed Queue service                     | ❌ NOT EVIDENCED      |
| FULL_BOOKED state handled correctly             | specification-stage (local) + deployed-integration-stage (real) | IT-10 local, DT-07 deployed                         | ✅ SPEC / ❌ DEPLOYED |
| CLOSED terminates stream                        | specification-stage (local) + deployed-integration-stage (real) | IT-11 local, DT-08 deployed                         | ✅ SPEC / ❌ DEPLOYED |
| Typecheck passes                                | implementation-stage                                            | `npm run typecheck`                                 | ⏳ IMPL REQUIRED      |
| Integration tests pass                          | implementation-stage                                            | `npm test`                                          | ⏳ IMPL REQUIRED      |

**Reconciliation Plan:** Do NOT check any verification items until implementation produces evidence. Deployed items remain unchecked until deployment is verified.

---

## Notes

1. **GH-8 Preservation:** T7 and T8 explicitly verify FakeQueueDataSource remains unchanged. No GH-8 files are modified.

2. **Transport Doubles:** All integration tests in T5-T9 use mock HTTP and mock SSE. No real network calls.

3. **poll_tiers Excluded:** Per ADR-6, polling fallback is not implemented. If needed, recommend new ticket.

4. **iOS Lifecycle:** Per ADR-5, only basic transport reconnect is implemented. iOS background/foreground recovery is GH-11 scope.

5. **Auth State:** AuthContext is passed via config, following GH-6 pattern. No runtime auth feature import needed.

6. **SSE Library:** Exact SSE client library TBD at implementation. Will be documented in commit message.

7. **T12 BLOCKED:** Deployed-environment tests cannot run until backend deployment is verified. This blocks DoR completion but not specification or local implementation.

8. **No Push/PR/Merge:** This specification does NOT authorize push, PR creation, merge, ticket mutation, or project movement.
