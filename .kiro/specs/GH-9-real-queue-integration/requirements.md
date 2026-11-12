# Requirements Document

## Introduction

GH-9 implements real backend Queue integration for the Rusuh Booking Tiket mobile app. This feature replaces/supplements the deterministic fake Queue capability (GH-8) with a real HTTP and SSE transport adapter that communicates with the deployed backend Queue service.

The real Queue integration provides:

- Real HTTP Queue join request with all contract-required fields
- Real SSE connection using the `sse_url` returned from join
- Real-time Queue position updates via SSE events
- Grant detection via `/queue/me` as authoritative source
- Error handling for transport and domain errors
- Adapter selection allowing both fake (GH-8) and real adapters to coexist

**Contract Reference:** `docs/CONTRACT-BASELINE.md` (2026-11-11)

**External Prerequisite:** Queue, SSE-server, and admission-controller source implementations are present and contract-aligned upstream. Actual deployment to a reachable integration environment remains unverified. GH-9 implementation authorization and acceptance involving real connections require evidence of a deployed, reachable, usable environment.

## Glossary

| Term                | Definition                                                                     |
| ------------------- | ------------------------------------------------------------------------------ |
| Queue Join          | HTTP POST to `/events/{event_id}/queue/join` returning queue_token and sse_url |
| queue_token         | Position token stored by mobile, sent as `X-Queue-Token` header                |
| sse_url             | Absolute SSE URL returned by join (host may differ from API host)              |
| SSE                 | Server-Sent Events — persistent HTTP connection for real-time updates          |
| /queue/me           | Authoritative endpoint for engagement state and grant credentials              |
| X-Grant-Token       | Header proving slot ownership for grant-protected requests                     |
| X-Device-Id         | Guest device identifier header (REQUIRED for guest queue join)                 |
| CAPTCHA Token       | Verification token required by queue join (CONTRACT-BASELINE.md §2.6)          |
| RealQueueDataSource | Real transport adapter implementing QueueDataSource interface                  |
| Transport Double    | Deterministic mock HTTP/SSE for local integration testing                      |

## Requirements

### Functional Requirements

#### R1: QueueDataSource Interface Formalization

**Description:** Formalize the existing `QueueDataSource` interface from GH-8's `useQueue.ts` as the port abstraction for Queue data sources, enabling swap between FakeQueueDataSource and RealQueueDataSource.

**Acceptance Criteria:**

- R1-AC1: Given the Queue feature, when a QueueDataSource interface exists, then both FakeQueueDataSource and RealQueueDataSource implement it
- R1-AC2: Given the useQueue hook, when it receives a QueueDataSource, then it works identically regardless of adapter type
- R1-AC3: Given the QueueDataSource interface, when inspected, then it has no HTTP, SSE, or network-specific types (transport-agnostic)

#### R2: Queue Join HTTP Request

**Description:** Implement HTTP POST to `/events/{event_id}/queue/join` with all contract-required fields.

**Acceptance Criteria:**

- R2-AC1: Given a queue join request, when `captcha_token` is provided, then it is sent in the request body per CONTRACT-BASELINE.md §2.6
- R2-AC2: Given a guest queue join, when `X-Device-Id` header is missing, then 400 `DEVICE_ID_REQUIRED` error is returned per CONTRACT-BASELINE.md §2.7
- R2-AC3: Given a successful join, when response is received, then `queue_token` and `sse_url` are extracted per CONTRACT-BASELINE.md §2.5
- R2-AC4: Given a rejoin response (`rejoined=true`), when processed, then existing engagement `state` is honored (may not be QUEUED)
- R2-AC5: Given queue join headers, when guest mode, then `X-Device-Id` is included; when authenticated mode, then `Authorization: Bearer` is included

#### R3: Queue Join Error Handling

**Description:** Map HTTP error responses from queue join to domain errors.

**Acceptance Criteria:**

- R3-AC1: Given HTTP 400 with `CAPTCHA_REQUIRED`, when mapped, then domain error `CAPTCHA_REQUIRED` is returned
- R3-AC2: Given HTTP 400 with `CAPTCHA_FAILED`, when mapped, then domain error `CAPTCHA_FAILED` is returned
- R3-AC3: Given HTTP 400 with `DEVICE_ID_REQUIRED`, when mapped, then domain error `DEVICE_ID_REQUIRED` is returned
- R3-AC4: Given HTTP 503 with `QUEUE_FULL`, when mapped, then QueueState `FULL_QUEUE` is returned (retryable)
- R3-AC5: Given HTTP 409 with `FULL_BOOKED`, when mapped, then QueueState `FULL_BOOKED` is returned
- R3-AC6: Given HTTP 410, when mapped, then QueueState `CLOSED` is returned (terminal)
- R3-AC7: Given HTTP 401 `UNAUTHORIZED`, when mapped, then domain error `UNAUTHORIZED` is returned
- R3-AC8: Given HTTP 404, when mapped, then domain error `EVENT_NOT_FOUND` is returned

#### R4: SSE Connection

**Description:** Establish SSE connection using the `sse_url` returned from queue join.

**Acceptance Criteria:**

- R4-AC1: Given a successful queue join with `sse_url`, when SSE connects, then connection uses the exact URL returned (host may differ from API)
- R4-AC2: Given SSE connection, when `X-Queue-Token` header is required, then it is included per CONTRACT-BASELINE.md §3.5
- R4-AC3: Given SSE connection established, when server sends events, then they are received and processed
- R4-AC4: Given SSE connection failure, when error occurs, then domain error is emitted and cleanup performed

#### R5: SSE Message Parsing

**Description:** Parse SSE messages into QueueUpdate domain types.

**Acceptance Criteria:**

- R5-AC1: Given SSE position event, when parsed, then `position` field is extracted as number
- R5-AC2: Given SSE state event, when parsed, then `queueState` is extracted and validated against QueueState union
- R5-AC3: Given SSE grant event, when parsed, then `engagementState` GRANTED and grant metadata are extracted
- R5-AC4: Given malformed SSE message, when parsed, then it is logged/ignored without crashing the stream
- R5-AC5: Given unsupported event type, when received, then it is ignored without affecting stream

#### R6: /queue/me Request

**Description:** Implement GET `/queue/me` as the authoritative source for engagement state and grant credentials.

**Acceptance Criteria:**

- R6-AC1: Given a `/queue/me` request, when `X-Queue-Token` is provided, then it is included per CONTRACT-BASELINE.md §3.5
- R6-AC2: Given a successful `/queue/me` response, when processed, then `state` (EngagementState) is extracted
- R6-AC3: Given a GRANTED state from `/queue/me`, when processed, then `grant_token` and `booking_expires_at` are extracted
- R6-AC4: Given HTTP 401 with `TOKEN_INVALID`, when mapped, then domain error `TOKEN_INVALID` is returned

#### R7: Queue State Semantics

**Description:** Enforce correct Queue state semantics per CONTRACT-BASELINE.md §2.3.

**Acceptance Criteria:**

- R7-AC1: Given QueueState values, when processed, then exactly these 5 states are supported: SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED
- R7-AC2: Given FULL_QUEUE state, when handled, then it is treated as temporary/retryable (503, queue capacity)
- R7-AC3: Given FULL_BOOKED state, when handled, then it is treated as recoverable (409, inventory)
- R7-AC4: Given CLOSED state, when handled, then it is treated as terminal (410, sale ended)
- R7-AC5: Given FULL_QUEUE and FULL_BOOKED, when compared, then they are distinct states (never collapsed)

#### R8: Engagement State Semantics

**Description:** Enforce correct Engagement state semantics per CONTRACT-BASELINE.md §2.2.

**Acceptance Criteria:**

- R8-AC1: Given EngagementState values, when processed, then exactly these 6 states are supported: QUEUED, GRANTED, SELECTING, AWAITING_PAYMENT, CONFIRMED, EXPIRED
- R8-AC2: Given GRANTED state, when detected, then grant metadata is available per R6-AC3
- R8-AC3: Given EXPIRED state, when detected, then it is treated as terminal
- R8-AC4: Given CONFIRMED state, when detected, then it is treated as terminal

#### R9: RealQueueDataSource Implementation

**Description:** Implement RealQueueDataSource class that orchestrates HTTP join, SSE connection, and /queue/me queries.

**Acceptance Criteria:**

- R9-AC1: Given RealQueueDataSource, when start() is called with event_id and captcha_token, then queue join HTTP is executed
- R9-AC2: Given successful join, when sse_url is returned, then SSE connection is established
- R9-AC3: Given SSE events, when received, then onUpdate callback is invoked with QueueUpdate
- R9-AC4: Given grant detection via SSE, when GRANTED hint received, then /queue/me is called to confirm and get credentials
- R9-AC5: Given RealQueueDataSource, when stop() is called, then SSE connection is closed and cleanup performed
- R9-AC6: Given RealQueueDataSource, when error occurs, then onError callback is invoked with domain error

#### R10: Adapter Selection/Composition

**Description:** Enable selection between FakeQueueDataSource (GH-8) and RealQueueDataSource without deleting the fake capability.

**Acceptance Criteria:**

- R10-AC1: Given the Queue feature, when configured for real mode, then RealQueueDataSource is used
- R10-AC2: Given the Queue feature, when configured for fake mode, then FakeQueueDataSource (GH-8) is used
- R10-AC3: Given useQueue hook, when data source factory is injected, then it works with either adapter
- R10-AC4: Given the repository, when inspected, then FakeQueueDataSource remains intact and usable

#### R11: Authentication Headers

**Description:** Compose correct authentication headers per CONTRACT-BASELINE.md §3.

**Acceptance Criteria:**

- R11-AC1: Given guest queue join, when headers composed, then `X-Device-Id` is REQUIRED
- R11-AC2: Given authenticated queue join, when headers composed, then `Authorization: Bearer <token>` is included
- R11-AC3: Given grant-protected request as guest, when headers composed, then `X-Grant-Token` AND `X-Device-Id` are included
- R11-AC4: Given grant-protected request as authenticated user, when headers composed, then `X-Grant-Token` AND `Authorization: Bearer` are BOTH included
- R11-AC5: Given header composition, when inspected, then existing `createQueueHeaders`, `createGrantHeaders` utilities from GH-5/GH-8 are reused

#### R12: Transport Error Handling

**Description:** Handle transport-level errors (network, timeout) distinctly from domain errors.

**Acceptance Criteria:**

- R12-AC1: Given network failure during HTTP request, when error occurs, then `NETWORK_ERROR` domain error is emitted
- R12-AC2: Given HTTP timeout, when error occurs, then `TIMEOUT_ERROR` domain error is emitted
- R12-AC3: Given SSE connection failure, when error occurs, then `SSE_CONNECTION_ERROR` domain error is emitted
- R12-AC4: Given SSE stream disconnect, when error occurs, then appropriate cleanup and error emission happen
- R12-AC5: Given transport error, when logged, then no sensitive tokens are included in logs

#### R13: Transport-Level Reconnect (Basic)

**Description:** Handle basic transport-level SSE reconnection as required by SSE contract, distinct from iOS lifecycle recovery (GH-11).

**Acceptance Criteria:**

- R13-AC1: Given SSE disconnect due to transport issue, when reconnect attempted, then it uses same sse_url and queue_token
- R13-AC2: Given reconnect, when successful, then stream continues from current state
- R13-AC3: Given reconnect failure after reasonable retry, when limit reached, then error is emitted to consumer
- R13-AC4: Given reconnect behavior, when documented, then it is explicitly distinct from iOS lifecycle recovery (GH-11 scope)

### Non-Functional Requirements

#### R14: Data Safety

**Description:** Ensure no real user data or sensitive information in fixtures, tests, or logs.

**Acceptance Criteria:**

- R14-AC1: Given test fixtures, when inspected, then no real NIK or customer PII is present
- R14-AC2: Given test data, when inspected, then deterministic synthetic identifiers are used
- R14-AC3: Given transport logs, when written, then no tokens or secrets are exposed
- R14-AC4: Given error messages, when displayed, then no sensitive information is leaked

#### R15: Architecture Compliance

**Description:** All code must comply with Clean Architecture boundaries.

**Acceptance Criteria:**

- R15-AC1: Given domain layer code, when inspected, then it has no HTTP, SSE, or network imports
- R15-AC2: Given data layer code, when inspected, then it has no presentation layer imports
- R15-AC3: Given `npm run boundary-check`, when run, then no violations are reported
- R15-AC4: Given cross-feature imports, when inspected, then they use public APIs via index.ts only

#### R16: Testability

**Description:** All components must be testable with deterministic local transport doubles.

**Acceptance Criteria:**

- R16-AC1: Given RealQueueDataSource, when tested locally, then transport doubles (mock HTTP, mock SSE) are used
- R16-AC2: Given unit tests, when run, then no real HTTP/SSE connections are made
- R16-AC3: Given integration tests with local transport doubles, when run, then full scenarios are verifiable
- R16-AC4: Given deployed-environment tests, when defined, then they are marked as requiring external prerequisites

## Constraints

1. **GH-8 Preservation:** FakeQueueDataSource and all GH-8 fake capability MUST remain intact and usable
2. **Contract Compliance:** All types, states, and behaviors MUST match CONTRACT-BASELINE.md exactly
3. **GH-5/GH-8 Reuse:** Must use existing Queue types (QueueState, EngagementState, QueueUpdate, etc.) from GH-5/GH-8
4. **Deployment Prerequisite:** Implementation acceptance requires deployed backend environment
5. **No iOS Lifecycle:** Transport reconnect is basic only; iOS background/foreground recovery is GH-11 scope
6. **No Speculative Contracts:** Only implement what is documented in CONTRACT-BASELINE.md

## Out of Scope

### GH-11 Scope (iOS SSE Lifecycle)

- iOS background SSE disconnection handling
- App foreground lifecycle handling
- Foreground /me recovery orchestration
- Lifecycle-aware reconnection beyond basic transport
- Slot-expiry handling after background/foreground transitions
- Full iOS recovery orchestration

### GH-16 Deferred (Queue Navigation)

- Navigation from Waiting Room to Booking screen on GRANTED
- This remains deferred per GH-16 specification

### Payment Scope

- Payment flow integration
- Payment state handling
- Any payment-related implementation

### Backend Implementation

- Backend Queue service implementation
- Backend SSE server implementation
- Backend admission-controller implementation
- Backend deployment

### Infrastructure

- Infrastructure provisioning
- Deployment configuration
- Environment setup

### Polling Fallback

- /queue/serving polling fallback implementation
- poll_tiers implementation
- Polling is documented under explicit exclusion; ownership unassigned

### Other Exclusions

- CAPTCHA UI acquisition (contract only requires token)
- Guest device ID generation (use existing utilities or fixture values)
- Speculative routing behaviors not in CONTRACT-BASELINE.md
- Modification of completed GH-8/GH-16 behavior

## Definition of Ready Assessment

| Criterion                                  | Status     | Evidence                          |
| ------------------------------------------ | ---------- | --------------------------------- |
| Requirements defined                       | ✅ PASS    | This document (R1-R16)            |
| Given/When/Then acceptance criteria        | ✅ PASS    | All R*-AC* criteria in GWT form   |
| Unit/integration/render test cases defined | ✅ PASS    | See Test Matrix in design.md      |
| Deterministic fixtures defined             | ✅ PASS    | Transport doubles specified       |
| Canonical contracts confirmed              | ✅ PASS    | CONTRACT-BASELINE.md (2026-11-11) |
| Architecture and boundaries confirmed      | ✅ PASS    | Clean Architecture per AGENTS.md  |
| External dependencies identified           | ✅ PASS    | Deployed Queue/SSE backend        |
| **Deployed environment available**         | ❌ NOT MET | Backend deployment unverified     |
| Verification gates defined                 | ✅ PASS    | 6 CI gates per AGENTS.md          |
| Scope exclusions documented                | ✅ PASS    | Out of Scope section above        |
| No unresolved contract decisions           | ✅ PASS    | No blockers identified            |
| No unresolved architecture decisions       | ✅ PASS    | ADRs documented in design.md      |

**DoR Status:** PRE_DOR_ONLY — Deployed environment requirement not met.
