# Progress — fe-mobile-rusuh-war-ticketing

> As of 2026-11-13 (KiroCrew brain snapshot). Verify with `gh issue list` before acting.

| Ticket    | Title                                 | State                                                                      |
| --------- | ------------------------------------- | -------------------------------------------------------------------------- |
| GH-1      | Bootstrap                             | CLOSED/Done                                                                |
| GH-2      | Repo setup (Expo SDK 58, tooling, CI) | CLOSED/Done                                                                |
| GH-3      | Signal UI foundation (Metro resolver) | CLOSED/Done                                                                |
| GH-4      | signal-ui packaging                   | BLOCKED-EXTERNAL (dist/ untracked)                                         |
| GH-5      | Core domain + API client              | Spec+impl PRs MERGED; ticket OPEN                                          |
| GH-6      | Auth data layer                       | CLOSED/Done                                                                |
| GH-7      | Deep link scheme                      | OPEN — DOR blocked (transport proven via GH-43 spike; backend ADR missing) |
| GH-8      | Queue fake                            | CLOSED/Done (PR #40)                                                       |
| GH-9      | Queue real                            | CLOSED/Done (DT-01..05 pass; DT-06..08 blocked)                            |
| GH-10     | iOS SSE fake                          | OPEN                                                                       |
| GH-11     | iOS SSE real                          | BLOCKED-EXTERNAL                                                           |
| GH-12     | Ticket selection                      | CLOSED/Done                                                                |
| GH-13     | Payment fake                          | CLOSED/Done                                                                |
| GH-14     | Payment real                          | PR OPEN                                                                    |
| GH-15     | E-ticket placeholder                  | CLOSED/Done                                                                |
| GH-16     | Events home/list                      | CLOSED/Done                                                                |
| GH-17     | Events real adapter                   | OPEN/Ready — spec qualified, impl NOT authorized                           |
| GH-34     | chore                                 | CLOSED/Done                                                                |
| GH-51     | Header component (P0)                 | CLOSED/Done (PR #58)                                                       |
| GH-52     | CTA color (P0)                        | CLOSED/Done (PR #59)                                                       |
| GH-53     | Progress bar color (P0)               | CLOSED/Done (PR #60)                                                       |
| GH-54..57 | P0 gaps                               | NOT STARTED                                                                |

## Known issues / blockers

- DT-06..08 (GH-9): blocked by backend state-control fixtures.
- GH-7: email-to-app return path unresolved (backend generates web URLs only).
- expo-doctor: 18/20 baseline acceptable (2 pre-existing on main).

## Done / working

- All queue (fake+real), auth, ticket selection, payment fake, e-ticket, events fake flows implemented and merged.
- 704+ tests passing at GH-9 merge (8 DT skipped).
- Signal UI Button NativeWind fix merged upstream (366 tests green).
- 2026-11-13 (Cline, uncommitted): web-UI alignment pass — EventCard badge-overlay +
  meta row + full-width CTA, EventsHomeScreen section header, brand-red loading/error
  states + home CTA, QueuedView red position number (GH-55 intent). lint/typecheck/
  test/boundary-check/expo-export pass. Awaiting review/commit by Rosyid.
- 2026-11-13 (Cline, uncommitted): GH-17 real events adapter — contract v2.12→v2.27
  (envelope `data` array, `location` `{venue, city}`), RealEventDataSource.getEvent
  (GET /events/{id}), new HttpEventRepository, events.tsx wired via
  `EXPO_PUBLIC_API_BASE_URL` (fallback Fake). 1013 tests green; all gates pass.
  Verified live against deployed API (5 events, real Wikimedia images).
- 2026-11-13 (Cline, uncommitted): home/queue/safearea wiring — `src/app/index.tsx`
  IS the events home (`events.tsx` + `__signal-ui-verify.tsx` deleted); new route
  `src/app/queue/[eventId].tsx` (guest deviceId + dummy captcha; real useRealQueue
  via injection, SSE when available else /queue/me polling every 4s — Hermes has no
  EventSource; fake scenario fallback without env var); `_layout.tsx` SafeAreaProvider
  - SafeAreaView(top); `QueueHttpClient.getMe` optional `authContext` (deployed v2.27
    requires X-Device-Id for guest /me); `QueueMeResponseDto` gained
    ticket_no/now_serving (position = ticket_no − now_serving).
- 2026-11-13 (Cline): "dev bundle contains no app source" RESOLVED as false alarm —
  hand-built curl URL lacked `transform.routerRoot=src%2Fapp` (defaults to `app` →
  empty router context module → 1630 all-node_modules bundle). Correct dev-bundle
  test: curl the launchAsset URL from the Expo Go manifest
  (`curl -H 'expo-platform: ios' http://localhost:8081/`). With the param: 2886-module
  bundle with all app code; `expo export` .hbc also verified. metro.config.js (GH-3
  resolver) NOT at fault; no code changes needed.
- 2026-11-13 (Cline): batches shipped as PRs — tickets GH-64/65/66 created (project
  #2, In review); PR #67 (UI alignment), PR #68 (v2.27 adapter), PR #69 (app-shell
  wiring, STACKED on the GH-65 branch — merge #68 first, #69 auto-retargets to main).
  GH-55 commented with partial progress, left open. Local 4-gate verification green
  per branch; CI pending on all three.
