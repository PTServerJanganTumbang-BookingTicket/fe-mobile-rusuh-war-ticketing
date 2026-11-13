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
