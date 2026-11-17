# AGENTS.md — fe-mobile-rusuh-war-ticketing

Repository constitution for human and AI agents working on the Rusuh Booking Tiket mobile application.

---

## 1. Purpose and Scope

This repository contains the Expo/React Native mobile app for Rusuh Booking Tiket. These instructions are the universal entry point for human and AI agents (Antigravity, Cline, Kiro/KiroCrew, Copilot, Hermes, and future tools) working within this repository.

For parent workspace coordination, see the parent `AGENTS.md` in `SemestralAssessment/`.

---

## 1a. Source-of-Truth & Conflict Resolution

| Knowledge Type               | Canonical Authority                                                                                               | Never Authoritative                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **IMPLEMENTATION**           | `src/**`, `__tests__/**`, `package.json`, `app.json`, `metro.config.js`                                           | `memory-bank/`, stale specs                               |
| **ARCHITECTURE**             | `eslint.config.mjs` (`npm run boundary-check`) + `docs/ARCHITECTURE.md`                                           | `memory-bank/`, contradictory steering prose              |
| **CONTRACTS**                | `docs/CONTRACT-BASELINE.md` + referenced external `../documentations/adr/` (preserve `Proposed`/`Pending` status) | AI session memory, test fixtures alone                    |
| **FEATURE SPECIFICATIONS**   | `.kiro/specs/GH-<n>-<slug>/{requirements,design,tasks}.md`                                                        | `memory-bank/` summaries                                  |
| **WORKFLOW / GOVERNANCE**    | `AGENTS.md` + `commitlint.config.js` + `.husky/*` + `.github/workflows/ci.yml`                                    | Outdated prose in `.kiro/steering/` or `.clinerules/`     |
| **CURRENT EXECUTION STATUS** | Git history (`origin/main`) + GitHub Issues / PRs / Project #2                                                    | `memory-bank/activeContext.md`, `memory-bank/progress.md` |
| **KNOWN TECHNICAL DEBT**     | `docs/KNOWN-ISSUES.md` (+ linked GitHub Issues)                                                                   | Unverified session notes                                  |
| **HISTORICAL AI MEMORY**     | `memory-bank/` (frozen 2026-11-13, **non-authoritative**)                                                         | Provider session logs / chat history                      |

**Conflict rules:**

- Executable configuration (`eslint.config.mjs`, `commitlint.config.js`, `.github/workflows/ci.yml`) and implementation evidence override contradictory prose for actual/enforced behavior.
- Approved contract/architecture intent (`docs/CONTRACT-BASELINE.md`, external ADRs, approved specs) establishes intended behavior when current product code contains a documented bug (`docs/KNOWN-ISSUES.md`).
- Never resolve an unresolved contract or architecture decision by guessing; stop and escalate to Rosyid.
- Provider session histories (`memory-bank/`, chat logs) are never authoritative for current status or contracts.

---

## 1b. Assessment Baseline

- **Immutable assessment submission tag:** `assessment-2026h2-submission` → `99c7cb2065b5f85b2c0f8a8b974360e43425cc08`
- Post-assessment documentation and development must preserve this baseline intact and must not rewrite or backdate historical artifacts.

---

## 2. Architecture Overview

**Pattern:** Clean Architecture, feature-first organization.

```
src/
├── app/              # Expo Router (file-based routing ONLY)
├── core/
│   ├── domain/       # Shared domain models, protocols, rules
│   ├── data/         # Shared data layer (HTTP client, storage)
│   └── presentation/ # Shared hooks, utilities, components
└── features/
    └── <feature>/
        ├── domain/       # Feature domain models, rules
        ├── data/         # Feature data layer
        ├── presentation/ # Feature screens, hooks, components
        └── index.ts      # Public API (only import via this)
```

---

## 3. Layer Dependency Rules

Executable authority: `eslint.config.mjs` (`npm run boundary-check`).

| Layer           | Can Import                                                             | Cannot Import                                                     |
| --------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `domain/`       | TypeScript only, `core/domain`                                         | React, React Native, external libs, `data/`, `presentation/`      |
| `data/`         | own `domain`, `core/domain`, `core/data`, external libs                | React, `presentation/`                                            |
| `presentation/` | own `domain`, `core/domain`, `core/presentation`, React, React Native  | **`data/` (own or core)**, other features (except via `index.ts`) |
| `app/`          | Feature public APIs via `index.ts`, `core/domain`, `core/presentation` | Feature internals directly                                        |

**Presentation DI rule:** Feature `presentation/` **MUST NOT import feature `data/`**. Data sources and repositories are instantiated in `src/app/` (the composition root) and injected into presentation hooks/screens.

**Cross-feature imports:** Only via `features/<x>/index.ts` (shared ports belong in `core/domain`). Never import from another feature's internal folders.

See `docs/ARCHITECTURE.md` for Signal UI, Metro/Expo/Hermes, and feature-wiring details.

---

## 4. Git Workflow

### Branch Naming

| Pattern               | Use                  |
| --------------------- | -------------------- |
| `story/GH-<n>-<slug>` | Feature work         |
| `fix/GH-<n>-<slug>`   | Bug fixes            |
| `chore/GH-<n>-<slug>` | Maintenance, tooling |

Branches live max 1 day. Use feature flags for incomplete work.

### Commit Message Format

Executable authority: `commitlint.config.js`.

```
[GH-<n>][Rosyid] <type>(<scope>): <description>
```

**Allowed types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

**Examples:**

- `[GH-3][Rosyid] feat(auth): add magic link request`
- `[GH-2][Rosyid] chore(tooling): add ESLint configuration`

Agents may add a `Co-authored-by:` trailer; the commitlint `[Rosyid]` actor token is required.

### Protected Branch

`main` is protected. Never push directly to main. Create a branch and open a PR.

### Issue Verification Checkboxes

GitHub issues may contain task-list checkboxes (e.g., "Verification gate" sections). Before closing a ticket or merging its PR:

1. Read the issue body and identify all `- [ ]` checkbox items
2. Verify each checkbox item against the implementation
3. Update the issue body to check off verified items (`- [x]`)
4. Leave a checkbox unchecked if verification fails or supporting evidence is insufficient
5. Do NOT close or merge with unchecked verification checkboxes

Never check an item solely to unblock merge or ticket closure.

Use `gh issue edit <n> --body '...'` to update checkboxes.

---

## 5. Verification Commands

```bash
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm test              # Jest (non-watch)
npm run boundary-check # Architecture boundary validation
npx expo-doctor       # Expo SDK compatibility
npx expo export       # Build verification
```

All gates must pass before merge.

---

## 6. CI Gates

Six gates block merge (GitHub Actions):

1. **lint** — `npm run lint`
2. **typecheck** — `npm run typecheck`
3. **test** — `npm test`
4. **expo-doctor** — `npx expo-doctor`
5. **expo-export** — `npx expo export`
6. **boundary-check** — `npm run boundary-check`

---

## 7. Multi-Agent Rules

- Two agents must never modify the same working tree concurrently.
- Work within authorized ticket scope only.
- Prefer separate branches and worktrees for parallel work.
- The human (Rosyid) approves all consequential Git operations.

---

## 8. Security Boundaries

- Never commit secrets, credentials, `.env*` files, `*.pem`, `*.key`.
- Never use real NIK data; use fake NIK fixtures only.
- `.gitignore` must exclude sensitive files.

---

## 9. Hook Bypass Policy

**Agents must never use `--no-verify` or otherwise bypass git hooks.**

Any bypass of pre-commit, commit-msg, or pre-push hooks requires Rosyid's explicit approval. This rule has no exceptions.

---

## 10. Documentation, Skills & Legacy Adapters

**Canonical documentation & portable skills:**

- `docs/ARCHITECTURE.md` — Clean Architecture, Signal UI, Expo/Hermes constraints, feature wiring inventory
- `docs/CONTRACT-BASELINE.md` — API contract baseline, post-baseline ADR index, and v2.27 observations
- `docs/KNOWN-ISSUES.md` — verified technical debt, contract mismatches, and unwired gaps
- `.agents/skills/` — portable provider-neutral workflows (`ticket-to-spec`, `release-train`)
- `.kiro/specs/` — feature specifications (`requirements.md`, `design.md`, `tasks.md`)

**Historical / legacy provider artifacts (non-authoritative on conflict):**

- `memory-bank/` — frozen historical AI session memory (`2026-11-13`); **never** use for current ticket/PR status or canonical rules.
- `.kiro/steering/` and `.clinerules/` — tool-specific rule adapters retained for Kiro/Cline compatibility; `AGENTS.md`, `eslint.config.mjs`, and `commitlint.config.js` take precedence if any wording diverges.
