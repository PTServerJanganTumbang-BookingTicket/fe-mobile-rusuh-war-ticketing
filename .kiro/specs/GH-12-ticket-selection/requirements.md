# Requirements Document

## Introduction

GH-12 implements the Ticket Selection and Booking flow for the Rusuh Booking Tiket mobile app. This feature enables users who have been granted a booking slot (GRANTED state from queue) to select ticket categories, specify NIK holders per ticket, and create a booking.

The ticket selection feature provides:

- Category selection with quantity stepper (max 3 tickets total)
- NIK input for each ticket holder with three input modes
- Client-side NIK validation before submission
- Booking creation with atomic NIK enforcement
- TTL countdown (5 min selection window)
- Grant token authentication for booking operations

**Contract Reference:** `sjtrbt20261112.openapi.json`  
**Research Notes:** `.kiro/specs/GH-12-ticket-selection/research-notes.md`

## Glossary

| Term                  | Definition                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Grant Token           | Token received upon GRANTED state, authorizing booking operations (X-Grant-Token header) |
| Category              | Ticket tier with id, name, description, price, and available stock                       |
| NIK                   | Nomor Induk Kependudukan — Indonesian national ID (16 digits after normalization)        |
| Saved NIK             | NIK stored in user's account, referenced by saved_nik_id                                 |
| Account NIK           | User's own registered NIK from their account                                             |
| Booking TTL           | 5-minute window from grant to complete ticket selection                                  |
| Selection             | Map of category_id to quantity                                                           |
| Slot                  | Individual ticket within an order, requiring one NIK holder                              |
| FakeBookingDataSource | Deterministic data source for testing ticket selection flow                              |

## Requirements

### Functional Requirements

#### R1: Ticket Selection Screen

**Description:** Display ticket categories with quantity stepper controls upon entering selection flow.

**Acceptance Criteria:**

- R1-AC1: Given a user with GRANTED state, when ticket selection screen loads, then categories are fetched from GET /events/{event_id}/tickets
- R1-AC2: Given categories data, when rendered, then each category shows name, description, price, and available stock
- R1-AC3: Given a category with available > 0, when displayed, then add/remove stepper buttons are shown
- R1-AC4: Given a category with available = 0 (soldOut), when displayed, then "Sold Out" badge is shown and stepper is disabled

#### R2: Category Quantity Control

**Description:** Allow users to add/remove tickets per category with validation.

**Acceptance Criteria:**

- R2-AC1: Given a category, when user taps add, then quantity increments by 1
- R2-AC2: Given a category with quantity > 0, when user taps remove, then quantity decrements by 1
- R2-AC3: Given total selected = 3 (MAX_TICKETS_PER_ORDER), when user tries to add more, then add button is disabled
- R2-AC4: Given category available = 2 and quantity = 2, when user tries to add more, then add button is disabled (per-category limit)
- R2-AC5: Given selection state, when categories change, then NIK holder slots are dynamically added/removed

#### R3: NIK Holder Input

**Description:** For each selected ticket slot, provide NIK input with three input modes.

**Acceptance Criteria:**

- R3-AC1: Given a slot, when displayed, then TextInput for NIK entry is shown with keyboardType="number-pad"
- R3-AC2: Given a typed NIK, when it changes, then non-digit characters are stripped (normalizeNik)
- R3-AC3: Given a typed NIK with 16 digits, when user blurs input, then POST /nik/validate is called
- R3-AC4: Given NIK validation returns valid=true, when displayed, then success indicator is shown
- R3-AC5: Given NIK validation returns valid=false with reason NIK_NOT_FOUND, when displayed, then error dialog is shown
- R3-AC6: Given logged-in user, when slot is displayed, then alias dropdown for saved NIKs is available

#### R4: Saved NIK Selection

**Description:** Allow logged-in users to select from saved NIKs via dropdown.

**Acceptance Criteria:**

- R4-AC1: Given logged-in user, when screen loads, then GET /accounts/me/saved-niks is fetched
- R4-AC2: Given saved NIKs list, when dropdown rendered, then each option shows masked NIK
- R4-AC3: Given a saved NIK selected, when displayed, then NIK input shows masked value (read-only)
- R4-AC4: Given a saved NIK already used in another slot, when dropdown rendered, then that option is disabled
- R4-AC5: Given saved NIK selected, when booking submitted, then saved_nik_id field is sent (not raw NIK)

#### R5: Account NIK Option

**Description:** Allow logged-in users to use their account's registered NIK.

**Acceptance Criteria:**

- R5-AC1: Given logged-in user with nik_masked in session, when dropdown rendered, then "Use my NIK" option is available
- R5-AC2: Given "Use my NIK" selected, when displayed, then NIK input shows account nik_masked (read-only)
- R5-AC3: Given account NIK already used in another slot, when dropdown rendered, then "Use my NIK" option is disabled
- R5-AC4: Given account NIK selected, when booking submitted, then use_account_nik=true field is sent
- R5-AC5: Given no logged-in user, when dropdown would render, then only raw NIK input is available

#### R6: Client-Side Validation

**Description:** Validate booking request before submission.

**Acceptance Criteria:**

- R6-AC1: Given zero tickets selected, when submit attempted, then button is disabled
- R6-AC2: Given ticket without NIK assigned, when submit attempted, then error is shown
- R6-AC3: Given raw NIK that is not 16 digits, when submit attempted, then error is shown for that slot
- R6-AC4: Given same NIK used for multiple slots, when submit attempted, then duplicate error is shown
- R6-AC5: Given contact_email invalid, when submit attempted, then email error is shown

#### R7: Booking Creation

**Description:** Submit booking request to backend.

**Acceptance Criteria:**

- R7-AC1: Given valid selection, when submit tapped, then POST /bookings is called with event_id, tickets[], contact_email
- R7-AC2: Given POST /bookings returns 201, when response received, then booking_id and summary are available
- R7-AC3: Given POST /bookings returns NIK_ALREADY_USED (409), when response received, then specific slot error is shown
- R7-AC4: Given POST /bookings returns INSUFFICIENT_STOCK (409), when response received, then stock depleted error is shown
- R7-AC5: Given POST /bookings returns BOOKING_EXPIRED (409), when response received, then TTL expired error is shown

#### R8: TTL Countdown Display

**Description:** Show remaining time for selection window.

**Acceptance Criteria:**

- R8-AC1: Given session.expires_at from ticket page response, when displayed, then countdown timer shows remaining time
- R8-AC2: Given countdown ticking, when 1 second passes, then displayed time decrements
- R8-AC3: Given countdown reaches 0, when displayed, then expired state is shown and submission is blocked
- R8-AC4: Given countdown calculation, when performed, then it uses server-authoritative time via remainingMs() from core

#### R9: Grant Authentication

**Description:** Authenticate booking operations with grant token.

**Acceptance Criteria:**

- R9-AC1: Given GET /events/{event_id}/tickets request, when made, then X-Grant-Token header is included
- R9-AC2: Given POST /bookings request, when made, then X-Grant-Token header is included
- R9-AC3: Given grant token expired/invalid, when 401 received, then GRANT_TOKEN_INVALID error is shown
- R9-AC4: Given guest flow, when booking request made, then X-Device-Id header is included (no Authorization)

#### R10: Order Summary Display

**Description:** Show real-time order summary as selections change.

**Acceptance Criteria:**

- R10-AC1: Given selection changes, when summary rendered, then line items show category name × quantity
- R10-AC2: Given selection, when summary rendered, then subtotal is calculated correctly
- R10-AC3: Given empty selection, when summary rendered, then "No tickets selected" placeholder is shown
- R10-AC4: Given selection, when summary rendered, then total price is shown (before service fee, which is backend-calculated)

### Non-Functional Requirements

#### R11: Performance

**Description:** Ticket selection operations must be performant for smooth UX.

**Acceptance Criteria:**

- R11-AC1: Given category stepper interaction, when tapped, then UI updates within 16ms (60fps)
- R11-AC2: Given NIK validation call, when in progress, then loading indicator is shown
- R11-AC3: Given screen load, when categories fetched, then skeleton/loading state is shown until ready

#### R12: Testability

**Description:** All components must be testable with deterministic fake data source.

**Acceptance Criteria:**

- R12-AC1: Given FakeBookingDataSource, when used in tests, then ticket selection flow is reproducible
- R12-AC2: Given FakeBookingDataSource, when configured, then categories, saved NIKs, and booking responses are deterministic
- R12-AC3: Given test files, when run, then no real HTTP calls are made

#### R13: Architecture Compliance

**Description:** All code must comply with Clean Architecture boundaries.

**Acceptance Criteria:**

- R13-AC1: Given domain layer code, when inspected, then it has no React/React Native imports
- R13-AC2: Given data layer code, when inspected, then it has no presentation layer imports
- R13-AC3: Given npm run boundary-check, when run, then no violations are reported

#### R14: Accessibility

**Description:** Ticket selection must be accessible.

**Acceptance Criteria:**

- R14-AC1: Given category stepper, when accessibility checked, then add/remove buttons have accessibilityLabel
- R14-AC2: Given NIK input, when accessibility checked, then label is associated with input
- R14-AC3: Given countdown timer, when accessibility checked, then time is announced to screen readers

## Constraints

1. **Max Tickets:** Maximum 3 tickets per order (total across all categories)
2. **One NIK Per Event:** Same NIK cannot hold multiple tickets for the same event (enforced atomically by backend)
3. **Exactly-One-Of NIK:** Each ticket must have exactly one of: nik, saved_nik_id, use_account_nik
4. **Grant Required:** Ticket selection requires valid grant token from queue flow
5. **5-Minute TTL:** Selection must complete within 5 minutes of grant
6. **GH-8 Patterns:** Must follow FakeQueueDataSource patterns for FakeBookingDataSource
7. **Reuse NIK Types:** Must use existing NikInput types from core/domain/booking/nik.types.ts

## Out of Scope

### GH-13 Scope (Payment Flow)

- Payment screen implementation
- VA/GoPay payment method selection
- Payment status polling
- 10-minute payment TTL handling

### GH-14 Scope (Booking Status)

- Booking detail screen
- Booking history/list
- Booking status polling

### GH-15 Scope (E-Ticket)

- E-ticket display
- QR code generation
- Ticket download

### Navigation Integration

- Navigation from Waiting Room to Ticket Selection (deferred with GH-8)
- Navigation from Ticket Selection to Payment (deferred to GH-13)

### Guest Flow Details

- Guest registration/login prompt
- Device ID generation (use fixture value)

### Other Exclusions

- CAPTCHA integration (ticket notes state CAPTCHA is backend-mocked)
- Real /nik/validate API calls beyond fake data source
- Service fee display (backend adds this at booking time)
- Seat assignment display (backend handles seat allocation)
