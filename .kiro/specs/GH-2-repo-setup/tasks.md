# Implementation Plan

## Overview

Tasks are ordered: harness docs first (AGENTS.md, steering, templates, skill), then Expo scaffold, then tooling, then hooks, then CI.

**Rule: One task = one commit.** Verification-only tasks are marked "no commit".

---

## Task Dependency Graph

```
T1 (AGENTS.md) ──► T2a-T2h (steering files) ──► T3 (templates) ──► T4 (skill)
                                                                        │
T5 (Expo scaffold) ◄────────────────────────────────────────────────────┘
        │
        ▼
T6 (ESLint/Prettier) ──► T7 (Jest) ──► T8 (boundaries)
                                              │
                                              ▼
T9 (commitlint) ──► T10 (pre-commit) ──► T11 (pre-push)
                                               │
                                               ▼
T12 (CI workflow) ──► T13 (smoke test KiroCrew)
```

```json
{
  "waves": [
    { "wave": 1, "tasks": ["T1"], "description": "AGENTS.md constitution" },
    { "wave": 2, "tasks": ["T2a", "T2b", "T2c", "T2d", "T2e", "T2f", "T2g", "T2h"], "description": "Steering files (parallel)" },
    { "wave": 3, "tasks": ["T3"], "description": "Spec templates" },
    { "wave": 4, "tasks": ["T4"], "description": "Ticket-to-spec skill" },
    { "wave": 5, "tasks": ["T5"], "description": "Expo SDK 58 scaffold" },
    { "wave": 6, "tasks": ["T6"], "description": "ESLint and Prettier" },
    { "wave": 7, "tasks": ["T7"], "description": "Jest test framework" },
    { "wave": 8, "tasks": ["T8"], "description": "Boundary lint" },
    { "wave": 9, "tasks": ["T9"], "description": "Commitlint" },
    { "wave": 10, "tasks": ["T10"], "description": "Pre-commit hook" },
    { "wave": 11, "tasks": ["T11"], "description": "Pre-push hook" },
    { "wave": 12, "tasks": ["T12"], "description": "CI workflow" },
    { "wave": 13, "tasks": ["T13"], "description": "KiroCrew smoke test (verification only)" }
  ]
}
```

---

## Tasks

### T1: AGENTS.md Constitution

**R-IDs:** R5

**Description:** Create AGENTS.md at repository root with all required sections.

**Files to create:**
- `AGENTS.md`

**Content requirements:**
- Architecture and layer rules
- Git workflow and commit conventions
- Verification commands
- Multi-agent isolation rules
- Security boundaries
- Steering file index
- **Rule: Agents must never use `--no-verify` or otherwise bypass git hooks; any bypass requires Rosyid's explicit approval**

**Verification Gate:** T2-11 — File exists with required sections (architecture, commit format, verification commands, steering index); `grep -n 'no-verify' AGENTS.md` returns at least 1 match

**Commit:**
```
[GH-2][Rosyid] docs(agents): add AGENTS.md repository constitution
```

---

### T2a: Steering — product.md

**R-IDs:** R6

**Description:** Create `.kiro/steering/product.md` with `inclusion: always`.

**Files to create:**
- `.kiro/steering/product.md`

**Content requirements:**
- Frontmatter with `inclusion: always`
- Product context: Rusuh Booking Tiket mobile app
- Reference AGENTS.md for details, don't duplicate

**Verification Gate:** T2-16 — File exists with correct inclusion mode

**Commit:**
```
[GH-2][Rosyid] docs(steering): add product.md steering
```

---

### T2b: Steering — tech.md

**R-IDs:** R6

**Description:** Create `.kiro/steering/tech.md` with `inclusion: always`.

**Files to create:**
- `.kiro/steering/tech.md`

**Content requirements:**
- Frontmatter with `inclusion: always`
- Tech stack: Expo SDK 58, React Native 0.88.1, Nativewind 4.2.7, TypeScript
- Reference AGENTS.md for details, don't duplicate

**Verification Gate:** T2-16 — File exists with correct inclusion mode

**Commit:**
```
[GH-2][Rosyid] docs(steering): add tech.md steering
```

---

### T2c: Steering — structure.md

**R-IDs:** R6

**Description:** Create `.kiro/steering/structure.md` with `inclusion: always`.

**Files to create:**
- `.kiro/steering/structure.md`

**Content requirements:**
- Frontmatter with `inclusion: always`
- Folder structure: Clean Architecture feature-first
- Reference AGENTS.md for layer rules, don't duplicate

**Verification Gate:** T2-16 — File exists with correct inclusion mode

**Commit:**
```
[GH-2][Rosyid] docs(steering): add structure.md steering
```

---

### T2d: Steering — git-workflow.md

**R-IDs:** R6

**Description:** Create `.kiro/steering/git-workflow.md` with `inclusion: always`.

**Files to create:**
- `.kiro/steering/git-workflow.md`

**Content requirements:**
- Frontmatter with `inclusion: always`
- Branch naming: story/GH-<n>-<slug>, fix/..., chore/...
- Commit format: [GH-<n>][Rosyid] <type>(<scope>): <desc>
- PR rules
- Reference AGENTS.md, don't duplicate

**Verification Gate:** T2-16 — File exists with correct inclusion mode

**Commit:**
```
[GH-2][Rosyid] docs(steering): add git-workflow.md steering
```

---

### T2e: Steering — spec-workflow.md

**R-IDs:** R6

**Description:** Create `.kiro/steering/spec-workflow.md` with `inclusion: always`.

**Files to create:**
- `.kiro/steering/spec-workflow.md`

**Content requirements:**
- Frontmatter with `inclusion: always`
- Spec creation process
- References templates in `.kiro/specs/_templates/`

**Verification Gate:** T2-16 — File exists with correct inclusion mode

**Commit:**
```
[GH-2][Rosyid] docs(steering): add spec-workflow.md steering
```

---

### T2f: Steering — architecture-boundaries.md

**R-IDs:** R6

**Description:** Create `.kiro/steering/architecture-boundaries.md` with `inclusion: fileMatch "src/**"`.

**Files to create:**
- `.kiro/steering/architecture-boundaries.md`

**Content requirements:**
- Frontmatter with `inclusion: fileMatch` and pattern `src/**`
- Layer dependency rules
- Boundary enforcement via eslint-plugin-boundaries
- Reference AGENTS.md for full rules, don't duplicate

**Verification Gate:** T2-16, T2-18 — File loads when editing src/ files

**Commit:**
```
[GH-2][Rosyid] docs(steering): add architecture-boundaries.md steering
```

---

### T2g: Steering — testing-tdd.md

**R-IDs:** R6

**Description:** Create `.kiro/steering/testing-tdd.md` with `inclusion: fileMatch` for test files.

**Files to create:**
- `.kiro/steering/testing-tdd.md`

**Content requirements:**
- Frontmatter with `inclusion: fileMatch` and patterns `**/*.test.{ts,tsx}`, `__tests__/**`
- Testing patterns and conventions
- TDD workflow guidance

**Verification Gate:** T2-16 — File exists with correct inclusion mode

**Commit:**
```
[GH-2][Rosyid] docs(steering): add testing-tdd.md steering
```

---

### T2h: Steering — release-train.md

**R-IDs:** R6

**Description:** Create `.kiro/steering/release-train.md` with `inclusion: manual`.

**Files to create:**
- `.kiro/steering/release-train.md`

**Content requirements:**
- Frontmatter with `inclusion: manual`
- Release flow: release/X.Y.Z from main → FT, NFT, Security → tag → mergeback
- Hotfix flow: hotfix/* from release/*, never from main
- Tag rules: never delete deployed tag; rollback = redeploy previous tag + git revert
- Conflict resolution: cherry-pick-* branch pattern

**Verification Gate:** T2-16 — Directory exists with release-train.md, inclusion mode is manual

**Commit:**
```
[GH-2][Rosyid] docs(steering): add release-train.md steering
```

---

### T3: Spec Templates

**R-IDs:** R7

**Description:** Create spec templates in `.kiro/specs/_templates/`.

**Files to create:**
- `.kiro/specs/_templates/requirements.md`
- `.kiro/specs/_templates/design.md`
- `.kiro/specs/_templates/tasks.md`

**Verification Gate:** T2-16 — Templates directory exists with all three files

**Commit:**
```
[GH-2][Rosyid] docs(specs): add spec templates for requirements, design, tasks
```

---

### T4: Ticket-to-Spec Skill

**R-IDs:** R8

**Description:** Create ticket-to-spec skill in `.kiro/skills/ticket-to-spec/`.

**Files to create:**
- `.kiro/skills/ticket-to-spec/SKILL.md`

**Content requirements:**
- Skill description and purpose
- Workflow steps for creating specs from GitHub issues
- References to templates in `../.kiro/specs/_templates/`

**Verification Gate:** T2-17 — SKILL.md exists and references templates

**Commit:**
```
[GH-2][Rosyid] chore(skills): add ticket-to-spec skill
```

---

### T5: Expo SDK 58 Scaffold

**R-IDs:** R1, R2, R3, R4

**Description:** Create Expo scaffold with SDK 58, Nativewind, Poppins, and Clean Architecture folder structure.

**Files to create/modify:**
- `package.json` — dependencies and scripts
- `app.json` — Expo config
- `babel.config.js` — with nativewind preset
- `metro.config.js` — with nativewind wrapper
- `tailwind.config.js` — nativewind preset
- `tsconfig.json` — TypeScript config
- `nativewind-env.d.ts` — type declarations
- `global.css` — Tailwind directives
- `src/app/_layout.tsx` — root layout with font loading
- `src/app/index.tsx` — home screen placeholder
- `src/core/domain/.gitkeep`
- `src/core/data/.gitkeep`
- `src/core/presentation/.gitkeep`
- `src/features/_example/domain/.gitkeep`
- `src/features/_example/data/.gitkeep`
- `src/features/_example/presentation/.gitkeep`
- `src/features/_example/index.ts`
- `.gitignore` — comprehensive exclusions

**Verification Gate:** T2-01 (npm ci), T2-07 (expo-doctor), T2-08 (expo export)

**Commit:**
```
[GH-2][Rosyid] chore(scaffold): add Expo SDK 58 with Nativewind and folder structure
```

---

### T6: ESLint and Prettier

**R-IDs:** R9, R10

**Description:** Configure ESLint with React Native rules and Prettier.

**Files to create:**
- `.eslintrc.js` — ESLint config (without boundaries yet)
- `.prettierrc` — Prettier config
- Add scripts to `package.json`: `lint`, `format`

**Verification Gate:** T2-02 (lint passes)

**Commit:**
```
[GH-2][Rosyid] chore(tooling): add ESLint and Prettier configuration
```

---

### T7: Jest Test Framework

**R-IDs:** R11, R12

**Description:** Configure Jest with jest-expo preset and React Native Testing Library.

**Files to create:**
- `jest.config.js` — Jest config
- `__tests__/smoke.test.ts` — basic smoke test
- `__tests__/App.render.test.tsx` — App render test
- Add scripts to `package.json`: `test`, `typecheck`

**Verification Gate:** T2-03 (typecheck), T2-04 (smoke test), T2-05 (render test)

**Commit:**
```
[GH-2][Rosyid] chore(tooling): add Jest with smoke and render tests
```

---

### T8: Boundary Lint

**R-IDs:** R16

**Description:** Add eslint-plugin-boundaries with Clean Architecture rules.

**Files to modify:**
- `.eslintrc.js` — add boundaries plugin and rules
- Add script to `package.json`: `boundary-check`

**Verification Gate:** T2-06 (boundary check rejects bad import)

**Commit:**
```
[GH-2][Rosyid] chore(tooling): add eslint-plugin-boundaries for architecture enforcement
```

---

### T9: Commitlint

**R-IDs:** R13

**Description:** Configure commitlint with custom pattern for `[GH-<n>][Actor] type(scope): desc`.

**Files to create:**
- `commitlint.config.js` — commitlint rules with custom plugin

**Verification Gate:** T2-15 (invalid commit rejected)

**Commit:**
```
[GH-2][Rosyid] chore(tooling): add commitlint with project commit format
```

---

### T10: Pre-commit Hook

**R-IDs:** R14

**Description:** Configure husky with pre-commit hook that blocks commits on main and runs lint-staged.

**Files to create/modify:**
- `.husky/pre-commit` — main branch check + lint-staged runner
- Add `lint-staged` config to `package.json`
- Add `prepare` script for husky

**Verification Gate:** T2-13 (pre-commit runs on staged files), T2-19 (blocks commits on main)

**Commit:**
```
[GH-2][Rosyid] chore(hooks): add pre-commit hook with main guard and lint-staged
```

---

### T11: Pre-push Hook (Main Protection)

**R-IDs:** R15

**Description:** Configure pre-push hook to block direct pushes to main branch.

**Files to create:**
- `.husky/commit-msg` — commitlint hook
- `.husky/pre-push` — main branch blocker

**Verification Gate:** T2-14 (push to main rejected)

**Commit:**
```
[GH-2][Rosyid] chore(hooks): add pre-push hook blocking direct main push
```

---

### T12: CI Workflow

**R-IDs:** R17, R18, R19, R20, R21, R22

**Description:** Create GitHub Actions workflow with all 6 CI gates.

**Files to create:**
- `.github/workflows/ci.yml` — CI workflow

**Verification Gate:** T2-09 (workflow triggers), T2-10 (failure blocks)

**Commit:**
```
[GH-2][Rosyid] chore(ci): add GitHub Actions workflow with 6 quality gates
```

---

### T13: KiroCrew Smoke Test

**R-IDs:** R6, R8

**Description:** Verify that a KiroCrew session can load repo steering and discover the ticket-to-spec skill.

**Verification method:**
1. Open KiroCrew session in repo directory
2. Verify always-on steering files load (product, tech, structure, git-workflow, spec-workflow)
3. Verify skill is discoverable via `skill_search`
4. Edit a `src/` file and confirm `architecture-boundaries.md` loads (fileMatch test)

**Verification Gate:** T2-18 (steering loads, skill discoverable, fileMatch triggers)

**Note:** This is a manual verification checkpoint, not a committed test. Document results in PR description.

**Commit:** (no commit — verification only)

---

## Task Summary Table

| Task | R-IDs | Files | Verification | Commit |
|------|-------|-------|--------------|--------|
| T1 | R5 | AGENTS.md | T2-11 | `[GH-2][Rosyid] docs(agents): add AGENTS.md repository constitution` |
| T2a | R6 | .kiro/steering/product.md | T2-16 | `[GH-2][Rosyid] docs(steering): add product.md steering` |
| T2b | R6 | .kiro/steering/tech.md | T2-16 | `[GH-2][Rosyid] docs(steering): add tech.md steering` |
| T2c | R6 | .kiro/steering/structure.md | T2-16 | `[GH-2][Rosyid] docs(steering): add structure.md steering` |
| T2d | R6 | .kiro/steering/git-workflow.md | T2-16 | `[GH-2][Rosyid] docs(steering): add git-workflow.md steering` |
| T2e | R6 | .kiro/steering/spec-workflow.md | T2-16 | `[GH-2][Rosyid] docs(steering): add spec-workflow.md steering` |
| T2f | R6 | .kiro/steering/architecture-boundaries.md | T2-16, T2-18 | `[GH-2][Rosyid] docs(steering): add architecture-boundaries.md steering` |
| T2g | R6 | .kiro/steering/testing-tdd.md | T2-16 | `[GH-2][Rosyid] docs(steering): add testing-tdd.md steering` |
| T2h | R6 | .kiro/steering/release-train.md | T2-16 | `[GH-2][Rosyid] docs(steering): add release-train.md steering` |
| T3 | R7 | .kiro/specs/_templates/*.md | T2-16 | `[GH-2][Rosyid] docs(specs): add spec templates for requirements, design, tasks` |
| T4 | R8 | .kiro/skills/ticket-to-spec/SKILL.md | T2-17 | `[GH-2][Rosyid] chore(skills): add ticket-to-spec skill` |
| T5 | R1-R4 | package.json, configs, src/** | T2-01, T2-07, T2-08 | `[GH-2][Rosyid] chore(scaffold): add Expo SDK 58 with Nativewind and folder structure` |
| T6 | R9-R10 | .eslintrc.js, .prettierrc | T2-02 | `[GH-2][Rosyid] chore(tooling): add ESLint and Prettier configuration` |
| T7 | R11-R12 | jest.config.js, __tests__/** | T2-03, T2-04, T2-05 | `[GH-2][Rosyid] chore(tooling): add Jest with smoke and render tests` |
| T8 | R16 | .eslintrc.js (boundaries) | T2-06 | `[GH-2][Rosyid] chore(tooling): add eslint-plugin-boundaries for architecture enforcement` |
| T9 | R13 | commitlint.config.js | T2-15 | `[GH-2][Rosyid] chore(tooling): add commitlint with project commit format` |
| T10 | R14 | .husky/pre-commit | T2-13, T2-19 | `[GH-2][Rosyid] chore(hooks): add pre-commit hook with main guard and lint-staged` |
| T11 | R15 | .husky/pre-push, .husky/commit-msg | T2-14 | `[GH-2][Rosyid] chore(hooks): add pre-push hook blocking direct main push` |
| T12 | R17-R22 | .github/workflows/ci.yml | T2-09, T2-10 | `[GH-2][Rosyid] chore(ci): add GitHub Actions workflow with 6 quality gates` |
| T13 | R6, R8 | — | T2-18 | (no commit — verification only) |

---

## Notes

### Commit Count

**Total: 19 commits** (one per task, T13 is verification-only)

Tasks T1 → T12 each produce exactly one commit. T13 is manual verification with no commit.

### Verification Sequence

Run verification after each task:
1. After T1: Check AGENTS.md exists
2. After T2a-T2h: Check `.kiro/steering/` has all 8 files
3. After T3: Check `.kiro/specs/_templates/` has 3 files
4. After T4: Check `.kiro/skills/ticket-to-spec/SKILL.md` exists
5. After T5: `npm ci`, `npx expo-doctor`, `npx expo export`
6. After T6: `npm run lint`
7. After T7: `npm run typecheck`, `npm test`
8. After T8: `npm run boundary-check`
9. After T9: Test commitlint with bad message
10. After T10: Test pre-commit on main branch, test lint-staged
11. After T11: Test pre-push to main
12. After T12: Push branch, verify CI triggers
13. T13: KiroCrew smoke test (manual, document in PR)

### R-ID to Task Traceability

| R-ID | Task(s) | Acceptance Criteria |
|------|---------|---------------------|
| R1 | T5 | R1-AC1 through R1-AC4 |
| R2 | T5 | R2-AC1 through R2-AC5 |
| R3 | T5 | R3-AC1 through R3-AC3 |
| R4 | T5 | R4-AC1 through R4-AC4 |
| R5 | T1 | R5-AC1 through R5-AC6 |
| R6 | T2a-T2h, T13 | R6-AC1 through R6-AC7 |
| R7 | T3 | R7-AC1 through R7-AC4 |
| R8 | T4, T13 | R8-AC1 through R8-AC3 |
| R9 | T6 | R9-AC1 through R9-AC3 |
| R10 | T6 | R10-AC1 through R10-AC3 |
| R11 | T7 | R11-AC1 through R11-AC4 |
| R12 | T7 | R12-AC1 through R12-AC3 |
| R13 | T9 | R13-AC1 through R13-AC3 |
| R14 | T10 | R14-AC1 through R14-AC4 |
| R15 | T11 | R15-AC1 through R15-AC3 |
| R16 | T8 | R16-AC1 through R16-AC4 |
| R17 | T12 | R17-AC1, R17-AC2 |
| R18 | T12 | R18-AC1, R18-AC2 |
| R19 | T12 | R19-AC1, R19-AC2 |
| R20 | T12 | R20-AC1, R20-AC2 |
| R21 | T12 | R21-AC1 through R21-AC3 |
| R22 | T12 | R22-AC1, R22-AC2 |
| R23 | T5 | R23-AC1 through R23-AC3 |
