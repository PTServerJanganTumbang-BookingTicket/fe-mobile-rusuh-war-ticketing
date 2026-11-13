# Active Context — fe-mobile-rusuh-war-ticketing

> Updated 2026-11-13 (post GH-53 merge; KiroCrew brain + git log verified).

## Current work

- **P0 UI hardening wave complete**: GH-51 (Header, PR #58), GH-52 (CTA color, PR #59),
  GH-53 (queue progress bar color, PR #60) all merged and CLOSED.
- **Remaining P0 tickets (specs not yet created)**: GH-54 (event context card),
  GH-55 (queue position large red number), GH-56 (contact email input),
  GH-57 (header wrapper with back button for PaymentWebView) — use `/ticket-to-spec`.
- GH-51 Figma gap analysis artifacts + de-branding cleanup merged to main (1bfda1f).

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

## Next steps

1. Spec + implement remaining P0 tickets GH-54..GH-57.
2. Await authorization for GH-17 implementation.
