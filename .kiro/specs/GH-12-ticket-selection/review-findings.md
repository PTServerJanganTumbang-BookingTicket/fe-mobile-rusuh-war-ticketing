# GH-12 Spec Review Findings

**Reviewer:** Independent Worker  
**Date:** 2026-11-13  
**PR:** #45  
**Branch:** spec/GH-12-ticket-selection

## Summary

| Category          | Pass | Issues |
| ----------------- | ---- | ------ |
| Requirements      | 9/9  | 1      |
| Design            | 7/8  | 2      |
| Tasks             | 7/7  | 0      |
| Cross-Consistency | 5/5  | 1      |

**Verdict:** APPROVE WITH COMMENTS

The spec is comprehensive and well-structured. It correctly references CONTRACT-BASELINE.md, properly documents the NIK exactly-one-of constraint, and follows the established FakeDataSource pattern from GH-8. Minor issues found are non-blocking and can be addressed during implementation.

---

## Detailed Findings

### Requirements

| Checklist Item                             | Status  | Finding                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All ticket requirements from GH-12 covered | ✅ PASS | All 10 verification gate items from GH-12 issue are addressed: ticket selection screen (R1), category selection (R2), max 3 tickets (R2-AC3, Constraints §1), NIK three modes (R3-R5), exactly-one-of validation (R6), NIK validation (R3-AC3), booking creation (R7), 5-min TTL (R8), grant auth headers (R9). |
| Each R-ID has testable acceptance criteria | ✅ PASS | All 14 requirements (R1-R14) have specific ACs using Given/When/Then format. ACs are testable and measurable.                                                                                                                                                                                                   |
| NIK exactly-one-of constraint documented   | ✅ PASS | Constraints §3 explicitly states: "Exactly-One-Of NIK: Each ticket must have exactly one of: nik, saved_nik_id, use_account_nik". Also documented in R3 (raw), R4 (saved), R5 (account). References CONTRACT-BASELINE §4.1.                                                                                     |
| 5-minute TTL documented                    | ✅ PASS | R8 (TTL Countdown Display) covers this. R8-AC1 references "session.expires_at". Constraints §5: "5-Minute TTL: Selection must complete within 5 minutes of grant". Glossary defines "Booking TTL: 5-minute window from grant to complete ticket selection".                                                     |
| Max 3 tickets per order documented         | ✅ PASS | Constraints §1: "Max Tickets: Maximum 3 tickets per order (total across all categories)". R2-AC3: "Given total selected = 3 (MAX_TICKETS_PER_ORDER), when user tries to add more, then add button is disabled".                                                                                                 |
| Grant authentication documented            | ✅ PASS | R9 (Grant Authentication) covers all auth scenarios. R9-AC1/AC2 document X-Grant-Token header. R9-AC4 covers guest flow with X-Device-Id. References CONTRACT-BASELINE §3.                                                                                                                                      |
| All three NIK input modes covered          | ✅ PASS | R3 (raw/manual), R4 (saved NIK via dropdown), R5 (account NIK). Each mode has detailed ACs for selection, display, and submission behavior.                                                                                                                                                                     |
| Contract reference correct                 | ✅ PASS | Introduction references "sjtrbt20261112.openapi.json" and CONTRACT-BASELINE.md.                                                                                                                                                                                                                                 |
| Out of scope clear                         | ✅ PASS | Clearly delineates GH-13 (payment), GH-14 (booking status), GH-15 (e-ticket), navigation integration, and guest flow details.                                                                                                                                                                                   |

**Issues Found:**

1. **[Non-Critical] R4-AC5 field name inconsistency:** R4-AC5 states "saved_nik_id field is sent (not raw NIK)" using snake_case, but the nik.types.ts uses camelCase `savedNikId` in the discriminated union. The `nikInputToRequest()` function handles conversion to snake_case `saved_nik_id` for the API request, so this is technically correct but could be clearer. The spec should note that internal types use camelCase while API requests use snake_case.

### Design

| Checklist Item                          | Status     | Finding                                                                                                                                                                                                                                                            |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Clean Architecture layers defined       | ✅ PASS    | Architecture section clearly defines Domain Layer (reused types + new GH-12 types), Data Layer (FakeBookingDataSource + Fixtures), Presentation Layer (screens, components, hooks). Component Diagram visualizes the layering.                                     |
| Correctness Properties format correct   | ✅ PASS    | All 6 properties use the exact format: `**Validates: Requirements X.Y**` followed by description with R-ID references in parentheses. Example: Property 1 has "**Validates: Requirements 2.3**" and "(R2-AC3)".                                                    |
| ADRs have Context/Decision/Consequences | ✅ PASS    | All 5 ADRs (ADR-1 through ADR-5) follow the required format with explicit Context, Decision, and Consequences sections. ADR-1 references GH-8 pattern, ADR-2 references FE-Web reducer pattern, ADR-3 documents core type reuse.                                   |
| Component interfaces defined            | ✅ PASS    | Comprehensive Interfaces section with TypeScript definitions for all domain types (TicketSelection, TicketSlot, BookingCategory, etc.), API types (TicketPageResponse, BookingRequest, BookingResponse), and presentation types (UseBookingResult, NikCheckState). |
| Data models match CONTRACT-BASELINE     | ⚠️ PARTIAL | Most models align correctly. BookingTicketRequest matches CONTRACT-BASELINE §4.1 exactly-one-of pattern. However, see Issue #1 below regarding field naming.                                                                                                       |
| Error handling covers all error codes   | ⚠️ PARTIAL | Error Handling table covers 8 error types. BookingErrorCode type lists 10 error codes. However, research-notes.md documents additional error codes not in design.md (see Issue #2).                                                                                |
| Testing Strategy complete               | ✅ PASS    | Unit Tests, Integration Tests, and Render Tests tables map tests to R-IDs. Testing approach follows TDD pattern established in GH-8.                                                                                                                               |
| Reused types verified to exist          | ✅ PASS    | Verified: `core/domain/booking/nik.types.ts` exists with NikInput, validateNikInput(), nikInputToRequest(), normalizeNik(), isValidNikFormat(). Verified: `core/domain/time/server-time.utils.ts` exists with remainingMs(), serverOffsetMs().                     |

**Issues Found:**

1. **[Non-Critical] nikInputToRequest snake_case conversion:** The design shows `BookingTicketRequest` interface with camelCase fields (`categoryId`, `savedNikId`) but the actual API contract per CONTRACT-BASELINE §4.1 and research-notes uses snake_case (`category_id`, `saved_nik_id`). The existing `nikInputToRequest()` in nik.types.ts handles this conversion for NIK fields, but the design should clarify that a similar mapper is needed for the full request, or explicitly note that the interfaces shown are internal representations.

2. **[Non-Critical] Missing error codes from research:** research-notes.md §Error Codes lists additional codes not in design.md's BookingErrorCode:
   - `STOCK_UNINITIALIZED` (503) — Redis stock key missing
   - `DUKCAPIL_UNAVAILABLE` (503) — NIK verification service down
   - `BOOKING_STATUS_INVALID` (409) — GRANTED but ticket page not opened
   - `TOKEN_EXPIRED` (401) — Access token expired (distinct from GRANT_TOKEN_INVALID)

   These are less common but should be considered for completeness. The design's BookingError type could be extended, or these could be documented as "handled by generic error handler".

### Tasks

| Checklist Item                  | Status  | Finding                                                                                                                                                                                                           |
| ------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task dependency graph present   | ✅ PASS | ASCII diagram shows clear T1→T14 flow. JSON waves structure shows 10 waves with correct parallel groupings (T2/T3/T4 in wave 2, T8/T9/T10 in wave 6).                                                             |
| Each task has R-IDs             | ✅ PASS | All 14 tasks have explicit R-ID mappings. T7 (useBooking) correctly references R1-R10 as it orchestrates the full flow.                                                                                           |
| Each task has files             | ✅ PASS | All tasks specify files to create/modify with correct paths following feature-first structure (`src/features/booking/domain/`, `src/features/booking/data/`, `src/features/booking/presentation/`).               |
| Each task has verification gate | ✅ PASS | Each task has specific verification: unit tests for domain utils (T2, T3), integration tests for data source (T6), render tests for components (T8-T11), boundary-check for barrel (T12), all 6 CI gates for T14. |
| Each task has commit message    | ✅ PASS | All commits follow `[GH-12][Rosyid] <type>(<scope>): <description>` format as required by git-workflow.                                                                                                           |
| Tasks cover all requirements    | ✅ PASS | Task Summary Table shows R-ID coverage. Cross-referenced: R1-R10 functional requirements mapped to T1-T13, R11-R14 non-functional requirements verified in T14.                                                   |
| No circular dependencies        | ✅ PASS | DAG is acyclic: T1→T2/T3/T4→T5→T6→T7→T8/T9/T10→T11→T12→T13→T14. Each task depends only on earlier waves.                                                                                                          |

### Cross-Consistency

| Checklist Item                      | Status     | Finding                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Design ADRs align with requirements | ✅ PASS    | ADR-1 (FakeBookingDataSource) supports R12 (Testability). ADR-2 (Selection Reducer) supports R2 (Category Quantity Control). ADR-3 (Reuse nik.types) supports R3-R5 (NIK input modes). ADR-4 (Slot-Based NIK) supports R2-AC5 (dynamic slot management).                                                                              |
| Tasks trace back to requirements    | ✅ PASS    | All tasks have R-ID references. Verified: T1 (R1,R6), T2 (R2), T3 (R2,R3), T4 (R7,R9), T5 (R12), T6 (R1,R3,R4,R7,R12), T7 (R1-R10), T8 (R1,R2,R14), T9 (R3-R5,R14), T10 (R10), T11 (R1,R7,R8), T12 (R1,R13), T13 (R12), T14 (R11-R13).                                                                                                |
| Domain types match research-notes   | ✅ PASS    | research-notes §3 Contract Summary matches design.md interfaces: TicketPageResponse structure matches, BookingRequest/Response match, NikValidationResponse matches. Categories (VIP 1.5M, Festival 850k, Tribune 500k) match.                                                                                                        |
| Error codes match CONTRACT-BASELINE | ⚠️ PARTIAL | Primary error codes (GRANT_TOKEN_INVALID, BOOKING_EXPIRED, NIK_ALREADY_USED, INSUFFICIENT_STOCK) match CONTRACT-BASELINE §6.3 and research-notes. However, design doesn't explicitly map HTTP status codes to error codes as CONTRACT-BASELINE §2.4 does. This is minor since the FakeBookingDataSource won't return real HTTP codes. |
| Constraints align with GH-12 issue  | ✅ PASS    | Issue states "Max 3 tickets per order" → Constraints §1. Issue states "1 NIK = 1 seat per event" → Constraints §2. Issue states "5 minutes from grant" → Constraints §5. Issue references CONTRACT-BASELINE §3 → R9 and Constraints §4.                                                                                               |

---

## Issues Found

### Critical (must fix before merge)

None.

### Non-Critical (can address in implementation)

1. **camelCase/snake_case interface documentation:** The design shows TypeScript interfaces with camelCase (`savedNikId`, `categoryId`) but the API contract uses snake_case. While the existing `nikInputToRequest()` handles NIK field conversion, the design should clarify that `BookingRequest` and `BookingTicketRequest` are internal representations, and a mapper is needed for API serialization. Consider adding a note to ADR-3 or a new ADR documenting the camelCase (internal) ↔ snake_case (API) convention.

2. **Additional error codes for robustness:** The research-notes document 4 additional error codes from backend that aren't in the design's `BookingErrorCode` type:
   - `STOCK_UNINITIALIZED` (503)
   - `DUKCAPIL_UNAVAILABLE` (503)
   - `BOOKING_STATUS_INVALID` (409)
   - `TOKEN_EXPIRED` (401)

   These could be added to `BookingErrorCode` or handled via a catch-all in the error handler. Since this is a fake capability (FakeBookingDataSource), the current error codes are sufficient, but real integration (future tickets) will need these.

3. **R4-AC5 / R5-AC4 field name clarity:** Requirements use API field names (`saved_nik_id`, `use_account_nik=true`) while design interfaces use TypeScript camelCase. The mapping is correct via `nikInputToRequest()`, but explicit documentation of this mapping would help implementers.

4. **Open Questions resolution suggestion:** Design has 3 Open Questions. Suggest resolving before implementation:
   - Contact Email: Proposed resolution (default to account.email) is reasonable.
   - Alias Dropdown: Native Picker is a safe starting choice per ADR-2.
   - Countdown Warning: Visual warning at 1 min is good for fake capability; vibration can be added in real integration.

---

## Recommendations

1. **Consider adding a small ADR-6 for camelCase/snake_case mapping convention.** This would document that internal TypeScript uses camelCase, API serialization uses snake_case, and mappers handle conversion. This is a cross-cutting concern that will apply to all features.

2. **T7 (useBooking Hook) is large.** It references R1-R10 (10 requirements). Consider whether it could be split, but the current structure (hook + reducer) follows the FE-Web pattern per ADR-2, so this is acceptable.

3. **Good pattern adherence:** The spec follows GH-8's FakeQueueDataSource pattern consistently. ADR-1 explicitly references this. The feature-first structure is correct.

4. **NIK type reuse is well-documented.** ADR-3 correctly identifies reuse of `core/domain/booking/nik.types.ts`. Verified that all referenced functions exist.

5. **Countdown implementation is well-specified.** Design Property 6 and R8 correctly reference `remainingMs()` from `core/domain/time`. Verified the function exists with server offset support.
