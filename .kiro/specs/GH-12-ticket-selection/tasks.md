# Implementation Plan

## Overview

GH-12 implements the Ticket Selection screen with deterministic fake Booking capability. Implementation follows TDD approach: domain types/utilities → data source → fixtures → hook → components → screen → integration tests.

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
                        T1 (Domain Types)
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
        T2 (Selection    T3 (Slot        T4 (API Types)
            Utils)           Utils)
               │              │              │
               └──────────────┼──────────────┘
                              ▼
                    T5 (BookingFixtures)
                              │
                              ▼
                T6 (FakeBookingDataSource)
                              │
                              ▼
                    T7 (useBooking Hook)
                              │
               ┌──────────────┼──────────────┐
               ▼              ▼              ▼
      T8 (CategoryCard)  T9 (NikInput   T10 (OrderSummary)
                             Field)
               │              │              │
               └──────────────┼──────────────┘
                              ▼
              T11 (TicketSelectionScreen)
                              │
                              ▼
                T12 (Feature Barrel)
                              │
                              ▼
                T13 (Integration Tests)
                              │
                              ▼
                T14 (Full Verification)
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1"] },
    { "wave": 2, "tasks": ["T2", "T3", "T4"] },
    { "wave": 3, "tasks": ["T5"] },
    { "wave": 4, "tasks": ["T6"] },
    { "wave": 5, "tasks": ["T7"] },
    { "wave": 6, "tasks": ["T8", "T9", "T10"] },
    { "wave": 7, "tasks": ["T11"] },
    { "wave": 8, "tasks": ["T12"] },
    { "wave": 9, "tasks": ["T13"] },
    { "wave": 10, "tasks": ["T14"] }
  ]
}
```

---

## Tasks

### T1: Booking Feature Domain Types

**R-IDs:** R1, R6

**Description:** Create Booking feature folder structure and define domain types (BookingCategory, BookingSession, TicketSlot, BookingRequest, BookingResponse, BookingError). Types must be pure TypeScript with no React dependencies.

**Files to create/modify:**

- `src/features/booking/domain/booking.types.ts`
- `src/features/booking/domain/index.ts`
- `__tests__/features/booking/domain/booking.types.test.ts`

**Planned Tests:**

- Unit: BookingCategory type validation
- Unit: TicketSlot structure validation
- Unit: BookingRequest structure validation
- Unit: BookingError discriminated union

**Verification Gate:** `npm run typecheck` passes, `npm test` passes for new tests, `npm run boundary-check` passes

**Commit:**

```
[GH-12][Rosyid] feat(booking): add Booking domain types
```

---

### T2: Selection Utility Functions

**R-IDs:** R2

**Description:** Implement pure utility functions: `totalSelectedCount()`, `canAddTicket()`, `canRemoveTicket()`. These handle selection validation logic.

**Files to create/modify:**

- `src/features/booking/domain/selection.utils.ts`
- `src/features/booking/domain/index.ts` (export)
- `__tests__/features/booking/domain/selection.utils.test.ts`

**Planned Tests:**

- Unit: totalSelectedCount({cat_vip: 2, cat_fest: 1}) = 3
- Unit: totalSelectedCount({}) = 0
- Unit: canAddTicket with total < 3, available > current = true
- Unit: canAddTicket with total = 3 = false
- Unit: canAddTicket with current = available = false
- Unit: canRemoveTicket with current > 0 = true
- Unit: canRemoveTicket with current = 0 = false

**Verification Gate:** `npm test __tests__/features/booking/domain/selection.utils.test.ts` passes

**Commit:**

```
[GH-12][Rosyid] feat(booking): add selection utility functions
```

---

### T3: Slot Builder Utility

**R-IDs:** R2, R3

**Description:** Implement `buildSlots()` function that creates TicketSlot array from selection map and categories. Handles slot key generation and mapping.

**Files to create/modify:**

- `src/features/booking/domain/slot.utils.ts`
- `src/features/booking/domain/index.ts` (export)
- `__tests__/features/booking/domain/slot.utils.test.ts`

**Planned Tests:**

- Unit: buildSlots with empty selection = []
- Unit: buildSlots with {cat_vip: 2} = 2 slots with keys cat_vip_0, cat_vip_1
- Unit: buildSlots preserves category name and price
- Unit: buildSlots initializes nikInput as null
- Unit: buildSlots with multiple categories interleaves correctly

**Verification Gate:** `npm test __tests__/features/booking/domain/slot.utils.test.ts` passes

**Commit:**

```
[GH-12][Rosyid] feat(booking): add slot builder utility
```

---

### T4: API Request/Response Types

**R-IDs:** R7, R9

**Description:** Define types for API request/response matching contract: TicketPageResponse, BookingTicketRequest, BookingRequest, BookingResponse, NikValidationResponse, SavedNik.

**Files to create/modify:**

- `src/features/booking/domain/booking-api.types.ts`
- `src/features/booking/domain/index.ts` (export)
- `__tests__/features/booking/domain/booking-api.types.test.ts`

**Planned Tests:**

- Unit: TicketPageResponse structure validation
- Unit: BookingRequest ticket structure (exactly-one-of NIK)
- Unit: BookingResponse summary structure

**Verification Gate:** `npm run typecheck` passes, tests pass

**Commit:**

```
[GH-12][Rosyid] feat(booking): add API request/response types
```

---

### T5: Booking Fixtures

**R-IDs:** R12

**Description:** Create deterministic fixtures: CATEGORIES (VIP, Festival, Tribune), SAVED_NIKS, NIK_DIRECTORY with test NIKs and validation results, EVENT_FIXTURE.

**Files to create/modify:**

- `src/features/booking/data/fixtures/categories.ts`
- `src/features/booking/data/fixtures/niks.ts`
- `src/features/booking/data/fixtures/events.ts`
- `src/features/booking/data/fixtures/index.ts`
- `__tests__/features/booking/data/fixtures/fixtures.test.ts`

**Planned Tests:**

- Unit: CATEGORIES has VIP (1.5M), Festival (850k), Tribune (500k)
- Unit: NIK_DIRECTORY contains valid and invalid test NIKs
- Unit: SAVED_NIKS has test aliases
- Unit: lookupNik returns expected validation result

**Verification Gate:** `npm test __tests__/features/booking/data/fixtures/fixtures.test.ts` passes

**Commit:**

```
[GH-12][Rosyid] feat(booking): add deterministic booking fixtures
```

---

### T6: FakeBookingDataSource Implementation

**R-IDs:** R1, R3, R4, R7, R12

**Description:** Implement FakeBookingDataSource class with methods: getTicketPage(), validateNik(), getSavedNiks(), createBooking(). Uses fixtures for deterministic responses. Supports scenario configuration for error paths.

**Files to create/modify:**

- `src/features/booking/data/FakeBookingDataSource.ts`
- `src/features/booking/data/index.ts`
- `__tests__/features/booking/data/FakeBookingDataSource.test.ts`

**Planned Tests:**

- Integration: getTicketPage returns categories and session
- Integration: validateNik with valid NIK returns valid=true
- Integration: validateNik with unknown NIK returns NIK_NOT_FOUND
- Integration: getSavedNiks returns fixture aliases
- Integration: createBooking success returns booking_id
- Integration: createBooking with NIK_ALREADY_USED error
- Integration: createBooking with BOOKING_EXPIRED error
- Integration: setScenario changes behavior

**Verification Gate:** `npm test __tests__/features/booking/data/FakeBookingDataSource.test.ts` passes

**Commit:**

```
[GH-12][Rosyid] feat(booking): implement FakeBookingDataSource
```

---

### T7: useBooking Hook Implementation

**R-IDs:** R1, R2, R3, R4, R5, R6, R7, R8, R9, R10

**Description:** Implement React hook that orchestrates booking flow: loads ticket page, manages selection state via reducer, tracks NIK inputs per slot, handles countdown, provides submit action. Uses FakeBookingDataSource via injection.

**Files to create/modify:**

- `src/features/booking/presentation/hooks/useBooking.ts`
- `src/features/booking/presentation/hooks/useSelectionReducer.ts`
- `src/features/booking/presentation/hooks/index.ts`
- `src/features/booking/presentation/index.ts`
- `__tests__/features/booking/presentation/hooks/useBooking.test.ts`
- `__tests__/features/booking/presentation/hooks/useSelectionReducer.test.ts`

**Planned Tests:**

- Integration: hook loads categories on mount
- Integration: addTicket updates selection
- Integration: removeTicket updates selection
- Integration: canAdd returns false when total=3
- Integration: setSlotNik updates slot
- Integration: validateSlotNik calls data source
- Integration: submitBooking creates booking
- Integration: countdown calculates from session.expiresAt
- Unit: reducer ADD_TICKET action
- Unit: reducer REMOVE_TICKET action
- Unit: reducer enforces max 3 total

**Verification Gate:** `npm test __tests__/features/booking/presentation/hooks` passes

**Commit:**

```
[GH-12][Rosyid] feat(booking): implement useBooking hook
```

---

### T8: CategoryCard Component

**R-IDs:** R1, R2, R14

**Description:** Implement CategoryCard component with name, description, price, available stock, and stepper controls. Handles soldOut state with disabled stepper.

**Files to create/modify:**

- `src/features/booking/presentation/components/CategoryCard.tsx`
- `src/features/booking/presentation/components/index.ts`
- `__tests__/features/booking/presentation/components/CategoryCard.render.test.tsx`

**Planned Tests:**

- Render: shows category name and description
- Render: shows formatted price (Rp 1.500.000)
- Render: shows available stock
- Render: stepper shows current quantity
- Render: add button disabled when canAdd=false
- Render: remove button disabled when quantity=0
- Render: soldOut badge shown when available=0
- Render: add/remove buttons have accessibilityLabel

**Verification Gate:** `npm test __tests__/features/booking/presentation/components/CategoryCard.render.test.tsx` passes

**Commit:**

```
[GH-12][Rosyid] feat(booking): implement CategoryCard component
```

---

### T9: NikInputField Component

**R-IDs:** R3, R4, R5, R14

**Description:** Implement NikInputField with TextInput for NIK, validation state indicators, and optional AliasDropdown for saved NIKs. Handles three input modes: raw, saved, account.

**Files to create/modify:**

- `src/features/booking/presentation/components/NikInputField.tsx`
- `src/features/booking/presentation/components/AliasDropdown.tsx`
- `__tests__/features/booking/presentation/components/NikInputField.render.test.tsx`
- `__tests__/features/booking/presentation/components/AliasDropdown.render.test.tsx`

**Planned Tests:**

- Render: TextInput with keyboardType="number-pad"
- Render: shows slot title (e.g., "Ticket 1 - VIP")
- Render: shows checking spinner during validation
- Render: shows success indicator when valid
- Render: shows error message when invalid
- Render: AliasDropdown shows saved NIK options
- Render: AliasDropdown disables already-used options
- Render: selecting alias sets input to read-only masked value
- Render: accessibilityLabel on input

**Verification Gate:** `npm test __tests__/features/booking/presentation/components/NikInputField.render.test.tsx` passes

**Commit:**

```
[GH-12][Rosyid] feat(booking): implement NikInputField component
```

---

### T10: OrderSummary Component

**R-IDs:** R10

**Description:** Implement OrderSummary component showing line items (category × qty), subtotal, and total. Handles empty state. Submit button included.

**Files to create/modify:**

- `src/features/booking/presentation/components/OrderSummary.tsx`
- `__tests__/features/booking/presentation/components/OrderSummary.render.test.tsx`

**Planned Tests:**

- Render: shows line items with category name × quantity
- Render: shows formatted prices
- Render: shows subtotal
- Render: shows total
- Render: empty state shows "No tickets selected"
- Render: submit button shows "Pay" label
- Render: submit button disabled when disabled=true
- Render: submit button shows spinner when busy=true

**Verification Gate:** `npm test __tests__/features/booking/presentation/components/OrderSummary.render.test.tsx` passes

**Commit:**

```
[GH-12][Rosyid] feat(booking): implement OrderSummary component
```

---

### T11: TicketSelectionScreen Implementation

**R-IDs:** R1, R7, R8

**Description:** Implement TicketSelectionScreen composing: CountdownBanner, CategoryCard list, NikInputField per slot, OrderSummary. Wires useBooking hook. Handles loading and error states.

**Files to create/modify:**

- `src/features/booking/presentation/screens/TicketSelectionScreen.tsx`
- `src/features/booking/presentation/screens/index.ts`
- `src/features/booking/presentation/components/CountdownBanner.tsx`
- `__tests__/features/booking/presentation/screens/TicketSelectionScreen.render.test.tsx`
- `__tests__/features/booking/presentation/components/CountdownBanner.render.test.tsx`

**Planned Tests:**

- Render: shows countdown banner with remaining time
- Render: shows category cards
- Render: shows NIK input fields when tickets selected
- Render: shows order summary
- Render: loading state shows skeleton
- Render: error state shows error message
- Render: CountdownBanner updates each second
- Render: expired state shows expiry message

**Verification Gate:** `npm test __tests__/features/booking/presentation/screens` passes

**Commit:**

```
[GH-12][Rosyid] feat(booking): implement TicketSelectionScreen
```

---

### T12: Booking Feature Barrel Export

**R-IDs:** R1, R13

**Description:** Create feature barrel index.ts exporting public API. Only types and public components/hooks should be exported. Follow GH-8/GH-16 feature pattern.

**Files to create/modify:**

- `src/features/booking/index.ts`

**Planned Tests:**

- Verify exports compile and are accessible from outside feature

**Verification Gate:** `npm run typecheck` passes, `npm run boundary-check` passes

**Commit:**

```
[GH-12][Rosyid] feat(booking): add feature barrel exports
```

---

### T13: Integration Tests

**R-IDs:** R12

**Description:** Add integration tests covering full booking flow: load → select → enter NIK → validate → submit. Verify no network calls. Test error scenarios.

**Files to create/modify:**

- `__tests__/features/booking/integration/booking-flow.integration.test.ts`

**Planned Tests:**

- Integration: full happy path flow
- Integration: NIK validation error flow
- Integration: NIK_ALREADY_USED submit error
- Integration: BOOKING_EXPIRED error
- Integration: countdown expiry blocks submit
- Integration: no network calls (mock fetch to throw)

**Verification Gate:** `npm test __tests__/features/booking/integration` passes

**Commit:**

```
[GH-12][Rosyid] test(booking): add booking flow integration tests
```

---

### T14: Full Verification and Cleanup

**R-IDs:** R11, R12, R13

**Description:** Run all verification gates, ensure no regressions, verify architecture boundaries. Document any deferred items.

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
5. `npx expo-doctor` — passes
6. `npx expo export` — builds successfully

**Commit:**

```
[GH-12][Rosyid] chore(booking): verify all gates pass
```

---

## Task Summary Table

| Task | R-IDs           | Files                 | Verification      | Commit                                              |
| ---- | --------------- | --------------------- | ----------------- | --------------------------------------------------- |
| T1   | R1,R6           | domain types          | typecheck, tests  | `feat(booking): add Booking domain types`           |
| T2   | R2              | selection.utils.ts    | unit tests        | `feat(booking): add selection utility functions`    |
| T3   | R2,R3           | slot.utils.ts         | unit tests        | `feat(booking): add slot builder utility`           |
| T4   | R7,R9           | booking-api.types.ts  | typecheck         | `feat(booking): add API request/response types`     |
| T5   | R12             | fixtures              | unit tests        | `feat(booking): add deterministic booking fixtures` |
| T6   | R1,R3,R4,R7,R12 | FakeBookingDataSource | integration tests | `feat(booking): implement FakeBookingDataSource`    |
| T7   | R1-R10          | useBooking hook       | integration tests | `feat(booking): implement useBooking hook`          |
| T8   | R1,R2,R14       | CategoryCard          | render tests      | `feat(booking): implement CategoryCard component`   |
| T9   | R3,R4,R5,R14    | NikInputField         | render tests      | `feat(booking): implement NikInputField component`  |
| T10  | R10             | OrderSummary          | render tests      | `feat(booking): implement OrderSummary component`   |
| T11  | R1,R7,R8        | TicketSelectionScreen | render tests      | `feat(booking): implement TicketSelectionScreen`    |
| T12  | R1,R13          | index.ts barrel       | boundary-check    | `feat(booking): add feature barrel exports`         |
| T13  | R12             | integration tests     | test pass         | `test(booking): add booking flow integration tests` |
| T14  | R11-R13         | —                     | all 6 gates       | `chore(booking): verify all gates pass`             |

---

## Notes

1. **NIK Types Reuse:** Tasks import NikInput types from `@/core/domain/booking/nik.types.ts`. No duplication.

2. **Fake Timers:** Tests in T7, T11 should use `jest.useFakeTimers()` for deterministic countdown tests.

3. **Navigation Deferred:** TicketSelectionScreen does NOT navigate after booking success. Navigation to Payment is GH-13 scope.

4. **Countdown Component:** T11 includes CountdownBanner. Uses remainingMs() from core/domain/time for server-authoritative timing.

5. **Alias Dropdown:** T9 includes AliasDropdown as sub-component of NikInputField. Uses native Picker initially per ADR-2.

6. **Contact Email:** T7 hook manages contactEmail state. Defaults to account.email if logged in.

7. **No Observer<T>:** Per GH-8 ADR-1, FakeBookingDataSource uses simple async methods, not Observer pattern.
