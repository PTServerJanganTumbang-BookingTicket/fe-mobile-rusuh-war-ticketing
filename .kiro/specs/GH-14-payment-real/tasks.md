# Implementation Plan

## Overview

GH-14 implements the real payment adapter using WebView handoff as specified in ADR-007. Implementation follows the existing GH-13 pattern: domain models (reused) → data layer adapter → presentation layer WebView component.

**Dependency:** GH-13 CLOSED — Payment domain models and `PaymentPort` interface already exist.

**Rule: One task = one commit.**

---

## Task Dependency Graph

```
                    T1 (WebView Dependency)
                           │
                           ▼
                    T2 (RealPaymentAdapter)
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         T3 (URL       T4 (Handoff   T5 (Status
         Validation)   DTOs)         Mapping)
              │            │            │
              └────────────┼────────────┘
                           ▼
                    T6 (PaymentWebView)
                           │
                           ▼
                    T7 (usePaymentWebView)
                           │
                           ▼
                    T8 (GoPay Handler)
                           │
                           ▼
                    T9 (Feature Barrel)
                           │
                           ▼
                    T10 (Unit Tests)
                           │
                           ▼
                    T11 (Integration Tests)
                           │
                           ▼
                    T12 (Verification)
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1"] },
    { "wave": 2, "tasks": ["T2"] },
    { "wave": 3, "tasks": ["T3", "T4", "T5"] },
    { "wave": 4, "tasks": ["T6"] },
    { "wave": 5, "tasks": ["T7"] },
    { "wave": 6, "tasks": ["T8"] },
    { "wave": 7, "tasks": ["T9"] },
    { "wave": 8, "tasks": ["T10"] },
    { "wave": 9, "tasks": ["T11"] },
    { "wave": 10, "tasks": ["T12"] }
  ]
}
```

---

## Tasks

### T1: WebView Dependency Installation

**R-IDs:** R1

**Description:** Install react-native-webview using Expo-compatible installation. Verify platform compatibility and expo-doctor passes.

**Files to create/modify:**

- `package.json` (dependency added)

**Commands:**

```bash
npx expo install react-native-webview
```

**Planned Tests:**

- Import verification: `import WebView from 'react-native-webview'`
- expo-doctor passes (expected: 18/20 with known exceptions)

**Verification Gate:** `npm run typecheck` passes, `npx expo-doctor` passes (18/20)

**Commit:**

```
[GH-14][Rosyid] deps: add react-native-webview
```

---

### T2: RealPaymentAdapter Skeleton

**R-IDs:** R2, R8

**Description:** Create RealPaymentAdapter class skeleton implementing PaymentPort interface. Wire up HTTP client and base URL configuration.

**Files to create/modify:**

- `src/features/payment/data/RealPaymentAdapter.ts`
- `src/features/payment/data/index.ts` (export)

**Planned Tests:**

- Compile-time verification (interface implementation)

**Verification Gate:** `npm run typecheck` passes

**Commit:**

```
[GH-14][Rosyid] feat(payment): add RealPaymentAdapter skeleton
```

---

### T3: Payment URL Validation

**R-IDs:** R3, R10

**Description:** Implement URL validation to ensure payment_url matches expected origin before opening WebView. Reject malicious URLs.

**Files to create/modify:**

- `src/features/payment/data/payment-url.validator.ts`
- `src/features/payment/data/index.ts` (export)
- `__tests__/features/payment/data/payment-url.validator.test.ts`

**Planned Tests:**

- Valid: `https://rush-my-ticket.my.id/m/orders/123/pay#code=hc_abc` → passes
- Invalid: `https://evil.com/m/orders/123/pay#code=hc_abc` → throws
- Invalid: `http://rush-my-ticket.my.id/m/orders/123/pay` (no HTTPS) → throws
- Invalid: `https://rush-my-ticket.my.id/orders/123/pay` (wrong path) → throws
- Edge: `https://rush-my-ticket.my.id.evil.com/...` → throws

**Verification Gate:** `npm test __tests__/features/payment/data/payment-url.validator.test.ts` passes

**Commit:**

```
[GH-14][Rosyid] feat(payment): add payment URL validation
```

---

### T4: Handoff Request DTOs

**R-IDs:** R2

**Description:** Define TypeScript types for handoff request and response. Create mapper functions for API response to domain model.

**Files to create/modify:**

- `src/features/payment/data/dto/handoff.dto.ts`
- `src/features/payment/data/dto/index.ts`

**Planned Tests:**

- Mapper correctly transforms API response to domain model

**Verification Gate:** `npm run typecheck` passes

**Commit:**

```
[GH-14][Rosyid] feat(payment): add handoff DTOs and mappers
```

---

### T5: Status Mapping Utilities

**R-IDs:** R6

**Description:** Implement mapping from booking status to PaymentStatusResult. Handle all status combinations per CONTRACT-BASELINE.md.

**Files to create/modify:**

- `src/features/payment/data/status-mapper.ts`
- `src/features/payment/data/index.ts` (export)
- `__tests__/features/payment/data/status-mapper.test.ts`

**Planned Tests:**

- Booking `PAID` → PaymentStatusResult `PAID`
- Booking `HELD` + payment_status `PENDING` → PaymentStatusResult `PENDING`
- Booking `EXPIRED` → PaymentStatusResult `EXPIRED`
- Booking `HELD` + payment_status `FAILED` → PaymentStatusResult `FAILED` with canRetry

**Verification Gate:** `npm test __tests__/features/payment/data/status-mapper.test.ts` passes

**Commit:**

```
[GH-14][Rosyid] feat(payment): add booking status mapper
```

---

### T6: PaymentWebView Component

**R-IDs:** R4, R5, R10

**Description:** Create PaymentWebView component with security restrictions, message handling, and navigation filtering per ADR-007.

**Files to create/modify:**

- `src/features/payment/presentation/PaymentWebView.tsx`
- `src/features/payment/presentation/index.ts`

**Planned Tests:**

- (Deferred to T11 for integration tests with actual WebView)

**Verification Gate:** `npm run typecheck` passes, `npm run lint` passes

**Commit:**

```
[GH-14][Rosyid] feat(payment): add PaymentWebView component
```

---

### T7: usePaymentWebView Hook

**R-IDs:** R2, R5, R6, R9, R11

**Description:** Create hook to manage WebView payment flow: handoff request, message handling, retry logic, and status verification.

**Files to create/modify:**

- `src/features/payment/presentation/usePaymentWebView.ts`
- `src/features/payment/presentation/index.ts` (export)

**Planned Tests:**

- (Deferred to T11 for integration tests)

**Verification Gate:** `npm run typecheck` passes

**Commit:**

```
[GH-14][Rosyid] feat(payment): add usePaymentWebView hook
```

---

### T8: GoPay External Link Handler

**R-IDs:** R7

**Description:** Implement GoPay deep link handling with Expo Linking. Add AppState listener for foreground return detection.

**Files to create/modify:**

- `src/features/payment/presentation/useGopayHandler.ts`
- `src/features/payment/presentation/index.ts` (export)
- `__tests__/features/payment/presentation/useGopayHandler.test.ts`

**Planned Tests:**

- `gojek.link/...` URL triggers Linking.openURL
- `gopay://...` URL triggers Linking.openURL
- AppState transition to 'active' triggers status check
- Non-GoPay URL does NOT trigger external open

**Verification Gate:** `npm test __tests__/features/payment/presentation/useGopayHandler.test.ts` passes

**Commit:**

```
[GH-14][Rosyid] feat(payment): add GoPay external link handler
```

---

### T9: Feature Barrel Update

**R-IDs:** R8

**Description:** Update feature barrel to export real adapter alongside fake adapter. Ensure clean public API for consumers.

**Files to create/modify:**

- `src/features/payment/index.ts` (add RealPaymentAdapter exports)

**Planned Tests:**

- Export compilation check

**Verification Gate:** `npm run typecheck` passes, `npm run boundary-check` passes

**Commit:**

```
[GH-14][Rosyid] feat(payment): export RealPaymentAdapter
```

---

### T10: Unit Tests

**R-IDs:** R2, R3, R6, R12

**Description:** Add unit tests for RealPaymentAdapter methods with mocked HTTP client. Cover handoff, validation, and status mapping.

**Files to create/modify:**

- `__tests__/features/payment/data/RealPaymentAdapter.test.ts`

**Planned Tests:**

- requestHandoff success → returns HandoffResponse
- requestHandoff 401 → throws GRANT_EXPIRED
- requestHandoff 409 → throws BOOKING_NOT_PAYABLE
- getPaymentStatus PAID → maps correctly
- getPaymentStatus HELD/PENDING → maps correctly
- initiatePayment → calls requestHandoff internally
- retryPayment → calls requestHandoff

**Verification Gate:** `npm test __tests__/features/payment/data/RealPaymentAdapter.test.ts` passes

**Commit:**

```
[GH-14][Rosyid] test(payment): add RealPaymentAdapter unit tests
```

---

### T11: Integration Tests

**R-IDs:** R4, R5, R7, R12

**Description:** Add integration tests for WebView component and hook. Test message handling, navigation filtering, and GoPay flow.

**Files to create/modify:**

- `__tests__/features/payment/presentation/PaymentWebView.test.tsx`
- `__tests__/features/payment/presentation/usePaymentWebView.test.ts`

**Planned Tests:**

- PaymentWebView renders with correct props
- PaymentWebView blocks navigation to external origin
- PaymentWebView allows GoPay link via Linking
- onMessage PAYMENT_DONE triggers callback
- onMessage HANDOFF_EXPIRED triggers retry
- usePaymentWebView requestHandoff sets paymentUrl
- usePaymentWebView handleHandoffExpired retries (max 3)
- usePaymentWebView verifies status on close

**Verification Gate:** `npm test __tests__/features/payment/presentation/` passes

**Commit:**

```
[GH-14][Rosyid] test(payment): add WebView integration tests
```

---

### T12: Full Verification and Cleanup

**R-IDs:** R11, R12

**Description:** Run all verification gates, ensure no regressions. Verify boundary-check passes with new exports.

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
5. `npx expo-doctor` — passes (18/20 with known exceptions)
6. `npx expo export` — builds successfully

**Commit:**

```
[GH-14][Rosyid] chore(payment): verify all gates pass
```

---

## Task Summary Table

| Task | R-IDs               | Files                      | Verification    | Commit                                             |
| ---- | ------------------- | -------------------------- | --------------- | -------------------------------------------------- |
| T1   | R1                  | package.json               | expo-doctor     | `deps: add react-native-webview`                   |
| T2   | R2, R8              | RealPaymentAdapter.ts      | typecheck       | `feat(payment): add RealPaymentAdapter skeleton`   |
| T3   | R3, R10             | payment-url.validator.ts   | unit tests      | `feat(payment): add payment URL validation`        |
| T4   | R2                  | handoff.dto.ts             | typecheck       | `feat(payment): add handoff DTOs and mappers`      |
| T5   | R6                  | status-mapper.ts           | unit tests      | `feat(payment): add booking status mapper`         |
| T6   | R4, R5, R10         | PaymentWebView.tsx         | typecheck, lint | `feat(payment): add PaymentWebView component`      |
| T7   | R2, R5, R6, R9, R11 | usePaymentWebView.ts       | typecheck       | `feat(payment): add usePaymentWebView hook`        |
| T8   | R7                  | useGopayHandler.ts         | unit tests      | `feat(payment): add GoPay external link handler`   |
| T9   | R8                  | index.ts                   | boundary-check  | `feat(payment): export RealPaymentAdapter`         |
| T10  | R2, R3, R6, R12     | RealPaymentAdapter.test.ts | test pass       | `test(payment): add RealPaymentAdapter unit tests` |
| T11  | R4, R5, R7, R12     | PaymentWebView.test.tsx    | test pass       | `test(payment): add WebView integration tests`     |
| T12  | R11, R12            | —                          | all 6 gates     | `chore(payment): verify all gates pass`            |

---

## Notes

1. **ADR-007 Compliance:** All implementation must strictly follow ADR-007 specification. The WebView opens the payment_url from backend response — mobile does not construct URLs.

2. **No Native Payment SDK:** This implementation uses WebView only. Native GoPay SDK or bank SDKs are out of scope.

3. **60-Second Window:** Handoff code expires in 60 seconds. Implementation MUST request handoff and open WebView immediately — no user-facing delay.

4. **postMessage is a Signal:** The authoritative source of truth is `GET /bookings/{booking_id}`. WebView messages trigger verification, not state changes.

5. **GoPay Return:** User returns manually via app switcher. No deep link callback. AppState listener detects foreground return.

6. **Adapter Swappability:** `RealPaymentAdapter` and `FakePaymentAdapter` are interchangeable via dependency injection. Tests use fake, production uses real.

7. **Security First:** URL validation, origin whitelist, and message origin check are critical security controls. Failing any of these blocks the payment flow.

8. **Error Messages:** User-facing errors follow the pattern in R11. Technical details logged internally but not shown to users.
