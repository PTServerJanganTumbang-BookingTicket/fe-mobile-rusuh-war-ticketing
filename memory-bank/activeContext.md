> **STATUS: HISTORICAL / TRANSITIONAL AI SESSION MEMORY (FROZEN 2026-11-13) — NOT CANONICAL.**
> Do not use this file as current ticket/PR/status authority or canonical architecture/contract truth.
> Canonical truth lives in `AGENTS.md`, executable source/config/tests, `docs/ARCHITECTURE.md`, `docs/CONTRACT-BASELINE.md`, `docs/KNOWN-ISSUES.md`, and Git / GitHub.

---

# Active Context — fe-mobile-rusuh-war-ticketing

> Updated 2026-11-13 (Cline session: UI alignment + GH-17 adapter + home/queue wiring;
> dev-bundle bug resolved as FALSE ALARM — see below).

## Current work

- **SESSION STATE (2026-11-13 ~16:20, Cline — queue-flow REVIEW session: findings
  reported to Rosyid, NO code changes made)**: PRs #67/#68/#69 are ALL MERGED;
  repo is on `main` @ `4a162f4` (ff-pulled, clean tree). `npm test` on main:
  65/65 suites, 1013 pass + 3 skip (lint/typecheck/boundary not re-run this
  session). Dev server restarted 16:13 with
  `EXPO_PUBLIC_API_BASE_URL` (Metro had a corrupt module graph after the
  story-branch → main switch: phone crashed repeatedly with
  `TypeError: undefined cannot be used as a constructor` at `index.tsx:26`
  `new HttpEventRepository`; fresh post-restart bundle verified sound — class
  - app markers present → transient Metro state, NOT a code bug; phone needs
    a manual reload in Expo Go).
- **HEADLINE REVIEW FINDING — the real queue flow is broken against deployed
  v2.27**: `POST /events/{id}/queue/join` and `GET /queue/me` return ENVELOPED
  responses `{data:{...},meta:{...}}`, while `isQueueJoinResponse`/
  `isQueueMeResponse` check TOP-LEVEL fields → join returns `ok:false`
  (UNKNOWN_ERROR "HTTP 200 error"), queueToken stays null, and on Hermes the
  SSE-fallback in `useRealQueue` CLEARS that error and starts a poll loop that
  no-ops on the null token → Waiting Room shows "#0 / 0 min / 0%" forever.
  Live-curl evidence: join 200 `{data:{ticket_no,now_serving,position,
queue_token,sse_url,event},meta:{server_time,...}}`; /me QUEUED
  `{data:{state,ticket_no,now_serving},meta:{server_time}}`; /me GRANTED adds
  `grant_token`+`booking_expires_at`; /me EXPIRED `{data:{state:"EXPIRED"}}`.
  Error bodies put `error_code` under `meta` (DEVICE_ID_REQUIRED 400 verified)
  → all distinct error codes (FULL_QUEUE/FULL_BOOKED/CAPTCHA…) collapse to
  UNKNOWN_ERROR. GH-9 DT tests passed only because the DT harness unwraps the
  envelope itself (`rawBody.data || rawBody`) with raw fetch — it never
  validated `QueueHttpClient`.
- **Other review findings (full report delivered to Rosyid, 2026-11-13):**
  1. `joined_at` is absent from join `data` (use `meta.server_time`); `/me`
     `data` has NO `server_time` and NO `rate_per_min` → poll-path ETA uses
     the hardcoded default 20/min while the real rate is 2/min (SSE
     broadcasts `ratePerMin`).
  2. SSE path unusable on ALL platforms: auth is the `X-Queue-Token` HEADER
     (query `?token=` → 401 "Token antrian tidak ditemukan"), and payloads are
     camelCase (`nowServing/state/ratePerMin/serverTime`) vs the parser's
     snake_case → every event would be silently dropped even with auth fixed.
     EventSource cannot set headers anyway → polling is the real path (as
     designed on Hermes).
  3. `WaitingRoomScreen` never renders `error`/`retry`, and `useRealQueue`'s
     onError wrapper discards `error.queueState` → FullQueueView/
     FullBookedView/ClosedView are UNREACHABLE in the real flow (fake
     scenarios only). FULL_QUEUE (503) vs FULL_BOOKED (409) is modeled
     correctly in domain/data but never surfaces.
  4. Guest deviceId is regenerated per mount (`useMemo`); the backend issues a
     NEW ticket per join (no dedupe by X-Device-Id, no `rejoined` flag, no 409
     on duplicate join — verified live) → back-nav + re-enter = new identity +
     new worse ticket; old ticket orphaned (a grant issued while away is
     lost). Fix requires persisting queueToken + /me-based restore, not just
     deviceId persistence.
  5. `useRealQueue` has ZERO tests (no test file imports it). The jest
     "worker failed to exit gracefully" warning was root-caused with
     `--detectOpenHandles` to `RealEventDataSource.createTimeoutController`
     (30s `setTimeout` never cleared — 37 open handles from events tests),
     NOT to useRealQueue (its own cleanup is correct: clearInterval +
     dataSource.stop + cancelled flag).
  6. Minor: polling never stops after GRANTED; EXPIRED (post-grant) would
     silently revert the UI to QueuedView with a stale position;
     `fetchGrantMetadata` (SSE GRANTED path) omits authContext → guest /me
     would 400 DEVICE_ID_REQUIRED; `pollMe` builds a new QueueHttpClient per
     call (harmless).

- **✅ RESOLVED (2026-11-13) — "dev bundle has no app source" was a FALSE ALARM (bad curl
  methodology, not a code bug)**: The previous session's curl URL was missing
  `transform.routerRoot=src%2Fapp`. Root cause: Expo's transform inlines
  `EXPO_ROUTER_APP_ROOT` in `expo-router/_ctx.js` from the `transform.routerRoot` URL
  param (default `app`) — without it, `require.context` resolved against `<root>/app`
  (nonexistent) → `metroEmptyContext` → 1630-module all-node_modules bundle with zero
  route modules. WITH the param: dev bundle = 2886 modules / 12.6MB containing all app
  code ('BOOKING TIKET', 'Upcoming Events', 'Loading events', 'Waiting Room', all 3
  route files, signal-ui src modules, X-Device-Id, /queue/me, inlined API URL).
  Evidence: (1) Expo Go manifest at `curl -H 'expo-platform: ios' http://localhost:8081/`
  hands out the CORRECT launchAsset URL incl. `transform.routerRoot=src%2Fapp&transform.engine=hermes&transform.bytecode=1&unstable_transformProfile=hermes-stable`;
  (2) curling that exact URL returns a bundle with all app markers; (3)
  `npx expo export --platform ios` dist `.hbc` contains 'BOOKING TIKET' +
  'Upcoming Events' + 'Waiting Room' + inlined API URL. The metro.config.js custom
  resolver (GH-3) is NOT at fault; typed routes + deleted `events.tsx`/
  `__signal-ui-verify.tsx` + new `queue/[eventId]` route are all fine. No code changes
  were needed. LESSON: never grep a hand-built bundle URL — always use the manifest
  launchAsset URL (it carries the required transform params).

- **Dev server**: restarted 2026-11-13 ~16:13 (log
  `/tmp/expo-rusuh-main-8081.log`; old log kept at
  `/tmp/expo-rusuh-main-8081.old.log`) WITH
  `EXPO_PUBLIC_API_BASE_URL=https://c7s53ojpml.execute-api.ap-southeast-1.amazonaws.com`;
  Expo Go URL `exp://172.20.10.11:8081`. Restart carefully — kill by explicit PIDs
  from `lsof -i :8081`, NOT by `ps | grep expo` (matches your own shell cmd → SIGTERM self).
  LESSON (2026-11-13 review): `git checkout` between branches while Metro is running
  left a corrupt graph (2853-module bundle) and the phone crashed on
  `new HttpEventRepository` (undefined constructor) — restart Metro after ANY
  branch switch before trusting on-device results.
  Live API re-verified by curl (2026-11-13 review): GET /events (5 events);
  POST join works BUT response is ENVELOPED `{data,meta}` (see headline finding);
  GET /queue/me needs X-Queue-Token AND X-Device-Id, response ENVELOPED
  (data: state/ticket_no/now_serving; grant fields only when GRANTED).
  To test the dev bundle by curl, use the MANIFEST launch URL, never a hand-built one:
  `curl -H 'expo-platform: ios' http://localhost:8081/` → copy `launchAsset.url`
  (it includes `transform.routerRoot=src%2Fapp`, which is REQUIRED — a bare URL
  defaults routerRoot to `app` and builds a bundle with an EMPTY router context,
  i.e. no app source; that is exactly the false alarm documented above).

- **GH-17 real events adapter — IMPLEMENTED** (details in batch 2 above; verified
  live; new HttpEventRepository.test.ts; contract drift-guard tests added).
- **Web-UI alignment pass (Cline, 2026-11-13, UNCOMMITTED on main — awaiting Rosyid review)**:
  6 files changed to match fe-web `EventCard`/`HomeView`/`QueueView` design:
  - `EventCard.tsx`: status badge overlaid on image (Signal DS tones: info/success/
    warning/error from web `signal.css`), "location · category" meta row in `#EC1C2E`
    uppercase, full-width CTA, outline-style disabled CTA, 4:3 image.
  - `EventsHomeScreen.tsx`: section header (title + subtitle) above list, web pattern.
  - `LoadingState.tsx` / `ErrorState.tsx`: spinner + retry button → brand red (was `#3b82f6`).
  - `app/index.tsx`: Browse Events CTA → `bg-[#EC1C2E]` + arrow.
  - `QueueStateViews.tsx`: QueuedView = label above, position number in `#EC1C2E`
    (implements GH-55 intent).
- **Dev server**: Metro running on port 8081 (nohup, PID in /tmp/expo-rusuh-main-8081.log)
  WITH `EXPO_PUBLIC_API_BASE_URL` set → real events + real images in Expo Go at
  `exp://<lan-ip>:8081`. Restart required to change env vars (inlined at bundle time).
- **Remaining P0 tickets (specs not yet created)**: GH-54 (event context card),
  GH-56 (contact email input), GH-57 (header wrapper with back button for
  PaymentWebView) — use `/ticket-to-spec`. GH-55 (queue position large red number)
  is effectively done in the uncommitted alignment pass; verify before ticketing.

## Recent completions

- GH-53: `QueueScreen.tsx` progress bar `bg-blue-600` → `bg-[#EC1C2E]` (PR #60, CLOSED).
- GH-52: EventCard CTA `#3b82f6`→`#EC1C2E` + arrow label (PR #59, CLOSED).
- GH-51: shared Header component, guest mode (PR #58, CLOSED).
- GH-9 real queue: DT-01..DT-05 pass against deployed API
  (`https://c7s53ojpml.execute-api.ap-southeast-1.amazonaws.com`,
  test event `evt_jkt_istora_nightfall`). DT-06..08 blocked (state-control fixtures).
- GH-8 fake queue: deterministic FakeQueueDataSource (PR #40 squash-merged).

## Constraints to remember

- Brand color: `#EC1C2E` — "Rusuh brand red" (never "Telkomsel red").
- Guest mode: no login in Header.
- FULL_QUEUE (503) ≠ FULL_BOOKED (409) — distinct states.
- Mobile uses `X-Queue-Token` header + `sse_url` from response (web differs intentionally).
- CAPTCHA: deployed test env accepts dummy token.
- Web is Indonesian / mobile English — i18n alignment is a separate spec-sized task.
- Web uses Signal DS tone tokens (valid `#edfcf0/#008e53`, info `#e7f5fc/#0050ae`,
  warning `#fef3d4/#d9801f`, error `#fdddd4/#bc1d42`) — reuse for status badges.

## Next steps

1. Rosyid decides on the review findings. P0 fix candidates (in priority order):
   (a) envelope unwrapping in the queue data layer (join + /me + `meta`
   error_code) — unblocks the entire real flow; (b) render error/retry in
   WaitingRoomScreen and surface FULL_QUEUE/FULL_BOOKED/CLOSED from join
   errors (keep them DISTINCT); (c) ETA rate — source `ratePerMin` from SSE
   or change the poll default 20 → 2; (d) useRealQueue test coverage.
2. Approved fixes go through `/ticket-to-spec`; gates: lint, typecheck, test,
   boundary-check.
3. E2E in Expo Go after (a): reload Expo Go at `exp://172.20.10.11:8081` —
   home shows real events → Join Queue → position should now move
   (ticket_no − now_serving, ~2/min on the test event); back-nav + re-enter
   will show the new-ticket-per-join behavior documented above.
4. Remaining P0 tickets GH-54, GH-56, GH-57 (GH-55 stays open: separator,
   Indonesian labels, badge remain).
