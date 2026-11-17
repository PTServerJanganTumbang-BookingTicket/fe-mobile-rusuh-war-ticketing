# Architecture — fe-mobile-rusuh-war-ticketing

Canonical durable architecture and runtime reference for the Rusuh Booking Tiket mobile app (Expo SDK 58, React Native 0.88, React 19, TypeScript, Hermes).

> Executable import-boundary authority lives in `eslint.config.mjs` (`npm run boundary-check`). See `AGENTS.md` for governance and `docs/KNOWN-ISSUES.md` for verified gaps.

---

## 1. Repository Architecture

The application follows **Clean Architecture** with **feature-first** vertical slices:

```text
src/
├── app/                          # Expo Router file-based routes & composition root
├── core/
│   ├── domain/                   # Shared domain models, API envelope/error types, header builders, time utils
│   ├── data/                     # Reserved for shared data utilities (currently empty)
│   └── presentation/             # Shared UI components (Header, Signal UI re-export gate)
└── features/
    └── <feature>/
        ├── domain/               # Feature domain models, ports, pure TypeScript rules
        ├── data/                 # Feature DTOs, mappers, HTTP/SSE/storage/fake data sources
        ├── presentation/         # Screens, components, hooks
        └── index.ts              # Public barrel API (sole entry point for app/ imports)
```

Active feature directories under `src/features/`: `auth`, `booking`, `eticket`, `events`, `payment`, `queue` (plus `_example` scaffold).

---

## 2. Dependency Rules

Enforced by `eslint-plugin-boundaries` in `eslint.config.mjs` (`npm run boundary-check`, CI Gate 4):

| Element                     | Allowed Imports                                                             | Prohibited                                                    |
| --------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `core/domain`               | TypeScript / pure utilities only                                            | `core/data`, `core/presentation`, `features/*`, `app/`        |
| `core/data`                 | `core/domain`                                                               | `core/presentation`, `features/*`, `app/`                     |
| `core/presentation`         | `core/domain` (+ React/RN & Signal UI gate)                                 | `core/data`, `features/*`, `app/`                             |
| `features/<x>/domain`       | `core/domain`                                                               | React, React Native, `data/`, `presentation/`, other features |
| `features/<x>/data`         | own `domain`, `core/domain`, `core/data`                                    | React, `presentation/`, other features                        |
| `features/<x>/presentation` | own `domain`, `core/domain`, `core/presentation`                            | **`data/` (own or core)**, other features directly            |
| `features/<x>/index.ts`     | own `domain`, `data`, `presentation`                                        | Other features directly                                       |
| `src/app/`                  | `features/<x>` (`index.ts` barrel only), `core/domain`, `core/presentation` | Feature internal subfolders directly                          |

Key invariants:

- **Presentation MUST NOT import data:** Presentation hooks and screens receive data sources/repositories or adapter functions via dependency injection.
- **No direct cross-feature imports:** Features communicate through `core/domain` ports/types and composition in `src/app/`.
- **Unknown files fail boundary check:** `boundaries/no-unknown-files` is set to `error` for `src/`.

---

## 3. Composition & Dependency Injection

`src/app/` is the composition root:

- `src/app/index.tsx` instantiates `HttpEventRepository` when `EXPO_PUBLIC_API_BASE_URL` is set, or `FakeEventRepository` otherwise, and passes it to `EventsHomeScreen`.
- `src/app/queue/[eventId].tsx` instantiates `RealQueueDataSource` + a `/queue/me` poll adapter (`QueueHttpClient.getMe`) and passes them to `useRealQueue`, or falls back to `FakeQueueDataSource` + `useQueue` when `EXPO_PUBLIC_API_BASE_URL` is unset, then passes `UseQueueResult` into `WaitingRoomScreen`.
- `src/app/_layout.tsx` wraps the router `Stack` in `SafeAreaProvider`, `SafeAreaView` (`edges={["top"]}`), and shared `Header`; individual screens manage their own bottom safe area (`edges={["bottom"]}`).

---

## 4. Feature Wiring Inventory

Do not treat unwired feature modules as end-to-end complete flows.

### WIRED (reachable in `src/app/` navigation)

- **App shell / Header / SafeArea:** `src/app/_layout.tsx`, `src/core/presentation/components/Header/` (guest mode; no login controls).
- **Events home:** `src/app/index.tsx` → `src/features/events/` (`EventsHomeScreen`, `HttpEventRepository` v2.27 or `FakeEventRepository`). Navigates to `/queue/${event.id}`.
- **Queue waiting room:** `src/app/queue/[eventId].tsx` → `src/features/queue/` (`WaitingRoomScreen`, `useRealQueue` / `useQueue`). Currently uses guest mode with generated `deviceId` and test CAPTCHA token. _(See `docs/KNOWN-ISSUES.md` for live-backend blockers.)_

### IMPLEMENTED IN `src/features/` BUT UNWIRED IN `src/app/`

- **Booking / Ticket selection:** `src/features/booking/` (`TicketSelectionScreen`, `useBooking`, `FakeBookingDataSource` deterministic fixtures only; no real HTTP booking adapter).
- **Payment (fake & real WebView):** `src/features/payment/` (`FakePaymentAdapter`, `RealPaymentAdapter`, `PaymentWebView`, `usePaymentWebView`, `useGopayHandler`). Module-level implementation and tests exist; no `src/app/` route renders them yet.
- **E-ticket placeholder:** `src/features/eticket/` (`ETicketPlaceholderScreen` static `"Coming Soon"` screen). No route wired.

### PARTIAL / DEFERRED

- **Authentication:** `src/features/auth/` implements `domain` and `data` (`AuthRepository`, `AuthRemoteDataSourceImpl`, `TokenStorageService`) only. There is no `src/features/auth/presentation/` layer; login/register UI (GH-7) and mobile magic-link return (GH-43 / `ADR-008`) are deferred.

---

## 5. Signal UI & Styling Patterns

- **Sibling-source resolution:** `signal-ui-react-shared` is consumed from the sibling clone `../signal-ui-react-shared` via a custom origin-aware Metro resolver in `metro.config.js` (dependencies resolve from this repo's `node_modules/`). `disableHierarchicalLookup` is intentionally not used because it breaks Reanimated semver resolution.
- **Single app import gate:** All application code must import Signal UI components and types exclusively through `src/core/presentation/components/signal/index.ts` (currently exports `Button`, `Text`, `TextField`).
- **NativeWind `Pressable` pattern:** NativeWind `cssInterop` can drop function-valued `Pressable` styles; keep visual styles on an inner `View` and static sizing (`minWidth`/`minHeight`) on `Pressable`.
- **Visual tokens:** Brand accent is Rusuh brand red (`#EC1C2E`). Queue/event status badges use Signal DS tones (`OPEN` `#edfcf0/#008e53`, `SCHEDULED` `#e7f5fc/#0050ae`, `FULL_QUEUE`/`FULL_BOOKED` `#fef3d4/#d9801f`, `CLOSED` `#fdddd4/#bc1d42`).

---

## 6. Runtime, Expo, Hermes & Auth Constraints

- **Hermes SSE limitation:** React Native / Hermes does not provide a global `EventSource`. `useRealQueue` detects `typeof EventSource !== "undefined"` and falls back to polling `GET /events/{eventId}/queue/me` every 4 seconds.
- **Build-time env inlining:** Expo inlines `EXPO_PUBLIC_*` environment variables (such as `EXPO_PUBLIC_API_BASE_URL`) at bundle time; Metro must be restarted (and reloaded on device) after env changes or branch switches to avoid stale/corrupt module graphs.
- **Metro dev-bundle inspection:** When verifying the Metro dev bundle via HTTP, use the `launchAsset.url` from the Expo Go manifest (`expo-platform: ios` / `android`). A hand-built bundle URL without `transform.routerRoot=src%2Fapp` causes `expo-router` to emit an empty router context without app routes.
- **Expo Go sharing & physical verification:** Physical-device Expo Go verification was performed during pre-submission development. `app.json` + `expo-updates` configures EAS Update (`preview` channel, `runtimeVersion` policy `appVersion`).
- **Token storage split (`auth` data):** Access tokens are memory-only; refresh tokens are stored in `expo-secure-store` (never `AsyncStorage`); no automatic retry on single-use auth endpoints.
- **Queue vs inventory semantics:** `FULL_QUEUE` (503, queue capacity), `FULL_BOOKED` (409, event stock exhausted), `CLOSED` (410, terminal sale closure), and `SOLD_OUT` (ticket-category level) are distinct states and must never be collapsed.
