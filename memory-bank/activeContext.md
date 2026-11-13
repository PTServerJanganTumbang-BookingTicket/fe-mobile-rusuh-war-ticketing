# Active Context — fe-mobile-rusuh-war-ticketing

> Updated 2026-11-13 (Cline session: UI alignment + GH-17 adapter + home/queue wiring;
> dev-bundle bug resolved as FALSE ALARM — see below).

## Current work

- **SESSION STATE (2026-11-13, Cline — shipped as PRs, awaiting Rosyid's merge)**:
  The three batches are committed on feature branches and pushed; tickets
  GH-64/65/66 created (project #2, status In review):
  - PR #67 `story/GH-64-web-ui-alignment` → main (UI alignment; also documents
    partial GH-55 progress — GH-55 stays OPEN: separator, Indonesian labels,
    ANTREAN AKTIF badge remain)
  - PR #68 `story/GH-65-real-events-v227` → main (v2.27 adapter + HttpEventRepository)
  - PR #69 `story/GH-66-app-shell-wiring` → **stacked on the GH-65 branch**
    (app shell + SafeArea + memory-bank) — MERGE #68 FIRST; GitHub auto-retargets
    #69 to main when the base branch is deleted (deleteBranchOnMerge=true).
    #67 is independent (any order). Local 4-gate verification green per branch;
    CI pending. Batch contents:
  1. **Web-UI alignment** — EventCard (badge overlay w/ Signal tones, red meta row,
     full-width CTA, 4:3 img), EventsHomeScreen section header, brand-red
     loading/error/home CTA, QueuedView red position number (GH-55 intent).
  2. **GH-17 real events adapter (contract v2.12→v2.27)** — envelope `data` direct
     array + `location {venue,city}`; `RealEventDataSource.getEvent` (GET /events/{id});
     new `HttpEventRepository`; env-var wiring (`EXPO_PUBLIC_API_BASE_URL`).
  3. **Home/Queue/SafeArea wiring** — `src/app/index.tsx` IS the events home now
     (`src/app/events.tsx` + `__signal-ui-verify.tsx` DELETED); new route
     `src/app/queue/[eventId].tsx` (guest deviceId + dummy captcha token, real
     `useRealQueue` or fake scenario fallback); `_layout.tsx` uses
     SafeAreaProvider + SafeAreaView(top); WaitingRoom/TicketSelection screens use
     react-native-safe-area-context (edges bottom); new hook
     `src/features/queue/presentation/hooks/useRealQueue.ts` (INJECTION-based
     `dataSource` + `pollMe` — boundary rule forbids presentation→data imports);
     `QueueHttpClient.getMe` gained optional `authContext` (deployed v2.27 requires
     X-Device-Id for guest /me — verified by curl); `QueueMeResponseDto` gained
     `ticket_no`/`now_serving` (position = ticket_no − now_serving); queue feature
     barrels now export `useRealQueue`/`RealQueueDataSource`/`QueueHttpClient`.
  - Gates for all three: lint ✅ typecheck ✅ boundary-check ✅ tests 1013/65 suites ✅.

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

- **Dev server**: running on port 8081 (nohup PID tree, log
  `/tmp/expo-rusuh-main-8081.log`) WITH
  `EXPO_PUBLIC_API_BASE_URL=https://c7s53ojpml.execute-api.ap-southeast-1.amazonaws.com`;
  Expo Go URL `exp://172.20.10.11:8081`. Restart carefully — kill by explicit PIDs
  from `lsof -i :8081`, NOT by `ps | grep expo` (matches your own shell cmd → SIGTERM self).
  Live API verified by curl: GET /events (5 events, real images), POST join
  (guest X-Device-Id + dummy captcha works, returns position/ticket_no/sse_url),
  GET /queue/me needs X-Queue-Token AND X-Device-Id, returns ticket_no/now_serving/state.
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

1. Rosyid merges on GitHub: **#68 (adapter) before #69 (wiring, stacked)**; #67
   (UI) any order. Each PR closes its ticket (#64/#65/#66).
2. After merge: `git checkout main && git pull --ff-only`, then verify end-to-end
   in Expo Go at `exp://172.20.10.11:8081` — home shows real events with real
   images; tap Join Queue → Waiting Room with live position (position =
   ticket_no − now_serving via /queue/me polling; guest X-Device-Id + dummy
   captcha token).
3. Spec + implement remaining P0 tickets GH-54, GH-56, GH-57 (GH-55 stays open:
   only position styling done via #67 — separator, Indonesian labels, badge remain).
