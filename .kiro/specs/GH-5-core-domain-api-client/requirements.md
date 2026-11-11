# Requirements Document

## GH-5 Core Domain Layer and API Client

## Introduction

Establish the pure-TypeScript domain layer and React Native API client foundation for the Rusuh Booking Tiket mobile application. This ticket owns the shared core/domain primitives, API envelope/error modeling, token abstractions, time handling, and header-based authentication policies required by all downstream feature tickets.

**Canonical Contract Source:** `docs/CONTRACT-BASELINE.md` (2026-11-11 reconciliation)

**Scope:** Foundation layer only. No UI screens, no feature implementations, no payment architecture decisions.

---

## Glossary

| Term             | Definition                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| Queue State      | Server state from `/queue/serving`: `SCHEDULED`, `OPEN`, `FULL_QUEUE`, `FULL_BOOKED`, `CLOSED`                   |
| Engagement State | Client engagement from `/queue/me`: `QUEUED`, `GRANTED`, `SELECTING`, `AWAITING_PAYMENT`, `CONFIRMED`, `EXPIRED` |
| Grant Token      | `X-Grant-Token` header value proving slot ownership for booking/payment                                          |
| Queue Token      | `X-Queue-Token` header value for SSE stream and `/queue/me`                                                      |
| Device ID        | 128-bit UUID in `X-Device-Id` header for guest device binding                                                    |
| server_time      | Authoritative timestamp from API responses used for TTL/countdown calculations                                   |
| NIK              | Nomor Induk Kependudukan — Indonesian national ID number (16 digits)                                             |
| Exactly-one-of   | Schema constraint where exactly one of N fields must be present                                                  |

---

## Requirements

### Functional Requirements

#### R1: API Envelope Modeling

**Description:** Model the standard API response envelope for success and error responses.

**Contract Evidence:** `docs/CONTRACT-BASELINE.md` §6.2

**Acceptance Criteria:**

- R1-AC1: Success envelope type includes `data: T`, `meta?: object` with optional `server_time: string`
- R1-AC2: Error envelope type includes `meta.error_code: string`, `meta.message: string`
- R1-AC3: Envelope types are generic over payload type `T`
- R1-AC4: Types compile without React/React Native dependencies

#### R2: API Error Modeling

**Description:** Model known API error codes as discriminated union for exhaustive handling.

**Contract Evidence:** `docs/CONTRACT-BASELINE.md` §6.3

**Acceptance Criteria:**

- R2-AC1: `ApiErrorCode` union includes: `DEVICE_ID_REQUIRED`, `CAPTCHA_REQUIRED`, `QUEUE_FULL`, `FULL_BOOKED`, `DEVICE_MISMATCH`, `GRANT_TOKEN_INVALID`, `NIK_ALREADY_USED`, `DUKCAPIL_UNAVAILABLE`
- R2-AC2: `ApiError` type associates HTTP status with error code
- R2-AC3: Forward-compatible: unknown error codes are representable without type error
- R2-AC4: Given an API error response, When parsed, Then error code is extractable with type safety

#### R3: Queue State Modeling

**Description:** Model queue poll/SSE states as discriminated union preventing invalid state collapse.

**Contract Evidence:** `docs/CONTRACT-BASELINE.md` §2.3

**Acceptance Criteria:**

- R3-AC1: `QueueState` union is exactly: `SCHEDULED`, `OPEN`, `FULL_QUEUE`, `FULL_BOOKED`, `CLOSED`
- R3-AC2: `FULL_QUEUE` (503 queue capacity) is distinct from `FULL_BOOKED` (409 inventory)
- R3-AC3: `SOLD_OUT` is NOT a valid queue state — ticket-category status only
- R3-AC4: `CLOSED` is marked as terminal; others are non-terminal
- R3-AC5: Given queue state `FULL_QUEUE`, When compared to `FULL_BOOKED`, Then they are distinct values

#### R4: Engagement State Modeling

**Description:** Model queue engagement states from `/queue/me` response.

**Contract Evidence:** `docs/CONTRACT-BASELINE.md` §2.2

**Acceptance Criteria:**

- R4-AC1: `EngagementState` union is exactly: `QUEUED`, `GRANTED`, `SELECTING`, `AWAITING_PAYMENT`, `CONFIRMED`, `EXPIRED`
- R4-AC2: Types compile without React/React Native dependencies
- R4-AC3: State transitions are documentable via type comments

#### R5: Server Time Handling

**Description:** Implement server-authoritative time offset calculation for TTL/countdown accuracy.

**Contract Evidence:** `docs/CONTRACT-BASELINE.md` §2.1 (server_time authoritative), `_handoff/B-web-lessons.md` §2

**Acceptance Criteria:**

- R5-AC1: `serverOffsetMs(serverTimeMs: number, clientNowMs: number): number` calculates offset
- R5-AC2: `remainingMs(expiresAt: string, clientNowMs: number, offsetMs: number): number` calculates remaining time
- R5-AC3: Functions are pure with no side effects
- R5-AC4: Given server_time ahead of client, When offset calculated, Then remaining time accounts for drift
- R5-AC5: Given expiry in past, When `remainingMs` called, Then returns 0 (not negative)

#### R6: Token Abstractions

**Description:** Define opaque branded types for queue_token, grant_token, device_id, and eticket_token.

**Contract Evidence:** `docs/CONTRACT-BASELINE.md` §3.5

**Acceptance Criteria:**

- R6-AC1: `QueueToken` is branded string type, not plain string
- R6-AC2: `GrantToken` is branded string type, not plain string
- R6-AC3: `DeviceId` is branded string type, not plain string
- R6-AC4: `ETicketToken` is branded string type, not plain string
- R6-AC5: Raw string assignment to branded type produces TypeScript error
- R6-AC6: Types compile without React/React Native dependencies

#### R7: Authentication Header Policy

**Description:** Define header composition rules for different authentication contexts.

**Contract Evidence:** `docs/CONTRACT-BASELINE.md` §3.2, §3.3, §3.4, §3.5

**Acceptance Criteria:**

- R7-AC1: Logged-in grant-protected requests require BOTH `X-Grant-Token` AND `Authorization: Bearer`
- R7-AC2: Guest grant-protected requests require `X-Grant-Token` AND `X-Device-Id`
- R7-AC3: Queue requests require `X-Queue-Token`
- R7-AC4: Account-only requests require `Authorization: Bearer` only
- R7-AC5: Guest queue join requires `X-Device-Id` (DEVICE_ID_REQUIRED error if missing)
- R7-AC6: Header policy types are composable without React dependencies

#### R8: NIK Exactly-One-Of Modeling

**Description:** Model the NIK input schema enforcing exactly-one-of constraint.

**Contract Evidence:** `docs/CONTRACT-BASELINE.md` §4.1

**Acceptance Criteria:**

- R8-AC1: NIK input is discriminated union with three variants: `raw_nik`, `saved_nik_id`, `use_account_nik`
- R8-AC2: Given zero NIK fields, When validated, Then error
- R8-AC3: Given multiple NIK fields, When validated, Then error
- R8-AC4: Given exactly one NIK field, When validated, Then valid
- R8-AC5: NIK normalization rule documented: strips non-digits, requires exactly 16 digits

#### R9: Queue Join Contract Modeling

**Description:** Model the queue join request/response contract including required captcha_token.

**Contract Evidence:** `docs/CONTRACT-BASELINE.md` §2.5, §2.6

**Acceptance Criteria:**

- R9-AC1: Queue join request type requires `captcha_token: string` field
- R9-AC2: Queue join response type includes: `queue_token`, `sse_url`, `rejoined?: boolean`, `state?: EngagementState`
- R9-AC3: `sse_url` is typed as absolute URL string
- R9-AC4: Types are DTOs separate from domain models
- R9-AC5: Given queue join without captcha_token, When validated, Then type error at compile time

#### R10: Poll Tiers Modeling

**Description:** Model the server-provided polling guidance structure.

**Contract Evidence:** `docs/CONTRACT-BASELINE.md` §2.8

**Acceptance Criteria:**

- R10-AC1: `PollTier` type has `max_position: number | null` and `poll_after_ms: number`
- R10-AC2: `null` max_position represents unbounded tier
- R10-AC3: Poll tiers array is orderable by max_position

#### R11: Pagination Primitives

**Description:** Model pagination request/response primitives for list endpoints.

**Contract Evidence:** Standard API pagination pattern from OpenAPI

**Acceptance Criteria:**

- R11-AC1: `PaginationParams` includes `page?: number`, `per_page?: number`
- R11-AC2: `PaginatedResponse<T>` includes `data: T[]`, `pagination: { current_page, per_page, total_pages, total_items }`
- R11-AC3: Pagination metadata fields are all optional for forward-compatibility

#### R12: Rate Limit Primitives

**Description:** Model rate limit response headers for client handling.

**Contract Evidence:** Standard API rate limiting headers

**Acceptance Criteria:**

- R12-AC1: `RateLimitInfo` type includes `retry_after_ms?: number`
- R12-AC2: Rate limit info is extractable from 429 responses
- R12-AC3: Types support forward-compatible extension

#### R13: Deterministic Fixtures

**Description:** Create test fixtures matching canonical contract states.

**Contract Evidence:** `docs/CONTRACT-BASELINE.md` all sections

**Acceptance Criteria:**

- R13-AC1: Fixtures exist for all five queue states: `SCHEDULED`, `OPEN`, `FULL_QUEUE`, `FULL_BOOKED`, `CLOSED`
- R13-AC2: Fixtures exist for all six engagement states
- R13-AC3: Fixtures exist for success envelope with `server_time`
- R13-AC4: Fixtures exist for all R2-AC1 error codes
- R13-AC5: Fixtures match `docs/CONTRACT-BASELINE.md` exactly — no `SOLD_OUT` as queue state
- R13-AC6: Fixtures are exported for use in feature tests

---

### Non-Functional Requirements

#### R14: Clean Architecture Compliance

**Description:** Domain types must have no external dependencies.

**Contract Evidence:** AGENTS.md §3

**Acceptance Criteria:**

- R14-AC1: `src/core/domain/` files import only TypeScript built-ins and other `core/domain/` files
- R14-AC2: No React, React Native, or external library imports in domain layer
- R14-AC3: `npm run boundary-check` passes without domain layer violations

#### R15: Type Safety

**Description:** All types must compile without suppressions.

**Acceptance Criteria:**

- R15-AC1: No `@ts-ignore` or `@ts-expect-error` on domain/data types
- R15-AC2: `npm run typecheck` passes
- R15-AC3: All public types are explicitly exported

#### R16: Test Coverage

**Description:** All domain logic must have unit tests.

**Acceptance Criteria:**

- R16-AC1: `remainingMs` and `serverOffsetMs` have unit tests
- R16-AC2: NIK exactly-one-of validation has unit tests (valid + 3 invalid cases)
- R16-AC3: Branded type construction has tests verifying type safety
- R16-AC4: All tests pass via `npm test`

#### R17: CI Gate Compliance

**Description:** All repository CI gates must pass.

**Acceptance Criteria:**

- R17-AC1: `npm run lint` passes
- R17-AC2: `npm run typecheck` passes
- R17-AC3: `npm test` passes
- R17-AC4: `npm run boundary-check` passes
- R17-AC5: `npx expo-doctor` passes (20/20 or established exception)
- R17-AC6: `npx expo export` succeeds

---

## Constraints

1. **Domain Purity:** Domain layer (`src/core/domain/`) must be pure TypeScript with no React, React Native, or external library dependencies.

2. **Contract Fidelity:** All models must align with `docs/CONTRACT-BASELINE.md`. If conflict exists, stop and report rather than guess.

3. **No Payment Architecture:** This ticket must not encode any payment hand-off architecture decisions. Payment-related types are out of scope.

4. **No UI Implementation:** No screens, components, or React hooks in this ticket scope.

5. **No Feature Implementation:** Queue, booking, payment, e-ticket features are out of scope. This ticket provides only the foundation primitives they will consume.

6. **CAPTCHA Input Only:** `captcha_token` is modeled as a required string input. CAPTCHA UI acquisition, provider integration (Turnstile/reCAPTCHA), and token generation are feature work beyond this scope.

---

## Out of Scope

**Explicitly excluded:**

1. CAPTCHA UI / provider integration (Turnstile, reCAPTCHA)
2. Queue screens / queue feature UX
3. SSE client implementation
4. Booking feature implementation
5. Payment UI / payment hand-off architecture
6. E-ticket feature implementation
7. Events UI / Event Detail screens
8. Signal UI packaging work (Ticket #4)
9. Any Ticket #15, #16 work
10. API client HTTP implementation (fetch/axios wrapper)
11. Secure storage implementation (expo-secure-store)
12. React hooks or presentation layer code
13. State management (TanStack Query, Zustand, etc.)

---

## Unresolved Dependencies

| Decision                      | Status     | Implication                                       |
| ----------------------------- | ---------- | ------------------------------------------------- |
| Payment hand-off architecture | UNRESOLVED | No payment types in this ticket                   |
| CAPTCHA provider selection    | UNRESOLVED | Model `captcha_token` as opaque string input      |
| SSE library selection         | UNRESOLVED | Model queue state, not SSE client                 |
| Secure storage API            | UNRESOLVED | Token types are abstract; storage is feature work |

---

## Definition of Done (DoD) Criteria

### Implementation Quality

| Criterion                               | Verification Method | Evidence Required                       |
| --------------------------------------- | ------------------- | --------------------------------------- |
| All R1-R17 acceptance criteria met      | Checklist review    | Each AC verified with specific evidence |
| Domain types compile without React deps | Boundary check      | `npm run boundary-check` exit 0         |
| All unit tests pass                     | Jest                | `npm test` exit 0, all tests green      |
| No type suppressions                    | Code review         | No `@ts-ignore` or `@ts-expect-error`   |
| Contract alignment verified             | Manual review       | Types match CONTRACT-BASELINE.md        |

### CI Gates (AGENTS.md §5-6)

| Gate           | Command                  | Evidence                        |
| -------------- | ------------------------ | ------------------------------- |
| lint           | `npm run lint`           | Exit 0, no errors               |
| typecheck      | `npm run typecheck`      | Exit 0, no errors               |
| test           | `npm test`               | All tests pass                  |
| boundary-check | `npm run boundary-check` | Exit 0, no violations           |
| expo-doctor    | `npx expo-doctor`        | 20/20 or established exception  |
| expo-export    | `npx expo export`        | iOS and Android bundles created |

### Git/PR Requirements (AGENTS.md §4, §7, §9)

| Criterion      | Verification                                    |
| -------------- | ----------------------------------------------- |
| Branch naming  | `story/GH-5-core-domain-api-client`             |
| Commit format  | `[GH-5][Rosyid] <type>(<scope>): <description>` |
| No hook bypass | No `--no-verify` used                           |
| Clean diff     | `git diff` reviewed, no unintended changes      |
