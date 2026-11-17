# Known Issues — fe-mobile-rusuh-war-ticketing

Canonical registry of verified technical debt, contract/implementation mismatches, and missing wiring as of `428ae41a196c21473293f83f9b7a582b1ac36cde`.

> **Scope note:** This registry documents verified findings only. Remediation of these items is **not** part of GH-72 (knowledge migration) and requires separate authorized tickets/PRs.

---

## 1. Queue HTTP response & error envelope mismatch (P0 blocker)

- **State:** `OPEN` (unfixed on `main`)
- **Affected paths:**
  - `src/features/queue/data/dtos/queue-http.dtos.ts`
  - `src/features/queue/data/http/queue-http.client.ts`
  - `src/core/domain/api/envelope.types.ts` (already defines `ApiSuccessEnvelope` / `ApiErrorEnvelope`, unused by queue client)
- **Verified evidence:** `isQueueJoinResponse`, `isQueueMeResponse`, and `isQueueErrorResponse` validate top-level fields (`dto.queue_token`, `dto.state`, `dto.server_time`, `dto.error_code`). Live deployed v2.27 responses wrap payloads in `{ data: {...}, meta: {...} }` and place `error_code` under `meta` (`joined_at` is also absent from join `data`).
- **Contract / reference:** `docs/CONTRACT-BASELINE.md` §9 (v2.27 observations), `src/core/domain/api/envelope.types.ts`.
- **Impact:** Real `join()` returns `ok: false` (`UNKNOWN_ERROR`) and `queueToken` stays `null`. Because `isQueueErrorResponse` fails to unwrap `{ meta: { error_code, message }, data }` envelopes, 400 errors (`DEVICE_ID_REQUIRED`, `CAPTCHA_REQUIRED`, `CAPTCHA_FAILED`) collapse to `UNKNOWN_ERROR` and 401 errors (`TOKEN_INVALID`, `TOKEN_EXPIRED`) collapse to `UNAUTHORIZED`. 409 `FULL_BOOKED` and 503 `QUEUE_FULL` still map by HTTP status in `mapHttpError`, but lose structured error-body metadata (`message`, `retry_after`, `data.queue_state`).
- **Remediation:** Separate ticket required (not part of GH-72).

## 2. SSE authentication transport mismatch

- **State:** `OPEN` (unfixed on `main`)
- **Affected paths:**
  - `src/features/queue/data/sse/sse.client.ts` (`buildSseUrl`)
- **Verified evidence:** `SseClient.buildSseUrl` appends `?token=<queueToken>` query parameter. Deployed backend requires `X-Queue-Token` header (query `?token=` returns `401`). Standard `EventSource` cannot set custom request headers.
- **Contract / reference:** `docs/CONTRACT-BASELINE.md` §3.5.
- **Impact:** SSE stream fails authentication in any runtime that has `EventSource`; Hermes already relies on `/queue/me` polling instead.
- **Remediation:** Separate ticket required (not part of GH-72).

## 3. SSE payload `snake_case` vs `camelCase` mismatch

- **State:** `OPEN` (unfixed on `main`)
- **Affected paths:**
  - `src/features/queue/data/mappers/sse-message.parser.ts` (`RawSseMessage`)
- **Verified evidence:** Parser expects `snake_case` fields (`queue_state`, `engagement_state`, `server_time`, `rate_per_min`, `grant_token`, `booking_expires_at`). External `ADR-006` specifies `camelCase` global broadcast payloads (`{ nowServing, state, ratePerMin, serverTime }`).
- **Contract / reference:** `../documentations/adr/ADR-006-queue-admission-amendments.md` §1 / §4.2 (`Proposed`).
- **Impact:** Even if SSE auth succeeded, broadcast payloads would be dropped (`null`) by `parseSseMessage`.
- **Remediation:** Separate ticket required (not part of GH-72).

## 4. `RealQueueDataSource.fetchGrantMetadata` omits `authContext`

- **State:** `OPEN` (unfixed on `main`)
- **Affected paths:**
  - `src/features/queue/data/RealQueueDataSource.ts` (`fetchGrantMetadata`)
- **Verified evidence:** `fetchGrantMetadata` calls `this.httpClient.getMe({ eventId, queueToken })` without passing `this.config.authContext`.
- **Contract / reference:** `docs/CONTRACT-BASELINE.md` §9 (v2.27 guest `/queue/me` requires `X-Device-Id`).
- **Impact:** If the SSE `GRANTED` path were active for a guest user, `/queue/me` would fail with `400 DEVICE_ID_REQUIRED`.
- **Remediation:** Separate ticket required (not part of GH-72).

## 5. `useRealQueue` missing tests and state-handling gaps

- **State:** `OPEN` (unfixed on `main`)
- **Affected paths:**
  - `src/features/queue/presentation/hooks/useRealQueue.ts`
  - `__tests__/` (no test file imports `useRealQueue`)
- **Verified evidence:**
  1. Zero unit/render tests cover `useRealQueue`.
  2. When `!sseAvailable` (Hermes), `useRealQueue` calls `setError(null)` unconditionally after `dataSource.start()`, clearing join errors and leaving a poll loop that no-ops on a `null` `queueToken`.
  3. `onError` wraps `queueError.message` into `new Error(...)`, discarding `queueError.queueState` (`FULL_QUEUE` / `FULL_BOOKED`).
  4. Initial `ratePerMin` defaults to `20` while deployed `/queue/me` omits `rate_per_min` (observed live queue rate was `2/min`).
  5. Polling does not stop after `GRANTED`, and `EXPIRED` is not handled explicitly.
- **Impact:** Waiting room on Hermes shows `#0` / `0%` on join errors, uses inaccurate ETA when `rate_per_min` is absent, and cannot distinguish `FULL_QUEUE`/`FULL_BOOKED` on join failure.
- **Remediation:** Separate ticket required (not part of GH-72).

## 6. `WaitingRoomScreen` ignores `error`/`retry` and `EXPIRED` state

- **State:** `OPEN` (unfixed on `main`)
- **Affected paths:**
  - `src/features/queue/presentation/screens/WaitingRoomScreen.tsx`
- **Verified evidence:** Component destructures `loading` and state fields from `queueState`, ignoring `error` and `retry`. `QueueStateRenderer` does not render an error/retry state or an `EXPIRED` view (falls through to `QueuedView`).
- **Impact:** Users see no error message or retry action on failure and see stale `QueuedView` if engagement transitions to `EXPIRED`.
- **Remediation:** Separate ticket required (not part of GH-72).

## 7. Guest `deviceId` and `queue_token` persistence gap

- **State:** `OPEN` (unfixed on `main`)
- **Affected paths:**
  - `src/app/queue/[eventId].tsx`
- **Verified evidence:** `deviceId` is generated via `useMemo(generateDeviceId, [])` per component mount, and `queue_token` is held only in memory inside `RealQueueDataSource`. Deployed backend issues a new ticket per join without deduplicating by `X-Device-Id`.
- **Impact:** Navigating back and re-entering a waiting room creates a new guest identity, orphans the previous ticket/grant, and assigns a worse queue position.
- **Remediation:** Separate ticket required (not part of GH-72).

## 8. `RealEventDataSource.createTimeoutController` timer/open-handle leak

- **State:** `OPEN` (unfixed on `main`)
- **Affected paths:**
  - `src/features/events/data/RealEventDataSource.ts` (`createTimeoutController`)
- **Verified evidence:** `createTimeoutController` schedules `setTimeout(() => controller.abort(), this.config.timeoutMs)` (30s default) without storing or clearing the timer ID after `fetch` resolves/rejects. Running `npm test` produces `A worker process has failed to exit gracefully and has been force exited`.
- **Impact:** Leaks active timers in runtime requests and causes Jest force-exit warnings.
- **Remediation:** Separate ticket required (not part of GH-72).

## 9. Magic-link verification transport mismatch

- **State:** `OPEN` (unfixed on `main`)
- **Affected paths:**
  - `src/features/auth/data/auth-remote.datasource.ts` (`verifyMagicLink`)
- **Verified evidence:** `verifyMagicLink` sends `GET /auth/verify?token={token}` query parameter. `ADR-008` documents that the backend exclusively reads `Cookie: magic_token={token}` (proven separately in a spike).
- **Contract / reference:** `../documentations/adr/ADR-008-mobile-magic-link-return-architecture.md` (`Pending (Deferred)`).
- **Impact:** Real magic-link verification via `AuthRemoteDataSourceImpl` would fail against the backend until updated alongside auth UI/return work.
- **Remediation:** Separate ticket required (not part of GH-72).

## 10. Missing real booking adapter, unwired downstream routes, and P0 UI gaps

- **State:** `OPEN`
- **Affected paths:**
  - `src/features/booking/` (`FakeBookingDataSource.ts` only; no real HTTP adapter)
  - `src/features/payment/`, `src/features/eticket/`
  - `src/app/` (only `_layout.tsx`, `index.tsx`, `queue/[eventId].tsx` exist)
- **Verified evidence:** `TicketSelectionScreen`, `PaymentWebView` / `RealPaymentAdapter`, and `ETicketPlaceholderScreen` have no `src/app/` routes or navigation transitions from `WaitingRoomScreen` on `GRANTED`. Remaining P0 UI tickets GH-54, GH-56, GH-57 (and non-completed items of GH-55) remain open.
- **Impact:** Users cannot progress end-to-end from queue grant through booking, payment, and e-ticket in the routed app.
- **Remediation:** Separate tickets required (not part of GH-72).

## 11. `ADR-008` mobile magic-link return path (LEG B) unresolved

- **State:** `BLOCKED` / `DEFERRED` (GH-43, GH-7)
- **Affected paths:**
  - Unmerged branches `spec/GH-7-auth-presentation`, `origin/spec/GH-43-mobile-magic-link`
- **Verified evidence:** `../documentations/adr/ADR-008-mobile-magic-link-return-architecture.md` was explicitly marked `Pending (Deferred)` on `2026-11-13` (awaiting cross-team Infra/Web FE contract for LEG B return).
- **Impact:** Mobile login/register screens and magic-link return remain blocked; app operates in guest mode.
- **Remediation:** Separate cross-team ADR resolution and implementation tickets (not part of GH-72).

## 12. External `ADR-006` and `ADR-007` still marked `Proposed`

- **State:** `OPEN` (external documentation status)
- **Affected paths:**
  - `../documentations/adr/ADR-006-queue-admission-amendments.md`
  - `../documentations/adr/ADR-007-mobile-webview-payment-handoff.md`
- **Verified evidence:** Both ADRs retain `Status: Proposed — menunggu review tim` in the `documentations` repository, even though `ADR-007` is implemented at module level in GH-14 and `ADR-006` reflects deployed backend queue/SSE behavior.
- **Impact:** Agents must treat these contracts with explicit `Proposed` caveat until accepted in `documentations/`.
- **Remediation:** Cross-repo ADR review in `documentations/` (not part of GH-72).

## 13. GH-70 real-device EAS Update verification pending

- **State:** `OPEN` (verification note from PR #71 / `README.md`)
- **Affected paths:**
  - `README.md`, `app.json`
- **Verified evidence:** `README.md` status notes EAS Update sharing link is live, with real-device testing pending; PR #71 intentionally used `Refs` instead of `Closes` for GH-70 pending real-device Expo Go confirmation.
- **Impact:** Preview link distribution is configured but lacks recorded end-to-end real-device verification evidence in the repository.
- **Remediation:** Verify on physical device and close/update GH-70 separately (not part of GH-72).
