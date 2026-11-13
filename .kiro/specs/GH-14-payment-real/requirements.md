# Requirements Document

## Introduction

GH-14 Payment WebView Real Backend implements the real payment adapter using WebView handoff as specified in ADR-007. This ticket replaces the fake adapter (GH-13) with a production-ready implementation that:

1. Requests a handoff code from the backend (`POST /payments/{booking_id}/handoff`)
2. Opens a secured WebView to the payment web app
3. Handles postMessage events from the WebView
4. Verifies final payment status with the backend

**Dependencies:**

- GH-13 (CLOSED) — Payment Port interface and domain models exist
- ADR-007 — WebView handoff architecture approved

**References:**

- `/Users/mochamadrih/Documents/Telkomsel/2026H2/SemestralAssessment/documentations/adr/ADR-007-mobile-webview-payment-handoff.md`
- `docs/CONTRACT-BASELINE.md` §5 Payment endpoints

---

## Glossary

| Term              | Definition                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Handoff Code      | One-time 256-bit token (`hc_...`) valid for 60 seconds, authorizes WebView to exchange for payment session |
| Payment Session   | 256-bit token (`ps_...`) returned by exchange endpoint, used as `X-Payment-Session` header                 |
| Payment URL       | Backend-constructed URL: `{PAYMENT_WEB_URL}/m/orders/{booking_id}/pay#code={handoff_code}`                 |
| postMessage       | WebView-to-native communication via `window.ReactNativeWebView.postMessage()`                              |
| Origin Whitelist  | Allowed URL origin for WebView: `https://rush-my-ticket.my.id`                                             |
| Handoff Endpoint  | `POST /payments/{booking_id}/handoff` — returns handoff_code and payment_url                               |
| Exchange Endpoint | `POST /payments/handoff/exchange` — exchanges code for payment_session                                     |

---

## Requirements

### Functional Requirements

#### R1: WebView Dependency

**Description:** Install and configure react-native-webview for payment handoff.

**Acceptance Criteria:**

- R1-AC1: `react-native-webview` installed via `npx expo install`
- R1-AC2: WebView component importable from `react-native-webview`
- R1-AC3: iOS and Android platform configurations verified via expo-doctor
- R1-AC4: No native rebuild required (Expo-compatible version)

---

#### R2: Handoff Request

**Description:** Implement handoff code request to authorize WebView payment session.

**Acceptance Criteria:**

- R2-AC1: `RealPaymentAdapter.requestHandoff(bookingId)` calls `POST /payments/{booking_id}/handoff`
- R2-AC2: Request includes current grant headers (`X-Grant-Token` + `X-Device-Id` OR `Authorization: Bearer`)
- R2-AC3: Response parsed as `{ handoff_code: string, payment_url: string, expires_at: string }`
- R2-AC4: Handoff code stored in memory only (never persisted)
- R2-AC5: Error `401 GRANT_TOKEN_INVALID` surfaces as `PaymentError.GRANT_EXPIRED`
- R2-AC6: Error `409 BOOKING_STATUS_INVALID` surfaces as `PaymentError.BOOKING_NOT_PAYABLE`

---

#### R3: Payment URL Validation

**Description:** Validate payment_url before opening WebView to prevent malicious redirects.

**Acceptance Criteria:**

- R3-AC1: URL MUST start with `https://rush-my-ticket.my.id/m/orders/`
- R3-AC2: URL MUST NOT contain credentials in path or query (except `#code` fragment)
- R3-AC3: Invalid URL throws `PaymentError.INVALID_PAYMENT_URL` — do not open WebView
- R3-AC4: Validation is synchronous and runs before any WebView navigation
- R3-AC5: Validation logs warning (not error) when URL passes but differs from expected pattern

---

#### R4: WebView Security Configuration

**Description:** Configure WebView with security restrictions per ADR-007 §9.

**Acceptance Criteria:**

- R4-AC1: `originWhitelist={['https://rush-my-ticket.my.id']}`
- R4-AC2: `onShouldStartLoadWithRequest` intercepts all navigation requests
- R4-AC3: Navigation to `gojek.link/*` or `gopay://*` opens via `Linking.openURL()` and returns `false`
- R4-AC4: Navigation to any other external host returns `false` (blocked)
- R4-AC5: `setSupportMultipleWindows={false}` prevents popup windows
- R4-AC6: `allowFileAccess={false}` prevents file:// access
- R4-AC7: `javaScriptEnabled={true}` for payment page functionality
- R4-AC8: `incognito={true}` or `sharedCookiesEnabled={false}` to isolate cookies

---

#### R5: WebView Event Handling

**Description:** Handle postMessage events from WebView per ADR-007 message table.

**Acceptance Criteria:**

- R5-AC1: `onMessage` handler validates `nativeEvent.url` starts with `https://rush-my-ticket.my.id`
- R5-AC2: Messages from other origins are silently ignored (do not log secrets)
- R5-AC3: Message payload parsed as JSON: `{ type: string, booking_id: string }`
- R5-AC4: Event `PAYMENT_DONE` triggers WebView close and status verification
- R5-AC5: Event `PAYMENT_EXPIRED` triggers WebView close and expiry handling
- R5-AC6: Event `HANDOFF_EXPIRED` triggers new handoff request and WebView reload
- R5-AC7: Event `CLOSE` triggers WebView close and status verification
- R5-AC8: Unknown event types are logged and ignored

---

#### R6: Status Verification

**Description:** After WebView closes, verify final status with backend.

**Acceptance Criteria:**

- R6-AC1: `GET /bookings/{booking_id}` called with current grant headers
- R6-AC2: Response status determines next screen: `PAID` → e-ticket, `EXPIRED` → expiry screen
- R6-AC3: Status `HELD` with `payment_status: PENDING` returns to WebView (payment in progress)
- R6-AC4: Status verification is authoritative — postMessage is just a signal
- R6-AC5: Network error during verification shows retry option, not assumed state

---

#### R7: GoPay External Link Handling

**Description:** Handle GoPay deep links that navigate outside the WebView.

**Acceptance Criteria:**

- R7-AC1: Links matching `gojek.link/*` open via `Linking.openURL()`
- R7-AC2: Links matching `gopay://*` open via `Linking.openURL()`
- R7-AC3: WebView remains open in background while GoPay app is active
- R7-AC4: `AppState` listener detects app foreground return
- R7-AC5: On foreground return, `GET /bookings/{booking_id}` verifies status
- R7-AC6: If status is `PAID`, close WebView and show e-ticket
- R7-AC7: If status is `HELD`, WebView remains and polling continues

---

#### R8: Real Payment Adapter

**Description:** Implement RealPaymentAdapter that satisfies PaymentPort interface.

**Acceptance Criteria:**

- R8-AC1: `RealPaymentAdapter` implements `PaymentPort` interface from GH-13
- R8-AC2: `getAvailableMethods()` calls `GET /payments/methods` (or returns hardcoded POC methods)
- R8-AC3: `initiatePayment()` delegates to `requestHandoff()` + WebView flow
- R8-AC4: `getPaymentStatus()` calls `GET /bookings/{booking_id}` and maps to `PaymentStatusResult`
- R8-AC5: `retryPayment()` requests new handoff code and reloads WebView
- R8-AC6: Adapter is swappable with `FakePaymentAdapter` via dependency injection

---

#### R9: Handoff Retry Logic

**Description:** Handle `HANDOFF_EXPIRED` by requesting a new code.

**Acceptance Criteria:**

- R9-AC1: On `HANDOFF_EXPIRED`, call `POST /payments/{booking_id}/handoff` again
- R9-AC2: If handoff succeeds, reload WebView with new `payment_url`
- R9-AC3: If handoff fails with `401 GRANT_TOKEN_INVALID`, booking has expired — close WebView
- R9-AC4: Maximum 3 handoff retries per payment session
- R9-AC5: Exponential backoff: 0s, 1s, 2s between retries

---

### Non-Functional Requirements

#### R10: Security

**Description:** Ensure no credentials leak and WebView is sandboxed.

**Acceptance Criteria:**

- R10-AC1: Handoff code never logged or persisted
- R10-AC2: Grant headers not passed to WebView (only handoff code in URL fragment)
- R10-AC3: WebView cannot access app's secure storage
- R10-AC4: postMessage origin validated before processing
- R10-AC5: URL fragment (`#code`) not sent to server (browser behavior)

---

#### R11: Error Handling

**Description:** Surface meaningful errors to user.

**Acceptance Criteria:**

- R11-AC1: Network errors show "Connection failed" with retry option
- R11-AC2: `GRANT_TOKEN_INVALID` shows "Session expired" with re-auth option
- R11-AC3: `BOOKING_STATUS_INVALID` shows appropriate booking state message
- R11-AC4: WebView load failure shows "Payment page unavailable" with retry
- R11-AC5: Timeout (60s handoff, 30s WebView load) shows "Taking too long" with retry

---

#### R12: Testability

**Description:** Real adapter supports testing without live backend.

**Acceptance Criteria:**

- R12-AC1: `RealPaymentAdapter` accepts `baseUrl` parameter for test environment
- R12-AC2: `RealPaymentAdapter` accepts mock HTTP client for unit tests
- R12-AC3: WebView component accepts `testID` for E2E automation
- R12-AC4: postMessage events can be simulated in integration tests

---

## Constraints

1. **ADR-007 Compliance:** All behavior must match ADR-007 specification exactly.

2. **WebView Only:** No native payment SDK integration — all payment UI is in WebView.

3. **60-Second Code Window:** Handoff code expires in 60 seconds — request and open immediately.

4. **No Deep Link Callback:** GoPay does not call back to app — user returns manually via app switcher.

5. **Single Browser Tab:** WebView `setSupportMultipleWindows={false}` — no popups.

6. **Domain Lock:** Only `https://rush-my-ticket.my.id` origin allowed in WebView.

---

## Out of Scope

1. **Backend Deployment:** This ticket assumes backend endpoints are deployed and accessible.

2. **Web Payment Page:** The `/m/orders/[orderId]/pay` web route is owned by fe-web team.

3. **E-Ticket Display:** Post-payment e-ticket screen is GH-15.

4. **Magic Link Auth:** Authentication flow is GH-6/GH-7.

5. **Payment UI Design:** This ticket implements the WebView container, not payment method selection UI.

6. **Offline Mode:** No offline payment capability.

7. **Payment Analytics:** Tracking and metrics are a separate concern.
