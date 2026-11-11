# Design — GH-5 Core Domain Layer and API Client

## Overview

Establish the pure-TypeScript domain layer primitives for the Rusuh Booking Tiket mobile application. This design follows Clean Architecture principles with domain as the innermost layer containing no external dependencies.

**Canonical Contract Source:** `docs/CONTRACT-BASELINE.md` (2026-11-11)

---

## Architecture

### Domain Layer

**Entities and Value Objects:**

- `QueueState` — Discriminated union for queue poll/SSE states
- `EngagementState` — Discriminated union for /queue/me engagement states
- `QueueToken`, `GrantToken`, `DeviceId`, `ETicketToken`, `AccessToken` — Branded string types
- `NikInput` — Discriminated union enforcing exactly-one-of constraint
- `ApiSuccessEnvelope<T>`, `ApiErrorEnvelope` — Generic API response types
- `PollTier`, `PaginationParams`, `RateLimitInfo` — API primitive types

**Interfaces:**

- `AuthContext` — Authentication context (guest vs authenticated)
- `QueueHeaders`, `GrantHeaders`, `AuthenticatedHeaders` — Header composition types

### Data Layer

Not implemented in this ticket. Future API client implementation will live in `src/core/data/`.

### Presentation Layer

Not applicable. This ticket implements domain primitives only.

---

## Component Diagram

```
Feature Layers (features/queue/*, features/booking/*)
           │
           │ imports from @/core/domain
           ▼
┌──────────────────────────────────────────┐
│         Core Domain Layer                │
│  src/core/domain/index.ts                │
│  ├── api/    (envelope, error, pagination)│
│  ├── queue/  (states, join, poll-tiers)  │
│  ├── auth/   (tokens, headers)           │
│  ├── booking/(nik)                       │
│  └── time/   (server-time utils)         │
│                                          │
│  Dependencies: NONE (pure TypeScript)    │
└──────────────────────────────────────────┘
```

---

## Data Flow

1. API response received by data layer
2. Response parsed into `ApiSuccessEnvelope<T>` or `ApiErrorEnvelope`
3. `server_time` extracted for offset calculation via `serverOffsetMs()`
4. Domain types (e.g., `QueueState`, `EngagementState`) validated via type guards
5. Features consume typed domain models via `@/core/domain` imports

---

## Components and Interfaces

### Components

| Component              | Responsibility                 | Layer  |
| ---------------------- | ------------------------------ | ------ |
| `envelope.types.ts`    | API response envelope modeling | Domain |
| `error.types.ts`       | API error code modeling        | Domain |
| `queue-state.types.ts` | Queue poll/SSE state modeling  | Domain |
| `engagement.types.ts`  | Engagement state modeling      | Domain |
| `tokens.types.ts`      | Branded token type factories   | Domain |
| `headers.types.ts`     | Header composition functions   | Domain |
| `nik.types.ts`         | NIK exactly-one-of validation  | Domain |
| `server-time.utils.ts` | Time offset calculation        | Domain |
| `poll-tiers.types.ts`  | Polling guidance modeling      | Domain |
| `pagination.types.ts`  | Pagination primitives          | Domain |
| `rate-limit.types.ts`  | Rate limit primitives          | Domain |

### Interfaces

```typescript
// Token branded types
type QueueToken = Brand<string, "QueueToken">;
type GrantToken = Brand<string, "GrantToken">;
type DeviceId = Brand<string, "DeviceId">;

// Authentication context
type AuthContext =
  | { type: "guest"; deviceId: DeviceId }
  | { type: "authenticated"; accessToken: AccessToken };

// Queue state discriminated union
type QueueState =
  "SCHEDULED" | "OPEN" | "FULL_QUEUE" | "FULL_BOOKED" | "CLOSED";

// Engagement state discriminated union
type EngagementState =
  | "QUEUED"
  | "GRANTED"
  | "SELECTING"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "EXPIRED";

// NIK input exactly-one-of
type NikInput =
  | { type: "raw"; nik: string }
  | { type: "saved"; savedNikId: string }
  | { type: "account"; useAccountNik: true };
```

---

## Data Models

```typescript
// API Envelope
interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: { server_time?: string; [key: string]: unknown };
}

interface ApiErrorEnvelope {
  meta: { error_code: string; message: string; [key: string]: unknown };
  data?: { queue_state?: string; [key: string]: unknown };
}

// Queue Join Contract
interface QueueJoinRequest {
  captcha_token: string; // REQUIRED
}

interface QueueJoinResponse {
  queue_token: string;
  sse_url: string;
  rejoined?: boolean;
  state?: EngagementState;
}

// Poll Tiers
interface PollTier {
  max_position: number | null;
  poll_after_ms: number;
}
```

---

## Correctness Properties

### Property 1: FULL_QUEUE ≠ FULL_BOOKED

**Validates: Requirements 3.2, 3.5**

`FULL_QUEUE` (503, queue capacity) and `FULL_BOOKED` (409, inventory) are distinct discriminated union members that cannot be collapsed. (R3-AC2, R3-AC5)

### Property 2: SOLD_OUT is NOT a Queue State

**Validates: Requirements 3.3**

`SOLD_OUT` is intentionally absent from `QueueState`. It is a ticket-category attribute only. (R3-AC3)

### Property 3: Logged-in Grant Requires BOTH Headers

**Validates: Requirements 7.1**

Authenticated grant-protected requests require both `X-Grant-Token` AND `Authorization: Bearer`. (R7-AC1)

### Property 4: Queue Join Requires captcha_token

**Validates: Requirements 9.5**

`QueueJoinRequest.captcha_token` is required (not optional). Omitting it is a compile-time error. (R9-AC5)

### Property 5: NIK Exactly-One-Of Enforced

**Validates: Requirements 8.2, 8.3, 8.4**

`validateNikInput` returns typed errors for zero or multiple fields. (R8-AC2, R8-AC3, R8-AC4)

### Property 6: Server Time is Authoritative

**Validates: Requirements 5.4**

`remainingMs` accounts for server-client offset. Client time alone never determines expiry. (R5-AC4)

---

## Error Handling

| Error Type          | Layer  | Handling Strategy                            | User Feedback           |
| ------------------- | ------ | -------------------------------------------- | ----------------------- |
| Invalid NIK input   | Domain | Return `NikValidationResult` with error type | Form validation message |
| Invalid server time | Domain | Return `null` from `parseServerTime`         | Fallback to client time |
| Unknown queue state | Domain | Return `false` from `isValidQueueState`      | Generic error screen    |
| Unknown error code  | Domain | Forward-compatible type allows unknown codes | Generic API error       |

---

## Testing Strategy

### Unit Tests

| Test Area                       | Coverage Target                 |
| ------------------------------- | ------------------------------- |
| `serverOffsetMs`, `remainingMs` | Offset calc, expired handling   |
| `validateNikInput`              | Zero/one/multiple/invalid cases |
| Queue/engagement type guards    | All state validations           |
| Token factories                 | Branded type creation           |
| Header composition              | Guest vs authenticated          |

### Integration Tests

Not applicable for domain layer (pure TypeScript, no I/O).

### E2E Tests

Not applicable (no UI components in this ticket).

---

## ADRs (Architecture Decision Records)

### ADR-1: Branded Types for Tokens

**Context:** Multiple token types are strings but must not be interchangeable.

**Decision:** Use TypeScript branded types with unique symbol for nominal typing.

**Consequences:** Type-safe at compile time; requires factory functions.

### ADR-2: Discriminated Unions over Enums

**Context:** Queue states need exhaustive pattern matching.

**Decision:** Use string literal union types instead of enums.

**Consequences:** Direct JSON serialization; tree-shakeable.

### ADR-3: Forward-Compatible Error Codes

**Context:** API may add new error codes.

**Decision:** `ApiErrorCode = KnownApiErrorCode | (string & {})` pattern.

**Consequences:** Autocompletion for known codes; unknown codes don't break.

### ADR-4: No Payment Types

**Context:** Payment hand-off architecture is unresolved.

**Decision:** Exclude payment types from this ticket.

**Consequences:** Payment ticket (#14) defines types when architecture decided.

---

## Dependencies

No external packages. Domain layer has zero external dependencies.

---

## Risks

| Risk                              | Likelihood | Impact | Mitigation                  |
| --------------------------------- | ---------- | ------ | --------------------------- |
| Contract drift from API changes   | Medium     | High   | Pin to CONTRACT-BASELINE.md |
| Branded type ergonomics           | Low        | Low    | Provide factory functions   |
| Unknown error codes in production | Medium     | Low    | Forward-compatible type     |

---

## Open Questions

None. All design decisions grounded in `docs/CONTRACT-BASELINE.md`.
