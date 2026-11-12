# Design — GH-17 Real Events Adapter

## Overview

Implement the real HTTP adapter for the Events feature, replacing the GH-16 fake data source while preserving the repository port pattern. The adapter maps the authoritative `GET /events` contract (5 queue states, simplified display block) to the existing presentation layer.

**Key Design Principle:** The EventRepository interface is the stable boundary. GH-17 adds RealEventDataSource implementing this interface. The domain Event type evolves to match the real contract; presentation adapts to the evolved domain.

**Contract Delta:** The real contract differs from GH-16's fake model:

| Aspect       | GH-16 Fake                            | GH-17 Real                                       |
| ------------ | ------------------------------------- | ------------------------------------------------ |
| QueueState   | NOT_OPEN, DIRECT, OPEN, FULL          | SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED |
| EventStatus  | AVAILABLE, SELLING_OUT_FAST, SOLD_OUT | Not present in list response                     |
| DisplayBlock | enabled, action, labelKey, badgeKey   | enabled only                                     |

---

## Architecture

### Domain Layer Evolution

The domain layer evolves to match the real contract.

```
src/features/events/domain/
├── Event.ts              # Evolves: QueueState changes, EventStatus optional/removed
├── EventRepository.ts    # Unchanged: port interface
└── index.ts              # Barrel export
```

**Changes from GH-16:**

- `QueueState`: 4 values → 5 values (different enum)
- `EventStatus`: Present → Optional/removed (no longer in list response)
- `DisplayBlock`: Full → Simplified (enabled only from server)

### Data Layer Addition

The data layer adds HTTP adapter alongside existing fake.

```
src/features/events/data/
├── FakeEventDataSource.ts    # Kept: for testing
├── FakeEventRepository.ts    # Kept: for testing
├── RealEventDataSource.ts    # NEW: HTTP adapter
├── HttpEventRepository.ts    # NEW: Repository using HTTP source (or merge into existing)
├── dto/
│   └── EventDTO.ts           # NEW: Raw API response types
├── mappers/
│   └── eventMapper.ts        # NEW: DTO → domain mapping
├── fixtures/
│   └── events.ts             # Evolves: update to match new QueueState values
└── index.ts                  # Barrel export
```

**Responsibilities:**

- `RealEventDataSource`: HTTP client calls to `GET /events`
- `EventDTO`: Raw API response structure (snake_case, server schema)
- `eventMapper`: DTO validation and transformation to domain Event
- Existing fake sources updated for new QueueState values (test fixtures)

### Presentation Layer Adaptation

The presentation layer adapts to the evolved domain.

```
src/features/events/presentation/
├── components/
│   ├── EventCard.tsx         # Adapts: handle 5 queue states, no status badge
│   └── ...                   # Other components unchanged
├── hooks/
│   └── useEvents.ts          # May need error handling updates
└── screens/
    └── EventsHomeScreen.tsx  # Unchanged structure
```

**Changes from GH-16:**

- `EventCard`: Queue state labels for 5 states instead of 4
- `EventCard`: Status badge handling for optional/absent status
- Error handling: API-specific error messages

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     App Layer (src/app/)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ (tabs)/index.tsx — renders EventsHomeScreen              │    │
│  └───────────────────────────┬─────────────────────────────┘    │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                  Features: Events                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ features/events/index.ts (public API barrel)             │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │                                  │
│  ┌───────────────────────────▼─────────────────────────────┐    │
│  │ presentation/                                            │    │
│  │   ├── EventsHomeScreen.tsx (unchanged structure)         │    │
│  │   ├── EventCard.tsx (ADAPTS: 5 queue states)             │    │
│  │   └── ...                                                │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │ imports domain types             │
│  ┌───────────────────────────▼─────────────────────────────┐    │
│  │ data/                                                    │    │
│  │   ├── RealEventDataSource.ts (NEW)                       │    │
│  │   │     └── HTTP GET /events                             │    │
│  │   ├── dto/EventDTO.ts (NEW)                              │    │
│  │   │     └── Raw API types (snake_case)                   │    │
│  │   ├── mappers/eventMapper.ts (NEW)                       │    │
│  │   │     └── DTO → Domain mapping                         │    │
│  │   ├── FakeEventDataSource.ts (EVOLVES: new fixtures)     │    │
│  │   └── FakeEventRepository.ts (KEPT)                      │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │ implements interface             │
│  ┌───────────────────────────▼─────────────────────────────┐    │
│  │ domain/                                                  │    │
│  │   ├── Event.ts (EVOLVES: new QueueState)                 │    │
│  │   │     └── QueueState: 5 values                         │    │
│  │   │     └── EventStatus: optional/removed                │    │
│  │   │     └── DisplayBlock: enabled only                   │    │
│  │   └── EventRepository.ts (UNCHANGED)                     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Happy Path (Real API)

```
1. EventsHomeScreen mounts
2. useEvents hook initializes with loading=true
3. useEvents calls eventRepository.getEvents()
4. RealEventRepository delegates to RealEventDataSource
5. RealEventDataSource makes HTTP GET /events?limit=10&offset=0
6. Response received: { data: { items: [...] } }
7. eventMapper validates each EventDTO:
   - Required fields present
   - queue_state in [SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED]
   - display.enabled is boolean
8. Valid DTOs mapped to domain Event[]
9. useEvents updates: loading=false, events=[...], error=null
10. EventsHomeScreen renders EventList with EventCard items
```

### Unknown QueueState Path (Contract Drift)

```
1. RealEventDataSource fetches events
2. Response contains event with queue_state="UNKNOWN_VALUE"
3. eventMapper validates EventDTO
4. Validation FAILS for that event (R17-AC1)
5. Error logged with actual value (R17-AC3)
6. Depending on configuration:
   a. Strict: Entire request fails, ErrorState rendered
   b. Lenient: Invalid event skipped, valid events rendered
7. NO silent fallback to any known state (R17-AC4)
```

### API Error Path

```
1. RealEventDataSource makes HTTP request
2. Server returns 503 INTERNAL_ERROR
3. RealEventDataSource catches and maps to domain ApiError
4. useEvents updates: loading=false, events=[], error=ApiError
5. EventsHomeScreen renders ErrorState with retry
6. User taps retry → request retried
```

---

## Components and Interfaces

### Components

| Component           | Responsibility              | Layer        | GH-17 Change               |
| ------------------- | --------------------------- | ------------ | -------------------------- |
| Event               | Domain entity type          | Domain       | EVOLVES: QueueState values |
| EventRepository     | Port interface              | Domain       | UNCHANGED                  |
| RealEventDataSource | HTTP client for GET /events | Data         | NEW                        |
| EventDTO            | Raw API response types      | Data         | NEW                        |
| eventMapper         | DTO validation and mapping  | Data         | NEW                        |
| FakeEventDataSource | Test fixtures               | Data         | EVOLVES: new fixtures      |
| EventCard           | Event display component     | Presentation | ADAPTS: 5 states           |

### Interfaces

```typescript
// ============================================================================
// Domain: Evolved Event types (src/features/events/domain/Event.ts)
// ============================================================================

/**
 * Queue admission state - EVOLVED for real contract
 * @see sjtrbt20261112.openapi.json GET /events
 */
export type QueueState =
  | "SCHEDULED" // Sale not yet opened; display.enabled=false
  | "OPEN" // Queue accepting participants; display.enabled=true
  | "FULL_QUEUE" // Queue capacity reached; display.enabled=false
  | "FULL_BOOKED" // Inventory exhaustion (reversible); display.enabled=true
  | "CLOSED"; // Terminal sale closure; display.enabled=false

/**
 * Server-computed display hints - SIMPLIFIED for real contract
 * Real contract provides only `enabled`; action/labelKey/badgeKey removed
 */
export type DisplayBlock = {
  /** Whether the CTA button is active/clickable */
  enabled: boolean;
};

/**
 * Event domain entity - EVOLVED for real contract
 * EventStatus removed (not in list response)
 */
export type Event = {
  id: string;
  name: string;
  category: string;
  location: string; // Combined venue/city from API
  date: string; // ISO date string
  imageUrl: string;
  queueState: QueueState;
  display: DisplayBlock;
  saleStartsAt?: string; // Optional, for SCHEDULED state
};

// ============================================================================
// Data: EventDTO types (src/features/events/data/dto/EventDTO.ts)
// ============================================================================

/**
 * Raw API response for GET /events
 * Uses snake_case matching server contract
 */
export type EventDTO = {
  id: string;
  name: string;
  category: string;
  location: string;
  date: string;
  image_url: string;
  queue_state: string; // Validated against QueueState values
  sale_starts_at?: string | null;
  display: {
    enabled: boolean;
  };
};

/**
 * GET /events response envelope
 */
export type EventsResponseDTO = {
  data: {
    items: EventDTO[];
  };
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
};

// ============================================================================
// Data: Mapper interface
// ============================================================================

/**
 * Validation result for EventDTO
 */
export type EventDTOValidationResult =
  | { valid: true; event: Event }
  | { valid: false; error: string; dto: EventDTO };

/**
 * Maps and validates EventDTO to domain Event
 * @throws never - returns validation result instead
 */
export function mapEventDTO(dto: EventDTO): EventDTOValidationResult;

// ============================================================================
// Domain: EventRepository (UNCHANGED)
// ============================================================================

export interface EventRepository {
  getEvents(params?: { limit?: number; offset?: number }): Promise<Event[]>;
  getEvent(eventId: string): Promise<Event>;
}
```

---

## Data Models

### EventDTO (Data Layer)

```typescript
// src/features/events/data/dto/EventDTO.ts

/**
 * Valid queue_state values from real contract
 */
export const VALID_QUEUE_STATES = [
  "SCHEDULED",
  "OPEN",
  "FULL_QUEUE",
  "FULL_BOOKED",
  "CLOSED",
] as const;

export type ValidQueueState = (typeof VALID_QUEUE_STATES)[number];

export function isValidQueueState(value: string): value is ValidQueueState {
  return VALID_QUEUE_STATES.includes(value as ValidQueueState);
}

/**
 * Raw API event structure (snake_case)
 */
export type EventDTO = {
  id: string;
  name: string;
  category: string;
  location: string;
  date: string;
  image_url: string;
  queue_state: string;
  sale_starts_at?: string | null;
  display: {
    enabled: boolean;
  };
};

/**
 * Full response envelope
 */
export type EventsResponseDTO = {
  data: {
    items: EventDTO[];
  };
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
};
```

### Event (Domain Layer - Evolved)

```typescript
// src/features/events/domain/Event.ts - EVOLVED

/**
 * Queue admission state
 * GH-17: Evolved from GH-16 values to real contract values
 *
 * @see CONTRACT-BASELINE.md §2.3
 * @see sjtrbt20261112.openapi.json GET /events
 */
export type QueueState =
  | "SCHEDULED" // Sale not yet opened
  | "OPEN" // Queue accepting participants
  | "FULL_QUEUE" // Queue capacity reached (temporary)
  | "FULL_BOOKED" // Inventory exhaustion (reversible)
  | "CLOSED"; // Terminal sale closure

/**
 * Server-computed display hints
 * GH-17: Simplified from GH-16 (action/labelKey/badgeKey no longer in contract)
 */
export type DisplayBlock = {
  /** Whether the CTA button is active/clickable */
  enabled: boolean;
};

/**
 * Event domain entity
 * GH-17: EventStatus removed (not in GET /events list response)
 */
export type Event = {
  /** Unique event identifier */
  id: string;
  /** Event display name */
  name: string;
  /** Event category (e.g., "LIVE MUSIC") */
  category: string;
  /** Location string */
  location: string;
  /** Event date as ISO string */
  date: string;
  /** Event image URL */
  imageUrl: string;
  /** Queue admission state */
  queueState: QueueState;
  /** Server-computed display hints */
  display: DisplayBlock;
  /** When sale starts (optional, for SCHEDULED) */
  saleStartsAt?: string;
};

// GH-16 types REMOVED:
// - EventStatus: "AVAILABLE" | "SELLING_OUT_FAST" | "SOLD_OUT"
// - display.action: "JOIN_QUEUE" | "GO_TO_TICKETS" | "NONE"
// - display.labelKey: string
// - display.badgeKey: string | null
```

---

## Correctness Properties

### Property 1: FULL_QUEUE ≠ FULL_BOOKED ≠ CLOSED Distinctness

**Validates: Requirements 5.4, 5.5, 5.6, 7.3, 7.4, 8.4**

These three states MUST remain distinct in domain model and never be collapsed. They have different semantics: (R5-AC4, R5-AC5, R5-AC6, R7-AC3, R7-AC4, R8-AC4)

- FULL_QUEUE: Queue capacity, joining unavailable, display.enabled=false
- FULL_BOOKED: Inventory exhaustion, reversible, display.enabled=true
- CLOSED: Terminal, irreversible, display.enabled=false

**Verification:** Type system enforces discriminated union; unit tests for each state.

### Property 2: No Silent Enum Fallback

**Validates: Requirements 17.1, 17.2, 17.4**

Unknown queue_state values MUST fail validation deterministically. No mapping to SCHEDULED, OPEN, or any other known state. (R17-AC1, R17-AC2, R17-AC4)

**Verification:** Unit test with unknown value; assertion that error is thrown, not a mapped value returned.

### Property 3: DTO Boundary Isolation

**Validates: Requirements 4.5, 20.2, 20.4**

EventDTO types exist only in data layer. Presentation layer imports only domain Event. (R4-AC5, R20-AC2, R20-AC4)

**Verification:** `grep -r "EventDTO" src/features/events/presentation/` returns zero hits; boundary-check passes.

### Property 4: Repository Port Stability

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

EventRepository interface is unchanged. RealEventDataSource implements the same interface as FakeEventDataSource. (R4-AC1 through R4-AC4)

**Verification:** TypeScript compilation; both implementations satisfy interface.

### Property 5: DIRECT Removal Completeness

**Validates: Requirements 9.1, 9.2**

No DIRECT value exists in QueueState type. No code references DIRECT. (R9-AC1, R9-AC2)

**Verification:** `grep -rn "DIRECT" src/features/events/` returns zero hits (excluding comments/docs).

### Property 6: display.enabled Server Authority

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

display.enabled comes from server, not synthesized. Presentation respects server value. (R6-AC1 through R6-AC4)

**Verification:** Mapper does not compute enabled; unit test confirms passthrough.

---

## Error Handling

| Error Type             | Source     | Handling Strategy                    | User Feedback                 |
| ---------------------- | ---------- | ------------------------------------ | ----------------------------- |
| 400 VALIDATION_ERROR   | API        | Map to ApiError, preserve error_code | "Invalid request" + retry     |
| 503 INTERNAL_ERROR     | API        | Map to ApiError, classify retryable  | "Service unavailable" + retry |
| Network timeout        | HTTP       | Map to ApiError (NETWORK_ERROR)      | "Connection failed" + retry   |
| Malformed JSON         | HTTP       | Map to ApiError (PARSE_ERROR)        | "Unexpected response" + retry |
| Unknown queue_state    | Validation | Map to ApiError (CONTRACT_DRIFT)     | "Data error" + retry          |
| Missing required field | Validation | Map to ApiError (VALIDATION_ERROR)   | "Data error" + retry          |

---

## Testing Strategy

### Unit Tests

| Test ID     | Test Case                                    | Classification | Requirement    |
| ----------- | -------------------------------------------- | -------------- | -------------- |
| UT-EVT17-01 | GET /events request with defaults            | unit           | R2-AC3         |
| UT-EVT17-02 | GET /events request with custom limit/offset | unit           | R2-AC4         |
| UT-EVT17-03 | Request has no auth headers                  | unit           | R2-AC2         |
| UT-EVT17-04 | SCHEDULED DTO maps correctly                 | unit           | R5-AC2         |
| UT-EVT17-05 | OPEN DTO maps correctly                      | unit           | R5-AC3         |
| UT-EVT17-06 | FULL_QUEUE DTO maps correctly                | unit           | R5-AC4         |
| UT-EVT17-07 | FULL_BOOKED DTO maps correctly               | unit           | R5-AC5         |
| UT-EVT17-08 | CLOSED DTO maps correctly                    | unit           | R5-AC6         |
| UT-EVT17-09 | display.enabled passthrough                  | unit           | R6-AC1, R6-AC2 |
| UT-EVT17-10 | sale_starts_at null handling                 | unit           | R4-AC3         |
| UT-EVT17-11 | Unknown queue_state rejects                  | unit           | R17-AC1        |
| UT-EVT17-12 | Malformed DTO rejects                        | unit           | R3-AC5         |
| UT-EVT17-13 | 400 error mapping                            | unit           | R13-AC1        |
| UT-EVT17-14 | 503 error mapping                            | unit           | R14-AC1        |
| UT-EVT17-15 | Network error mapping                        | unit           | R15-AC1        |

### Integration Tests

| Test ID     | Test Case                      | Classification | Requirement    |
| ----------- | ------------------------------ | -------------- | -------------- |
| IT-EVT17-01 | Successful GET /events (MSW)   | integration    | R1-AC1, R1-AC2 |
| IT-EVT17-02 | Empty collection               | integration    | R12-AC1        |
| IT-EVT17-03 | Pagination params              | integration    | R18-AC2        |
| IT-EVT17-04 | All 5 queue states in response | integration    | R5             |
| IT-EVT17-05 | 400 response handling          | integration    | R13-AC3        |
| IT-EVT17-06 | 503 response handling          | integration    | R14-AC3        |
| IT-EVT17-07 | Network failure handling       | integration    | R15-AC3        |
| IT-EVT17-08 | Contract drift detection       | integration    | R16-AC2        |

### Render/Regression Tests

| Test ID     | Test Case                       | Classification | Requirement |
| ----------- | ------------------------------- | -------------- | ----------- |
| RT-EVT17-01 | SCHEDULED EventCard renders     | render         | R11-AC2     |
| RT-EVT17-02 | OPEN EventCard renders          | render         | R11-AC2     |
| RT-EVT17-03 | FULL_QUEUE EventCard renders    | render         | R11-AC2     |
| RT-EVT17-04 | FULL_BOOKED EventCard renders   | render         | R11-AC2     |
| RT-EVT17-05 | CLOSED EventCard renders        | render         | R11-AC2     |
| RT-EVT17-06 | Mixed states list               | render         | R11-AC1     |
| RT-EVT17-07 | Empty list                      | render         | R12-AC2     |
| RT-EVT17-08 | GH-16 regression (list renders) | render         | R11-AC1     |

---

## ADRs (Architecture Decision Records)

### ADR-GH17-01: Strict Unknown Enum Rejection

**Context:** Unknown queue_state values could be handled by: (A) silent fallback to a default, (B) strict rejection, (C) skip invalid items.

**Decision:** Strict rejection (B) by default. Invalid events fail validation. No silent fallback to any known state.

**Consequences:**

- (+) Contract drift is detected immediately
- (+) No incorrect UI state from guessed mapping
- (-) A single bad event can fail the entire list
- Mitigation: Configurable lenient mode for production resilience (skip invalid, log)

### ADR-GH17-02: Domain Type Evolution

**Context:** GH-16 domain types (QueueState, EventStatus, DisplayBlock) don't match real contract. Options: (A) Add new types alongside, (B) Evolve existing types, (C) Adapter layer.

**Decision:** Evolve existing types (B). QueueState becomes 5 values. EventStatus removed. DisplayBlock simplified.

**Consequences:**

- (+) No parallel type systems
- (+) Single source of truth
- (-) GH-16 fixtures must update
- (-) EventCard must adapt
- Mitigation: Update fixtures in same PR; EventCard changes are presentation-only

### ADR-GH17-03: DTO Isolation

**Context:** Raw API response could be: (A) directly used as domain, (B) isolated in data layer with mapping.

**Decision:** DTO isolation (B). EventDTO lives in data/dto/, mapper transforms to domain Event.

**Consequences:**

- (+) Domain layer has no snake_case or API structure knowledge
- (+) Validation happens at data boundary
- (+) Contract changes don't leak to presentation
- (-) Mapping code to maintain

### ADR-GH17-04: Presentation-Derived Labels

**Context:** Server no longer provides display.action/labelKey/badgeKey. Options: (A) synthesize server-like labels, (B) derive in presentation from queue_state.

**Decision:** Derive in presentation (B). EventCard maps queueState to labels directly.

**Consequences:**

- (+) No invented contract fields
- (+) Presentation owns its display logic
- (-) Label logic moves from data to presentation
- Note: Labels for FULL_BOOKED may need PRODUCT_COPY_CONFIRMATION_REQUIRED

### ADR-GH17-05: Preserve FakeEventDataSource

**Context:** GH-17 adds real adapter. Options: (A) remove fake, (B) keep fake alongside.

**Decision:** Keep fake alongside (B). Evolve fake fixtures to match new QueueState values.

**Consequences:**

- (+) Tests don't require MSW/network
- (+) Development can use fake
- (-) Two data sources to maintain
- Mitigation: Fake is simple; evolution is one-time update

---

## Dependencies

### Internal Dependencies

| Module               | Purpose                 |
| -------------------- | ----------------------- |
| GH-16 Events feature | Base presentation layer |
| core/domain/api      | ApiError types          |
| core/data            | HTTP client (if exists) |

### External Dependencies

| Package      | Purpose            | Notes          |
| ------------ | ------------------ | -------------- |
| React Native | Networking (fetch) | Built-in       |
| MSW          | Test HTTP mocking  | Dev dependency |

---

## Risks

| Risk                              | Likelihood | Impact | Mitigation                                 |
| --------------------------------- | ---------- | ------ | ------------------------------------------ |
| Backend contract changes          | Low        | High   | DTO validation catches drift               |
| Unknown queue_state in production | Low        | Medium | Lenient mode option                        |
| EventCard label confusion         | Medium     | Medium | Mark as PRODUCT_COPY_CONFIRMATION_REQUIRED |
| Performance with large lists      | Low        | Low    | Pagination support ready                   |

---

## Open Questions

**Resolved:**

1. ~~How to handle DIRECT removal?~~ **Resolved:** Remove from QueueState type entirely
2. ~~How to handle missing EventStatus?~~ **Resolved:** Remove from Event type; presentation handles absence
3. ~~What labels for FULL_BOOKED?~~ **Partially resolved:** Mark PRODUCT_COPY_CONFIRMATION_REQUIRED for user-facing copy

**Pending (non-blocking):**

1. **FULL_BOOKED user-facing label:** What should the CTA/badge say? Options:
   - "May Return" (implies inventory recovery)
   - "Notify Me" (implies waitlist)
   - Server guidance needed

   **Status:** PRODUCT_COPY_CONFIRMATION_REQUIRED — does not block implementation, blocks final label text

---

## GH-16 → GH-17 Evolution Summary

### Domain Changes

| Type                  | GH-16                                 | GH-17                                            | Change               |
| --------------------- | ------------------------------------- | ------------------------------------------------ | -------------------- |
| QueueState            | NOT_OPEN, DIRECT, OPEN, FULL          | SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED | Complete replacement |
| EventStatus           | AVAILABLE, SELLING_OUT_FAST, SOLD_OUT | (removed)                                        | Deleted              |
| DisplayBlock.enabled  | boolean                               | boolean                                          | Unchanged            |
| DisplayBlock.action   | JOIN_QUEUE, GO_TO_TICKETS, NONE       | (removed)                                        | Deleted              |
| DisplayBlock.labelKey | string                                | (removed)                                        | Deleted              |
| DisplayBlock.badgeKey | string \| null                        | (removed)                                        | Deleted              |
| Event.status          | EventStatus                           | (removed)                                        | Deleted              |
| Event.venue           | string                                | (merged into location)                           | Renamed              |
| Event.city            | string                                | (merged into location)                           | Renamed              |
| Event.saleStartsAt    | (not present)                         | string \| undefined                              | Added                |

### Presentation Changes

| Component          | GH-16               | GH-17                   | Change          |
| ------------------ | ------------------- | ----------------------- | --------------- |
| QUEUE_STATE_LABELS | 4 entries           | 5 entries               | Values changed  |
| STATUS_LABELS      | 3 entries           | (removed)               | Deleted         |
| Status badge       | Renders status      | Not rendered            | Feature removed |
| CTA button text    | From display.action | Derived from queueState | Logic moved     |

### Files Affected

| File                                                        | Change Type                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/features/events/domain/Event.ts`                       | MODIFY: QueueState values, remove EventStatus, simplify DisplayBlock |
| `src/features/events/data/dto/EventDTO.ts`                  | CREATE: Raw API types                                                |
| `src/features/events/data/mappers/eventMapper.ts`           | CREATE: DTO → domain mapping                                         |
| `src/features/events/data/RealEventDataSource.ts`           | CREATE: HTTP adapter                                                 |
| `src/features/events/data/fixtures/events.ts`               | MODIFY: New QueueState fixtures                                      |
| `src/features/events/presentation/components/EventCard.tsx` | MODIFY: 5 states, no status badge                                    |
| `src/features/events/index.ts`                              | MODIFY: Export new types                                             |
