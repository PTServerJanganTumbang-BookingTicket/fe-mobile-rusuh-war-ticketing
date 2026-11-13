# Implementation Plan

## Overview

GH-13 implements the Payment Port interface with a deterministic fake adapter for the Rusuh Booking Tiket mobile app. Implementation follows Clean Architecture: domain models → port interface → fake adapter → tests. The implementation is architecture-neutral per ADR-0008 (WebView handoff is PROPOSED, not confirmed).

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
                    T1 (Domain Models)
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         T2 (Port)   T3 (Rules)   T4 (TTL Utils)
              │          │          │
              └──────────┼──────────┘
                         ▼
                 T5 (Fake Adapter)
                         │
                         ▼
                 T6 (Scenario Config)
                         │
                         ▼
                 T7 (Feature Barrel)
                         │
                         ▼
                 T8 (Adapter Tests)
                         │
                         ▼
                 T9 (Verification)
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1"] },
    { "wave": 2, "tasks": ["T2", "T3", "T4"] },
    { "wave": 3, "tasks": ["T5"] },
    { "wave": 4, "tasks": ["T6"] },
    { "wave": 5, "tasks": ["T7"] },
    { "wave": 6, "tasks": ["T8"] },
    { "wave": 7, "tasks": ["T9"] }
  ]
}
```

---

## Tasks

### T1: Payment Domain Models

**R-IDs:** R1, R3, R4, R5

**Description:** Create Payment feature folder structure and define domain models: PaymentMethod, BankCode, PaymentStatus, PaymentInstruction, AvailableMethod, PaymentInitiation, PaymentStatusResult. Types must be pure TypeScript with no React dependencies.

**Files to create/modify:**

- `src/features/payment/domain/payment-method.types.ts`
- `src/features/payment/domain/payment-status.types.ts`
- `src/features/payment/domain/payment-instruction.types.ts`
- `src/features/payment/domain/index.ts`
- `__tests__/features/payment/domain/payment-types.test.ts`

**Planned Tests:**

- Unit: PaymentMethod enum values (`bank_transfer`, `gopay`)
- Unit: BankCode enum values (`bca`, `bni`, `bri`, `cimb`)
- Unit: PaymentStatus enum values (`PENDING`, `PAID`, `FAILED`, `EXPIRED`)
- Unit: PaymentInstruction discriminated union (VA vs GoPay)
- Unit: AvailableMethod includes banks for bank_transfer
- Unit: PaymentInitiation includes payment_id format

**Verification Gate:** `npm run typecheck` passes, `npm test` passes for new tests, `npm run boundary-check` passes

**Commit:**

```
[GH-13][Rosyid] feat(payment): add Payment domain models
```

---

### T2: Payment Port Interface

**R-IDs:** R1

**Description:** Define the architecture-neutral PaymentPort protocol that abstracts payment operations without committing to WebView, native API, or any specific production mechanism. Interface defines WHAT operations exist, not HOW they execute.

**Files to create/modify:**

- `src/features/payment/domain/payment.port.ts`
- `src/features/payment/domain/index.ts` (export)

**Planned Tests:**

- Compile-time verification only (interface has no implementation)

**Verification Gate:** `npm run typecheck` passes, `npm run boundary-check` passes

**Commit:**

```
[GH-13][Rosyid] feat(payment): add PaymentPort interface
```

---

### T3: Payment Domain Rules

**R-IDs:** R5, R8

**Description:** Implement pure domain rule functions: `isTerminalStatus(status)`, `canRetryPayment(status, attempt, maxAttempts)`, `hasTimeForRetry(remainingMs, minRetryMs)`. Rules encode business logic without framework dependencies.

**Files to create/modify:**

- `src/features/payment/domain/payment.rules.ts`
- `src/features/payment/domain/index.ts` (export)
- `__tests__/features/payment/domain/payment-rules.test.ts`

**Planned Tests:**

- Unit: isTerminalStatus(`PENDING`) = false
- Unit: isTerminalStatus(`PAID`) = true
- Unit: isTerminalStatus(`FAILED`) = true
- Unit: isTerminalStatus(`EXPIRED`) = true
- Unit: canRetryPayment with attempt < max = true
- Unit: canRetryPayment with attempt >= max = false
- Unit: canRetryPayment with terminal status = false
- Unit: hasTimeForRetry with sufficient time = true
- Unit: hasTimeForRetry with insufficient time = false

**Verification Gate:** `npm test __tests__/features/payment/domain/payment-rules.test.ts` passes

**Commit:**

```
[GH-13][Rosyid] feat(payment): add payment domain rules
```

---

### T4: TTL Calculation Utilities

**R-IDs:** R7

**Description:** Implement TTL countdown utilities: `remainingMs(expiresAt, clientNow, offsetMs)` for countdown calculation, `serverOffsetMs(serverTime, responseReceivedAt)` for clock drift correction. Calculations recalculate from timestamp (not decrement) to survive app backgrounding.

**Files to create/modify:**

- `src/features/payment/domain/payment-ttl.utils.ts`
- `src/features/payment/domain/index.ts` (export)
- `__tests__/features/payment/domain/payment-ttl.test.ts`

**Planned Tests:**

- Unit: remainingMs returns positive value when not expired
- Unit: remainingMs returns 0 when expired
- Unit: remainingMs applies offset correctly
- Unit: serverOffsetMs calculates positive drift
- Unit: serverOffsetMs calculates negative drift
- Unit: serverOffsetMs handles equal times (0 offset)

**Verification Gate:** `npm test __tests__/features/payment/domain/payment-ttl.test.ts` passes

**Commit:**

```
[GH-13][Rosyid] feat(payment): add TTL calculation utilities
```

---

### T5: Fake Payment Adapter Implementation

**R-IDs:** R2, R6

**Description:** Implement FakePaymentAdapter class that satisfies the PaymentPort interface. Returns deterministic responses based on configured scenario. Maintains in-memory state for payment status transitions. Supports scenario injection via constructor.

**Files to create/modify:**

- `src/features/payment/data/FakePaymentAdapter.ts`
- `src/features/payment/data/index.ts`

**Planned Tests:**

- (Deferred to T8 for comprehensive scenario testing)

**Verification Gate:** `npm run typecheck` passes, `npm run boundary-check` passes

**Commit:**

```
[GH-13][Rosyid] feat(payment): implement FakePaymentAdapter
```

---

### T6: Payment Scenario Configuration

**R-IDs:** R6, R9, R10

**Description:** Create configurable scenario system for fake adapter: `payment-success` (PENDING→PAID), `payment-failure` (PENDING→FAILED with can_retry), `payment-timeout` (PENDING→EXPIRED), `payment-cancelled`. Scenarios support configurable delays (immediate for tests, realistic for manual testing).

**Files to create/modify:**

- `src/features/payment/data/scenarios/payment.scenarios.ts`
- `src/features/payment/data/scenarios/index.ts`
- `__tests__/features/payment/data/scenarios/payment-scenarios.test.ts`

**Planned Tests:**

- Unit: SCENARIO_PAYMENT_SUCCESS has correct structure
- Unit: SCENARIO_PAYMENT_FAILURE includes can_retry: true
- Unit: SCENARIO_PAYMENT_TIMEOUT respects TTL
- Unit: SCENARIO_PAYMENT_CANCELLED has cancelled state
- Unit: Scenarios support delay configuration
- Unit: Default scenario for tests is immediate

**Verification Gate:** `npm test __tests__/features/payment/data/scenarios/payment-scenarios.test.ts` passes

**Commit:**

```
[GH-13][Rosyid] feat(payment): add payment scenario configuration
```

---

### T7: Payment Feature Barrel Export

**R-IDs:** R1

**Description:** Create feature barrel index.ts exporting public API. Export types, port interface, fake adapter, rules, and TTL utilities. Follow Clean Architecture boundary rules.

**Files to create/modify:**

- `src/features/payment/index.ts`

**Planned Tests:**

- Verify exports compile and are accessible from outside feature

**Verification Gate:** `npm run typecheck` passes, `npm run boundary-check` passes

**Commit:**

```
[GH-13][Rosyid] feat(payment): add feature barrel exports
```

---

### T8: Fake Adapter Unit Tests

**R-IDs:** R2, R4, R5, R6, R9, R10

**Description:** Add comprehensive unit tests for FakePaymentAdapter covering all scenarios: success flow, failure with retry, timeout/expiry, method switching. Verify idempotency, state inspection, and reset capability.

**Files to create/modify:**

- `__tests__/features/payment/data/FakePaymentAdapter.test.ts`

**Planned Tests:**

- Integration: getAvailableMethods returns bank_transfer with 4 banks
- Integration: getAvailableMethods returns gopay
- Integration: initiatePayment for bank_transfer returns VA instructions
- Integration: initiatePayment for gopay returns QR + deeplink
- Integration: initiatePayment is idempotent (same booking returns same instructions)
- Integration: getPaymentStatus returns PENDING initially
- Integration: payment-success scenario transitions to PAID
- Integration: payment-failure scenario transitions to FAILED with can_retry
- Integration: payment-timeout scenario transitions to EXPIRED
- Integration: retryPayment increments attempt_number
- Integration: retryPayment fails after max attempts (5)
- Integration: retryPayment fails if already settled
- Integration: adapter state can be inspected for assertions
- Integration: adapter can be reset between tests
- Integration: all methods resolve within 10ms in test mode

**Verification Gate:** `npm test __tests__/features/payment/data/FakePaymentAdapter.test.ts` passes

**Commit:**

```
[GH-13][Rosyid] test(payment): add FakePaymentAdapter unit tests
```

---

### T9: Full Verification and Cleanup

**R-IDs:** R9, R10

**Description:** Run all verification gates, ensure no regressions, verify architecture boundaries. Confirm no React/RN dependencies in domain layer. Document any deferred items.

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
5. `npx expo-doctor` — passes (with known exceptions)
6. `npx expo export` — builds successfully

**Commit:**

```
[GH-13][Rosyid] chore(payment): verify all gates pass
```

---

## Task Summary Table

| Task | R-IDs         | Files                    | Verification     | Commit                                         |
| ---- | ------------- | ------------------------ | ---------------- | ---------------------------------------------- |
| T1   | R1,R3,R4,R5   | domain models            | typecheck, tests | `feat(payment): add Payment domain models`     |
| T2   | R1            | payment.port.ts          | typecheck        | `feat(payment): add PaymentPort interface`     |
| T3   | R5,R8         | payment.rules.ts         | unit tests       | `feat(payment): add payment domain rules`      |
| T4   | R7            | payment-ttl.utils.ts     | unit tests       | `feat(payment): add TTL calculation utilities` |
| T5   | R2,R6         | FakePaymentAdapter.ts    | typecheck        | `feat(payment): implement FakePaymentAdapter`  |
| T6   | R6,R9,R10     | payment.scenarios.ts     | unit tests       | `feat(payment): add payment scenario config`   |
| T7   | R1            | index.ts barrel          | boundary-check   | `feat(payment): add feature barrel exports`    |
| T8   | R2,R4-6,R9-10 | FakePaymentAdapter tests | test pass        | `test(payment): add FakePaymentAdapter tests`  |
| T9   | R9,R10        | —                        | all 6 gates      | `chore(payment): verify all gates pass`        |

---

## Notes

1. **Architecture Neutrality:** The PaymentPort interface defines WHAT operations exist without encoding HOW they execute. ADR-0008 (WebView handoff) is PROPOSED; this implementation does not commit to it.

2. **No HTTP Calls:** FakePaymentAdapter simulates all responses locally. Real backend integration is a separate ticket.

3. **TTL Anchoring:** TTL is anchored to `held_at` timestamp per BR-05. Method switch does NOT reset TTL.

4. **Constants:** Use `MAX_PAYMENT_ATTEMPTS = 5`, `PAYMENT_TTL_SECONDS = 600`, `MIN_RETRY_REMAINING_SECONDS = 60`.

5. **Fake Timers:** Tests in T8 should use `jest.useFakeTimers()` for deterministic timing when testing delays.

6. **Domain Portability:** Domain layer (`features/payment/domain/`) reuses patterns from web's `modules/payment/domain/` but adapted for mobile conventions.

7. **Out of Scope:** UI components, hooks, WebView implementation, clipboard, QR rendering, and deep linking are NOT in this ticket's scope.
