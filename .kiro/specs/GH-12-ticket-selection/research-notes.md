# GH-12 Research Notes

**Date:** 2026-11-13
**Scope:** Backend booking service, FE-Web ticket selection patterns
**Contract:** sjtrbt20261112.openapi.json

## 1. Backend Implementation Status

### Booking Service Structure

The backend booking service is **fully implemented** (not skeleton) at `services/booking/`. The clean architecture structure:

```
services/booking/internal/booking/
├── application/usecase/     # Use cases (business logic)
│   ├── ticket_page.go       # GET /events/{event_id}/tickets
│   ├── create_booking.go    # POST /bookings
│   ├── get_booking.go       # GET /bookings/{id}
│   └── booking_detail.go    # Booking detail renderer
├── domain/                  # Domain models
│   ├── domain.go            # Core types & constants
│   ├── entity/booking.go    # Booking entity
│   ├── valueobject/category.go  # Category value object
│   ├── dto/                 # Data transfer objects
│   └── mapper/              # Object mappers
├── port/
│   ├── inbound/             # Incoming ports
│   └── outbound/            # Outgoing ports (repos, external services)
└── infrastructure/          # Concrete implementations
```

### Domain Models

**Booking Entity** (`entity/booking.go`):

- `BookingStatus`: `PENDING_PAYMENT`, `PAID`, `EXPIRED`
- `PaymentTTLSeconds`: 600 (10 minutes)
- `BookingIDPrefix`: "RB-"
- `Ticket`: `CategoryID`, `CategoryName`, `Price`, `NIK`, `HolderEmail`
- `Event`: Embedded snapshot of event details
- `Booking`: Full entity with `Subtotal`, `ServiceFee`, `Total`, `CreatedAt`, `ExpiresAt`

**Core Domain Types** (`domain/domain.go`):

- `Booking`: ID, EventID, Status, BookingExpiresAt, PaymentExpiresAt
- `Category`: ID, Name, Description, Price, MaxPerOrder
- `Account`: Email, NIKMasked (nullable)
- `Seat`: CategoryID, CategoryName, UnitPrice, NIKHmac, NIKMasked
- `NIKCheck`: NIKHmac, NIKMasked, Valid, Status, Source
- `Identity`: NIKHmac, NIKMasked (stored proof)
- `HoldOrder`: Categories ([]CategoryQty), NIKs ([]string)
- `HoldAnswer`: Code (HELD, NO_STOCK, NIK_TAKEN, etc.), Index

**Category Value Object** (`valueobject/category.go`):

- Static catalog: `cat_vip` (Rp 1.5M), `cat_festival` (Rp 850k), `cat_tribune` (Rp 500k)

### Validation

**Implemented in `create_booking.go`**:

1. **Event validation**: event_id must match grant's event
2. **Ticket count**: min 1, max 3 (MAX_TICKETS_PER_TRANSACTION)
3. **NIK source**: Exactly one of `nik`, `saved_nik_id`, `use_account_nik` per seat
4. **Account NIK limit**: `use_account_nik` only allowed once per booking
5. **NIK format**: 16 digits after normalization (via `nikformat.IsValidFormat`)
6. **Email validation**: Valid email format for `contact_email`
7. **Category validation**: Category must exist in catalog
8. **Stored NIK access**: `saved_nik_id` and `use_account_nik` require login
9. **Duplicate NIK**: Same NIK cannot be used for multiple seats
10. **NIK verification**: All typed NIKs go to Dukcapil (parallel, max 3)

**Error Codes** (from `domain.go`):

- `NOT_FOUND`, `STOCK_UNINITIALIZED`, `STOCK_NEGATIVE`
- `BOOKING_STATUS_INVALID`, `BOOKING_EXPIRED`, `QTY_EXCEEDED`
- `INSUFFICIENT_STOCK`, `TICKETS_UNAVAILABLE`, `NIK_ALREADY_USED`

**Hold Logic**:

- Atomic hold in Redis: all seats or nothing
- HoldOrder contains CategoryQty[] and NIK hashes
- Compensation if booking transaction fails after hold

## 2. FE-Web Patterns

### Page/Component Structure

**Module Location**: `src/modules/booking/`

**Views** (`views/`):

- `BookingContainer.tsx` — Container connecting controller to view
- `BookingView.tsx` — Main booking page view (~240 lines)
- `CategoryRow.tsx` — Ticket category stepper component

**Key Components & Props**:

1. **BookingView** (main):
   - `header: PageHeaderProps`
   - `countdown: CountdownBannerProps`
   - `error?: string`
   - `dialog?: ActionDialogProps`
   - `buyer: { title, name: TextFieldProps, email: TextFieldProps, hint }`
   - `categories: { title, limit, items: CategoryRowProps[] }`
   - `holders?: { title, hint, items: TicketHolderProps[], footnote }`
   - `event?: EventSummaryCardProps`
   - `summary: { title, lines, emptyLabel, totalLabel, total, footnote }`
   - `submit: { label, busy, disabled, onSubmit }`
   - `notice: string`

2. **CategoryRow** (ticket stepper):
   - `id`, `name`, `description`, `priceLabel`, `stockLabel`
   - `soldOut: boolean`, `quantity: number`
   - `canAdd`, `canRemove: boolean`
   - `addLabel`, `removeLabel`, `onAdd`, `onRemove`

3. **TicketHolderProps** (NIK input per seat):
   - `id`, `title`, `priceLabel`
   - `nik: TextFieldProps`
   - `holder?: HolderSourceProps` (alias selector, only for logged-in users)
   - `seat: { label, value }` (read-only seat assignment)

4. **TextFieldProps**:
   - `label`, `value`, `placeholder?`, `hint?`
   - `success?`, `error?`, `readOnly?`, `focusKey?`
   - `onChange`, `onBlur?`

5. **HolderSourceProps** (alias dropdown):
   - `label`, `value`, `hint`
   - `options: { value, label, disabled }[]`
   - `onChange`

### State Management

**Pattern**: React hooks with `useReducer` + `useState` + React Query

**Controller** (`booking.controller.ts`):

```typescript
// State pieces:
const [selection, dispatch] = useReducer(selectionReducer, {}); // ticket counts
const [buyerName, setBuyerName] = useState("");
const [contactEmail, setContactEmail] = useState("");
const [niks, setNiks] = useState<Record<string, string>>({}); // slotKey → NIK
const [aliasPicks, setAliasPicks] = useState<Record<string, string>>({}); // slotKey → aliasId
const [checks, setChecks] = useState<Record<string, NikCheckState>>({});
const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
const [submitted, setSubmitted] = useState(false);
```

**Selection Reducer** (`selection.reducer.ts`):

- `Selection`: `Record<string, number>` (categoryId → count)
- Actions: `ADD_TICKET` (with stock check), `REMOVE_TICKET`
- Helper: `selectedCount()`, `totalPriceIdr()`

**React Query Usage**:

- `bookingSessionQuery` — fetches GET /events/{id}/tickets
- `bookingEventQuery` — fetches event details (sidebar)
- `holderAliasesQuery` — fetches GET /accounts/me/saved-niks
- `useMutation` for `submitBookingUseCase`

### NIK Input Handling

**Three Modes** (logged-in users only have options 2 & 3):

1. **Raw/Manual NIK** (`nik` field):
   - User types 16-digit NIK
   - Auto-strips non-digits on input
   - Validated on blur via `POST /nik/validate`
   - Shows checking/success/error states

2. **Saved NIK** (`saved_nik_id`):
   - Dropdown from `HolderSourceProps`
   - Options come from `GET /accounts/me/saved-niks`
   - Selected alias populates NIK field (read-only, masked)
   - Disabled if NIK already used by another seat in this order

3. **Account NIK** (`use_account_nik`):
   - Account's own registered NIK
   - Implicit via `session.account.nik_masked`
   - Can only be used once per booking

**NIK Check Flow**:

```typescript
const checkNik = (slotKey, nik, force) => {
  if (!isNikFormat(nik) || (!force && checks[slotKey]?.nik === nik)) return;
  setChecks(...{ nik, state: "checking" });
  validateNikUseCase(nik).then(
    (result) => {
      if (result.status === "not_found" || "inactive") openMismatchModal();
      else closeModalIfThisSlot();
    },
    () => openUnavailableModal()
  );
};
```

**Alias Options Logic** (`ticket-holders.rules.ts`):

- Shows all aliases but marks ones already used by other seats as `disabled`
- Prevents duplicate NIK selection across seats

### TTL Countdown

**Implementation** (`countdown.hook.ts` + `remaining-ms.utils.ts`):

```typescript
// Calculate server time offset
const offsetMs = serverOffsetMs(
  Date.parse(session.serverNow),
  query.dataUpdatedAt
);

// Use countdown hook with server offset
const remainingMs = useCountdown(session?.expiresAt, offsetMs);

// Hook implementation
function useCountdown(expiresAt, offsetMs) {
  const [now, setNow] = useState(() => clock.now());
  useEffect(() => {
    const id = setInterval(() => setNow(clock.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt, clock]);
  return expiresAt ? remainingMs(expiresAt, now, offsetMs) : null;
}
```

**Key Aspects**:

- Server time synchronization via `serverOffsetMs()`
- Countdown recalculated from clock each tick (not decremented) per ADR-0005
- `useAskServerAtExpiry` — re-fetches when time runs out
- Two TTLs: 5 min for selection, 10 min for payment

### Fake Data / MSW Handlers

**Location**: `src/mocks/api/`

**Fixtures** (`fixtures.ts`):

- 3 mock events: `evt_konser_a` (OPEN), `evt_konser_b` (FULL), `evt_konser_c` (NOT_OPEN)
- Categories: VIP (1.5M), Festival (850k), Tribune (500k)
- `QUEUE_CAPACITY`: 300,000
- `MAX_TICKETS_PER_ORDER`: 3
- `MAX_SAVED_NIKS`: 5
- NIK directory with test data (3171...22, ...33, ...44, ...99)
- `lookupNik()` — returns person or fallback `WARGA <last4>`
- `maskNik()` — formats as `3171********xx22`

**Scenarios** (`handlers.ts`):

- `queue-moving`: normal flow, servingStep 416
- `queue-stuck`: servingStep 0
- `booking-expiring`: bookingTtlMs 75s (vs normal 5min)
- `payment-expiring`: paymentTtlMs 45s (vs normal 10min)

**Booking Handlers** (`booking.ts`):

- `GET /events/:eventId/tickets` — returns session, categories, rules
- `POST /nik/validate` — checks NIK format, returns valid/not_found/inactive
- `POST /bookings` — validates, creates booking, decrements stock
- `GET /bookings/:bookingId` — returns booking detail

## 3. Contract Summary for GH-12

### Endpoints Required

| Endpoint                     | Method | Purpose                            |
| ---------------------------- | ------ | ---------------------------------- |
| `/events/{event_id}/tickets` | GET    | Ticket selection page data         |
| `/bookings`                  | POST   | Create booking                     |
| `/nik/validate`              | POST   | Validate NIK before submit         |
| `/accounts/me/saved-niks`    | GET    | List saved NIKs for alias dropdown |

### Key Request/Response Types

**GET /events/{event_id}/tickets Response**:

```typescript
{
  event: { id, name, date, venue, image_url },
  session: { expires_at, server_time },
  categories: [{
    id, name, description, price,
    available,      // live stock from Redis
    max_per_order   // min(category limit, available, 3)
  }],
  rules: { max_tickets_per_order: 3, one_nik_per_ticket: true },
  account: { email, nik_masked } | null  // null for guest
}
```

**POST /bookings Request**:

```typescript
{
  event_id: string,
  tickets: [{
    category_id: string,
    nik?: string,           // typed NIK (exactly one of three)
    saved_nik_id?: string,  // alias id
    use_account_nik?: boolean
  }],
  contact_email: string
}
```

**POST /bookings Response (201)**:

```typescript
{
  booking_id: string,
  status: "PENDING_PAYMENT",
  event: { id, name, date, venue, image_url },
  tickets: [{ category, price, nik_masked, holder_name }],
  summary: { subtotal, service_fee, total },
  payment_ttl: { expires_at, ttl_seconds, server_time }
}
```

**POST /nik/validate Response**:

```typescript
{
  nik: string,
  valid: boolean,
  reason?: "NIK_NOT_FOUND" | "NIK_INACTIVE" | "NIK_ALREADY_USED",
  already_used?: boolean
}
```

### Error Codes to Handle

| Code                     | HTTP | Meaning                            |
| ------------------------ | ---- | ---------------------------------- |
| `GRANT_TOKEN_INVALID`    | 401  | Grant expired or invalid           |
| `DEVICE_MISMATCH`        | 401  | X-Device-Id doesn't match grant    |
| `UNAUTHORIZED`           | 401  | Missing/wrong Authorization header |
| `TOKEN_EXPIRED`          | 401  | Access token expired               |
| `BOOKING_EXPIRED`        | 409  | 5-minute selection time over       |
| `BOOKING_STATUS_INVALID` | 409  | GRANTED but ticket page not opened |
| `VALIDATION_ERROR`       | 400  | Body validation failed             |
| `NIK_NOT_FOUND`          | 400  | Dukcapil returned not found        |
| `NIK_INACTIVE`           | 400  | Dukcapil returned inactive         |
| `NIK_ALREADY_USED`       | 409  | NIK used for this event            |
| `INSUFFICIENT_STOCK`     | 409  | Category partially sold out        |
| `TICKETS_UNAVAILABLE`    | 409  | Totally sold out                   |
| `STOCK_UNINITIALIZED`    | 503  | Redis stock key missing            |
| `DUKCAPIL_UNAVAILABLE`   | 503  | NIK verification service down      |

## 4. Recommendations for Mobile

### What to Reuse

1. **Domain Rules** — Port directly from FE-Web:
   - `MAX_TICKETS_PER_NIK = 3`
   - `MAX_TICKETS_PER_BOOKING = 3`
   - `isNikFormat()` — 16-digit check
   - `canAddTicket()` logic
   - `validateBookingTickets()` client-side validation
   - Selection reducer pattern

2. **State Model**:
   - `Selection: Record<string, number>` for ticket counts
   - `NikCheckState` for tracking validation status
   - Slot-based NIK management pattern

3. **Timer Logic**:
   - Server time offset calculation
   - 1-second tick countdown
   - Per ADR-0005: recalculate from clock, don't decrement

### What to Adapt

1. **Component Architecture**:
   - Replace SiteShell → mobile SafeAreaView + navigation
   - Replace CategoryRow → NativeWind Card with stepper
   - Replace select dropdown → React Native Picker or BottomSheet for alias selection

2. **Form Handling**:
   - Use React Native TextInput with `keyboardType="number-pad"` for NIK
   - Platform-specific keyboard handling
   - Touch-friendly stepper buttons (larger hit areas)

3. **Fixed Bottom Bar**:
   - Web uses fixed positioning; mobile should use absolute positioning
   - Include safe area insets for notch/home indicator

4. **Alias Selection**:
   - Web uses native `<select>`; mobile needs Picker or ActionSheet
   - Consider bottom sheet pattern for better UX

### Mobile-Specific Considerations

1. **Countdown Display**:
   - Consider prominent sticky header for timer (vs web's CountdownBanner)
   - Vibration/notification when time is running low

2. **Error Modals**:
   - Use React Native Modal or bottom sheet
   - Match dialog patterns from FE-Web (mismatch, unavailable, submitFailed)

3. **Loading States**:
   - Skeleton screens for initial load
   - Inline spinners for NIK validation
   - Disabled submit button with spinner during submission

4. **Offline Handling**:
   - Show network error states
   - Consider optimistic UI where safe

5. **Deep Linking**:
   - Support navigation from queue completion: `/events/{id}/tickets`
   - Preserve grant token across navigation

### Risk Notes

1. **NIK Privacy**: Never log or display full NIK; use masked form only
2. **Timer Accuracy**: Mobile background state can affect timers; re-sync on app foreground
3. **Grant Token**: Must persist securely; use expo-secure-store
4. **Device ID**: Generate once, persist for guest flow binding
