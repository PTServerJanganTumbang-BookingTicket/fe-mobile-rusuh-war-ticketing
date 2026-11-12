# Requirements Document

## GH-15 E-Ticket Coming-Soon Placeholder

## Introduction

Display a static "Coming Soon" placeholder screen for e-ticket functionality. This is intentionally minimal — no Figma frame exists (per D-figma-state-report.md §1.8: "E-Ticket: ⚠ Not Found"), no QR code component is available in Signal UI, and no backend integration is required. The placeholder communicates that e-ticket functionality will be available in a future release.

**Scope limitation:** Presentation-only. No business logic, no data layer, no API integration.

---

## Glossary

| Term           | Definition                                                  |
| -------------- | ----------------------------------------------------------- |
| Placeholder    | Static UI indicating future functionality                   |
| Signal UI      | Telkomsel design system (Text component qualified via GH-3) |
| Feature Module | Clean Architecture bounded context under `src/features/`    |

---

## Requirements

### Functional Requirements

#### R1: Placeholder Screen Rendering

**Description:** The e-ticket placeholder screen renders successfully and displays the approved placeholder state.

**Acceptance Criteria:**

- R1-AC1: Screen component mounts without runtime errors
- R1-AC2: Screen displays "Coming Soon" message using Signal UI Text component
- R1-AC3: Screen does not render any UI that implies real e-ticket functionality is available

#### R2: Feature Module Structure

**Description:** The e-ticket feature follows Clean Architecture boundaries.

**Acceptance Criteria:**

- R2-AC1: Feature exists at `src/features/eticket/`
- R2-AC2: Public API exported via `src/features/eticket/index.ts`
- R2-AC3: Presentation layer at `src/features/eticket/presentation/`

### Non-Functional Requirements

#### R3: CI Gate Compliance

**Description:** All CI gates pass after implementation.

**Acceptance Criteria:**

- R3-AC1: `npm run lint` passes
- R3-AC2: `npm run typecheck` passes
- R3-AC3: `npm test` passes (including new render test)
- R3-AC4: `npm run boundary-check` passes
- R3-AC5: `npx expo-doctor` passes (same baseline as main)
- R3-AC6: `npx expo export` succeeds

---

## Constraints

1. **No Figma frame** — Placeholder design is intentionally absent (per D-figma-state-report.md)
2. **No QR code** — Signal UI QRCode component does not exist (verified by directory listing)
3. **No backend integration** — Static placeholder only
4. **No routing composition** — Routing/navigation integration is outside GH-15 and remains owned by the future flow that has an approved contract

---

## Out of Scope

1. Real e-ticket retrieval or display
2. QR code generation or rendering
3. Ticket-detail API contracts
4. Payment integration or payment hand-off behavior
5. Navigation/routing to this screen
6. Domain layer (no business logic for placeholder)
7. Data layer (no data sources for placeholder)
8. Backend adapters or repositories
9. Event Detail navigation
10. Wallet integration, ticket download, or sharing
11. Any new Signal UI capabilities

---

## Definition of Done (DoD) Criteria

### Implementation Quality

| Criterion  | Verification Method | Evidence Required                    |
| ---------- | ------------------- | ------------------------------------ |
| R1-AC1 met | Render test         | Test passes                          |
| R1-AC2 met | Render test         | "Coming Soon" text present           |
| R1-AC3 met | Code review         | No real e-ticket UI                  |
| R2-AC1 met | File exists         | `src/features/eticket/`              |
| R2-AC2 met | File exists         | `src/features/eticket/index.ts`      |
| R2-AC3 met | File exists         | `src/features/eticket/presentation/` |

### CI Gates (AGENTS.md §5-6)

| Gate           | Command                  | Evidence                                 |
| -------------- | ------------------------ | ---------------------------------------- |
| lint           | `npm run lint`           | Exit 0, no errors                        |
| typecheck      | `npm run typecheck`      | Exit 0, no errors                        |
| test           | `npm test`               | All tests pass including new render test |
| boundary-check | `npm run boundary-check` | Exit 0, no violations                    |
| expo-doctor    | `npx expo-doctor`        | Same baseline as main                    |
| expo-export    | `npx expo export`        | iOS and Android bundles created          |

### Git/PR Requirements (AGENTS.md §4, §7, §9)

| Criterion      | Verification                                     |
| -------------- | ------------------------------------------------ |
| Branch naming  | `story/GH-15-eticket-placeholder`                |
| Commit format  | `[GH-15][Rosyid] <type>(<scope>): <description>` |
| No hook bypass | No `--no-verify` used                            |
| Clean diff     | `git diff` reviewed, no unintended changes       |
