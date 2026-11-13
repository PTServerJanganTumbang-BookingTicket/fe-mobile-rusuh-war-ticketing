# Design — GH-13 Payment Port Fake

## Overview

GH-13 implements the Payment Port interface with a deterministic fake adapter for the Rusuh Booking Tiket mobile app. The design follows Clean Architecture principles and maintains strict **architecture neutrality** — the port interface defines WHAT payment operations exist without committing to HOW they execute (WebView, native API, or other mechanism).

**Critical Constraint:** ADR-0008 (WebView payment handoff) is PROPOSED, not confirmed. This implementation intentionally defers the production mechanism decision while enabling end-to-end flow testing from ticket selection through payment completion.

The design reuses patterns from the web frontend's `modules/payment/domain/` (OrderProtocol, domain rules, TTL utilities) adapted for mobile conventions, following the established `FakeQueueDataSource` pattern from GH-8.

---

## Architecture

### Domain Layer

The domain layer contains pure TypeScript models, the port interface, business rules, and TTL calculation utilities. **Zero React or React Native dependencies.**

**Domain Models:**

- `PaymentMethod` — Payment type discriminator (`bank_transfer`, `gopay`)
- `BankCode` — Supported bank identifiers (`bca`, `bni`, `bri`, `cimb`)
- `PaymentStatus` — Status state machine (`PENDING`, `PAID`, `FAILED`, `EXPIRED`)
- `PaymentInstruction` — Discriminated union for VA or GoPay instructions
- `AvailableMethod` — Method metadata with enabled flag and bank list
- `PaymentInitiation` — Response from initiate operation
- `PaymentStatusResult` — Polling response with status-specific fields

**Domain Rules:**

- `isTerminalStatus(status)` — Determines if polling should stop
- `canRetryPayment(status, attempt, maxAttempts)` — Retry eligibility
- `hasTimeForRetry(remainingMs, minRetryMs)` — Time guard for method switch

**TTL Utilities:**

- `remainingMs(expiresAt, clientNow, offsetMs)` — Countdown calculation
- `serverOffsetMs(serverTime, responseReceivedAt)` — Clock drift correction

### Data Layer

The data layer implements the port interface with a fake adapter for deterministic testing.

**Components:**

- `PaymentPort` — Interface contract (lives in domain, implemented in data)
- `FakePaymentAdapter` — Deterministic scenario-based implementation
- `PaymentScenarios` — Named scenario configurations

### Presentation Layer

**Out of scope for GH-13.** Payment UI components, hooks, and screens are separate implementation work. GH-15 handles e-ticket display post-payment.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Feature Boundary                                 │
│                      src/features/payment/                               │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       domain/ (Pure TypeScript)                   │  │
│  │                                                                   │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │  │
│  │  │  Domain Models  │  │  PaymentPort    │  │  Domain Rules   │   │  │
│  │  │  - PaymentMethod│  │  (Interface)    │  │  - isTerminal   │   │  │
│  │  │  - BankCode     │  │                 │  │  - canRetry     │   │  │
│  │  │  - PaymentStatus│  │  - getMethods   │  │  - hasTime      │   │  │
│  │  │  - Instruction  │  │  - initiate     │  │                 │   │  │
│  │  │  - StatusResult │  │  - getStatus    │  └─────────────────┘   │  │
│  │  └─────────────────┘  │  - retry        │                        │  │
│  │                       └────────┬────────┘  ┌─────────────────┐   │  │
│  │                                │           │   TTL Utilities │   │  │
│  │                                │           │  - remainingMs  │   │  │
│  │                                │           │  - serverOffset │   │  │
│  │                                │           └─────────────────┘   │  │
│  └────────────────────────────────┼──────────────────────────────────┘  │
│                                   │                                     │
│                                   │ implements                          │
│                                   ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       data/ (Implementations)                     │  │
│  │                                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                  FakePaymentAdapter                         │  │  │
│  │  │                                                             │  │  │
│  │  │  - scenario: PaymentScenario                                │  │  │
│  │  │  - state: Map<bookingId, InternalState>                     │  │  │
│  │  │  - getAvailableMethods(bookingId): AvailableMethod[]        │  │  │
│  │  │  - initiatePayment(bookingId, method, bank?): PaymentInit   │  │  │
│  │  │  - getPaymentStatus(bookingId): PaymentStatusResult         │  │  │
│  │  │  - retryPayment(bookingId): void                            │  │  │
│  │  │  - reset(): void                                            │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                │                                  │  │
│  │                                │ uses                             │  │
│  │                                ▼                                  │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │                  scenarios/                                 │  │  │
│  │  │                                                             │  │  │
│  │  │  - SCENARIO_PAYMENT_SUCCESS                                 │  │  │
│  │  │  - SCENARIO_PAYMENT_FAILURE                                 │  │  │
│  │  │  - SCENARIO_PAYMENT_TIMEOUT                                 │  │  │
│  │  │  - SCENARIO_PAYMENT_CANCELLED                               │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                       index.ts (Feature Barrel)                   │  │
│  │  - Public API: types, port, adapter, rules, utilities            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Payment Method Selection

```
Consumer requests available methods
    ↓
PaymentPort.getAvailableMethods(bookingId)
    ↓
FakePaymentAdapter returns canned methods:
  - bank_transfer: enabled, banks: [bca, bni, bri, cimb]
  - gopay: enabled
    ↓
Consumer displays method selection UI
```

### 2. Payment Initiation

```
User selects method (e.g., bank_transfer + bca)
    ↓
PaymentPort.initiatePayment(bookingId, 'bank_transfer', 'bca')
    ↓
FakePaymentAdapter:
  1. Generates payment_id: {booking_id}:{attempt}
  2. Creates instructions: { bank: 'bca', va_number: '...' }
  3. Sets TTL: expires_at = held_at + 600s
  4. Stores internal state: status = PENDING
  5. Returns PaymentInitiation
    ↓
Consumer displays VA number and countdown
```

### 3. Payment Status Polling

```
Consumer polls every 3s with jitter
    ↓
PaymentPort.getPaymentStatus(bookingId)
    ↓
FakePaymentAdapter checks scenario:
  - payment-success: After configured delay → status = PAID
  - payment-failure: After delay → status = FAILED, can_retry = true
  - payment-timeout: After TTL → status = EXPIRED
    ↓
Returns PaymentStatusResult with status-specific fields
    ↓
Consumer checks isTerminalStatus(status)
  - Terminal (PAID/FAILED/EXPIRED): stop polling
  - Non-terminal (PENDING): continue
```

### 4. Payment Retry (Method Switch)

```
User wants to switch from VA to GoPay
    ↓
PaymentPort.retryPayment(bookingId)
    ↓
FakePaymentAdapter:
  1. Validates: not terminal, attempts < max, time remaining
  2. Increments attempt counter
  3. Clears previous instructions
  4. Returns to HELD-like state
    ↓
Consumer can now call initiatePayment with different method
    ↓
Note: TTL does NOT reset — anchored to original held_at
```

---

## Components and Interfaces

### Components

| Component            | Responsibility                           | Layer  |
| -------------------- | ---------------------------------------- | ------ |
| `PaymentMethod`      | Payment type discriminator enum          | Domain |
| `BankCode`           | Bank identifier enum                     | Domain |
| `PaymentStatus`      | Status state machine enum                | Domain |
| `PaymentInstruction` | VA or GoPay instruction union            | Domain |
| `PaymentPort`        | Architecture-neutral operation interface | Domain |
| `isTerminalStatus()` | Terminal state detection rule            | Domain |
| `canRetryPayment()`  | Retry eligibility rule                   | Domain |
| `hasTimeForRetry()`  | Time guard for retry                     | Domain |
| `remainingMs()`      | TTL countdown calculation                | Domain |
| `serverOffsetMs()`   | Clock drift correction                   | Domain |
| `FakePaymentAdapter` | Deterministic port implementation        | Data   |
| `PaymentScenarios`   | Named scenario configurations            | Data   |

### Interfaces

```typescript
// === Domain Types ===

type PaymentMethod = "bank_transfer" | "gopay";

type BankCode = "bca" | "bni" | "bri" | "cimb";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

/** Discriminated union for payment instructions */
type PaymentInstruction =
  | { method: "bank_transfer"; bank: BankCode; vaNumber: string }
  | { method: "gopay"; qrUrl: string; deeplinkUrl: string };

interface PaymentTTL {
  /** ISO 8601 expiry timestamp */
  expiresAt: string;
  /** ISO 8601 server time for drift calculation */
  serverTime: string;
}

interface AvailableMethod {
  id: PaymentMethod;
  name: string;
  description: string;
  iconUrl: string;
  enabled: boolean;
  /** Only present for bank_transfer */
  banks?: Array<{ code: BankCode; name: string; iconUrl: string }>;
}

interface PaymentInitiation {
  /** Format: {booking_id}:{attempt_number} */
  paymentId: string;
  method: PaymentMethod;
  status: "PENDING" | "FAILED";
  instructions: PaymentInstruction;
  ttl: PaymentTTL;
}

/** Discriminated union for status polling response */
type PaymentStatusResult =
  | { status: "PENDING"; expiresAt: string; serverTime: string }
  | { status: "PAID"; paidAt: string; redirectUrl: string }
  | {
      status: "FAILED";
      reason: string;
      canRetry: boolean;
      attempt: number;
      paymentExpiresAt: string;
      serverTime: string;
    }
  | { status: "EXPIRED"; expiredAt: string };

// === Port Interface (Architecture-Neutral) ===

interface PaymentPort {
  /**
   * Returns available payment methods for a booking.
   * Methods may be disabled (enabled: false) due to circuit breaker.
   */
  getAvailableMethods(bookingId: string): Promise<AvailableMethod[]>;

  /**
   * Initiates payment and returns instructions (VA number or QR).
   * Idempotent: calling twice returns same instructions.
   * @throws BOOKING_STATUS_INVALID if booking not payable
   * @throws PAYMENT_WINDOW_CLOSED if TTL expired
   */
  initiatePayment(
    bookingId: string,
    method: PaymentMethod,
    bank?: BankCode
  ): Promise<PaymentInitiation>;

  /**
   * Polls current payment status.
   * Returns different shapes based on status discriminator.
   */
  getPaymentStatus(bookingId: string): Promise<PaymentStatusResult>;

  /**
   * Cancels pending payment to allow method switch.
   * NOT for retrying after decline (just call initiate again).
   * @throws PAYMENT_ALREADY_SETTLED if payment completed
   * @throws PAYMENT_WINDOW_CLOSED if TTL expired
   * @throws MAX_ATTEMPTS_EXCEEDED if attempt >= 5
   */
  retryPayment(bookingId: string): Promise<void>;
}

// === Scenario Configuration ===

interface PaymentScenario {
  name: string;
  description: string;
  /** Delay in ms before terminal status (0 for immediate) */
  transitionDelayMs: number;
  /** Terminal status to transition to */
  terminalStatus: "PAID" | "FAILED" | "EXPIRED";
  /** For FAILED status: can user retry? */
  canRetry?: boolean;
  /** For FAILED status: failure reason */
  failureReason?: string;
}

// === Fake Adapter ===

interface FakePaymentAdapter extends PaymentPort {
  /** Reset all internal state (for test isolation) */
  reset(): void;
  /** Inspect internal state for test assertions */
  getInternalState(bookingId: string): InternalBookingState | undefined;
}
```

---

## Data Models

```typescript
// === Feature-Level Domain Models ===

// Payment method enumeration
export type PaymentMethod = "bank_transfer" | "gopay";

// Supported banks for VA payments (POC scope)
export type BankCode = "bca" | "bni" | "bri" | "cimb";

// Payment status state machine
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED";

// Payment instructions - discriminated by method
export type PaymentInstruction = VAInstruction | GopayInstruction;

interface VAInstruction {
  method: "bank_transfer";
  bank: BankCode;
  vaNumber: string;
}

interface GopayInstruction {
  method: "gopay";
  qrUrl: string;
  deeplinkUrl: string;
}

// TTL information returned with payment
export interface PaymentTTL {
  expiresAt: string; // ISO 8601 RFC3339
  serverTime: string; // ISO 8601 RFC3339
}

// Available method for selection
export interface AvailableMethod {
  id: PaymentMethod;
  name: string;
  description: string;
  iconUrl: string;
  enabled: boolean;
  banks?: BankInfo[]; // Only for bank_transfer
}

export interface BankInfo {
  code: BankCode;
  name: string;
  iconUrl: string;
}

// Response from initiatePayment
export interface PaymentInitiation {
  paymentId: string; // Format: {booking_id}:{attempt}
  method: PaymentMethod;
  status: "PENDING" | "FAILED";
  instructions: PaymentInstruction;
  ttl: PaymentTTL;
}

// Polling response - discriminated union
export type PaymentStatusResult =
  PendingStatus | PaidStatus | FailedStatus | ExpiredStatus;

interface PendingStatus {
  status: "PENDING";
  expiresAt: string;
  serverTime: string;
}

interface PaidStatus {
  status: "PAID";
  paidAt: string;
  redirectUrl: string;
}

interface FailedStatus {
  status: "FAILED";
  reason: string;
  canRetry: boolean;
  attempt: number;
  paymentExpiresAt: string;
  serverTime: string;
}

interface ExpiredStatus {
  status: "EXPIRED";
  expiredAt: string;
}

// === Internal State (Adapter Implementation) ===

interface InternalBookingState {
  bookingId: string;
  attempt: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  bank?: BankCode;
  instructions?: PaymentInstruction;
  heldAt: string; // TTL anchor timestamp
  initiatedAt?: string; // When initiatePayment called
  transitionScheduledAt?: number; // When scenario schedules transition
}

// === Constants ===

export const PAYMENT_CONSTANTS = {
  /** Payment window duration in seconds (BR-05) */
  TTL_SECONDS: 600,
  /** Minimum remaining time to allow retry (1 minute) */
  MIN_RETRY_REMAINING_SECONDS: 60,
  /** Maximum payment attempts per booking */
  MAX_ATTEMPTS: 5,
  /** Polling interval in milliseconds */
  POLL_INTERVAL_MS: 3000,
  /** Jitter ratio for polling (±20%) */
  POLL_JITTER_RATIO: 0.2,
  /** Urgent countdown threshold (1 minute) */
  COUNTDOWN_URGENT_MS: 60000,
} as const;
```

---

## Correctness Properties

### Property 1: Architecture Neutrality

**Validates: Requirements 1.5, 1.6**

The `PaymentPort` interface contains no references to WebView, native Linking, HTTP clients, or any implementation-specific types. Implementation mechanism is deferred to production ticket. (R1-AC5, R1-AC6)

### Property 2: Terminal Status Semantics

**Validates: Requirements 5.5**

`PAID`, `FAILED`, and `EXPIRED` are terminal statuses. Polling stops when `isTerminalStatus(status)` returns true. `PENDING` is the only non-terminal status. (R5-AC5)

### Property 3: TTL Anchoring Invariant

**Validates: Requirements 7.1, 7.3**

TTL is anchored to `held_at` timestamp, never to request time. Method switch via `retryPayment` does NOT reset TTL — switching at minute 8 leaves 2 minutes remaining. (R7-AC1, R7-AC3)

### Property 4: Idempotent Initiation

**Validates: Requirements 4.5**

Calling `initiatePayment` twice with the same booking returns identical instructions without side effects. The `payment_id` and instructions remain stable across calls. (R4-AC5)

### Property 5: Attempt Limit Enforcement

**Validates: Requirements 8.4**

Maximum 5 payment attempts per booking (`MAX_ATTEMPTS`). `retryPayment` throws `MAX_ATTEMPTS_EXCEEDED` when `attempt >= 5`. (R8-AC4)

### Property 6: Scenario Determinism

**Validates: Requirements 10.1, 10.2**

Given the same scenario configuration, `FakePaymentAdapter` produces identical responses. No randomness except for deterministic pseudo-random VA numbers. (R10-AC1, R10-AC2)

### Property 7: Clock Drift Resilience

**Validates: Requirements 7.5, 7.6**

Countdown recalculates from `expiresAt` timestamp minus clock-drift-adjusted current time, never by decrementing a counter. This survives app backgrounding and clock skew. (R7-AC5, R7-AC6)

### Property 8: Retry Precondition Enforcement

**Validates: Requirements 8.5, 8.6**

`retryPayment` throws `PAYMENT_ALREADY_SETTLED` if status is `PAID`, and `PAYMENT_WINDOW_CLOSED` if TTL expired. Retry is only valid for `PENDING` status within window. (R8-AC5, R8-AC6)

---

## Error Handling

| Error Type                | Layer  | Handling Strategy       | User Feedback                             |
| ------------------------- | ------ | ----------------------- | ----------------------------------------- |
| `BOOKING_STATUS_INVALID`  | Data   | Return structured error | "Cannot process payment in current state" |
| `PAYMENT_WINDOW_CLOSED`   | Data   | Return 409-equivalent   | "Payment time expired"                    |
| `PAYMENT_ALREADY_SETTLED` | Data   | Return 409-equivalent   | "Payment already completed"               |
| `MAX_ATTEMPTS_EXCEEDED`   | Data   | Return 429-equivalent   | "Maximum payment attempts reached"        |
| `BANK_NOT_SUPPORTED`      | Data   | Return validation error | "Selected bank not available"             |
| Invalid method/bank combo | Domain | Validation before call  | "Please select a bank for bank transfer"  |
| Clock drift detected      | Domain | Apply offset silently   | None (transparent correction)             |
| Scenario not found        | Data   | Throw Error             | Developer error (test setup issue)        |

**Error Shape (aligned with CONTRACT-BASELINE.md):**

```typescript
interface PaymentError {
  code: string; // e.g., 'PAYMENT_WINDOW_CLOSED'
  message: string; // Human-readable
  details?: unknown; // Additional context
}
```

---

## Testing Strategy

### Unit Tests

| Test Suite      | File                        | Coverage Target                                          |
| --------------- | --------------------------- | -------------------------------------------------------- |
| Domain Models   | `payment-types.test.ts`     | Type compilation, discriminated unions                   |
| Domain Rules    | `payment-rules.test.ts`     | `isTerminalStatus`, `canRetryPayment`, `hasTimeForRetry` |
| TTL Utilities   | `payment-ttl.test.ts`       | `remainingMs`, `serverOffsetMs`                          |
| Scenario Config | `payment-scenarios.test.ts` | Scenario structure validation                            |

**Rule Coverage:**

- `isTerminalStatus(PENDING)` → false
- `isTerminalStatus(PAID)` → true
- `isTerminalStatus(FAILED)` → true
- `isTerminalStatus(EXPIRED)` → true
- `canRetryPayment` with attempts < max and non-terminal → true
- `canRetryPayment` with attempts >= max → false
- `canRetryPayment` with terminal status → false
- `hasTimeForRetry` with sufficient time → true
- `hasTimeForRetry` with insufficient time → false
- `remainingMs` returns positive when not expired
- `remainingMs` returns 0 when expired
- `serverOffsetMs` calculates drift correctly

### Integration Tests

| Test Suite         | File                         | Coverage Target         |
| ------------------ | ---------------------------- | ----------------------- |
| FakePaymentAdapter | `FakePaymentAdapter.test.ts` | All PaymentPort methods |

**Scenario Coverage:**

- `payment-success`: PENDING → PAID with `paidAt` and `redirectUrl`
- `payment-failure`: PENDING → FAILED with `canRetry: true`
- `payment-timeout`: PENDING → EXPIRED after TTL
- `payment-cancelled`: User-initiated cancellation flow

**Behavior Coverage:**

- `getAvailableMethods` returns 2 methods with correct structure
- `initiatePayment` for bank_transfer returns VA instructions
- `initiatePayment` for gopay returns QR + deeplink
- `initiatePayment` idempotency (same result on retry)
- `getPaymentStatus` returns correct shape per status
- `retryPayment` increments attempt number
- `retryPayment` fails appropriately (settled, expired, max)
- Adapter `reset()` clears state between tests
- Adapter `getInternalState()` enables assertions
- Performance: all methods resolve within 10ms in test mode

### E2E Tests

**Out of scope for GH-13.** E2E testing requires UI components which are separate implementation work.

---

## ADRs (Architecture Decision Records)

### ADR-GH13-01: Architecture-Neutral Payment Port

**Context:** ADR-0008 proposes WebView payment handoff for mobile, but this decision is not confirmed. The mobile team needs to proceed with payment flow implementation without blocking on architecture decision.

**Decision:** Define `PaymentPort` as an architecture-neutral interface that specifies WHAT operations exist (getMethods, initiate, getStatus, retry) without encoding HOW they execute. The interface:

- Takes booking ID and method selection as input
- Returns domain models (instructions, status, TTL)
- Does NOT reference WebView, native SDK, HTTP transport, or URL handling
- Defers implementation mechanism to production ticket

**Consequences:**

- ✅ Unblocks mobile development with fake adapter
- ✅ End-to-end flow testable without production dependency
- ✅ Port interface survives any architecture decision (WebView, native, hybrid)
- ⚠️ Real adapter implementation may need additional methods (e.g., `getHandoffUrl` for WebView)
- ⚠️ Consumer code (UI) must also remain mechanism-agnostic

### ADR-GH13-02: Fake Adapter Pattern Following GH-8

**Context:** GH-8 established the `FakeQueueDataSource` pattern for deterministic testing. The payment feature needs similar fake capability.

**Decision:** Implement `FakePaymentAdapter` following the GH-8 pattern:

- Implements `PaymentPort` interface fully
- Configured with `PaymentScenario` via constructor
- Maintains in-memory state for status transitions
- Supports `reset()` for test isolation
- Supports `getInternalState()` for assertions
- Default scenario for tests is `payment-success` with immediate transition

**Consequences:**

- ✅ Consistent with established patterns
- ✅ Deterministic and fast tests
- ✅ Scenario-based testing covers all flows
- ⚠️ Fake does not exercise network behavior (intentional)
- ⚠️ Real adapter will need separate testing

### ADR-GH13-03: TTL Recalculation Over Decrement

**Context:** Mobile apps may be backgrounded, and system clocks may drift. Decrementing a timer loses accuracy.

**Decision:** Countdown calculation always recalculates from `expiresAt` timestamp:

```typescript
remainingMs = max(0, expiresAt - (clientNow + serverOffset));
```

Where `serverOffset = serverTime - responseReceivedAt`.

This matches web's ADR-0005 pattern exactly.

**Consequences:**

- ✅ Survives app backgrounding
- ✅ Self-corrects clock drift
- ✅ Consistent with web implementation
- ⚠️ Requires storing `serverTime` and calculating offset

### ADR-GH13-04: Scenario-Based State Transitions

**Context:** Payment outcomes depend on external factors (user paying, timeouts, gateway errors). Tests need deterministic control.

**Decision:** Define named scenarios that configure adapter behavior:

- `payment-success`: PENDING → PAID after `transitionDelayMs`
- `payment-failure`: PENDING → FAILED with `canRetry: true`
- `payment-timeout`: PENDING → EXPIRED after TTL (respects configured TTL)
- `payment-cancelled`: Simulates user abandonment

Scenarios support `transitionDelayMs = 0` for immediate transitions in tests, and realistic delays for manual testing.

**Consequences:**

- ✅ Tests are deterministic and fast
- ✅ All outcome paths are testable
- ✅ Manual testing can simulate realistic timing
- ⚠️ Must use `jest.useFakeTimers()` for delay tests

---

## Dependencies

### Internal Dependencies

| Module | Import | Purpose                                              |
| ------ | ------ | ---------------------------------------------------- |
| None   | —      | GH-13 is self-contained; no core/domain dependencies |

**Note:** Unlike GH-8 which reused GH-5 queue types, GH-13 defines all payment types fresh in `features/payment/domain/`. This is intentional — payment domain is feature-scoped, not shared across features.

### External Dependencies

| Package    | Version | Purpose                       |
| ---------- | ------- | ----------------------------- |
| TypeScript | 5.x     | Type safety (build-time only) |
| Jest       | —       | Testing framework             |

**No new runtime dependencies.** All payment domain logic is pure TypeScript. React and React Native are NOT dependencies of this ticket (presentation is out of scope).

---

## Risks

| Risk                                        | Likelihood | Impact | Mitigation                                                                     |
| ------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------ |
| Port interface insufficient for production  | Medium     | Medium | Design interface from backend contract (§5); real adapter may extend interface |
| Fake scenarios don't cover edge cases       | Low        | Low    | Add scenarios as edge cases discovered in integration                          |
| TTL calculation off by seconds              | Low        | Low    | E2E tests with real timing will validate                                       |
| ADR-0008 confirmed with incompatible design | Low        | High   | Interface is neutral; worst case needs additional methods                      |
| Test timing flaky with delays               | Medium     | Low    | Use `jest.useFakeTimers()` consistently                                        |

---

## Open Questions

1. **Polling Hook Ownership:** Should `features/payment/` export a `usePaymentPolling` hook, or is polling a presentation-layer concern for a separate ticket?
   - **Proposed Resolution:** Defer to presentation ticket. GH-13 provides the port and rules; hooks are UI implementation.

2. **Error Code Typing:** Should error codes be TypeScript enums or string literals?
   - **Proposed Resolution:** Use `as const` string literals to match CONTRACT-BASELINE.md codes exactly and avoid enum indirection.

3. **VA Number Generation:** Should fake adapter generate realistic-looking VA numbers?
   - **Proposed Resolution:** Yes, use deterministic pseudo-random based on booking ID for consistency across tests (e.g., `8801${hash(bookingId).slice(0,10)}`).
