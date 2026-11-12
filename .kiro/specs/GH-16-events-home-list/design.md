# Design — GH-16 Events Home and List (Fake Data Source)

## Overview

Implement the Events Home/List feature using Clean Architecture with a substitutable data source. The fake data source provides deterministic fixtures for development and testing while maintaining schema alignment with the canonical mobile API contract. GH-17 will later replace the fake implementation with a real HTTP adapter.

**Key Design Principle:** The boundary between domain and data layers is the EventRepository interface. The fake implementation sits entirely in the data layer, and the domain/presentation layers have no knowledge of whether data is fake or real.

---

## Architecture

### Domain Layer

The domain layer defines the Event entity and the EventRepository port interface.

```
src/features/events/domain/
├── Event.ts              # Event entity type
├── EventRepository.ts    # Repository interface (port)
└── index.ts              # Domain barrel export
```

**Responsibilities:**

- Define Event, EventStatus, QueueState, DisplayBlock types
- Define EventRepository interface
- NO implementation logic, NO external dependencies

### Data Layer

The data layer implements the EventRepository port with a fake data source.

```
src/features/events/data/
├── FakeEventDataSource.ts    # Deterministic fixture provider
├── FakeEventRepository.ts    # Repository implementation using fake source
├── fixtures/
│   └── events.ts             # Fixture data matching canonical contract
└── index.ts                  # Data barrel export
```

**Responsibilities:**

- Implement EventRepository using FakeEventDataSource
- Provide deterministic fixture data
- Support loading delay simulation
- Support error simulation for testing

### Presentation Layer

The presentation layer contains the UI components and screen.

```
src/features/events/presentation/
├── components/
│   ├── EventCard.tsx         # Feature-local event card
│   ├── EventList.tsx         # FlatList wrapper
│   ├── LoadingState.tsx      # Feature-local loading indicator
│   ├── EmptyState.tsx        # Feature-local empty state
│   └── ErrorState.tsx        # Feature-local error state
├── hooks/
│   └── useEvents.ts          # Data fetching hook
├── screens/
│   └── EventsHomeScreen.tsx  # Main screen composition
└── index.ts                  # Presentation barrel export
```

**Responsibilities:**

- Render event list using EventCard
- Handle loading, empty, error states
- Compose UI using feature-local components

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     App Layer (src/app/)                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ (tabs)/index.tsx — renders EventsHomeScreen              │    │
│  │ imports from @/features/events                           │    │
│  └───────────────────────────┬─────────────────────────────┘    │
└──────────────────────────────┼──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                  Features: Events                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ features/events/index.ts (public API barrel)             │    │
│  │   └── exports EventsHomeScreen, useEvents                │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │                                  │
│  ┌───────────────────────────▼─────────────────────────────┐    │
│  │ presentation/                                            │    │
│  │   ├── EventsHomeScreen.tsx                               │    │
│  │   │     └── uses useEvents hook                          │    │
│  │   │     └── renders EventList / LoadingState / etc.      │    │
│  │   ├── EventCard.tsx (feature-local)                      │    │
│  │   ├── EventList.tsx (FlatList wrapper)                   │    │
│  │   └── LoadingState / EmptyState / ErrorState             │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │ imports domain types             │
│  ┌───────────────────────────▼─────────────────────────────┐    │
│  │ data/                                                    │    │
│  │   ├── FakeEventRepository.ts                             │    │
│  │   │     └── implements EventRepository                   │    │
│  │   │     └── uses FakeEventDataSource                     │    │
│  │   └── FakeEventDataSource.ts                             │    │
│  │         └── provides fixture data                        │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              │ implements interface             │
│  ┌───────────────────────────▼─────────────────────────────┐    │
│  │ domain/                                                  │    │
│  │   ├── Event.ts — Event, EventStatus, QueueState types    │    │
│  │   └── EventRepository.ts — interface (port)              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Happy Path (Populated)

```
1. EventsHomeScreen mounts
2. useEvents hook initializes with loading=true
3. useEvents calls eventRepository.getEvents()
4. FakeEventRepository delegates to FakeEventDataSource
5. FakeEventDataSource returns deterministic fixtures (with optional delay)
6. useEvents updates: loading=false, events=[...], error=null
7. EventsHomeScreen renders EventList with EventCard items
```

### Empty Path

```
1. EventsHomeScreen mounts
2. useEvents hook initializes with loading=true
3. useEvents calls eventRepository.getEvents()
4. FakeEventDataSource returns empty array (configured for test)
5. useEvents updates: loading=false, events=[], error=null
6. EventsHomeScreen renders EmptyState
```

### Error Path

```
1. EventsHomeScreen mounts
2. useEvents hook initializes with loading=true
3. useEvents calls eventRepository.getEvents()
4. FakeEventDataSource throws Error (configured for test)
5. useEvents updates: loading=false, events=[], error=Error
6. EventsHomeScreen renders ErrorState with retry action
7. User taps retry → goto step 2
```

---

## Components and Interfaces

### Components

| Component           | Responsibility                              | Layer        |
| ------------------- | ------------------------------------------- | ------------ |
| Event               | Domain entity type for event data           | Domain       |
| EventRepository     | Port interface for event data access        | Domain       |
| FakeEventDataSource | Provides deterministic fixture data         | Data         |
| FakeEventRepository | Implements EventRepository with fake source | Data         |
| EventCard           | Displays single event summary               | Presentation |
| EventList           | FlatList wrapper for event cards            | Presentation |
| LoadingState        | Loading indicator component                 | Presentation |
| EmptyState          | Empty state message component               | Presentation |
| ErrorState          | Error state with retry component            | Presentation |
| EventsHomeScreen    | Main screen composing all states            | Presentation |
| useEvents           | React hook for data fetching                | Presentation |

### Interfaces

```typescript
// Domain: Event entity
export type EventStatus = "AVAILABLE" | "SELLING_OUT_FAST" | "SOLD_OUT";

export type QueueState = "NOT_OPEN" | "DIRECT" | "OPEN" | "FULL";

export type DisplayBlock = {
  enabled: boolean;
  action: "JOIN_QUEUE" | "GO_TO_TICKETS" | "NONE";
  labelKey: string;
  badgeKey: string | null;
};

export type Event = {
  id: string;
  name: string;
  category: string;
  venue: string;
  city: string;
  date: string; // ISO date string
  imageUrl: string;
  status: EventStatus;
  queueState: QueueState;
  display: DisplayBlock;
};

// Domain: Repository port
export interface EventRepository {
  getEvents(): Promise<Event[]>;
  getEvent(eventId: string): Promise<Event>;
}

// Presentation: Hook return type
export type UseEventsResult = {
  events: Event[];
  loading: boolean;
  error: Error | null;
  retry: () => void;
};

// Presentation: EventCard props
export type EventCardProps = {
  event: Event;
  onPress?: () => void; // Placeholder for future navigation
};
```

---

## Data Models

### Event (Domain Entity)

```typescript
// src/features/events/domain/Event.ts

export type EventStatus = "AVAILABLE" | "SELLING_OUT_FAST" | "SOLD_OUT";

export type QueueState = "NOT_OPEN" | "DIRECT" | "OPEN" | "FULL";

export type DisplayBlock = {
  /** Whether the CTA button is active/clickable */
  enabled: boolean;
  /** Action type for the CTA */
  action: "JOIN_QUEUE" | "GO_TO_TICKETS" | "NONE";
  /** i18n key for button label */
  labelKey: string;
  /** i18n key for status badge (optional) */
  badgeKey: string | null;
};

export type Event = {
  /** Unique event identifier */
  id: string;
  /** Event display name */
  name: string;
  /** Event category (e.g., "LIVE MUSIC") */
  category: string;
  /** Venue name */
  venue: string;
  /** City name */
  city: string;
  /** Event date as ISO string */
  date: string;
  /** Event image URL */
  imageUrl: string;
  /** Ticket availability status */
  status: EventStatus;
  /** Queue admission state */
  queueState: QueueState;
  /** Server-computed display hints */
  display: DisplayBlock;
};
```

### Fixture Data

```typescript
// src/features/events/data/fixtures/events.ts
// Matches web MSW fixtures and canonical contract

export const FAKE_EVENTS: Event[] = [
  {
    id: "evt_konser_a",
    name: "Konser A",
    category: "LIVE MUSIC",
    venue: "GBK",
    city: "Jakarta",
    date: "2026-12-25",
    imageUrl: "/images/concert-placeholder.webp",
    status: "AVAILABLE",
    queueState: "OPEN",
    display: {
      enabled: true,
      action: "JOIN_QUEUE",
      labelKey: "join_queue",
      badgeKey: null,
    },
  },
  {
    id: "evt_konser_b",
    name: "Konser B",
    category: "LIVE MUSIC",
    venue: "GOR Saparua",
    city: "Bandung",
    date: "2027-01-10",
    imageUrl: "/images/concert-placeholder.webp",
    status: "SELLING_OUT_FAST",
    queueState: "FULL",
    display: {
      enabled: false,
      action: "NONE",
      labelKey: "queue_full",
      badgeKey: "selling_out_fast",
    },
  },
  {
    id: "evt_konser_c",
    name: "Konser C",
    category: "LIVE MUSIC",
    venue: "Jatim Expo",
    city: "Surabaya",
    date: "2027-02-02",
    imageUrl: "/images/concert-placeholder.webp",
    status: "AVAILABLE",
    queueState: "NOT_OPEN",
    display: {
      enabled: false,
      action: "NONE",
      labelKey: "sale_not_open",
      badgeKey: "coming_soon",
    },
  },
  // Additional fixture for DIRECT queue state
  {
    id: "evt_konser_d",
    name: "Konser D",
    category: "LIVE MUSIC",
    venue: "Ancol Beach",
    city: "Jakarta",
    date: "2027-03-15",
    imageUrl: "/images/concert-placeholder.webp",
    status: "AVAILABLE",
    queueState: "DIRECT",
    display: {
      enabled: true,
      action: "GO_TO_TICKETS",
      labelKey: "buy_tickets",
      badgeKey: null,
    },
  },
  // Additional fixture for SOLD_OUT status
  {
    id: "evt_konser_e",
    name: "Konser E",
    category: "LIVE MUSIC",
    venue: "Istora Senayan",
    city: "Jakarta",
    date: "2026-11-30",
    imageUrl: "/images/concert-placeholder.webp",
    status: "SOLD_OUT",
    queueState: "OPEN", // Queue was open but tickets exhausted
    display: {
      enabled: false,
      action: "NONE",
      labelKey: "sold_out",
      badgeKey: "sold_out",
    },
  },
];
```

---

## Correctness Properties

### Property 1: Fake Data Matches Canonical Contract

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 5.5, 11.1, 11.2**

Fake fixture Event objects use the exact field names and enum values defined in docs/CONTRACT-BASELINE.md and the web implementation. (R3-AC1, R3-AC2, R3-AC3, R3-AC4, R5-AC5, R11-AC1, R11-AC2)

**Verification:** Type-level enforcement via shared Event type; code review against CONTRACT-BASELINE.md and web fixtures.

### Property 2: Repository Port Isolation

**Validates: Requirements 4.1, 4.4, 12.1, 12.2**

The EventRepository interface contains no implementation details. Swapping FakeEventDataSource for RealEventDataSource requires changing only the data layer wiring, not domain or presentation code. (R4-AC1, R4-AC4, R12-AC1, R12-AC2)

**Verification:** Grep for data source imports in domain/presentation layers returns zero hits.

### Property 3: Feature-Local Components

**Validates: Requirements 2.1, 6.2, 10.4**

EventCard, LoadingState, EmptyState, and ErrorState are defined within features/events/presentation, not in core/presentation or Signal UI. The feature exports only its public API via index.ts. (R2-AC1, R6-AC2, R10-AC4)

**Verification:** `grep -r "EventCard" src/core/` returns zero hits; boundary-check passes.

### Property 4: Clean Architecture Layer Compliance

**Validates: Requirements 10.1, 10.2, 10.3**

Domain layer imports only TypeScript. Data layer imports only domain. Presentation can import both plus React/RN. (R10-AC1, R10-AC2, R10-AC3)

**Verification:** `npm run boundary-check` passes; eslint-plugin-boundaries enforces.

### Property 5: State Machine Completeness

**Validates: Requirements 1.1, 6.1, 7.1, 8.1**

The UI renders exactly one of: LoadingState, EventList (populated), EmptyState, or ErrorState at any time — never a combination. (R1-AC1, R6-AC1, R7-AC1, R8-AC1)

**Verification:** Render tests for each state; visual inspection.

### Property 6: Status and QueueState Independence

**Validates: Requirements 5.4**

EventStatus (ticket availability) and QueueState (queue admission) are orthogonal. The fixture includes status=AVAILABLE with queueState=FULL to demonstrate this. (R5-AC4)

**Verification:** Fixture data includes the combination; type system enforces both fields exist.

---

## Error Handling

| Error Type                | Layer        | Handling Strategy                    | User Feedback                |
| ------------------------- | ------------ | ------------------------------------ | ---------------------------- |
| Network error (simulated) | Data         | Throw Error from FakeEventDataSource | ErrorState with retry button |
| Empty data                | Data         | Return empty array                   | EmptyState component         |
| Image load failure        | Presentation | Image onError → show placeholder     | Placeholder image displayed  |
| Invalid event data        | Data         | Should not occur with fake data      | N/A (controlled fixtures)    |

---

## Testing Strategy

### Unit Tests

| Test Case                                               | Classification | Requirement Coverage |
| ------------------------------------------------------- | -------------- | -------------------- |
| Event type matches contract schema                      | unit           | R3, R11              |
| EventRepository interface is pure port                  | unit           | R4                   |
| FakeEventDataSource getEvents() returns fixtures        | unit           | R5                   |
| FakeEventDataSource getEvent(id) returns specific event | unit           | R5-AC7               |
| FakeEventDataSource can simulate delay                  | unit           | R5-AC6               |
| FakeEventDataSource can simulate error                  | unit           | R8-AC4               |
| useEvents hook loading state                            | unit           | R6                   |
| useEvents hook success state                            | unit           | R1                   |
| useEvents hook empty state                              | unit           | R7                   |
| useEvents hook error state                              | unit           | R8                   |
| useEvents hook retry functionality                      | unit           | R8-AC3               |

### Integration Tests

| Test Case                                     | Classification | Requirement Coverage |
| --------------------------------------------- | -------------- | -------------------- |
| Repository implementation satisfies interface | integration    | R4, R5               |

### Render Tests

| Test Case                                                    | Classification | Requirement Coverage |
| ------------------------------------------------------------ | -------------- | -------------------- |
| EventCard renders all required fields                        | render         | R2                   |
| EventCard renders status badge correctly                     | render         | R2-AC3               |
| EventCard renders queue state indicator                      | render         | R2-AC4               |
| EventCard renders disabled button when display.enabled=false | render         | R2-AC5               |
| EventCard renders enabled button when display.enabled=true   | render         | R2-AC6               |
| EventCard renders image                                      | render         | R9-AC1               |
| EventCard renders placeholder for invalid image              | render         | R9-AC2               |
| LoadingState renders loading indicator                       | render         | R6-AC1               |
| EmptyState renders empty message                             | render         | R7-AC2               |
| ErrorState renders error message                             | render         | R8-AC2               |
| ErrorState renders retry button                              | render         | R8-AC3               |
| EventsHomeScreen renders loading state                       | render         | R6                   |
| EventsHomeScreen renders populated list                      | render         | R1                   |
| EventsHomeScreen renders empty state                         | render         | R7                   |
| EventsHomeScreen renders error state                         | render         | R8                   |

---

## ADRs (Architecture Decision Records)

### ADR-GH16-01: Feature-Local Components

**Context:** GH-16 needs EventCard, loading, empty, and error state components. Options: (A) Add to Signal UI, (B) Add to core/presentation, (C) Keep feature-local.

**Decision:** Keep all components feature-local in features/events/presentation/components.

**Consequences:**

- (+) No Signal UI expansion for one ticket
- (+) Components can evolve with Events feature independently
- (+) Clear ownership within feature boundary
- (-) May duplicate patterns if other features need similar components
- Mitigation: Extract to core/presentation in a future ticket if pattern stabilizes

### ADR-GH16-02: React Native Image

**Context:** Event images need to be displayed. Options: (A) React Native Image, (B) expo-image, (C) react-native-fast-image.

**Decision:** Use React Native's built-in Image component.

**Consequences:**

- (+) No additional dependencies
- (+) Sufficient for static image display
- (+) Aligns with rulings (no third-party image library required)
- (-) May lack advanced caching/optimization
- Mitigation: Can upgrade to expo-image in future if performance issues arise

### ADR-GH16-03: Fake Data Source Pattern

**Context:** GH-16 needs fake data. Options: (A) MSW like web, (B) In-memory fake data source class, (C) JSON fixture files.

**Decision:** In-memory FakeEventDataSource class implementing EventRepository pattern.

**Consequences:**

- (+) Simpler than MSW setup for mobile
- (+) Clear substitution path for GH-17 real adapter
- (+) Deterministic for testing
- (+) Can simulate delay and error states
- (-) Not as realistic as MSW network interception
- Mitigation: GH-17 can add MSW if needed for API integration testing

### ADR-GH16-04: CTA Button Placeholder

**Context:** EventCard needs a CTA button, but queue join and navigation are out of scope.

**Decision:** Render button based on display.enabled state, but onPress is a no-op placeholder (console.log or empty).

**Consequences:**

- (+) UI matches Figma design
- (+) Demonstrates display.enabled behavior
- (-) Button doesn't do anything when pressed
- Mitigation: Future tickets (queue, detail) will implement actual navigation

---

## Dependencies

### Internal Dependencies

| Module                    | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| GH-3 Signal UI Foundation | Button, Text components (if used in EventCard) |
| core/domain               | Shared domain types if any                     |
| React Native              | Image, FlatList, View, etc.                    |

### External Dependencies

None required. React Native built-in components suffice.

---

## Risks

| Risk                                 | Likelihood | Impact | Mitigation                                               |
| ------------------------------------ | ---------- | ------ | -------------------------------------------------------- |
| Fake data diverges from real API     | Low        | Medium | Fixtures mirror web MSW exactly; GH-17 validates         |
| EventCard design doesn't match Figma | Medium     | Medium | Visual QA before merge                                   |
| Performance with large event list    | Low        | Low    | FakeEventDataSource has 5 events; real API will paginate |
| GH-17 requires domain changes        | Low        | High   | Design review ensures interface stability                |

---

## Open Questions

**All resolved per rulings:**

1. ~~What image library to use?~~ **Resolved:** React Native Image (ruling #3)
2. ~~Where do EventCard components live?~~ **Resolved:** Feature-local (ruling #1, #2)
3. ~~How to handle Event Detail navigation?~~ **Resolved:** Out of scope (ruling #5, #8)
4. ~~What about queue join action?~~ **Resolved:** Out of scope, placeholder only (ruling #6)

---

## GH-17 Boundary

The design explicitly preserves the GH-17 adapter replacement boundary:

```
GH-16 (this ticket):
  EventRepository (interface in domain)
       │
       └──> FakeEventRepository (data)
               │
               └──> FakeEventDataSource (data)

GH-17 (future):
  EventRepository (interface unchanged)
       │
       └──> HttpEventRepository (new in data)
               │
               └──> HttpEventDataSource (new in data)
                       │
                       └──> HTTP client → GET /events
```

**What GH-17 will add:**

- `HttpEventDataSource` — HTTP client calls to real API
- `HttpEventRepository` — Repository implementation using HTTP source
- Wiring change to use HTTP instead of fake

**What GH-17 will NOT change:**

- Event domain type
- EventRepository interface
- Any presentation layer code
- Any domain layer code
