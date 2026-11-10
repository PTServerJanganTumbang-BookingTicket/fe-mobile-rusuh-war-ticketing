# Implementation Tasks — GH-2 Repo Setup

## Overview

Tasks are ordered: harness docs first (AGENTS.md, steering, templates, skill), then Expo scaffold, then tooling, then hooks, then CI.

Each task ends with a named verification gate and maps to ONE proposed commit message.

---

## Task Dependency Graph

```
T1 (AGENTS.md) ──► T2 (steering) ──► T3 (templates) ──► T4 (skill)
                                                              │
T5 (Expo scaffold) ◄──────────────────────────────────────────┘
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

---

## Tasks

### T1: AGENTS.md Constitution

**R-IDs:** R5

**Description:** Create AGENTS.md at repository root with all required sections.

**Files to create:**
- `AGENTS.md`

**Verification Gate:** T2-11 — File exists with required sections (architecture, commit format, verification commands, steering index)

**Proposed Commit:**
```
[GH-2][Rosyid] docs(agents): add AGENTS.md repository constitution
```

---

### T2: Release Train Steering

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

**Proposed Commit:**
```
[GH-2][Rosyid] docs(steering): add release-train steering file
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

**Proposed Commit:**
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

**Proposed Commit:**
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

**Proposed Commit:**
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

**Proposed Commit:**
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

**Proposed Commit:**
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

**Proposed Commit:**
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

**Proposed Commit:**
```
[GH-2][Rosyid] chore(tooling): add commitlint with project commit format
```

---

### T10: Pre-commit Hook

**R-IDs:** R14

**Description:** Configure husky with pre-commit hook running lint-staged.

**Files to create/modify:**
- `.husky/pre-commit` — lint-staged runner
- Add `lint-staged` config to `package.json`
- Add `prepare` script for husky

**Verification Gate:** T2-13 (pre-commit runs on staged files)

**Proposed Commit:**
```
[GH-2][Rosyid] chore(hooks): add pre-commit hook with lint-staged
```

---

### T11: Pre-push Hook (Main Protection)

**R-IDs:** R15

**Description:** Configure pre-push hook to block direct pushes to main branch.

**Files to create:**
- `.husky/commit-msg` — commitlint hook
- `.husky/pre-push` — main branch blocker

**Verification Gate:** T2-14 (push to main rejected)

**Proposed Commit:**
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

**Proposed Commit:**
```
[GH-2][Rosyid] chore(ci): add GitHub Actions workflow with 6 quality gates
```

---

### T13: KiroCrew Smoke Test

**R-IDs:** R6, R8

**Description:** Verify that a KiroCrew session can load repo steering and discover the ticket-to-spec skill.

**Verification method:**
1. Open KiroCrew session in repo directory
2. Verify steering files load (check context)
3. Verify skill is discoverable via `skill_search`

**Verification Gate:** T2-18 (steering loads, skill discoverable)

**Note:** This is a manual verification checkpoint, not a committed test. Document results in PR description.

**Proposed Commit:** N/A (verification only)

---

## Task Summary Table

| Task | R-IDs | Files | Verification | Commit Type |
|------|-------|-------|--------------|-------------|
| T1 | R5 | AGENTS.md | T2-11 | docs(agents) |
| T2 | R6 | .kiro/steering/release-train.md | T2-16 | docs(steering) |
| T3 | R7 | .kiro/specs/_templates/*.md | T2-16 | docs(specs) |
| T4 | R8 | .kiro/skills/ticket-to-spec/SKILL.md | T2-17 | chore(skills) |
| T5 | R1-R4 | package.json, configs, src/** | T2-01, T2-07, T2-08 | chore(scaffold) |
| T6 | R9-R10 | .eslintrc.js, .prettierrc | T2-02 | chore(tooling) |
| T7 | R11-R12 | jest.config.js, __tests__/** | T2-03, T2-04, T2-05 | chore(tooling) |
| T8 | R16 | .eslintrc.js (boundaries) | T2-06 | chore(tooling) |
| T9 | R13 | commitlint.config.js | T2-15 | chore(tooling) |
| T10 | R14 | .husky/pre-commit | T2-13 | chore(hooks) |
| T11 | R15 | .husky/pre-push, .husky/commit-msg | T2-14 | chore(hooks) |
| T12 | R17-R22 | .github/workflows/ci.yml | T2-09, T2-10 | chore(ci) |
| T13 | R6, R8 | — (manual verification) | T2-18 | — |

---

## Implementation Notes

### Commit Ordering

Tasks should be committed in order T1 → T12 to maintain logical progression. T13 is a verification step, not a commit.

However, for practical implementation, some tasks may be combined:
- T1-T4 can be one commit (all docs)
- T5 is standalone (scaffold)
- T6-T8 can be one commit (static analysis)
- T9-T11 can be one commit (hooks)
- T12 is standalone (CI)

Final commit count: 5-12 depending on granularity chosen.

### Verification Sequence

Run verification after each logical group:
1. After T4: Check `.kiro/` structure
2. After T5: `npm ci`, `npx expo-doctor`, `npx expo export`
3. After T8: `npm run lint`, `npm run typecheck`, `npm run boundary-check`
4. After T11: Test hooks manually
5. After T12: Push branch, verify CI triggers

### R-ID to Task Traceability

| R-ID | Task(s) | Acceptance Criteria |
|------|---------|---------------------|
| R1 | T5 | R1-AC1 through R1-AC4 |
| R2 | T5 | R2-AC1 through R2-AC5 |
| R3 | T5 | R3-AC1 through R3-AC3 |
| R4 | T5 | R4-AC1 through R4-AC4 |
| R5 | T1 | R5-AC1 through R5-AC5 |
| R6 | T2, T13 | R6-AC1 through R6-AC4 |
| R7 | T3 | R7-AC1 through R7-AC4 |
| R8 | T4, T13 | R8-AC1 through R8-AC3 |
| R9 | T6 | R9-AC1 through R9-AC3 |
| R10 | T6 | R10-AC1 through R10-AC3 |
| R11 | T7 | R11-AC1 through R11-AC4 |
| R12 | T7 | R12-AC1 through R12-AC3 |
| R13 | T9 | R13-AC1 through R13-AC3 |
| R14 | T10 | R14-AC1 through R14-AC3 |
| R15 | T11 | R15-AC1 through R15-AC3 |
| R16 | T8 | R16-AC1 through R16-AC4 |
| R17 | T12 | R17-AC1, R17-AC2 |
| R18 | T12 | R18-AC1, R18-AC2 |
| R19 | T12 | R19-AC1, R19-AC2 |
| R20 | T12 | R20-AC1, R20-AC2 |
| R21 | T12 | R21-AC1 through R21-AC3 |
| R22 | T12 | R22-AC1, R22-AC2 |
| R23 | T5 | R23-AC1 through R23-AC3 |
