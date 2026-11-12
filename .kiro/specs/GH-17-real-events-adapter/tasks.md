# Implementation Plan

## Overview

Implement the real HTTP adapter for GET /events, evolving the GH-16 domain model to match the authoritative contract (5 queue states, simplified display block). The implementation preserves Clean Architecture boundaries and maintains backward compatibility through the repository port pattern.

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
T1 (DTO schema) ──► T2 (mapper) ──► T3 (data source) ──► T4 (error mapping)
                                          │
T5 (domain evolution) ◄──────────────────┘
       │
       ▼
T6 (presentation) ──► T7 (unit tests) ──► T8 (integration tests) ──► T9 (render tests)
                                                                           │
                                                                           ▼
                                               T10 (boundary check) ──► T11 (full gates) ──► T12 (docs)
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1"] },
    { "wave": 2, "tasks": ["T2"] },
    { "wave": 3, "tasks": ["T3", "T5"] },
    { "wave": 4, "tasks": ["T4"] },
    { "wave": 5, "tasks": ["T6"] },
    { "wave": 6, "tasks": ["T7"] },
    { "wave": 7, "tasks": ["T8"] },
    { "wave": 8, "tasks": ["T9"] },
    { "wave": 9, "tasks": ["T10"] },
    { "wave": 10, "tasks": ["T11"] },
    { "wave": 11, "tasks": ["T12"] }
  ]
}
```

---

## Tasks

### T1: EventDTO Schema

**R-IDs:** R3, R4, R17

**Description:** Create raw API response types for GET /events in the data layer. Define EventDTO with snake_case fields matching server contract, VALID_QUEUE_STATES constant, and type guard for queue_state validation.

**Files to create/modify:**

- `src/features/events/data/dto/EventDTO.ts` (CREATE)
- `src/features/events/data/dto/index.ts` (CREATE)
- `src/features/events/data/index.ts` (MODIFY: export dto)

**Verification Gate:**

- TypeScript compiles
- VALID_QUEUE_STATES contains exactly: SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED
- isValidQueueState type guard exists
- npm run typecheck passes

**Commit:**

```
[GH-17][Rosyid] feat(events): add EventDTO schema for real API
```

---

### T2: Event Mapper

**R-IDs:** R3, R4, R17

**Description:** Create mapper function to validate EventDTO and transform to domain Event. Implement strict validation that rejects unknown queue_state values without silent fallback.

**Files to create/modify:**

- `src/features/events/data/mappers/eventMapper.ts` (CREATE)
- `src/features/events/data/mappers/index.ts` (CREATE)
- `src/features/events/data/index.ts` (MODIFY: export mappers)

**Verification Gate:**

- mapEventDTO function validates required fields
- Unknown queue_state returns validation failure
- No silent fallback to any known state
- npm run typecheck passes

**Commit:**

```
[GH-17][Rosyid] feat(events): add event DTO mapper with strict validation
```

---

### T3: RealEventDataSource

**R-IDs:** R1, R2, R18

**Description:** Create HTTP data source for GET /events endpoint. Implement request construction with limit/offset pagination, no authentication headers, no filter parameter.

**Files to create/modify:**

- `src/features/events/data/RealEventDataSource.ts` (CREATE)
- `src/features/events/data/index.ts` (MODIFY: export RealEventDataSource)

**Verification Gate:**

- HTTP GET request to /events
- No auth headers
- Query params: limit (default 10), offset (default 0)
- No filter param
- Uses eventMapper for response transformation
- npm run typecheck passes

**Commit:**

```
[GH-17][Rosyid] feat(events): add RealEventDataSource HTTP adapter
```

---

### T4: Error Mapping

**R-IDs:** R13, R14, R15, R16, R21

**Description:** Implement error handling for API errors (400, 503), network failures, and malformed responses. Map to domain ApiError with appropriate error codes and traceability.

**Files to create/modify:**

- `src/features/events/data/RealEventDataSource.ts` (MODIFY: add error handling)
- `src/features/events/data/errors/` (CREATE if needed)

**Verification Gate:**

- 400 VALIDATION_ERROR mapped correctly
- 503 INTERNAL_ERROR mapped correctly
- Network timeout caught and mapped
- Malformed JSON caught and mapped
- Error messages include context (URL, field path)
- npm run typecheck passes

**Commit:**

```
[GH-17][Rosyid] feat(events): add error mapping for real data source
```

---

### T5: Domain Model Evolution

**R-IDs:** R5, R6, R7, R8, R9, R10

**Description:** Evolve domain Event types to match real contract. Change QueueState from 4 to 5 values, remove EventStatus, simplify DisplayBlock. Update fixtures for new values.

**Files to create/modify:**

- `src/features/events/domain/Event.ts` (MODIFY: QueueState, remove EventStatus, simplify DisplayBlock)
- `src/features/events/domain/index.ts` (MODIFY: update exports)
- `src/features/events/data/fixtures/events.ts` (MODIFY: new QueueState values)

**Verification Gate:**

- QueueState = SCHEDULED | OPEN | FULL_QUEUE | FULL_BOOKED | CLOSED
- No DIRECT in QueueState
- No EventStatus type
- DisplayBlock has only `enabled`
- Fixtures cover all 5 states
- Fixture for FULL_BOOKED with enabled=true
- npm run typecheck passes

**Commit:**

```
[GH-17][Rosyid] feat(events): evolve domain model for real contract
```

---

### T6: Presentation Adaptation

**R-IDs:** R11

**Description:** Update EventCard to handle 5 queue states and absence of status badge. Derive labels from queueState. Mark FULL_BOOKED label as PRODUCT_COPY_CONFIRMATION_REQUIRED if user-facing text is uncertain.

**Files to create/modify:**

- `src/features/events/presentation/components/EventCard.tsx` (MODIFY: 5 states, no status badge)

**Verification Gate:**

- QUEUE_STATE_LABELS has 5 entries (SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED)
- No STATUS_LABELS constant
- No status badge rendering (or conditional if status optional)
- CTA button respects display.enabled
- npm run typecheck passes
- npm run lint passes

**Commit:**

```
[GH-17][Rosyid] feat(events): adapt EventCard for 5 queue states
```

---

### T7: Unit Tests

**R-IDs:** R1-R17, R21

**Description:** Implement unit tests for DTO validation, mapping, request construction, and error handling. Cover all 5 queue states, unknown state rejection, and error scenarios.

**Files to create/modify:**

- `src/features/events/data/__tests__/EventDTO.test.ts` (CREATE)
- `src/features/events/data/__tests__/eventMapper.test.ts` (CREATE)
- `src/features/events/data/__tests__/RealEventDataSource.test.ts` (CREATE)

**Test Cases:**

- UT-EVT17-01 through UT-EVT17-15 (see design.md)

**Verification Gate:**

- All 15 unit test cases pass
- Unknown queue_state test asserts rejection (not fallback)
- npm test passes

**Commit:**

```
[GH-17][Rosyid] test(events): add unit tests for real events adapter
```

---

### T8: Integration Tests

**R-IDs:** R1, R12, R13, R14, R15, R16, R17, R18

**Description:** Implement integration tests using MSW for HTTP mocking. Test successful responses, empty collections, pagination, error responses, and contract drift detection.

**Files to create/modify:**

- `src/features/events/__tests__/integration/realEvents.integration.test.ts` (CREATE)
- `src/features/events/__tests__/msw/handlers.ts` (CREATE or modify)

**Test Cases:**

- IT-EVT17-01 through IT-EVT17-08 (see design.md)

**Verification Gate:**

- All 8 integration test cases pass
- MSW handlers configured for /events
- npm test passes

**Commit:**

```
[GH-17][Rosyid] test(events): add integration tests with MSW
```

---

### T9: Render/Regression Tests

**R-IDs:** R11, R12

**Description:** Implement render tests for EventCard with all 5 queue states. Verify GH-16 presentation regression (list still renders correctly).

**Files to create/modify:**

- `src/features/events/presentation/__tests__/EventCard.render.test.tsx` (MODIFY: add new states)
- `src/features/events/presentation/__tests__/EventsHomeScreen.render.test.tsx` (MODIFY if needed)

**Test Cases:**

- RT-EVT17-01 through RT-EVT17-08 (see design.md)

**Verification Gate:**

- All 8 render test cases pass
- EventCard renders each of 5 states without error
- npm test passes

**Commit:**

```
[GH-17][Rosyid] test(events): add render tests for 5 queue states
```

---

### T10: Boundary Verification

**R-IDs:** R20

**Description:** Verify Clean Architecture boundaries. Ensure EventDTO is not imported in presentation, domain has no HTTP dependencies, public API exports are correct.

**Files to create/modify:**

- `src/features/events/index.ts` (MODIFY: update exports if needed)

**Verification Gate:**

- npm run boundary-check passes
- `grep -r "EventDTO" src/features/events/presentation/` returns 0 hits
- `grep -r "fetch\|http" src/features/events/domain/` returns 0 hits
- npm run lint passes

**Commit:**

```
[GH-17][Rosyid] chore(events): verify architecture boundaries
```

---

### T11: Full CI Gates

**R-IDs:** R20

**Description:** Run all CI gates and fix any remaining issues. Verify expo-doctor and expo-export pass (or document known exceptions).

**Files to create/modify:**

- None expected (fixes only if gates fail)

**Verification Gate:**

- npm run lint — Exit 0
- npm run typecheck — Exit 0
- npm test — All tests pass
- npm run boundary-check — Exit 0
- npx expo-doctor — Pass (or known exception documented)
- npx expo export — Bundles created

**Commit:**

```
[GH-17][Rosyid] chore(events): verify all CI gates pass
```

---

### T12: Documentation and Checklist

**R-IDs:** All

**Description:** Update ticket verification checklist with evidence. Update CONTRACT-BASELINE.md if needed. Prepare PR description.

**Files to create/modify:**

- GitHub issue #17 (UPDATE: verification checkboxes)
- `docs/CONTRACT-BASELINE.md` (MODIFY if contract semantics need update)

**Verification Gate:**

- Each applicable verification checkbox updated with evidence
- Inapplicable items (queue navigation) left unchecked with rationale
- PR description complete

**Commit:**

```
[GH-17][Rosyid] docs(events): update verification checklist
```

---

## Task Summary Table

| Task | R-IDs        | Files                     | Verification        | Commit                                  |
| ---- | ------------ | ------------------------- | ------------------- | --------------------------------------- |
| T1   | R3, R4, R17  | dto/EventDTO.ts           | typecheck           | `feat(events): add EventDTO schema`     |
| T2   | R3, R4, R17  | mappers/eventMapper.ts    | no silent fallback  | `feat(events): add event DTO mapper`    |
| T3   | R1, R2, R18  | RealEventDataSource.ts    | HTTP GET /events    | `feat(events): add RealEventDataSource` |
| T4   | R13-R16, R21 | RealEventDataSource.ts    | error mapping       | `feat(events): add error mapping`       |
| T5   | R5-R10       | domain/Event.ts, fixtures | 5 queue states      | `feat(events): evolve domain model`     |
| T6   | R11          | EventCard.tsx             | 5 state labels      | `feat(events): adapt EventCard`         |
| T7   | R1-R17, R21  | **tests**/*.test.ts       | 15 unit tests       | `test(events): add unit tests`          |
| T8   | R1, R12-R18  | integration/*.test.ts     | 8 integration tests | `test(events): add integration tests`   |
| T9   | R11, R12     | *.render.test.tsx         | 8 render tests      | `test(events): add render tests`        |
| T10  | R20          | index.ts                  | boundary-check      | `chore(events): verify boundaries`      |
| T11  | R20          | (fixes)                   | all CI gates        | `chore(events): verify CI gates`        |
| T12  | All          | GH issue, docs            | checklist           | `docs(events): update checklist`        |

---

## Notes

### Test Case Coverage Matrix

| Test ID     | Type        | Requirements   | Given/When/Then                                                               |
| ----------- | ----------- | -------------- | ----------------------------------------------------------------------------- |
| UT-EVT17-01 | unit        | R2-AC3         | Given default getEvents, When request built, Then limit=10, offset=0          |
| UT-EVT17-02 | unit        | R2-AC4         | Given custom pagination, When request built, Then uses provided values        |
| UT-EVT17-03 | unit        | R2-AC2         | Given any request, When headers checked, Then no auth headers                 |
| UT-EVT17-04 | unit        | R5-AC2         | Given SCHEDULED DTO, When mapped, Then queueState=SCHEDULED, enabled=false    |
| UT-EVT17-05 | unit        | R5-AC3         | Given OPEN DTO, When mapped, Then queueState=OPEN, enabled=true               |
| UT-EVT17-06 | unit        | R5-AC4         | Given FULL_QUEUE DTO, When mapped, Then queueState=FULL_QUEUE, enabled=false  |
| UT-EVT17-07 | unit        | R5-AC5         | Given FULL_BOOKED DTO, When mapped, Then queueState=FULL_BOOKED, enabled=true |
| UT-EVT17-08 | unit        | R5-AC6         | Given CLOSED DTO, When mapped, Then queueState=CLOSED, enabled=false          |
| UT-EVT17-09 | unit        | R6-AC1, R6-AC2 | Given display.enabled, When mapped, Then passthrough unchanged                |
| UT-EVT17-10 | unit        | R4-AC3         | Given sale_starts_at=null, When mapped, Then saleStartsAt=undefined           |
| UT-EVT17-11 | unit        | R17-AC1        | Given unknown queue_state, When validated, Then fails (not fallback)          |
| UT-EVT17-12 | unit        | R3-AC5         | Given missing required field, When validated, Then fails                      |
| UT-EVT17-13 | unit        | R13-AC1        | Given 400 response, When mapped, Then ApiError with code                      |
| UT-EVT17-14 | unit        | R14-AC1        | Given 503 response, When mapped, Then ApiError retryable                      |
| UT-EVT17-15 | unit        | R15-AC1        | Given network timeout, When caught, Then ApiError NETWORK_ERROR               |
| IT-EVT17-01 | integration | R1-AC1         | Given MSW handler, When getEvents called, Then returns Event[]                |
| IT-EVT17-02 | integration | R12-AC1        | Given empty response, When getEvents called, Then returns []                  |
| IT-EVT17-03 | integration | R18-AC2        | Given pagination params, When getEvents called, Then request has params       |
| IT-EVT17-04 | integration | R5             | Given all 5 states in response, When mapped, Then all 5 in result             |
| IT-EVT17-05 | integration | R13-AC3        | Given 400 response, When getEvents called, Then error propagates              |
| IT-EVT17-06 | integration | R14-AC3        | Given 503 response, When getEvents called, Then error propagates              |
| IT-EVT17-07 | integration | R15-AC3        | Given network fail, When getEvents called, Then error propagates              |
| IT-EVT17-08 | integration | R17-AC1        | Given unknown state, When getEvents called, Then validation fails             |
| RT-EVT17-01 | render      | R11-AC2        | Given SCHEDULED event, When EventCard renders, Then shows "Scheduled"         |
| RT-EVT17-02 | render      | R11-AC2        | Given OPEN event, When EventCard renders, Then shows "Open"                   |
| RT-EVT17-03 | render      | R11-AC2        | Given FULL_QUEUE event, When EventCard renders, Then shows "Queue Full"       |
| RT-EVT17-04 | render      | R11-AC2        | Given FULL_BOOKED event, When EventCard renders, Then shows enabled CTA       |
| RT-EVT17-05 | render      | R11-AC2        | Given CLOSED event, When EventCard renders, Then shows "Closed"               |
| RT-EVT17-06 | render      | R11-AC1        | Given mixed states, When EventList renders, Then all cards visible            |
| RT-EVT17-07 | render      | R12-AC2        | Given empty events, When screen renders, Then EmptyState visible              |
| RT-EVT17-08 | render      | R11-AC1        | Given events, When screen renders, Then EventList visible (regression)        |

### PRODUCT_COPY_CONFIRMATION_REQUIRED Items

The following user-facing text needs product confirmation before final implementation:

1. **FULL_BOOKED queue state label:** What should the EventCard show?
   - Current: "Full" (neutral, states the fact)
   - Final copy TBD by product
   - Impact: RT-EVT17-04 test assertion

2. **CLOSED queue state label:** Confirm "Closed" is acceptable
   - Current: "Closed"
   - Alternative: "Sale Ended", "Sold Out"

These do NOT block implementation — use placeholder labels and document in tests.

### GH-16 Verification Checkbox Note

The GH-16 verification checkbox "Event queue_state values handled correctly (NOT_OPEN, OPEN, FULL, DIRECT)" references the OLD enum values. GH-17 evolves these to SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED.

Do NOT:

- Check the GH-16 checkbox for queue navigation (explicitly out of scope)
- Modify GH-16 checkboxes

Do:

- Update GH-17 checkboxes with new enum evidence
