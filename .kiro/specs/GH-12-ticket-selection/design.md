# Design — GH-12 Ticket Selection and Booking Flow

## Overview

GH-12 implements the Ticket Selection screen with deterministic fake Booking capability. The design reuses existing domain types from core/domain/booking/nik.types.ts and follows the feature-first Clean Architecture pattern established in GH-8 and GH-16.

The core abstraction is `FakeBookingDataSource` — a deterministic data source that provides ticket page data, validates NIKs, and creates bookings. This follows the established `FakeQueueDataSource` pattern from GH-8.

**Key Design Decision:** State management uses a reducer pattern for selections, similar to FE-Web's booking controller. The useBooking hook consumes FakeBookingDataSource via dependency injection.

---

## Architecture

### Domain Layer

The domain layer reuses NIK types from core and adds booking-specific types.

**Reused from core/domain/booking (no changes):**

- `NikInput` — Discriminated union: raw | saved | account
- `NikInputRaw`, `NikInputSaved`, `NikInputAccount` — Variant types
- `validateNikInput()` — Exactly-one-of constraint validation
- `nikInputToRequest()` — Convert NikInput to API request fields
- `normalizeNik()` — Strip non-digits
- `isValidNikFormat()` — 16-digit check

**New in GH-12:**

- `TicketSelection` — Map of category_id to quantity
- `TicketSlot` — Individual ticket slot with NIK assignment
- `BookingCategory` — Category type from API response
- `BookingSession` — Session with expires_at and server_time
- `BookingRequest` — Request payload for POST /bookings
- `BookingResponse` — Response from POST /bookings
- `BookingError` — Discriminated union for error handling

### Data Layer

- `FakeBookingDataSource` — Deterministic data source for ticket selection
- `BookingFixtures` — Test categories, saved NIKs, NIK directory

### Presentation Layer

- `TicketSelectionScreen` — Main screen component
- `CategoryCard` — Ticket category with stepper
- `NikInputField` — NIK input with validation feedback
- `AliasDropdown` — Saved NIK selector (logged-in users)
- `OrderSummary` — Real-time selection summary
- `CountdownBanner` — TTL countdown display
- `useBooking` — React hook managing selection and booking state

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │              TicketSelectionScreen                               │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │   │
│  │  │CountdownBanner│  │ CategoryCard │  │   NikInputField      │   │   │
│  │  │              │  │   (×N)       │  │     (×slots)         │   │   │
│  │  └──────────────┘  │ +stepper     │  │  +AliasDropdown?     │   │   │
│  │                    └──────────────┘  └──────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────────┐   │   │
│  │  │                   OrderSummary                            │   │   │
│  │  │  lines[], subtotal, total, submit button                  │   │   │
│  │  └──────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────┬──────────────────────────┘   │
│                                         │                               │
│  ┌──────────────────────────────────────▼──────────────────────────┐   │
│  │                    useBooking (hook)                             │   │
│  │  - selection: Selection                                          │   │
│  │  - slots: TicketSlot[]                                          │   │
│  │  - nikChecks: Map<slotKey, NikCheckState>                       │   │
│  │  - session: BookingSession | null                                │   │
│  │  - submitBooking(): Promise<BookingResponse>                     │   │
│  └──────────────────────────────────────┬──────────────────────────┘   │
└──────────────────────────────────────────┼──────────────────────────────┘
                                           │
                              injects/uses │
                                           │
┌──────────────────────────────────────────┼──────────────────────────────┐
│                        Data Layer        │                              │
│                                          │                              │
│  ┌───────────────────────────────────────▼─────────────────────────┐   │
│  │               FakeBookingDataSource                              │   │
│  │                                                                  │   │
│  │  + getTicketPage(eventId): TicketPageResponse                   │   │
│  │  + validateNik(nik): NikValidationResponse                      │   │
│  │  + getSavedNiks(): SavedNik[]                                   │   │
│  │  + createBooking(request): BookingResponse                      │   │
│  │  + setScenario(name): void                                      │   │
│  └──────────────────────────────────────┬──────────────────────────┘   │
│                                         │                              │
│  ┌──────────────────────────────────────▼──────────────────────────┐   │
│  │                    BookingFixtures                               │   │
│  │                                                                  │   │
│  │  - CATEGORIES: VIP, Festival, Tribune                           │   │
│  │  - SAVED_NIKS: Pre-configured saved NIKs                        │   │
│  │  - NIK_DIRECTORY: Test NIKs with validation results             │   │
│  │  - SCENARIOS: normal, soldout, expired                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
                                           │
                             imports types │
                                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Domain Layer                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  core/domain/booking (Reused)                   │   │
│  │  NikInput, validateNikInput(), nikInputToRequest()              │   │
│  │  normalizeNik(), isValidNikFormat()                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  features/booking/domain (New)                  │   │
│  │  TicketSelection, TicketSlot, BookingCategory                   │   │
│  │  BookingSession, BookingRequest, BookingResponse                │   │
│  │  BookingError, canAddTicket(), totalSelectedCount()             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Screen Initialization

```
User granted from Queue (grant_token available)
    ↓
TicketSelectionScreen mounts
    ↓
useBooking hook mounts with FakeBookingDataSource + grantToken
    ↓
FakeBookingDataSource.getTicketPage(eventId) called
    ↓
Categories, session (expires_at), account info returned
    ↓
Countdown timer starts from session.expires_at
    ↓
TicketSelectionScreen renders categories with steppers
```

### 2. Category Selection

```
User taps Add button on VIP category
    ↓
dispatch({ type: 'ADD_TICKET', categoryId: 'cat_vip' })
    ↓
Selection reducer validates: totalCount < 3, available > current
    ↓
Selection state updates: { cat_vip: 1 }
    ↓
New TicketSlot created: { slotKey: 'cat_vip_0', categoryId: 'cat_vip' }
    ↓
OrderSummary re-renders with updated line items
```

### 3. NIK Input and Validation

```
User types NIK in slot 0
    ↓
onChange: setNik(slotKey, normalizeNik(value))
    ↓
User blurs input (16 digits present)
    ↓
FakeBookingDataSource.validateNik(nik) called
    ↓
Response: { valid: true } or { valid: false, reason: 'NIK_NOT_FOUND' }
    ↓
NikCheckState updated: { nik, state: 'valid' | 'error', message }
    ↓
NikInputField shows success/error indicator
```

### 4. Booking Submission

```
User taps "Pay" button
    ↓
useBooking.submitBooking() called
    ↓
Client-side validation: all slots have valid NIK
    ↓
Build BookingRequest from slots (nikInputToRequest per slot)
    ↓
FakeBookingDataSource.createBooking(request) called
    ↓
Response 201: BookingResponse with booking_id
    ↓
(Future: navigate to Payment screen with booking_id)
```

---

## Components and Interfaces

### Components

| Component               | Responsibility                                 | Layer        |
| ----------------------- | ---------------------------------------------- | ------------ |
| `TicketSelection`       | Type for category → quantity map               | Domain       |
| `TicketSlot`            | Individual ticket with NIK assignment          | Domain       |
| `BookingCategory`       | Category from API (id, name, price, available) | Domain       |
| `BookingRequest`        | POST /bookings request payload                 | Domain       |
| `BookingResponse`       | POST /bookings response                        | Domain       |
| `BookingError`          | Discriminated union for errors                 | Domain       |
| `canAddTicket()`        | Validate if ticket can be added                | Domain       |
| `totalSelectedCount()`  | Sum of all selected tickets                    | Domain       |
| `FakeBookingDataSource` | Deterministic booking data provider            | Data         |
| `BookingFixtures`       | Test data for categories, NIKs                 | Data         |
| `TicketSelectionScreen` | Main screen with category list + NIK inputs    | Presentation |
| `CategoryCard`          | Category display with stepper controls         | Presentation |
| `NikInputField`         | NIK input with validation state                | Presentation |
| `AliasDropdown`         | Saved NIK selector dropdown                    | Presentation |
| `OrderSummary`          | Selection summary with totals                  | Presentation |
| `CountdownBanner`       | TTL countdown display                          | Presentation |
| `useBooking`            | React hook for booking state management        | Presentation |

### Interfaces

```typescript
// Domain: Selection state
type TicketSelection = Record<string, number>; // categoryId → quantity

// Domain: Individual ticket slot
interface TicketSlot {
  slotKey: string; // unique: `${categoryId}_${index}`
  categoryId: string;
  categoryName: string;
  price: number;
  nikInput: NikInput | null; // null until assigned
}

// Domain: Category from API
interface BookingCategory {
  id: string;
  name: string;
  description: string;
  price: number;
  available: number;
  maxPerOrder: number; // min(category limit, available, 3)
}

// Domain: Session from API
interface BookingSession {
  expiresAt: string; // ISO timestamp
  serverTime: string; // for offset calculation
}

// Domain: Account info (logged-in only)
interface BookingAccount {
  email: string;
  nikMasked: string | null; // null if no NIK registered
}

// Domain: Ticket page response
interface TicketPageResponse {
  event: {
    id: string;
    name: string;
    date: string;
    venue: string;
    imageUrl: string;
  };
  session: BookingSession;
  categories: BookingCategory[];
  rules: {
    maxTicketsPerOrder: number; // 3
    oneNikPerTicket: boolean; // true
  };
  account: BookingAccount | null;
}

// Domain: Booking request
interface BookingTicketRequest {
  categoryId: string;
  nik?: string;
  savedNikId?: string;
  useAccountNik?: true;
}

interface BookingRequest {
  eventId: string;
  tickets: BookingTicketRequest[];
  contactEmail: string;
}

// Domain: Booking response
interface BookingResponse {
  bookingId: string;
  status: "PENDING_PAYMENT";
  event: { id: string; name: string; date: string; venue: string };
  tickets: Array<{
    category: string;
    price: number;
    nikMasked: string;
    holderName: string;
  }>;
  summary: {
    subtotal: number;
    serviceFee: number;
    total: number;
  };
  paymentTtl: {
    expiresAt: string;
    ttlSeconds: number;
    serverTime: string;
  };
}

// Domain: NIK validation response
interface NikValidationResponse {
  nik: string;
  valid: boolean;
  reason?: "NIK_NOT_FOUND" | "NIK_INACTIVE" | "NIK_ALREADY_USED";
  alreadyUsed?: boolean;
}

// Domain: Saved NIK
interface SavedNik {
  id: string;
  nikMasked: string;
  label?: string; // e.g., "Adik", "Kakak"
}

// Domain: Booking errors
type BookingErrorCode =
  | "GRANT_TOKEN_INVALID"
  | "DEVICE_MISMATCH"
  | "BOOKING_EXPIRED"
  | "NIK_ALREADY_USED"
  | "INSUFFICIENT_STOCK"
  | "TICKETS_UNAVAILABLE"
  | "VALIDATION_ERROR"
  | "NIK_NOT_FOUND"
  | "NIK_INACTIVE"
  | "NETWORK_ERROR";

interface BookingError {
  code: BookingErrorCode;
  message: string;
  field?: string; // e.g., 'tickets[0].nik'
  index?: number; // slot index for NIK errors
}

// Data: FakeBookingDataSource interface
interface BookingDataSource {
  getTicketPage(eventId: string): Promise<TicketPageResponse>;
  validateNik(nik: string): Promise<NikValidationResponse>;
  getSavedNiks(): Promise<SavedNik[]>;
  createBooking(request: BookingRequest): Promise<BookingResponse>;
}

// Presentation: NIK check state
type NikCheckStatus = "idle" | "checking" | "valid" | "error";

interface NikCheckState {
  nik: string;
  status: NikCheckStatus;
  message?: string;
}

// Presentation: Hook result
interface UseBookingResult {
  // Data
  categories: BookingCategory[];
  session: BookingSession | null;
  account: BookingAccount | null;
  savedNiks: SavedNik[];
  event: TicketPageResponse["event"] | null;

  // Selection state
  selection: TicketSelection;
  slots: TicketSlot[];
  totalCount: number;
  canAdd: (categoryId: string) => boolean;

  // Actions
  addTicket: (categoryId: string) => void;
  removeTicket: (categoryId: string) => void;

  // NIK state
  nikChecks: Map<string, NikCheckState>;
  setSlotNik: (slotKey: string, nikInput: NikInput | null) => void;
  validateSlotNik: (slotKey: string) => Promise<void>;

  // Summary
  subtotal: number;

  // Submission
  contactEmail: string;
  setContactEmail: (email: string) => void;
  submitBooking: () => Promise<BookingResponse>;
  isSubmitting: boolean;

  // Loading/Error
  isLoading: boolean;
  error: BookingError | null;
}
```

---

## Data Models

```typescript
// Reused from core/domain/booking (no changes)
import type {
  NikInput,
  NikInputRaw,
  NikInputSaved,
  NikInputAccount,
  NikValidationResult,
} from "@/core/domain/booking/nik.types";

import {
  validateNikInput,
  nikInputToRequest,
  normalizeNik,
  isValidNikFormat,
} from "@/core/domain/booking/nik.types";

// New in features/booking/domain
export type TicketSelection = Record<string, number>;

export interface TicketSlot {
  slotKey: string;
  categoryId: string;
  categoryName: string;
  price: number;
  nikInput: NikInput | null;
}

export interface BookingCategory {
  id: string;
  name: string;
  description: string;
  price: number;
  available: number;
  maxPerOrder: number;
}

export interface BookingSession {
  expiresAt: string;
  serverTime: string;
}

export interface BookingAccount {
  email: string;
  nikMasked: string | null;
}

// Constants
export const MAX_TICKETS_PER_ORDER = 3;

// Pure functions
export function totalSelectedCount(selection: TicketSelection): number {
  return Object.values(selection).reduce((sum, qty) => sum + qty, 0);
}

export function canAddTicket(
  selection: TicketSelection,
  category: BookingCategory
): boolean {
  const total = totalSelectedCount(selection);
  const current = selection[category.id] ?? 0;
  return (
    total < MAX_TICKETS_PER_ORDER &&
    current < category.maxPerOrder &&
    current < category.available
  );
}

export function buildSlots(
  selection: TicketSelection,
  categories: BookingCategory[]
): TicketSlot[] {
  const slots: TicketSlot[] = [];
  for (const category of categories) {
    const count = selection[category.id] ?? 0;
    for (let i = 0; i < count; i++) {
      slots.push({
        slotKey: `${category.id}_${i}`,
        categoryId: category.id,
        categoryName: category.name,
        price: category.price,
        nikInput: null,
      });
    }
  }
  return slots;
}
```

---

## Correctness Properties

### Property 1: Maximum Ticket Constraint

**Validates: Requirements 2.3**

`totalSelectedCount(selection) <= MAX_TICKETS_PER_ORDER` (3) at all times. The reducer blocks ADD_TICKET when total reaches 3. (R2-AC3)

### Property 2: Per-Category Stock Limit

**Validates: Requirements 2.4**

`selection[categoryId] <= category.available` for all categories. The reducer blocks ADD_TICKET when quantity reaches available stock. (R2-AC4)

### Property 3: Exactly-One-Of NIK Constraint

**Validates: Requirements 3.1, 3.2, 3.3**

Each TicketSlot's nikInput is exactly one variant of NikInput discriminated union (raw|saved|account). This is enforced by validateNikInput() from core/domain. (R3-AC1, R3-AC2, R3-AC3)

### Property 4: No Duplicate NIK Across Slots

**Validates: Requirements 6.4**

Before submission, the same NIK (whether raw, saved, or account) cannot appear in multiple slots. Enforced by client-side validation before API call. (R6-AC4)

### Property 5: Account NIK Single Use

**Validates: Requirements 5.3**

If NikInputAccount is used for one slot, it cannot be selected for any other slot in the same booking. Alias dropdown disables "Use my NIK" option when already used. (R5-AC3)

### Property 6: Server-Authoritative TTL

**Validates: Requirements 8.1, 8.4**

Countdown is calculated using `remainingMs(expiresAt, now, offsetMs)` from core/domain/time. Offset is derived from session.serverTime. Timer recalculates each tick (not decrement). (R8-AC1, R8-AC4)

---

## Error Handling

| Error Type          | Layer        | Handling Strategy           | User Feedback                                  |
| ------------------- | ------------ | --------------------------- | ---------------------------------------------- |
| Network error       | Data         | Catch, wrap in BookingError | "Unable to connect" toast                      |
| GRANT_TOKEN_INVALID | Data         | Return error, stop flow     | "Session expired" dialog + return to queue     |
| BOOKING_EXPIRED     | Data         | Return error                | "Time's up" dialog + return to queue           |
| NIK_NOT_FOUND       | Data         | Return error per slot       | Error message on specific slot                 |
| NIK_ALREADY_USED    | Data         | Return error per slot       | "This NIK already has a ticket" on slot        |
| INSUFFICIENT_STOCK  | Data         | Return error                | "Tickets sold out" dialog + refresh categories |
| Client validation   | Presentation | Block submit, show errors   | Inline errors on fields                        |
| Countdown expired   | Presentation | Block submit                | "Time's up" banner                             |

---

## Testing Strategy

### Unit Tests

| Test                     | File                    | Purpose        |
| ------------------------ | ----------------------- | -------------- |
| totalSelectedCount       | `booking.utils.test.ts` | R2-AC1, R2-AC2 |
| canAddTicket             | `booking.utils.test.ts` | R2-AC3, R2-AC4 |
| buildSlots               | `booking.utils.test.ts` | R2-AC5         |
| validateNikInput (reuse) | existing in core        | R3-AC1, R3-AC2 |
| normalizeNik (reuse)     | existing in core        | R3-AC2         |

### Integration Tests

| Test                  | File                            | Purpose                |
| --------------------- | ------------------------------- | ---------------------- |
| getTicketPage         | `FakeBookingDataSource.test.ts` | R1-AC1                 |
| validateNik scenarios | `FakeBookingDataSource.test.ts` | R3-AC4, R3-AC5         |
| createBooking success | `FakeBookingDataSource.test.ts` | R7-AC1, R7-AC2         |
| createBooking errors  | `FakeBookingDataSource.test.ts` | R7-AC3, R7-AC4, R7-AC5 |
| useBooking flow       | `useBooking.test.ts`            | R9-AC1, R9-AC2         |

### Render Tests

| Test                          | File                                    | Purpose          |
| ----------------------------- | --------------------------------------- | ---------------- |
| TicketSelectionScreen initial | `TicketSelectionScreen.render.test.tsx` | R1-AC2, R1-AC3   |
| CategoryCard stepper          | `CategoryCard.render.test.tsx`          | R2-AC1, R2-AC2   |
| CategoryCard soldOut          | `CategoryCard.render.test.tsx`          | R1-AC4           |
| NikInputField states          | `NikInputField.render.test.tsx`         | R3-AC1, R3-AC4   |
| AliasDropdown options         | `AliasDropdown.render.test.tsx`         | R4-AC2, R4-AC4   |
| OrderSummary                  | `OrderSummary.render.test.tsx`          | R10-AC1, R10-AC2 |
| CountdownBanner               | `CountdownBanner.render.test.tsx`       | R8-AC1, R8-AC2   |

---

## ADRs (Architecture Decision Records)

### ADR-1: FakeBookingDataSource Pattern from GH-8

**Context:** GH-8 established FakeQueueDataSource as a deterministic data source for testing. GH-12 needs similar capability for booking flow.

**Decision:** Follow the same pattern: FakeBookingDataSource class with methods matching the API contract. Configurable via setScenario() for different test scenarios (normal, soldout, expired, nik-error).

**Consequences:**

- ✅ Consistent with GH-8 patterns
- ✅ Deterministic testing without backend
- ✅ Scenarios cover error paths
- ⚠️ Real adapter (GH-13+) will need interface extraction

### ADR-2: Selection Reducer Pattern from FE-Web

**Context:** FE-Web booking controller uses useReducer for selection state with ADD_TICKET/REMOVE_TICKET actions.

**Decision:** Adopt the same reducer pattern. Selection state is Record<string, number>. Reducer validates constraints before updating.

**Consequences:**

- ✅ Proven pattern from web
- ✅ Pure reducer is easily testable
- ✅ Predictable state transitions
- ⚠️ Slot management derived from selection (not separate state)

### ADR-3: Reuse core/domain/booking/nik.types.ts

**Context:** GH-5 or earlier created nik.types.ts with NikInput discriminated union and validation functions.

**Decision:** Reuse these types directly. Do not duplicate or extend unless required by new contract evidence.

**Consequences:**

- ✅ Single source of truth for NIK types
- ✅ Existing tests cover edge cases
- ✅ Type changes propagate automatically

### ADR-4: Slot-Based NIK Management

**Context:** Each selected ticket needs a NIK holder. FE-Web uses slotKey pattern: `${categoryId}_${index}`.

**Decision:** Adopt slotKey pattern. TicketSlot objects are derived from selection. NIK inputs and checks are keyed by slotKey.

**Consequences:**

- ✅ Clear mapping: slot → NIK
- ✅ Supports dynamic add/remove
- ⚠️ Removing a category removes all its slots (NIK inputs lost)

### ADR-5: No Intermediate BookingDataSource Interface

**Context:** Could introduce an interface now for FakeBookingDataSource to implement, anticipating RealBookingDataSource.

**Decision:** Follow YAGNI. FakeBookingDataSource is concrete. Interface extraction happens when RealBookingDataSource is implemented.

**Consequences:**

- ✅ Simpler initial implementation
- ✅ Interface shaped by actual usage
- ⚠️ GH-13+ must extract interface

---

## Dependencies

### Internal Dependencies

- `@/core/domain/booking/nik.types` — NIK types and validation
- `@/core/domain/time` — remainingMs, serverOffsetMs for countdown
- `@/core/domain/api` — API client types (if defined)
- `@/features/queue` — Grant token from queue flow (props, not import)

### External Dependencies

- React, React Native (presentation layer only)
- NativeWind/Tailwind (styling)
- No new npm packages required

---

## Risks

| Risk                               | Likelihood | Impact | Mitigation                             |
| ---------------------------------- | ---------- | ------ | -------------------------------------- |
| TTL sync drift with backend        | Medium     | Medium | Use serverOffsetMs pattern from GH-8   |
| NIK validation UX confusion        | Low        | Medium | Clear error messages, inline feedback  |
| Slot state lost on category remove | Low        | Low    | Confirm dialog before removing tickets |
| Stepper accessibility              | Low        | Medium | Test with screen reader, add labels    |

---

## Open Questions

1. **Contact Email Source:** Should contact email default to account email (logged-in) or always require input?
   - **Proposed Resolution:** Default to account.email if logged in, allow edit.

2. **Alias Dropdown Style:** Should saved NIK selector be a native Picker, ActionSheet, or BottomSheet?
   - **Proposed Resolution:** Start with native Picker; upgrade to BottomSheet if UX testing indicates need.

3. **Countdown Warning:** Should there be a warning at 1 minute remaining? Vibration?
   - **Proposed Resolution:** Visual warning (color change) at 1 min. No vibration in fake capability.
