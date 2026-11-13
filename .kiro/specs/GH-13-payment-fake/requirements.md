# Requirements Document

## Introduction

GH-13 Payment Port Fake implements the payment flow boundary for the Rusuh Booking Tiket mobile app using a fake adapter. This ticket models the payment port interface without committing to any production architecture (WebView, native API, or other mechanism).

The implementation enables end-to-end flow testing from ticket selection through payment completion while maintaining architecture neutrality per `docs/CONTRACT-BASELINE.md` §5.

**Critical Constraint:** ADR-0008 (WebView handoff) is PROPOSED, not confirmed. This implementation MUST NOT encode any production mechanism assumptions.

## Glossary

| Term                | Definition                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Payment Port        | Architecture-neutral interface defining payment operations (initiate, poll, retry) without specifying implementation mechanism |
| Fake Adapter        | Implementation of payment port that simulates backend responses locally without real HTTP calls                                |
| Payment Method      | Type of payment: `bank_transfer` (VA) or `gopay` (QR/deeplink)                                                                 |
| Bank Code           | Bank identifier for VA payments: `bca`, `bni`, `bri`, `cimb`                                                                   |
| Payment Instruction | Instructions returned after payment initiation (VA number or QR URL)                                                           |
| TTL                 | Time-to-live for payment window: 10 minutes from `held_at` timestamp                                                           |
| held_at             | Anchor timestamp when payment was initiated (booking moved to HELD status)                                                     |
| Terminal State      | Final payment status that stops polling: `PAID`, `FAILED`, `EXPIRED`                                                           |
| Scenario            | Configurable fake behavior pattern (success, failure, timeout, cancelled)                                                      |

## Requirements

### Functional Requirements

#### R1: Payment Port Interface

**Description:** Define an architecture-neutral port interface that abstracts payment operations without committing to WebView, native API, or any specific production mechanism.

**Acceptance Criteria:**

- R1-AC1: Port interface defines `getAvailableMethods(bookingId: string): Promise<AvailableMethod[]>` returning enabled payment methods
- R1-AC2: Port interface defines `initiatePayment(bookingId: string, method: PaymentMethod, bank?: BankCode): Promise<PaymentInitiation>` returning payment instructions
- R1-AC3: Port interface defines `getPaymentStatus(bookingId: string): Promise<PaymentStatus>` for polling current status
- R1-AC4: Port interface defines `retryPayment(bookingId: string): Promise<void>` to cancel pending payment and allow method switch
- R1-AC5: Interface resides in `features/payment/domain/` with no React or React Native dependencies
- R1-AC6: Interface does NOT reference WebView, native Linking, or any implementation-specific types

#### R2: Fake Payment Adapter

**Description:** Implement a fake adapter that satisfies the payment port interface, simulating backend behavior locally without real HTTP calls.

**Acceptance Criteria:**

- R2-AC1: Fake adapter implements all methods defined in payment port interface
- R2-AC2: Adapter returns deterministic responses based on configured scenario
- R2-AC3: Adapter maintains in-memory state for payment status transitions
- R2-AC4: Adapter simulates realistic response delays (configurable, default immediate for tests)
- R2-AC5: Adapter resides in `features/payment/data/` directory

#### R3: Payment Method Selection

**Description:** Support selection of available payment methods with proper validation.

**Acceptance Criteria:**

- R3-AC1: `getAvailableMethods` returns `bank_transfer` with banks `bca`, `bni`, `bri`, `cimb`
- R3-AC2: `getAvailableMethods` returns `gopay` as e-wallet option
- R3-AC3: Each method includes `id`, `name`, `description`, `icon_url`, `enabled` fields
- R3-AC4: `bank_transfer` method includes `banks` array with bank details
- R3-AC5: Disabled methods (circuit breaker open) return `enabled: false`

#### R4: Payment Initiation

**Description:** Initiate payment and return appropriate instructions based on selected method.

**Acceptance Criteria:**

- R4-AC1: For `bank_transfer`, response includes `va_number` and `bank` in instructions
- R4-AC2: For `gopay`, response includes `qr_url` and `deeplink_url` in instructions
- R4-AC3: Response includes `payment_id` in format `{booking_id}:{attempt_number}`
- R4-AC4: Response includes `ttl.expires_at` (ISO 8601) and `ttl.server_time`
- R4-AC5: Calling initiate twice with same booking returns same instructions (idempotent)
- R4-AC6: Response includes initial `status: "PENDING"`

#### R5: Payment Status Polling

**Description:** Poll payment status with appropriate state transitions based on scenario.

**Acceptance Criteria:**

- R5-AC1: `PENDING` status includes `expires_at` and `server_time`
- R5-AC2: `PAID` status includes `paid_at` timestamp and `redirect_url`
- R5-AC3: `FAILED` status includes `reason`, `can_retry`, `attempt`, `payment_expires_at`
- R5-AC4: `EXPIRED` status includes `expired_at` timestamp
- R5-AC5: Polling stops automatically when terminal state reached (`PAID`, `FAILED`, `EXPIRED`)

#### R6: Payment Scenarios

**Description:** Support configurable scenarios for testing different payment outcomes.

**Acceptance Criteria:**

- R6-AC1: `payment-success` scenario transitions `PENDING` → `PAID` after configurable delay
- R6-AC2: `payment-failure` scenario transitions `PENDING` → `FAILED` with `can_retry: true`
- R6-AC3: `payment-timeout` scenario transitions `PENDING` → `EXPIRED` after TTL (10 minutes or test-configured)
- R6-AC4: `payment-cancelled` scenario simulates user-initiated cancellation
- R6-AC5: Scenario is selectable per fake adapter instance or via constructor parameter
- R6-AC6: Default scenario for tests is `payment-success` with immediate transition

#### R7: TTL Countdown Display

**Description:** Support countdown timer calculation for 10-minute payment window.

**Acceptance Criteria:**

- R7-AC1: TTL is anchored to `held_at` timestamp, not request time
- R7-AC2: TTL is 10 minutes (600 seconds) as per BR-05
- R7-AC3: TTL does NOT reset on method switch or retry
- R7-AC4: Domain provides `remainingMs(expiresAt, clientNow, offsetMs)` calculation
- R7-AC5: Domain provides `serverOffsetMs(serverTime, responseReceivedAt)` for clock drift
- R7-AC6: Countdown recalculates from clock (not decrement) to survive app backgrounding

#### R8: Retry and Method Switch

**Description:** Support cancelling pending payment to switch to different method.

**Acceptance Criteria:**

- R8-AC1: `retryPayment` cancels current pending payment
- R8-AC2: After retry, `initiatePayment` can be called with different method
- R8-AC3: Retry increments `attempt_number` in subsequent `payment_id`
- R8-AC4: Maximum 5 payment attempts per booking (MAX_PAYMENT_ATTEMPTS)
- R8-AC5: Retry is NOT allowed if payment already settled (`PAYMENT_ALREADY_SETTLED` error)
- R8-AC6: Retry is NOT allowed if TTL expired (`PAYMENT_WINDOW_CLOSED` error)

### Non-Functional Requirements

#### R9: Performance

**Description:** Fake adapter provides immediate responses suitable for testing.

**Acceptance Criteria:**

- R9-AC1: All fake adapter methods resolve within 10ms in test mode
- R9-AC2: Configurable delays available for simulating realistic network latency
- R9-AC3: Status polling with 3-second interval does not cause memory leaks

#### R10: Testability

**Description:** Fake adapter enables deterministic unit and integration testing.

**Acceptance Criteria:**

- R10-AC1: Fake adapter can be instantiated with specific scenario
- R10-AC2: Fake adapter state can be inspected for test assertions
- R10-AC3: Fake adapter can be reset between test cases
- R10-AC4: Time-dependent tests can inject mock clock

## Constraints

1. **Architecture Neutrality:** Implementation MUST NOT commit to WebView, native API, or any specific production mechanism. The port interface defines WHAT operations exist, not HOW they execute.

2. **No Real HTTP:** Fake adapter MUST NOT make real HTTP calls. All responses are local simulations.

3. **Clean Architecture:** Domain layer (`features/payment/domain/`) MUST have no React/RN dependencies. Data layer implements the port interface.

4. **Contract Alignment:** Response shapes MUST match backend contract defined in `docs/CONTRACT-BASELINE.md` §5 Payment endpoints.

5. **ADR-0008 Status:** WebView handoff (ADR-0008) is PROPOSED, not confirmed. Do not encode it as the production mechanism.

## Out of Scope

1. **Real Backend Integration:** This ticket uses fake adapter only; real payment API integration is a separate ticket.

2. **WebView Implementation:** No WebView component or handoff mechanism in this ticket.

3. **Native Payment SDK:** No integration with native payment SDKs (GoPay SDK, etc.).

4. **Webhook Handling:** Backend webhook processing is not modeled; fake adapter simulates final states directly.

5. **Payment UI Components:** Screen components and UI are separate implementation work.

6. **Deep Link Handling:** Opening GoPay app via `deeplink_url` is not implemented; port returns the URL, consumer decides how to use it.

7. **QR Code Rendering:** Displaying `qr_url` as QR image is not in scope; port returns the URL only.

8. **Clipboard Operations:** Copying VA number to clipboard is UI-layer concern, not port interface.
