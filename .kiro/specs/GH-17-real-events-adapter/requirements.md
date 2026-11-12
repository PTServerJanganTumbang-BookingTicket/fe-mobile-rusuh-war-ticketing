# Requirements Document

## GH-17 Real Events Adapter

## Introduction

Connect the Events Home/List feature to the real backend `GET /events` endpoint, replacing the GH-16 fake data source with a real HTTP adapter. This ticket implements the data layer evolution required by the authoritative contract (sjtrbt20261112.openapi.json), adapting the domain model from the earlier GH-16 fake contract to the current production contract.

**Key Constraint:** This is an ADAPTER ticket. It adapts the real API contract to the existing Events presentation layer. It does NOT implement Event Detail, queue navigation, booking, or payment features.

**Contract Evolution:** The real `GET /events` contract uses different enum values than the GH-16 fake:

- GH-16 QueueState: `NOT_OPEN | DIRECT | OPEN | FULL`
- GH-17 QueueState: `SCHEDULED | OPEN | FULL_QUEUE | FULL_BOOKED | CLOSED`

This evolution is GH-17 scope, not a GH-16 defect.

**Dependency:** GH-16 (Events Home and List with Fake Data Source) provides the domain types, repository port, and presentation layer that this ticket adapts.

---

## Glossary

| Term                | Definition                                                        |
| ------------------- | ----------------------------------------------------------------- |
| RealEventDataSource | GH-17 HTTP adapter fetching from `GET /events`                    |
| EventDTO            | Raw API response structure before domain mapping                  |
| QueueState          | Domain enum for queue admission state (5 values in real contract) |
| DisplayBlock        | Server-computed UI hints: `{ enabled: boolean }`                  |
| FULL_QUEUE          | Queue capacity reached; joining unavailable; non-terminal         |
| FULL_BOOKED         | Ticket inventory exhaustion; reversible; customers may still join |
| CLOSED              | Terminal sale closure; irreversible                               |
| SCHEDULED           | Sale not yet opened; queue unavailable                            |
| Contract Drift      | Unexpected response schema or enum values from server             |

---

## Requirements

### Functional Requirements

#### R1: Real GET /events Integration

**Description:** Implement HTTP client integration with the real `GET /events` endpoint.

**Acceptance Criteria:**

- R1-AC1: Given RealEventDataSource, when getEvents() is called, then an HTTP GET request is made to `/events`
- R1-AC2: Given successful response, when data is received, then raw JSON is parsed and validated against EventDTO schema
- R1-AC3: Given successful validation, when EventDTO is valid, then data is mapped to domain Event[] and returned

#### R2: Request Construction

**Description:** Build correct HTTP requests for the Events API.

**Acceptance Criteria:**

- R2-AC1: Given getEvents() call, then request method is GET
- R2-AC2: Given getEvents() call, then no authentication headers are included (endpoint is public)
- R2-AC3: Given default call, then query parameters include `limit=10` and `offset=0`
- R2-AC4: Given custom pagination, then query parameters reflect provided `limit` and `offset`
- R2-AC5: Given any request, then `filter` parameter is NOT sent (backend ignores it)

#### R3: EventDTO Validation

**Description:** Validate raw API response against expected schema before mapping.

**Acceptance Criteria:**

- R3-AC1: Given API response, when response envelope is valid, then `data.items` array is extracted
- R3-AC2: Given EventDTO, when required fields are present (id, name, category, location, date, image_url, queue_state, display), then validation passes
- R3-AC3: Given EventDTO, when queue_state is one of `SCHEDULED | OPEN | FULL_QUEUE | FULL_BOOKED | CLOSED`, then validation passes
- R3-AC4: Given EventDTO, when queue_state is NOT one of the 5 valid values, then validation fails deterministically
- R3-AC5: Given EventDTO, when required fields are missing or malformed, then validation fails deterministically

#### R4: DTO to Domain Mapping

**Description:** Map validated EventDTO to domain Event type through the data boundary.

**Acceptance Criteria:**

- R4-AC1: Given validated EventDTO, when mapping, then `image_url` maps to `imageUrl` (camelCase)
- R4-AC2: Given validated EventDTO, when mapping, then `queue_state` maps to `queueState` (camelCase)
- R4-AC3: Given validated EventDTO, when mapping, then `sale_starts_at` maps to `saleStartsAt` (optional field)
- R4-AC4: Given validated EventDTO, when mapping, then domain Event contains all required display fields
- R4-AC5: Given the data layer, then raw EventDTO types are NOT exposed to presentation layer

#### R5: Five QueueState Values

**Description:** Domain model supports the 5 current queue states from the real contract.

**Acceptance Criteria:**

- R5-AC1: Given QueueState type, then it is a discriminated union of exactly: `SCHEDULED | OPEN | FULL_QUEUE | FULL_BOOKED | CLOSED`
- R5-AC2: Given SCHEDULED state, then `display.enabled = false` and joining is unavailable
- R5-AC3: Given OPEN state, then `display.enabled = true` and joining is permitted
- R5-AC4: Given FULL_QUEUE state, then `display.enabled = false` and joining is unavailable (queue capacity reached)
- R5-AC5: Given FULL_BOOKED state, then `display.enabled = true` and customers may still join (inventory may return)
- R5-AC6: Given CLOSED state, then `display.enabled = false` and joining is unavailable (terminal)

#### R6: Display.enabled Handling

**Description:** Correctly interpret server-provided display.enabled flag.

**Acceptance Criteria:**

- R6-AC1: Given EventDTO with `display.enabled = true`, then domain Event has `display.enabled = true`
- R6-AC2: Given EventDTO with `display.enabled = false`, then domain Event has `display.enabled = false`
- R6-AC3: Given display.enabled state, then presentation layer respects it for CTA button state
- R6-AC4: Given the current contract, then `display.action`, `display.label_key`, and `display.badge_key` are NOT expected or synthesized

#### R7: FULL_BOOKED Reversible Semantics

**Description:** FULL_BOOKED represents inventory exhaustion that may recover.

**Acceptance Criteria:**

- R7-AC1: Given FULL_BOOKED state, then it is treated as non-terminal (reversible)
- R7-AC2: Given FULL_BOOKED state, then `display.enabled = true` per server contract
- R7-AC3: Given FULL_BOOKED state, then it is distinguishable from FULL_QUEUE in domain model
- R7-AC4: Given FULL_BOOKED state, then it is distinguishable from CLOSED in domain model
- R7-AC5: Given FULL_BOOKED state, then presentation may indicate inventory scarcity (PRODUCT_COPY_CONFIRMATION_REQUIRED)

#### R8: CLOSED Terminal Semantics

**Description:** CLOSED represents terminal sale closure.

**Acceptance Criteria:**

- R8-AC1: Given CLOSED state, then it is treated as terminal (irreversible)
- R8-AC2: Given CLOSED state, then `display.enabled = false` per server contract
- R8-AC3: Given CLOSED state, then joining is unavailable
- R8-AC4: Given CLOSED state, then it is distinguishable from FULL_QUEUE and FULL_BOOKED

#### R9: DIRECT Removal

**Description:** Remove DIRECT from domain model; it no longer exists in the real contract.

**Acceptance Criteria:**

- R9-AC1: Given QueueState type, then DIRECT is NOT a valid value
- R9-AC2: Given GH-16 code referencing DIRECT, then it is removed or updated
- R9-AC3: Given any API response containing DIRECT, then it is treated as unknown/contract-drift

#### R10: Event-Level Status Removal

**Description:** Event-level status (AVAILABLE/SELLING_OUT_FAST/SOLD_OUT) is no longer in GET /events.

**Acceptance Criteria:**

- R10-AC1: Given EventDTO from GET /events, then event-level `status` field is NOT expected
- R10-AC2: Given domain Event type, then `status: EventStatus` is removed or made optional
- R10-AC3: Given presentation layer, then status badge logic is updated to handle absence
- R10-AC4: Given the real contract, then availability status now exists at category level in Event Detail (out of scope)

#### R11: Presentation Compatibility

**Description:** Existing Events Home/List presentation continues to work with evolved domain.

**Acceptance Criteria:**

- R11-AC1: Given EventsHomeScreen, when events load successfully, then EventList renders
- R11-AC2: Given EventCard, when event with any of 5 queue states is passed, then card renders without error
- R11-AC3: Given event with display.enabled=false, then CTA button is visually disabled
- R11-AC4: Given event with display.enabled=true, then CTA button is visually enabled
- R11-AC5: Given the 5 queue states, then presentation displays appropriate queue state indicator

#### R12: Empty Collection Behavior

**Description:** Handle empty events list from API.

**Acceptance Criteria:**

- R12-AC1: Given API returns empty `data.items` array, then getEvents() returns empty Event[]
- R12-AC2: Given empty Event[], then EventsHomeScreen renders EmptyState
- R12-AC3: Given empty result, then no error is thrown

#### R13: 400 VALIDATION_ERROR Behavior

**Description:** Handle 400 validation errors from API.

**Acceptance Criteria:**

- R13-AC1: Given invalid request (e.g., limit > 50), when API returns 400, then error is mapped to domain ApiError
- R13-AC2: Given 400 response, then error_code is extracted and preserved
- R13-AC3: Given 400 error, then presentation renders ErrorState with appropriate message
- R13-AC4: Given 400 error, then retry is available (user may have triggered edge case)

#### R14: 503 INTERNAL_ERROR Behavior

**Description:** Handle 503 service unavailable errors.

**Acceptance Criteria:**

- R14-AC1: Given backend unavailable, when API returns 503, then error is mapped to domain ApiError
- R14-AC2: Given 503 response, then error is classified as server error (retryable)
- R14-AC3: Given 503 error, then presentation renders ErrorState
- R14-AC4: Given 503 error, then retry is available

#### R15: Network Failure Behavior

**Description:** Handle network-level failures.

**Acceptance Criteria:**

- R15-AC1: Given network timeout, then error is caught and mapped to domain ApiError
- R15-AC2: Given network unreachable, then error is caught and mapped to domain ApiError
- R15-AC3: Given network failure, then presentation renders ErrorState with retry
- R15-AC4: Given network failure, then error message indicates connectivity issue

#### R16: Malformed Response Behavior

**Description:** Handle malformed or unexpected API responses.

**Acceptance Criteria:**

- R16-AC1: Given non-JSON response, then error is caught and mapped to domain ApiError
- R16-AC2: Given JSON with unexpected structure, then validation fails deterministically
- R16-AC3: Given malformed response, then error is logged for debugging
- R16-AC4: Given malformed response, then presentation renders ErrorState

#### R17: Unknown QueueState Behavior

**Description:** Handle unknown queue_state values without silent fallback.

**Acceptance Criteria:**

- R17-AC1: Given queue_state not in `SCHEDULED | OPEN | FULL_QUEUE | FULL_BOOKED | CLOSED`, then validation FAILS
- R17-AC2: Given unknown queue_state, then entire event DTO is rejected (not silently mapped)
- R17-AC3: Given unknown queue_state, then error is logged with the unknown value
- R17-AC4: Given unknown queue_state, then NO silent fallback to any known state occurs
- R17-AC5: Given list with mixed known/unknown states, then only invalid events are rejected (configurable behavior)

#### R18: Pagination Behavior

**Description:** Support limit/offset pagination for events list.

**Acceptance Criteria:**

- R18-AC1: Given default getEvents(), then request uses limit=10, offset=0
- R18-AC2: Given getEvents({ limit: 20, offset: 10 }), then request uses those values
- R18-AC3: Given limit > 50, then either clamp to 50 or pass through for server validation
- R18-AC4: Given pagination response, then total count is available if server provides it

#### R19: Scope Exclusions

**Description:** Explicit scope boundaries for GH-17.

**Acceptance Criteria:**

- R19-AC1: Given GH-17, then Event Detail UI is NOT implemented
- R19-AC2: Given GH-17, then queue navigation is NOT implemented
- R19-AC3: Given GH-17, then queue join is NOT implemented
- R19-AC4: Given GH-17, then Waiting Room is NOT implemented
- R19-AC5: Given GH-17, then Queue SSE is NOT implemented
- R19-AC6: Given GH-17, then booking/payment is NOT implemented
- R19-AC7: Given queue_state consumption, then it is metadata display only, not queue implementation

#### R20: Clean Architecture Compliance

**Description:** Maintain layer boundaries established in GH-16.

**Acceptance Criteria:**

- R20-AC1: Given RealEventDataSource, then it lives in features/events/data/
- R20-AC2: Given EventDTO types, then they live in features/events/data/ (not domain)
- R20-AC3: Given domain Event type, then it has no HTTP/transport dependencies
- R20-AC4: Given presentation layer, then it imports only domain Event (not EventDTO)
- R20-AC5: Given public API, then features/events/index.ts exports only public types

---

## Non-Functional Requirements

#### R21: Error Traceability

**Description:** Errors include sufficient context for debugging.

**Acceptance Criteria:**

- R21-AC1: Given API error, then request URL is logged
- R21-AC2: Given validation error, then field path is included in error message
- R21-AC3: Given unknown enum value, then the actual value is logged

---

## Constraints

1. **No Event Detail:** Event Detail screen is OUT OF SCOPE
2. **No Queue Implementation:** Queue join/navigation/SSE are OUT OF SCOPE
3. **No Booking/Payment:** All booking/payment features are OUT OF SCOPE
4. **No Filter Parameter:** `filter` query param must NOT be sent
5. **No Silent Fallback:** Unknown enum values must NOT silently map to known values
6. **No DIRECT State:** DIRECT no longer exists in the contract
7. **No Event-Level Status:** status field is no longer in GET /events response
8. **Clean Architecture:** Data layer owns DTOs; domain owns Event type
9. **GH-16 Evolution:** This evolves GH-16 types; it does not mean GH-16 was incomplete

---

## Out of Scope

**Explicitly excluded from GH-17:**

1. Event Detail screen and route
2. `GET /events/{event_id}` integration
3. Queue join action (`POST /queue/join`)
4. Waiting Room implementation
5. Queue SSE stream
6. Polling fallback
7. CAPTCHA integration
8. Admission/grant handling
9. Booking creation
10. Payment flow (VA, GoPay, WebView)
11. E-ticket display
12. Authentication-dependent behavior (events endpoint is public)
13. Real queue navigation (consuming queue_state is metadata display only)
14. Restoring DIRECT queue state
15. Restoring event-level status enum

**NEW PAYMENT CONTRACT EVIDENCE OBSERVED — OUTSIDE GH-17:**
The latest OpenAPI (sjtrbt20261112) contains payment handoff evidence:

- `POST /payments/{booking_id}/handoff`
- `POST /payments/handoff/exchange`
- `handoff_code`, `X-Payment-Session`, WebView `#code` fragment

This is recorded but NOT implemented in GH-17.

---

## Assessment Mapping

| Focus Area            | Evidence                                  | Acceptance / Trade-off                | Verification                |
| --------------------- | ----------------------------------------- | ------------------------------------- | --------------------------- |
| UI Implementation     | EventCard renders 5 queue states          | Presentation adapts to evolved domain | Render tests                |
| Software Design       | Repository port pattern with HTTP adapter | Clean Architecture preserved          | Code review, boundary-check |
| Software Construction | HTTP client integration                   | Requires backend or MSW               | Integration tests           |
| Software Quality      | DTO validation, error mapping             | Contract drift detected               | Unit tests                  |
| Software Deployment   | N/A                                       | No deployment changes                 | N/A                         |
| Software Security     | No auth required for GET /events          | Public endpoint                       | Contract verification       |

---

## Definition of Done (DoD) Criteria

### Implementation Quality

| Criterion                                  | Verification Method | Evidence Required            |
| ------------------------------------------ | ------------------- | ---------------------------- |
| All R1-R21 acceptance criteria met         | Checklist review    | Each AC verified             |
| Events Home renders with real API (or MSW) | Integration test    | Test passes                  |
| All 5 queue states handled                 | Unit tests          | Coverage for each state      |
| Unknown enum rejected deterministically    | Unit test           | No silent fallback           |
| Error states work                          | Error tests         | Each error type tested       |
| DIRECT removed                             | Code review         | No DIRECT references remain  |
| EventStatus handled                        | Code review         | Absence or optional handling |

### CI Gates (AGENTS.md §5-6)

| Gate           | Command                  | Evidence                  |
| -------------- | ------------------------ | ------------------------- |
| lint           | `npm run lint`           | Exit 0                    |
| typecheck      | `npm run typecheck`      | Exit 0                    |
| test           | `npm test`               | All tests pass            |
| boundary-check | `npm run boundary-check` | Exit 0                    |
| expo-doctor    | `npx expo-doctor`        | Pass (or known exception) |
| expo-export    | `npx expo export`        | Bundles created           |

### Git/PR Requirements

| Criterion      | Verification                                     |
| -------------- | ------------------------------------------------ |
| Branch naming  | `story/GH-17-real-events-adapter`                |
| Commit format  | `[GH-17][Rosyid] <type>(<scope>): <description>` |
| No hook bypass | No `--no-verify` used                            |
| Clean diff     | No unintended changes                            |
