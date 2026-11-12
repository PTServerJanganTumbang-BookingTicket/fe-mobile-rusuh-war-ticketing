# Requirements Document

## GH-16 Events Home and List (Fake Data Source)

## Introduction

Implement the Events Home/List screen with a fake data source behind a repository port. The feature displays event cards matching the Figma "Home — Mobile" frame, with support for loading, populated, empty, and error states. Event detail and queue join actions are explicitly out of scope until authoritative designs exist.

**Key Constraint:** The fake data source MUST use the canonical mobile API contract schema. GH-17 will later replace the fake implementation with a real HTTP adapter without requiring domain or UI redesign.

**Dependency:** GH-3 (Signal UI Foundation) provides presentation components via the established Metro resolver.

---

## Glossary

| Term                | Definition                                                                   |
| ------------------- | ---------------------------------------------------------------------------- |
| EventCard           | Feature-local presentation component displaying event summary information    |
| EventRepository     | Domain interface (port) for accessing event data, independent of data source |
| FakeEventDataSource | Implementation providing deterministic fixture data for GH-16                |
| RealEventDataSource | Future GH-17 implementation providing HTTP/API data                          |
| Event               | Domain entity representing a concert/event with status and queue_state       |
| EventStatus         | Ticket availability status: `AVAILABLE`, `SELLING_OUT_FAST`, `SOLD_OUT`      |
| QueueState          | Queue admission status: `NOT_OPEN`, `DIRECT`, `OPEN`, `FULL`                 |
| DisplayBlock        | Server-computed UI rendering hints (enabled, action, labelKey, badgeKey)     |
| Canonical Contract  | docs/CONTRACT-BASELINE.md — authoritative mobile API semantics               |

---

## Requirements

### Functional Requirements

#### R1: Events List Display

**Description:** Display a scrollable list of events on the Events Home screen.

**Acceptance Criteria:**

- R1-AC1: Given the Events Home screen is opened, when event data loads successfully, then a scrollable FlatList of EventCard components is displayed
- R1-AC2: Given the event list has loaded, when the user scrolls, then additional events are revealed (no pagination in GH-16 scope; all fake events rendered)
- R1-AC3: Given the event list is displayed, then each event shows: name, category, location (venue + city), date, image, status badge, and queue_state indicator

#### R2: EventCard Component

**Description:** Feature-local EventCard component displays event summary matching web EventCard patterns.

**Acceptance Criteria:**

- R2-AC1: Given event data, when EventCard renders, then event image is displayed using React Native Image component
- R2-AC2: Given event data, when EventCard renders, then event name, category, venue, city, and date are displayed
- R2-AC3: Given event data with status, when EventCard renders, then a status badge displays the appropriate label (e.g., "Available", "Selling Out Fast", "Sold Out")
- R2-AC4: Given event data with queue_state, when EventCard renders, then the queue state is indicated (NOT_OPEN → "Coming Soon", OPEN → "Open", FULL → "Queue Full", DIRECT → "Direct Purchase")
- R2-AC5: Given event data with display.enabled=false, when EventCard renders, then the CTA button is visually disabled
- R2-AC6: Given event data with display.enabled=true, when EventCard renders, then the CTA button is visually enabled (onPress is a no-op placeholder in GH-16)

#### R3: Event Domain Model

**Description:** Events feature domain layer defines Event entity matching canonical contract schema.

**Acceptance Criteria:**

- R3-AC1: Given the Events feature domain, then an Event type exists with: id, name, category, venue, city, date, imageUrl, status (EventStatus), queueState (QueueState), display (DisplayBlock)
- R3-AC2: Given the Event type, then EventStatus is a discriminated union: `'AVAILABLE' | 'SELLING_OUT_FAST' | 'SOLD_OUT'`
- R3-AC3: Given the Event type, then QueueState is a discriminated union: `'NOT_OPEN' | 'DIRECT' | 'OPEN' | 'FULL'`
- R3-AC4: Given the Event type, then DisplayBlock contains: enabled (boolean), action ('JOIN_QUEUE' | 'GO_TO_TICKETS' | 'NONE'), labelKey (string), badgeKey (string | null) — action values match web MSW fixtures
- R3-AC5: Given the domain Event type, then it does NOT include queue-specific fields (ticket_no, now_serving, position) — those belong to Queue feature domain

#### R4: EventRepository Port

**Description:** EventRepository interface defines the data access contract independent of implementation.

**Acceptance Criteria:**

- R4-AC1: Given the Events feature, then an EventRepository interface exists in the domain layer
- R4-AC2: Given EventRepository, then it declares `getEvents(): Promise<Event[]>` for fetching the event list
- R4-AC3: Given EventRepository, then it declares `getEvent(eventId: string): Promise<Event>` for fetching a single event (preparation for detail; not used in GH-16 UI)
- R4-AC4: Given EventRepository, then the interface has NO implementation details — it is a pure port

#### R5: Fake Data Source Implementation

**Description:** FakeEventDataSource provides deterministic fixture data implementing EventRepository.

**Acceptance Criteria:**

- R5-AC1: Given FakeEventDataSource, when getEvents() is called, then it returns a deterministic array of Event fixtures
- R5-AC2: Given FakeEventDataSource, then fixtures cover all EventStatus values: AVAILABLE, SELLING_OUT_FAST, SOLD_OUT
- R5-AC3: Given FakeEventDataSource, then fixtures cover all QueueState values: NOT_OPEN, DIRECT, OPEN, FULL
- R5-AC4: Given FakeEventDataSource, then fixtures include the combination: status=AVAILABLE with queueState=FULL (queue full but event not sold out)
- R5-AC5: Given FakeEventDataSource, then fixture Event objects match the canonical contract schema exactly — no invented fields
- R5-AC6: Given FakeEventDataSource, then a configurable delay can simulate loading state (default: 0ms for instant in tests, configurable for development)
- R5-AC7: Given FakeEventDataSource, then getEvent(eventId) returns the fixture Event matching the id, or throws if not found

#### R6: Loading State

**Description:** Events Home displays a loading state while data is being fetched.

**Acceptance Criteria:**

- R6-AC1: Given the Events Home screen opens, when data is being fetched, then a loading indicator is displayed
- R6-AC2: Given the loading state, then the loading indicator is a feature-local component (not Signal UI expansion)
- R6-AC3: Given the loading state, then EventCard components are NOT rendered until data loads

#### R7: Empty State

**Description:** Events Home displays an empty state when no events are available.

**Acceptance Criteria:**

- R7-AC1: Given the Events Home screen, when getEvents() returns an empty array, then an empty state message is displayed
- R7-AC2: Given the empty state, then a user-friendly message is shown (e.g., "No events available")
- R7-AC3: Given the empty state, then no EventCard components are rendered

#### R8: Error State

**Description:** Events Home displays an error state when data fetching fails.

**Acceptance Criteria:**

- R8-AC1: Given the Events Home screen, when getEvents() throws an error, then an error state is displayed
- R8-AC2: Given the error state, then a user-friendly error message is shown
- R8-AC3: Given the error state, then a retry mechanism is available (retry button or pull-to-refresh)
- R8-AC4: Given FakeEventDataSource, then an error simulation mode exists for testing error state

#### R9: Image Handling

**Description:** Event images are displayed using React Native Image with fallback handling.

**Acceptance Criteria:**

- R9-AC1: Given event data with imageUrl, when EventCard renders, then the image is displayed using React Native Image component
- R9-AC2: Given event data with empty/invalid imageUrl, when EventCard renders, then a placeholder image is displayed
- R9-AC3: Given an image loading, then the Image component handles loading state appropriately (no explicit loading spinner required)

### Non-Functional Requirements

#### R10: Clean Architecture Compliance

**Description:** Events feature follows Clean Architecture layer boundaries.

**Acceptance Criteria:**

- R10-AC1: Given the Events feature, then domain layer imports ONLY TypeScript and core/domain — no React, React Native, or external libraries
- R10-AC2: Given the Events feature, then data layer imports domain and core/domain — no React or presentation
- R10-AC3: Given the Events feature, then presentation layer can import domain, data, React, and React Native
- R10-AC4: Given the Events feature, then it exports a public API via `features/events/index.ts` — app layer imports only through this barrel

#### R11: Contract Alignment

**Description:** Fake data source aligns with canonical mobile API contract.

**Acceptance Criteria:**

- R11-AC1: Given fake event fixtures, then field names match docs/CONTRACT-BASELINE.md and web MSW fixtures
- R11-AC2: Given fake event fixtures, then enum values (EventStatus, QueueState) use exact canonical strings
- R11-AC3: Given fake event fixtures, then DisplayBlock structure matches web implementation

#### R12: GH-17 Adapter Boundary

**Description:** Design enables future replacement of fake data source with real HTTP adapter.

**Acceptance Criteria:**

- R12-AC1: Given EventRepository interface, then replacing FakeEventDataSource with RealEventDataSource requires NO changes to domain or presentation layers
- R12-AC2: Given the data layer structure, then a clear data-source abstraction exists that GH-17 can implement
- R12-AC3: Given the feature structure, then the wiring of data source to repository is isolated and swappable

---

## Constraints

1. **Feature-Local Components:** EventCard, loading indicator, and error/empty state components are feature-local — NOT added to Signal UI or core/presentation
2. **React Native Image:** Use React Native's built-in Image component — NOT a third-party image library
3. **No Event Detail:** Event detail screen and navigation are OUT OF SCOPE — no Figma frame exists
4. **No Queue Routing:** Queue join action is OUT OF SCOPE — display.enabled affects visual state only, onPress is placeholder
5. **No Signal UI Expansion:** Do NOT expand Signal UI library merely for this ticket
6. **Canonical Contract:** Fake fixtures MUST align with docs/CONTRACT-BASELINE.md — do NOT invent fields
7. **Deterministic Fixtures:** Fake data must be deterministic for reproducible tests
8. **GH-17 Boundary:** Design MUST support later replacement of fake source without domain/UI changes

---

## Out of Scope

**Explicitly excluded from GH-16:**

1. Event Detail screen and navigation (no Figma frame)
2. Queue join action implementation (display.enabled is visual only)
3. Real HTTP/API integration (GH-17 scope)
4. Pagination or infinite scroll (all fake events rendered)
5. Search/filter functionality
6. Pull-to-refresh with real data (can exist as placeholder)
7. Signal UI component additions
8. Price display (min_price/max_price are detail-level data)
9. Ticket category information
10. Any queue/booking/payment integration
11. Authentication-dependent behavior
12. Backend/API behavior speculation

---

## Assessment Mapping

| Focus Area            | Evidence                                      | Acceptance / Trade-off                          | Verification                    |
| --------------------- | --------------------------------------------- | ----------------------------------------------- | ------------------------------- |
| UI Implementation     | EventCard matches Figma "Home — Mobile" frame | Feature-local card component, RN Image          | Visual inspection, render tests |
| Software Design       | Repository port pattern with fake adapter     | Clean Architecture data layer, GH-17 boundary   | Code review, boundary-check     |
| Software Construction | Deterministic fake data source                | No real backend needed, fixtures match contract | Unit tests                      |
| Software Quality      | Unit tests for domain, render tests for UI    | TDD approach, state coverage                    | Test suite passes               |
| Software Deployment   | N/A for fake data feature                     | No deployment changes                           | N/A                             |
| Software Security     | N/A (fake data, no auth)                      | No security-sensitive operations                | N/A                             |

---

## Definition of Done (DoD) Criteria

### Implementation Quality

| Criterion                              | Verification Method  | Evidence Required                           |
| -------------------------------------- | -------------------- | ------------------------------------------- |
| All R1-R12 acceptance criteria met     | Checklist review     | Each AC verified with specific evidence     |
| Events Home renders with fake data     | Render test          | Jest snapshot or assertion                  |
| EventCard displays all required fields | Render test          | Visual verification                         |
| Loading/Empty/Error states work        | State-specific tests | Each state tested                           |
| Domain model matches contract          | Code review          | Type definitions match CONTRACT-BASELINE.md |
| GH-17 boundary preserved               | Design review        | Data source swappable                       |

### CI Gates (AGENTS.md §5-6)

| Gate           | Command                  | Evidence                        |
| -------------- | ------------------------ | ------------------------------- |
| lint           | `npm run lint`           | Exit 0, no errors               |
| typecheck      | `npm run typecheck`      | Exit 0, no errors               |
| test           | `npm test`               | All tests pass                  |
| boundary-check | `npm run boundary-check` | Exit 0, no violations           |
| expo-doctor    | `npx expo-doctor`        | Pass (or known exceptions)      |
| expo-export    | `npx expo export`        | iOS and Android bundles created |

### Git/PR Requirements (AGENTS.md §4, §7, §9)

| Criterion      | Verification                                     |
| -------------- | ------------------------------------------------ |
| Branch naming  | `story/GH-16-events-home-list`                   |
| Commit format  | `[GH-16][Rosyid] <type>(<scope>): <description>` |
| No hook bypass | No `--no-verify` used                            |
| Clean diff     | `git diff` reviewed, no unintended changes       |
