# Design — GH-9 Real Queue Integration

## Overview

GH-9 implements real backend Queue integration by introducing `RealQueueDataSource` — a transport adapter that communicates with the deployed Queue service via HTTP (join, /me) and SSE (real-time updates).

The design preserves GH-8's `FakeQueueDataSource` for deterministic testing and development, while enabling swap to real transport via dependency injection through the existing `QueueDataSource` interface.

**Key Design Decision:** The existing `QueueDataSource` interface from GH-8's `useQueue.ts` is already transport-agnostic. GH-9 formalizes it as the port and implements `RealQueueDataSource` against it.

---

## Architecture

### Current-State Analysis (GH-8)

GH-8 established the Queue architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                          │
│  ┌───────────────────┐  ┌────────────────────────────────────┐ │
│  │ WaitingRoomScreen │  │ useQueue(config: UseQueueConfig)   │ │
│  └────────┬──────────┘  │  - createDataSource: Factory       │ │
│           │             │  - scenario: QueueScenario         │ │
│           │             └────────────────┬───────────────────┘ │
└───────────┼──────────────────────────────┼─────────────────────┘
            │                              │
            │ uses                         │ creates
            │                              ▼
┌───────────┼──────────────────────────────────────────────────────┐
│           │              Data Layer                               │
│  ┌────────▼──────────────────────────────────────────────────┐   │
│  │                QueueDataSource (interface)                 │   │
│  │  start(): void                                             │   │
│  │  stop(): void                                              │   │
│  │  retry(): void                                             │   │
│  │  setCallbacks({onUpdate, onComplete, onError}): void       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                    │
│  ┌───────────────────────────▼───────────────────────────────┐   │
│  │              FakeQueueDataSource (GH-8)                   │   │
│  │  - Plays scripted scenarios                                │   │
│  │  - Deterministic timing                                    │   │
│  │  - No network                                              │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

**Existing Ports/Interfaces:**

- `QueueDataSource` — already defined in `useQueue.ts` (start, stop, retry, setCallbacks)
- `QueueUpdate` — domain type for position updates
- `GrantInfo` — grant metadata type

**Existing Consumers:**

- `useQueue` hook — uses QueueDataSource via DI
- `WaitingRoomScreen` — uses useQueue

### Proposed Real Integration

GH-9 adds `RealQueueDataSource` implementing the same interface:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                          │
│  ┌───────────────────┐  ┌────────────────────────────────────┐ │
│  │ WaitingRoomScreen │  │ useQueue(config: UseQueueConfig)   │ │
│  └────────┬──────────┘  │  - createDataSource: Factory       │ │
│           │             │  (unchanged from GH-8)             │ │
│           │             └────────────────┬───────────────────┘ │
└───────────┼──────────────────────────────┼─────────────────────┘
            │                              │
            │ uses                         │ creates
            │                              ▼
┌───────────┼──────────────────────────────────────────────────────┐
│           │              Data Layer                               │
│  ┌────────▼──────────────────────────────────────────────────┐   │
│  │                QueueDataSource (interface)                 │   │
│  │  start(): void                                             │   │
│  │  stop(): void                                              │   │
│  │  retry(): void                                             │   │
│  │  setCallbacks({onUpdate, onComplete, onError}): void       │   │
│  └───────────────────┬───────────────────┬───────────────────┘   │
│                      │                   │                        │
│  ┌───────────────────▼───────┐   ┌──────▼───────────────────┐    │
│  │   FakeQueueDataSource     │   │   RealQueueDataSource    │    │
│  │   (GH-8, unchanged)       │   │   (GH-9, new)            │    │
│  │                           │   │                          │    │
│  │   - Scripted scenarios    │   │   - HTTP join            │    │
│  │   - Deterministic         │   │   - SSE connection       │    │
│  │   - No network            │   │   - /queue/me calls      │    │
│  └───────────────────────────┘   │   - Real transport       │    │
│                                  └────────────┬─────────────┘    │
│                                               │                   │
│                           ┌───────────────────┴──────────────┐   │
│                           │       Transport Collaborators     │   │
│  ┌────────────────────────┼────────────────────────────────┐ │   │
│  │ QueueHttpClient        │ SseClient                      │ │   │
│  │ - join()               │ - connect(sse_url)             │ │   │
│  │ - getMe()              │ - onMessage()                  │ │   │
│  │                        │ - close()                      │ │   │
│  └────────────────────────┴────────────────────────────────┘ │   │
└──────────────────────────────────────────────────────────────────┘
            │
            │ imports types
            ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Domain Layer                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                 Core Domain (GH-5, unchanged)               │  │
│  │  QueueState, EngagementState, QueueJoinRequest/Response    │  │
│  │  createQueueHeaders(), createGrantHeaders()                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                 Queue Domain (GH-8, unchanged)              │  │
│  │  QueueUpdate, GrantInfo, calculateEta(), calculateProgress()│  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                 Queue Domain (GH-9, new)                    │  │
│  │  QueueError (domain error union), QueueMeResponse          │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Domain Layer

**Reused from GH-5/GH-8 (no changes):**

- `QueueState` — SCHEDULED | OPEN | FULL_QUEUE | FULL_BOOKED | CLOSED
- `EngagementState` — QUEUED | GRANTED | SELECTING | AWAITING_PAYMENT | CONFIRMED | EXPIRED
- `QueueJoinRequest` / `QueueJoinResponse`
- `QueueUpdate` / `GrantInfo`
- `createQueueHeaders()` / `createGrantHeaders()`
- `calculateEta()` / `calculateProgress()`

**New in GH-9:**

- `QueueError` — Domain error discriminated union
- `QueueMeResponse` — /queue/me response type
- `SseMessageDto` — SSE message DTO types

### Data Layer

**Preserved from GH-8:**

- `FakeQueueDataSource` — Deterministic scenario player
- `QueueScenarioFixtures` — Named scenarios

**New in GH-9:**

- `RealQueueDataSource` — Real transport adapter
- `QueueHttpClient` — HTTP client for join and /me
- `SseClient` — SSE connection wrapper
- `QueueErrorMapper` — HTTP to domain error mapping
- `SseMessageParser` — SSE message to QueueUpdate mapping
- Transport DTOs for HTTP request/response

### Presentation Layer

**No changes.** The existing `useQueue` hook and `WaitingRoomScreen` work unchanged — they consume `QueueDataSource` interface, agnostic to transport.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Data Layer                                      │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                       RealQueueDataSource                             │  │
│  │                                                                       │  │
│  │  Config:                                                              │  │
│  │  - eventId: string                                                    │  │
│  │  - captchaToken: string                                               │  │
│  │  - authContext: AuthContext (guest | authenticated)                   │  │
│  │  - baseUrl: string                                                    │  │
│  │                                                                       │  │
│  │  State:                                                               │  │
│  │  - queueToken: string | null                                          │  │
│  │  - sseUrl: string | null                                              │  │
│  │  - isRunning: boolean                                                 │  │
│  │                                                                       │  │
│  │  Methods:                                                             │  │
│  │  - start()  → HTTP join → SSE connect → emit updates                  │  │
│  │  - stop()   → close SSE → cleanup                                     │  │
│  │  - retry()  → stop + start                                            │  │
│  │  - setCallbacks()                                                     │  │
│  └───────────────────────┬─────────────────────┬─────────────────────────┘  │
│                          │                     │                             │
│              uses        │                     │ uses                        │
│                          ▼                     ▼                             │
│  ┌───────────────────────────────┐   ┌────────────────────────────────────┐ │
│  │       QueueHttpClient         │   │           SseClient                │ │
│  │                               │   │                                    │ │
│  │  join(eventId, req, headers)  │   │  connect(sseUrl, queueToken)       │ │
│  │   → QueueJoinResponse | Error │   │  onMessage(callback)               │ │
│  │                               │   │  onError(callback)                 │ │
│  │  getMe(queueToken)            │   │  close()                           │ │
│  │   → QueueMeResponse | Error   │   │                                    │ │
│  └───────────────────────────────┘   └────────────────────────────────────┘ │
│                          │                     │                             │
│              uses        │                     │ uses                        │
│                          ▼                     ▼                             │
│  ┌───────────────────────────────┐   ┌────────────────────────────────────┐ │
│  │       QueueErrorMapper        │   │        SseMessageParser            │ │
│  │                               │   │                                    │ │
│  │  mapHttpError(status, body)   │   │  parse(eventData) → QueueUpdate    │ │
│  │   → QueueError                │   │  isSupported(eventType) → boolean  │ │
│  └───────────────────────────────┘   └────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Fresh Guest Join

```
Consumer calls start()
    ↓
RealQueueDataSource.start()
    ↓
QueueHttpClient.join(eventId, {captcha_token}, {X-Device-Id})
    ↓
POST /events/{eventId}/queue/join
    ↓
Response: {queue_token, sse_url}
    ↓
Store queue_token, sse_url
    ↓
SseClient.connect(sse_url, {X-Queue-Token: queue_token})
    ↓
SSE connection established
    ↓
SSE message received
    ↓
SseMessageParser.parse(message) → QueueUpdate
    ↓
onUpdate(QueueUpdate) callback invoked
```

### 2. Authenticated Join

```
Consumer calls start()
    ↓
RealQueueDataSource.start()
    ↓
QueueHttpClient.join(eventId, {captcha_token}, {Authorization: Bearer <token>})
    ↓
POST /events/{eventId}/queue/join
    ↓
Response: {queue_token, sse_url}
    ↓
(same as guest from here)
```

### 3. Rejoin Response

```
Consumer calls start() (user has existing queue position)
    ↓
QueueHttpClient.join(eventId, {captcha_token}, headers)
    ↓
Response: {queue_token, sse_url, rejoined: true, state: "SELECTING"}
    ↓
Detect rejoined=true, state="SELECTING" (not QUEUED)
    ↓
Store queue_token, sse_url
    ↓
Call getMe(queue_token) to get full state
    ↓
SseClient.connect(sse_url, ...)
    ↓
Continue with current state
```

### 4. SSE Connect Using sse_url and queue_token

```
RealQueueDataSource has queue_token and sse_url
    ↓
SseClient.connect(sse_url, headers: {X-Queue-Token: queue_token})
    ↓
HTTP GET to sse_url (EventSource or fetch with streaming)
    ↓
Server sends event: "data: {...}\n\n"
    ↓
SseClient invokes onMessage(eventData)
    ↓
SseMessageParser.parse(eventData) → QueueUpdate
    ↓
RealQueueDataSource.emitUpdate(QueueUpdate)
```

### 5. Position Update

```
SSE message: {position: 45, queue_state: "OPEN"}
    ↓
SseMessageParser.parse() → QueueUpdate {position: 45, queueState: "OPEN", ...}
    ↓
onUpdate(update)
    ↓
useQueue receives update
    ↓
Recalculates ETA, progress
    ↓
UI re-renders
```

### 6. Grant-Related Update and /me Confirmation

```
SSE message hints GRANTED (or position → 0)
    ↓
RealQueueDataSource detects grant signal
    ↓
QueueHttpClient.getMe(queue_token)
    ↓
GET /queue/me with {X-Queue-Token}
    ↓
Response: {state: "GRANTED", grant_token: "gt_...", booking_expires_at: "..."}
    ↓
Build QueueUpdate with grant info
    ↓
onUpdate(update with grant)
    ↓
useQueue exposes grant
    ↓
onGranted callback invoked
```

### 7. FULL_QUEUE Response

```
QueueHttpClient.join(...)
    ↓
Response: HTTP 503, body: {error_code: "QUEUE_FULL", data: {queue_state: "FULL_QUEUE"}}
    ↓
QueueErrorMapper.mapHttpError(503, body)
    ↓
QueueError: {type: "QUEUE_FULL", queueState: "FULL_QUEUE", retryable: true}
    ↓
onError or emit QueueUpdate with FULL_QUEUE state
```

### 8. FULL_BOOKED State

```
SSE message: {queue_state: "FULL_BOOKED"}
    ↓
SseMessageParser.parse() → QueueUpdate {queueState: "FULL_BOOKED", ...}
    ↓
onUpdate(update)
    ↓
UI shows FULL_BOOKED message (recoverable, non-terminal)
```

### 9. CLOSED Behavior

```
SSE message: {queue_state: "CLOSED"}
    ↓
SseMessageParser.parse() → QueueUpdate {queueState: "CLOSED", ...}
    ↓
onUpdate(update)
    ↓
SseClient.close() (stream terminates)
    ↓
onComplete()
    ↓
UI shows terminal CLOSED message
```

### 10. Transport Failure

```
SseClient.connect(sse_url, ...)
    ↓
Network error (timeout, DNS, connection refused)
    ↓
SseClient invokes onError(error)
    ↓
QueueErrorMapper creates NETWORK_ERROR or SSE_CONNECTION_ERROR
    ↓
RealQueueDataSource.emitError(QueueError)
    ↓
useQueue.error is set
```

### 11. Malformed/Unsupported SSE Event

```
SSE message: {unknown_field: ...} or invalid JSON
    ↓
SseMessageParser.parse(message)
    ↓
Returns null or throws
    ↓
RealQueueDataSource logs warning (no token exposure)
    ↓
Message ignored, stream continues
```

### 12. Disconnect/Cleanup Initiated by Consumer

```
Consumer calls stop() or useQueue unmounts
    ↓
RealQueueDataSource.stop()
    ↓
SseClient.close()
    ↓
SSE connection closed
    ↓
Clear queue_token, sse_url
    ↓
isRunning = false
```

---

## Components and Interfaces

### Components

| Component             | Responsibility                           | Layer            |
| --------------------- | ---------------------------------------- | ---------------- |
| `QueueDataSource`     | Port interface for queue data sources    | Data (interface) |
| `RealQueueDataSource` | Orchestrates HTTP + SSE for real backend | Data             |
| `QueueHttpClient`     | HTTP client for /join and /me            | Data             |
| `SseClient`           | SSE connection wrapper                   | Data             |
| `QueueErrorMapper`    | Maps HTTP errors to domain errors        | Data             |
| `SseMessageParser`    | Parses SSE messages to QueueUpdate       | Data             |
| `QueueError`          | Domain error discriminated union         | Domain           |
| `QueueMeResponse`     | /queue/me response type                  | Domain           |

### Interfaces

```typescript
// Domain: Queue error types
type QueueErrorCode =
  | "CAPTCHA_REQUIRED"
  | "CAPTCHA_FAILED"
  | "DEVICE_ID_REQUIRED"
  | "QUEUE_FULL"
  | "FULL_BOOKED"
  | "UNAUTHORIZED"
  | "TOKEN_INVALID"
  | "EVENT_NOT_FOUND"
  | "SALE_CLOSED"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "SSE_CONNECTION_ERROR"
  | "UNKNOWN_ERROR";

interface QueueError {
  code: QueueErrorCode;
  message: string;
  retryable: boolean;
  /** HTTP status if applicable */
  httpStatus?: number;
  /** Queue state if error includes it */
  queueState?: QueueState;
}

// Domain: /queue/me response
interface QueueMeResponse {
  state: EngagementState;
  /** Present when state is GRANTED */
  grant_token?: string;
  /** Present when state is GRANTED */
  booking_expires_at?: string;
  /** Server time for offset calculation */
  server_time: string;
}

// Data: RealQueueDataSource config
interface RealQueueDataSourceConfig {
  /** Event ID to join queue for */
  eventId: string;
  /** CAPTCHA token from UI */
  captchaToken: string;
  /** Guest or authenticated context */
  authContext: AuthContext;
  /** API base URL */
  baseUrl: string;
  /** SSE connection timeout (ms) */
  sseTimeoutMs?: number;
  /** HTTP request timeout (ms) */
  httpTimeoutMs?: number;
}

// Data: QueueHttpClient interface (for testing)
interface QueueHttpClientPort {
  join(
    eventId: string,
    request: QueueJoinRequest,
    headers: Record<string, string>
  ): Promise<Result<QueueJoinResponse, QueueError>>;

  getMe(
    queueToken: string,
    headers?: Record<string, string>
  ): Promise<Result<QueueMeResponse, QueueError>>;
}

// Data: SseClient interface (for testing)
interface SseClientPort {
  connect(url: string, headers: Record<string, string>): void;
  close(): void;
  onMessage(callback: (data: string) => void): void;
  onError(callback: (error: Error) => void): void;
  onClose(callback: () => void): void;
}

// Data: SseMessageParser
interface SseMessageDto {
  /** Event type (position, state, grant, etc.) */
  type?: string;
  /** Queue position */
  position?: number;
  /** Queue state */
  queue_state?: string;
  /** Engagement state */
  engagement_state?: string;
  /** Server time */
  server_time?: string;
  /** Rate per minute */
  rate_per_min?: number;
}
```

---

## Data Models

```typescript
// Reused from GH-5/GH-8 (no changes)
import type {
  QueueState,
  EngagementState,
  QueueJoinRequest,
  QueueJoinResponse,
  AuthContext,
} from "@/core/domain";

import type { QueueUpdate, GrantInfo } from "@/features/queue/domain";

// New in GH-9: Domain error types
export type QueueErrorCode =
  | "CAPTCHA_REQUIRED"
  | "CAPTCHA_FAILED"
  | "DEVICE_ID_REQUIRED"
  | "QUEUE_FULL"
  | "FULL_BOOKED"
  | "UNAUTHORIZED"
  | "TOKEN_INVALID"
  | "EVENT_NOT_FOUND"
  | "SALE_CLOSED"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "SSE_CONNECTION_ERROR"
  | "UNKNOWN_ERROR";

export interface QueueError {
  code: QueueErrorCode;
  message: string;
  retryable: boolean;
  httpStatus?: number;
  queueState?: QueueState;
}

// New in GH-9: /queue/me response
export interface QueueMeResponse {
  state: EngagementState;
  grant_token?: string;
  booking_expires_at?: string;
  server_time: string;
}

// New in GH-9: SSE message DTO
export interface SseMessageDto {
  type?: string;
  position?: number;
  queue_state?: string;
  engagement_state?: string;
  server_time?: string;
  rate_per_min?: number;
}
```

---

## Correctness Properties

### Property 1: QueueDataSource Interface Compatibility

**Validates: Requirements 1.1, 1.2, 1.3**

`RealQueueDataSource` implements the exact same `QueueDataSource` interface as `FakeQueueDataSource`. The `useQueue` hook works unchanged with either adapter. (R1-AC1, R1-AC2, R1-AC3)

### Property 2: FULL_QUEUE ≠ FULL_BOOKED

**Validates: Requirements 7.2, 7.3, 7.5**

`FULL_QUEUE` (503, queue capacity) and `FULL_BOOKED` (409, inventory) are distinct `QueueState` union members. They are never collapsed or conflated. (R7-AC2, R7-AC3, R7-AC5)

### Property 3: Logged-In Grant Requires Both Headers

**Validates: Requirements 11.4**

When `authContext.type === "authenticated"`, grant-protected requests include BOTH `X-Grant-Token` AND `Authorization: Bearer`. Neither is omitted. (R11-AC4)

### Property 4: Guest Queue Join Requires X-Device-Id

**Validates: Requirements 2.2, 2.5, 11.1**

When `authContext.type === "guest"`, queue join includes `X-Device-Id` header. Missing header returns 400 `DEVICE_ID_REQUIRED`. (R2-AC2, R2-AC5, R11-AC1)

### Property 5: sse_url Is Used As-Is

**Validates: Requirements 4.1**

The `sse_url` returned from join is used exactly as-is for SSE connection. The host may differ from the API host, and no URL manipulation is performed. (R4-AC1)

### Property 6: CLOSED Is Terminal

**Validates: Requirements 7.4**

When `queueState === "CLOSED"`, the SSE stream terminates and `onComplete` is called. No further updates are expected. (R7-AC4)

### Property 7: Transport Reconnect ≠ iOS Lifecycle Recovery

**Validates: Requirements 13.4**

Basic transport-level SSE reconnect (R13) is explicitly distinct from iOS lifecycle recovery (GH-11). Transport reconnect uses same `sse_url` and `queue_token`; it does not handle app background/foreground transitions. (R13-AC4)

### Property 8: FakeQueueDataSource Preserved

**Validates: Requirements 10.4**

`FakeQueueDataSource` from GH-8 remains intact and usable. GH-9 adds `RealQueueDataSource` without modifying or deleting GH-8 code. (R10-AC4)

---

## Error Handling

| Error Type            | Layer | Handling Strategy                               | User Feedback                     |
| --------------------- | ----- | ----------------------------------------------- | --------------------------------- |
| CAPTCHA_REQUIRED      | Data  | Return domain error                             | "CAPTCHA verification required"   |
| CAPTCHA_FAILED        | Data  | Return domain error                             | "CAPTCHA verification failed"     |
| DEVICE_ID_REQUIRED    | Data  | Return domain error                             | "Device ID required"              |
| QUEUE_FULL (503)      | Data  | Return retryable error with FULL_QUEUE state    | "Queue is full, please wait"      |
| FULL_BOOKED (409)     | Data  | Return recoverable error with FULL_BOOKED state | "Event is fully booked"           |
| UNAUTHORIZED (401)    | Data  | Return domain error                             | "Session expired"                 |
| TOKEN_INVALID         | Data  | Return domain error                             | "Invalid queue token"             |
| EVENT_NOT_FOUND (404) | Data  | Return domain error                             | "Event not found"                 |
| SALE_CLOSED (410)     | Data  | Return terminal error with CLOSED state         | "Sale has ended"                  |
| NETWORK_ERROR         | Data  | Return retryable error                          | "Network error, please try again" |
| TIMEOUT_ERROR         | Data  | Return retryable error                          | "Request timed out"               |
| SSE_CONNECTION_ERROR  | Data  | Return error, attempt reconnect                 | "Connection lost"                 |
| Malformed SSE         | Data  | Log warning, ignore message                     | None (transparent)                |

---

## Testing Strategy

### Unit Tests

| Test                         | File                         | Purpose                |
| ---------------------------- | ---------------------------- | ---------------------- |
| QueueError type validation   | `queue-error.test.ts`        | R3 error mapping       |
| QueueMeResponse mapping      | `queue-me.test.ts`           | R6 response handling   |
| SseMessageParser happy path  | `sse-message-parser.test.ts` | R5-AC1, R5-AC2         |
| SseMessageParser malformed   | `sse-message-parser.test.ts` | R5-AC4                 |
| SseMessageParser unsupported | `sse-message-parser.test.ts` | R5-AC5                 |
| QueueErrorMapper HTTP 400    | `queue-error-mapper.test.ts` | R3-AC1, R3-AC2, R3-AC3 |
| QueueErrorMapper HTTP 503    | `queue-error-mapper.test.ts` | R3-AC4                 |
| QueueErrorMapper HTTP 409    | `queue-error-mapper.test.ts` | R3-AC5                 |
| QueueErrorMapper HTTP 410    | `queue-error-mapper.test.ts` | R3-AC6                 |
| QueueErrorMapper HTTP 401    | `queue-error-mapper.test.ts` | R3-AC7                 |
| QueueErrorMapper HTTP 404    | `queue-error-mapper.test.ts` | R3-AC8                 |
| Header composition guest     | `headers.test.ts`            | R11-AC1, R11-AC3       |
| Header composition auth      | `headers.test.ts`            | R11-AC2, R11-AC4       |

### Integration Tests (Local Deterministic)

| Test                             | File                          | Purpose                   |
| -------------------------------- | ----------------------------- | ------------------------- |
| Guest join with X-Device-Id      | `RealQueueDataSource.test.ts` | R2-AC2, R2-AC5            |
| Missing guest device ID          | `RealQueueDataSource.test.ts` | R2-AC2                    |
| Captcha-required behavior        | `RealQueueDataSource.test.ts` | R2-AC1, R3-AC1            |
| Successful join returning tokens | `RealQueueDataSource.test.ts` | R2-AC3                    |
| Rejoin response handling         | `RealQueueDataSource.test.ts` | R2-AC4                    |
| /me success                      | `RealQueueDataSource.test.ts` | R6-AC1, R6-AC2, R6-AC3    |
| Invalid queue token              | `RealQueueDataSource.test.ts` | R6-AC4                    |
| SSE position update sequence     | `RealQueueDataSource.test.ts` | R5-AC1                    |
| Grant-related sequence           | `RealQueueDataSource.test.ts` | R5-AC3, R6                |
| FULL_QUEUE handling              | `RealQueueDataSource.test.ts` | R3-AC4, R7-AC2            |
| FULL_BOOKED handling             | `RealQueueDataSource.test.ts` | R3-AC5, R7-AC3            |
| CLOSED sequence                  | `RealQueueDataSource.test.ts` | R3-AC6, R7-AC4            |
| Connection failure               | `RealQueueDataSource.test.ts` | R12-AC3                   |
| Stream cleanup                   | `RealQueueDataSource.test.ts` | R9-AC5                    |
| Adapter selection                | `queue-adapter.test.ts`       | R10-AC1, R10-AC2, R10-AC3 |

### Integration Tests (Deployed Environment)

| Test                          | File                     | Environment Prerequisite                |
| ----------------------------- | ------------------------ | --------------------------------------- |
| Real Queue endpoint reachable | `real-queue.e2e.test.ts` | Deployed Queue service                  |
| Real guest join succeeds      | `real-queue.e2e.test.ts` | Deployed Queue service                  |
| Real SSE connection opens     | `real-queue.e2e.test.ts` | Deployed SSE server                     |
| Real position event received  | `real-queue.e2e.test.ts` | Deployed SSE server                     |
| Real /me behavior             | `real-queue.e2e.test.ts` | Deployed Queue service                  |
| Real FULL_QUEUE behavior      | `real-queue.e2e.test.ts` | Test environment with capacity control  |
| Real FULL_BOOKED behavior     | `real-queue.e2e.test.ts` | Test environment with inventory control |
| Real CLOSED behavior          | `real-queue.e2e.test.ts` | Test environment with sale control      |

**Note:** Deployed environment tests are BLOCKED pending backend deployment verification.

### Render Tests

No new render tests required — WaitingRoomScreen and useQueue are unchanged from GH-8. GH-9 tests focus on data layer.

---

## ADRs (Architecture Decision Records)

### ADR-1: Reuse Existing QueueDataSource Interface

**Context:** GH-8's `useQueue.ts` already defines a `QueueDataSource` interface with `start()`, `stop()`, `retry()`, and `setCallbacks()`. Should GH-9 create a new interface or reuse this one?

**Decision:** Reuse the existing `QueueDataSource` interface from GH-8. It is already transport-agnostic and sufficient for real transport.

**Consequences:**

- ✅ No changes to useQueue hook or WaitingRoomScreen
- ✅ Consistent API for both adapters
- ✅ Enables seamless swap via DI
- ⚠️ May need minor interface evolution if real transport requires additional control (handled via config)

### ADR-2: Separate HTTP and SSE Clients

**Context:** Should `RealQueueDataSource` handle all HTTP and SSE logic internally, or delegate to separate clients?

**Decision:** Extract `QueueHttpClient` and `SseClient` as separate collaborators, each with its own interface for testing.

**Consequences:**

- ✅ Single responsibility — RealQueueDataSource orchestrates, clients handle transport
- ✅ Testable — clients can be mocked independently
- ✅ Replaceable — SSE client can use different implementation (polyfill, native module)
- ⚠️ More files to maintain

### ADR-3: Domain Error Union Over Exception Throwing

**Context:** How should transport errors be communicated to consumers?

**Decision:** Use a discriminated union `QueueError` with explicit error codes rather than throwing exceptions. Return `Result<T, QueueError>` from HTTP methods.

**Consequences:**

- ✅ Type-safe error handling
- ✅ Explicit error cases for each HTTP status
- ✅ Retryable flag for retry logic
- ⚠️ Slightly more verbose than try/catch

### ADR-4: FakeQueueDataSource Preserved, Not Replaced

**Context:** Should GH-9 replace FakeQueueDataSource or keep both adapters?

**Decision:** Preserve FakeQueueDataSource from GH-8 unchanged. RealQueueDataSource is added alongside it.

**Consequences:**

- ✅ Deterministic testing remains available
- ✅ Development without backend dependency
- ✅ No regression risk to GH-8 functionality
- ⚠️ Two adapters to maintain (intentional)

### ADR-5: Basic Transport Reconnect Only (GH-11 Boundary)

**Context:** How much reconnection logic should GH-9 implement?

**Decision:** Implement only basic transport-level reconnect (same sse_url and queue_token after disconnect). iOS lifecycle recovery (background/foreground, /me recovery) is explicitly GH-11 scope.

**Consequences:**

- ✅ Clear scope boundary
- ✅ Avoids iOS-specific complexity
- ✅ Transport reconnect is testable with transport doubles
- ⚠️ Full iOS experience requires GH-11

### ADR-6: poll_tiers Excluded

**Context:** CONTRACT-BASELINE.md documents `poll_tiers` for `/queue/serving` polling fallback. Should GH-9 implement it?

**Decision:** Exclude `poll_tiers`. GH-9's primary path is SSE. Polling fallback via `/queue/serving` is not implemented, and `poll_tiers` has no mobile type currently. Documented under explicit exclusion with ownership unassigned.

**Consequences:**

- ✅ Focused scope on SSE
- ✅ No speculative implementation
- ⚠️ Polling fallback requires future ticket if needed

---

## Dependencies

### Internal Dependencies

**From GH-5 Core Domain (unchanged):**

- `@/core/domain/queue/queue-state.types` — QueueState
- `@/core/domain/queue/engagement.types` — EngagementState
- `@/core/domain/queue/queue-join.types` — QueueJoinRequest, QueueJoinResponse
- `@/core/domain/auth/headers.types` — AuthContext, createQueueHeaders, createGrantHeaders
- `@/core/domain/auth/tokens.types` — QueueToken, GrantToken, DeviceId

**From GH-8 Queue Feature (unchanged):**

- `@/features/queue/domain` — QueueUpdate, GrantInfo
- `@/features/queue/data` — FakeQueueDataSource (preserved)
- `@/features/queue/presentation` — useQueue, QueueDataSource interface

### External Dependencies

- React Native SSE client (react-native-sse or EventSource polyfill) — exact library TBD at implementation
- No new npm packages required for domain/types

### Auth Feature Dependency

GH-9 requires access to `AuthContext` (guest vs authenticated) for header composition. This is already available in `@/core/domain/auth/headers.types`. If GH-9 requires importing directly from the auth feature (e.g., to get current auth state), an approved core port or public API must be used.

**Current evidence:** `AuthContext` is in core/domain and can be imported directly. No cross-feature import required for type-level dependency. Runtime auth state retrieval (if needed) would require `auth/index.ts` public API — to be confirmed at implementation if required.

---

## Risks

| Risk                                | Likelihood | Impact | Mitigation                                                 |
| ----------------------------------- | ---------- | ------ | ---------------------------------------------------------- |
| Backend not deployed in time        | High       | High   | DoR blocked until deployment verified                      |
| SSE client compatibility issues     | Medium     | Medium | Test with transport doubles; document actual client choice |
| GH-11 scope creep into GH-9         | Medium     | Medium | Explicit boundary in requirements and ADR                  |
| Auth state retrieval needs new port | Low        | Low    | AuthContext type is in core; runtime state TBD             |
| poll_tiers ownership unassigned     | Low        | Low    | Documented as excluded; create ticket if needed            |

---

## Open Questions

1. **SSE Client Library:** Which SSE client library to use? `react-native-sse`, EventSource polyfill, or native module?
   - **Proposed Resolution:** Evaluate at implementation based on React Native 0.88 compatibility. Document choice in ADR.

2. **Auth State Retrieval:** Does RealQueueDataSource need runtime auth state, or is AuthContext passed in via config?
   - **Proposed Resolution:** AuthContext passed via config (mirrors GH-6 pattern). No auth feature runtime import needed.

---

## Assessment Mapping

| Focus Area            | Expected Evidence                                                             | Acceptance Criteria / Trade-off                      | Verification Method             |
| --------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------- |
| UI Implementation     | No UI changes                                                                 | GH-9 is data layer only; WaitingRoomScreen unchanged | Code review                     |
| Software Design       | QueueDataSource port, RealQueueDataSource adapter, HTTP/SSE separation        | ADR-1 through ADR-6 document decisions               | Design review, boundary-check   |
| Software Construction | HTTP client, SSE client, error mapper, message parser                         | R2-R13 acceptance criteria                           | Unit + integration tests        |
| Software Quality      | Unit tests, integration tests with transport doubles                          | R16 testability criteria                             | npm test, coverage report       |
| Software Deployment   | N/A for GH-9 spec                                                             | Deployed environment prerequisite                    | External verification (blocked) |
| Software Security     | No token logging, X-Device-Id for guest, both headers for authenticated grant | R11, R14 criteria                                    | Code review, security scan      |

---

## Deployment Dependency

**Status:** External DoR gate — NOT MET

Queue, SSE-server, and admission-controller source implementations exist on backend origin/main. Deployment configurations and CI/CD jobs exist. However:

- Deployment execution NOT proven
- Infrastructure availability NOT verified
- Usable endpoint URL NOT confirmed
- Live endpoint behavior NOT tested

GH-9 implementation authorization and acceptance involving real connections require evidence of a deployed, reachable, usable environment. This is an external prerequisite, not a mobile architecture assumption.
