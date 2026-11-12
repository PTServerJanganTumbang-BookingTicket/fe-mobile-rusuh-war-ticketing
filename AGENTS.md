# AGENTS.md — fe-mobile-rusuh-war-ticketing

Repository constitution for human and AI agents working on the Rusuh Booking Tiket mobile application.

---

## 1. Purpose and Scope

This repository contains the Expo/React Native mobile app for Rusuh Booking Tiket. These instructions govern all work within this repository.

For parent workspace coordination, see the parent `AGENTS.md` in `SemestralAssessment/`.

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

| Layer           | Can Import                                   | Cannot Import                                          |
| --------------- | -------------------------------------------- | ------------------------------------------------------ |
| `domain/`       | TypeScript only, `core/domain`               | React, React Native, external libs, data, presentation |
| `data/`         | `domain`, `core/domain`, external libs       | React, presentation                                    |
| `presentation/` | `domain`, `data`, React, React Native        | Other features (except via `index.ts`)                 |
| `app/`          | Feature public APIs via `index.ts`, `core/*` | Feature internals directly                             |

**Cross-feature imports:** Only via `features/<x>/index.ts`. Never import from another feature's internal folders.

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

```
[GH-<n>][Rosyid] <type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`

**Examples:**

- `[GH-3][Rosyid] feat(auth): add magic link request`
- `[GH-2][Rosyid] chore(tooling): add ESLint configuration`

Agents may add a `Co-authored-by:` trailer; the Actor stays Rosyid.

### Protected Branch

`main` is protected. Never push directly to main. Create a branch and open a PR.

### Issue Verification Checkboxes

GitHub issues may contain task-list checkboxes (e.g., "Verification gate" sections). Before closing a ticket or merging its PR:

1. Read the issue body and identify all `- [ ]` checkbox items
2. Verify each checkbox item against the implementation
3. Update the issue body to check off verified items (`- [x]`)
4. Do NOT close or merge with unchecked verification checkboxes

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

## 10. Steering File Index

Context files in `.kiro/steering/`:

| File                         | Inclusion            | Purpose                               |
| ---------------------------- | -------------------- | ------------------------------------- |
| `product.md`                 | always               | Product context                       |
| `tech.md`                    | always               | Tech stack                            |
| `structure.md`               | always               | Folder structure                      |
| `git-workflow.md`            | always               | Branch/commit rules                   |
| `spec-workflow.md`           | always               | Spec creation process                 |
| `architecture-boundaries.md` | fileMatch `src/**`   | Layer rules (loads when editing src/) |
| `testing-tdd.md`             | fileMatch test files | Testing patterns                      |
| `release-train.md`           | manual               | Release process                       |

Steering files reference this document; they do not duplicate it.
