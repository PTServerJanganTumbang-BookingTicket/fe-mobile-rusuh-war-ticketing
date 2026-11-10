# Design Document — GH-2 Repo Setup

## Overview

This document specifies the technical design for Ticket #2: repository foundation setup. The design establishes project structure, tooling configuration, governance documentation, and CI/CD pipeline.

---

## File Tree with Purpose and Steering Inclusion

```
fe-mobile-rusuh-war-ticketing/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI workflow (6 gates)
├── .husky/                           # Git hooks (via husky)
│   ├── commit-msg                    # Commitlint validation
│   ├── pre-commit                    # lint-staged
│   └── pre-push                      # Block direct main push
├── .kiro/
│   ├── settings/
│   │   └── project.json              # Kiro project config (if needed)
│   ├── skills/
│   │   └── ticket-to-spec/
│   │       └── SKILL.md              # Spec creation skill
│   ├── specs/
│   │   ├── _templates/
│   │   │   ├── requirements.md       # Req template
│   │   │   ├── design.md             # Design template
│   │   │   └── tasks.md              # Tasks template
│   │   └── GH-2-repo-setup/          # This spec
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   └── steering/
│       ├── product.md                # inclusion: always — product context
│       ├── tech.md                   # inclusion: always — tech stack
│       ├── structure.md              # inclusion: always — folder structure
│       ├── git-workflow.md           # inclusion: always — branch/commit rules
│       ├── spec-workflow.md          # inclusion: always — spec process
│       ├── architecture-boundaries.md # inclusion: fileMatch "src/**"
│       ├── testing-tdd.md            # inclusion: fileMatch "**/*.test.{ts,tsx}", "__tests__/**"
│       └── release-train.md          # inclusion: manual
├── __tests__/
│   ├── smoke.test.ts                 # Basic smoke test
│   └── App.render.test.tsx           # App render test
├── src/
│   ├── app/                          # Expo Router (file-based routing)
│   │   ├── _layout.tsx               # Root layout, font loading, global.css import
│   │   └── index.tsx                 # Home screen placeholder
│   ├── core/
│   │   ├── domain/                   # Shared domain models, protocols
│   │   │   └── .gitkeep
│   │   ├── data/                     # Shared data layer (HTTP client, etc.)
│   │   │   └── .gitkeep
│   │   └── presentation/             # Shared presentation (hooks, utils)
│   │       └── .gitkeep
│   └── features/
│       └── _example/                 # Placeholder feature (removed after first real feature)
│           ├── domain/
│           │   └── .gitkeep
│           ├── data/
│           │   └── .gitkeep
│           ├── presentation/
│           │   └── .gitkeep
│           └── index.ts              # Public API barrel export
├── .eslintrc.js                      # ESLint config with boundaries
├── .gitignore                        # Exclude secrets, node_modules, build outputs
├── .prettierrc                       # Prettier config
├── AGENTS.md                         # Repository constitution
├── README.md                         # Project readme (update from initial)
├── app.json                          # Expo config
├── babel.config.js                   # Babel with nativewind preset
├── commitlint.config.js              # Commitlint rules
├── global.css                        # Tailwind directives
├── jest.config.js                    # Jest config
├── metro.config.js                   # Metro with nativewind
├── nativewind-env.d.ts               # Nativewind TypeScript types
├── package-lock.json                 # npm lockfile
├── package.json                      # Dependencies and scripts
├── tailwind.config.js                # Tailwind config with nativewind preset
└── tsconfig.json                     # TypeScript config
```

### Steering File Budget Analysis

| File | Inclusion Mode | Est. Tokens | Purpose |
|------|---------------|-------------|---------|
| `product.md` | always | ~200 | Product context: Rusuh Booking Tiket mobile app |
| `tech.md` | always | ~300 | Tech stack: Expo SDK 58, Nativewind, TypeScript |
| `structure.md` | always | ~400 | Folder structure: Clean Architecture feature-first |
| `git-workflow.md` | always | ~350 | Branch naming, commit format, PR rules |
| `spec-workflow.md` | always | ~250 | Spec creation process, references templates |
| `architecture-boundaries.md` | fileMatch `src/**` | ~400 | Layer rules, boundary enforcement (loads when editing src/) |
| `testing-tdd.md` | fileMatch `**/*.test.{ts,tsx}`, `__tests__/**` | ~300 | Testing patterns, TDD workflow (loads for test files) |
| `release-train.md` | manual | ~400 | Release process, hotfix rules, mergeback |
| **Total always-on** | — | **~1,500** | Under 2,000 token budget ✓ |
| **Total fileMatch** | — | ~700 | Loads conditionally |
| **Total manual** | — | ~400 | On-demand only |

---

## AGENTS.md Constitution Design

AGENTS.md is the repository constitution. It **references** steering files; it never duplicates their content.

### Sections

1. **Purpose and Scope** — What this repo is for
2. **Architecture Overview** — Clean Architecture feature-first, layer rules
3. **Layer Dependency Rules** — What each layer can import
4. **Git Workflow** — Trunk-based development, branch naming
5. **Commit Message Format** — `[GH-<n>][Rosyid] <type>(<scope>): <desc>`
6. **Verification Commands** — npm run lint, typecheck, test
7. **CI Gates** — What blocks merge
8. **Multi-Agent Rules** — Isolation, no concurrent modification
9. **Security Boundaries** — No secrets, approval requirements
10. **Steering File Index** — Points to `.kiro/steering/` files

### Key Content (Not Duplicated from Steering)

```markdown
## Commit Message Format

Format: `[GH-<n>][Rosyid] <type>(<scope>): <desc>`

Types: feat | fix | chore | docs | refactor | test

Example: `[GH-3][Rosyid] feat(auth): add magic link request`

Agent may add `Co-authored-by:` trailer; Actor stays Rosyid.
```

---

## Clean Architecture Feature-First Layout

### Layer Definitions

| Layer | Location | Can Import | Cannot Import |
|-------|----------|------------|---------------|
| **domain** | `*/domain/` | TypeScript only, `core/domain` | React, React Native, external libs, data, presentation |
| **data** | `*/data/` | `domain`, `core/domain`, external libs | React, presentation |
| **presentation** | `*/presentation/` | `domain`, `data`, React, React Native | Other features except via `index.ts` |

### Feature Structure Pattern

```
src/features/<feature>/
├── domain/
│   ├── <concept>.model.ts       # Types and interfaces
│   ├── <concept>.rules.ts       # Pure business logic
│   └── <feature>.constants.ts   # Business constants
├── data/
│   ├── <feature>.repository.ts  # Data access implementation
│   └── <feature>.schema.ts      # Zod schemas for validation
├── presentation/
│   ├── <feature>.hooks.ts       # React hooks
│   ├── <feature>.viewmodel.ts   # View state logic
│   └── components/              # Feature-specific components
└── index.ts                     # Public API only
```

### Boundary Lint Element/Rule Map

```javascript
// .eslintrc.js boundaries configuration
{
  settings: {
    'boundaries/elements': [
      { type: 'app', pattern: 'src/app/*' },
      { type: 'core-domain', pattern: 'src/core/domain/*' },
      { type: 'core-data', pattern: 'src/core/data/*' },
      { type: 'core-presentation', pattern: 'src/core/presentation/*' },
      { type: 'feature-domain', pattern: 'src/features/*/domain/*' },
      { type: 'feature-data', pattern: 'src/features/*/data/*' },
      { type: 'feature-presentation', pattern: 'src/features/*/presentation/*' },
      { type: 'feature-public', pattern: 'src/features/*/index.ts' },
    ],
  },
  rules: {
    'boundaries/element-types': [2, {
      default: 'disallow',
      rules: [
        // Domain cannot import data or presentation
        { from: ['feature-domain', 'core-domain'], allow: ['core-domain'] },
        // Data can import domain only
        { from: ['feature-data', 'core-data'], allow: ['core-domain', 'feature-domain', 'core-data'] },
        // Presentation can import domain, data, and other features via index.ts
        { from: ['feature-presentation', 'core-presentation'], allow: ['core-domain', 'core-data', 'core-presentation', 'feature-domain', 'feature-data', 'feature-public'] },
        // App can import anything via public API
        { from: ['app'], allow: ['core-domain', 'core-data', 'core-presentation', 'feature-public'] },
      ],
    }],
  },
}
```

---

## Hook and Commitlint Design

### Husky Configuration

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx --no -- commitlint --edit ${1}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Block commits on main branch
current_branch=$(git symbolic-ref HEAD 2>/dev/null | sed 's|refs/heads/||')
if [ "$current_branch" = "main" ]; then
  echo "❌ Commits directly on main are not allowed."
  echo "   Create a branch first: git switch -c story/GH-<n>-<slug>"
  exit 1
fi

npx lint-staged
```

```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

remote="$1"
current_branch=$(git symbolic-ref HEAD 2>/dev/null | sed 's|refs/heads/||')

if [ "$current_branch" = "main" ]; then
  echo "❌ Direct push to main is not allowed."
  echo "   Create a branch and open a pull request instead."
  echo "   Branch naming: story/GH-<n>-<slug>, fix/..., chore/..."
  exit 1
fi
```

### Commitlint Configuration

```javascript
// commitlint.config.js
module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^\[GH-(\d+)\]\[([^\]]+)\] (feat|fix|chore|docs|refactor|test)\(([^)]+)\): (.+)$/,
      headerCorrespondence: ['ticket', 'actor', 'type', 'scope', 'subject'],
    },
  },
  rules: {
    'header-match-pattern': [2, 'always'],
    'type-enum': [2, 'always', ['feat', 'fix', 'chore', 'docs', 'refactor', 'test']],
  },
  plugins: [
    {
      rules: {
        'header-match-pattern': ({ header }) => {
          const pattern = /^\[GH-\d+\]\[[^\]]+\] (feat|fix|chore|docs|refactor|test)\([^)]+\): .+$/;
          return [
            pattern.test(header),
            'Commit message must match: [GH-<n>][Actor] <type>(<scope>): <desc>',
          ];
        },
      },
    },
  ],
};
```

### Lint-Staged Configuration

```javascript
// package.json "lint-staged" field
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## CI Workflow Design

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - uses: actions/cache/save@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}

  lint:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
      - run: npm run lint

  typecheck:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
      - run: npm run typecheck

  test:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
      - run: npm test -- --ci --coverage

  expo-doctor:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
      - run: npx expo-doctor

  expo-export:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
      - run: npx expo export

  boundary-check:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('package-lock.json') }}
      - run: npm run boundary-check
```

### CI Jobs Summary

| Job | Command | Blocks Merge |
|-----|---------|--------------|
| lint | `npm run lint` | Yes |
| typecheck | `npm run typecheck` | Yes |
| test | `npm test -- --ci` | Yes |
| expo-doctor | `npx expo-doctor` | Yes |
| expo-export | `npx expo export` | Yes |
| boundary-check | `npm run boundary-check` | Yes |

---

## Architecture

This ticket establishes the foundational architecture — it does not implement feature business logic. The architecture applies to all future feature development.

### Domain Layer

For this setup ticket, domain layer contains only placeholder `.gitkeep` files:
- `src/core/domain/` — Shared domain models, protocols (empty at setup)
- `src/features/_example/domain/` — Example feature domain placeholder

**Future features** place business entities, value objects, and pure business rules here. No React, no external dependencies.

### Data Layer

Placeholder structure established:
- `src/core/data/` — Shared data layer infrastructure (HTTP client, storage adapters)
- `src/features/_example/data/` — Example feature data placeholder

**Future features** place repositories, API clients, and data mapping here. Can import domain, cannot import presentation.

### Presentation Layer

Minimal working structure:
- `src/app/_layout.tsx` — Root layout with font loading and global CSS
- `src/app/index.tsx` — Home screen placeholder
- `src/core/presentation/` — Shared hooks, utilities
- `src/features/_example/presentation/` — Example feature presentation placeholder

---

## Components and Interfaces

### Components

| Component | Responsibility | Layer |
|-----------|----------------|-------|
| `src/app/_layout.tsx` | Root layout, font loading, global.css import | Presentation |
| `src/app/index.tsx` | Home screen placeholder | Presentation |
| `.eslintrc.js` | Lint config with boundary rules | Tooling |
| `commitlint.config.js` | Commit message validation | Tooling |
| `.husky/pre-commit` | Block main commits, run lint-staged | Tooling |
| `.husky/pre-push` | Block main pushes | Tooling |
| `.husky/commit-msg` | Run commitlint | Tooling |
| `.github/workflows/ci.yml` | 6-gate CI pipeline | CI/CD |

### Interfaces

```typescript
// No runtime interfaces for this setup ticket.
// Architecture interfaces are enforced via ESLint boundaries plugin.

// Example of boundary element types (configured in .eslintrc.js):
type BoundaryElement =
  | 'app'
  | 'core-domain'
  | 'core-data'
  | 'core-presentation'
  | 'feature-domain'
  | 'feature-data'
  | 'feature-presentation'
  | 'feature-public';
```

---

## Data Models

```typescript
// No domain data models for this setup ticket.
// This ticket establishes the folder structure where models will live.

// Example structure for future features (src/features/<feature>/domain/):
// interface Event { id: string; name: string; date: Date; }
// interface Ticket { id: string; eventId: string; seatNumber: string; }

// Configuration models used by tooling:
interface CommitMessage {
  ticket: string;   // e.g., "2"
  actor: string;    // e.g., "Rosyid"
  type: 'feat' | 'fix' | 'chore' | 'docs' | 'refactor' | 'test';
  scope: string;    // e.g., "auth", "queue", "core"
  subject: string;  // e.g., "add magic link request"
}
```

---

## Correctness Properties

### Property 1: Branch Protection Invariant

**Validates: Requirements 14.1, 15.1**

- Commits directly on `main` branch are blocked by pre-commit hook
- Pushes to `main` branch are blocked by pre-push hook
- All changes must go through feature branches and pull requests
- Enforcement: Git hooks + AGENTS.md constitution + Kiro ASK permissions

### Property 2: Commit Message Format Invariant

**Validates: Requirements 5.1, 13.1**

- Every commit message must match pattern: `[GH-<n>][<Actor>] <type>(<scope>): <desc>`
- Enforcement: commitlint via commit-msg hook
- Types restricted to: feat, fix, chore, docs, refactor, test

### Property 3: Layer Dependency Invariant

**Validates: Requirements 4.1, 16.1**

- Domain layer cannot import Data or Presentation
- Data layer cannot import Presentation
- Features can only be imported via their public `index.ts` barrel
- Enforcement: ESLint boundaries plugin + CI boundary-check job

### Property 4: CI Gate Completeness

**Validates: Requirements 17.1, 18.1, 19.1, 20.1, 21.1, 22.1**

- All 6 CI jobs must pass before merge: lint, typecheck, test, expo-doctor, expo-export, boundary-check
- Enforcement: GitHub Actions workflow (manual enforcement on merge for GitHub Free)

---

## Error Handling

| Error Type | Layer | Handling Strategy | User Feedback |
|------------|-------|-------------------|---------------|
| Lint failure | Tooling | Block commit via lint-staged | Terminal error message |
| Type error | Tooling | Block via typecheck | Terminal error message |
| Test failure | Tooling | Block via Jest exit code | Terminal test output |
| Invalid commit message | Tooling | Block via commitlint | Error with expected format |
| Direct main commit | Tooling | Block via pre-commit hook | Error with branch guidance |
| Direct main push | Tooling | Block via pre-push hook | Error with PR guidance |
| CI failure | CI/CD | Block merge (manual check) | GitHub Actions red status |
| Boundary violation | Tooling | Block via ESLint | Lint error with layer rules |

---

## Testing Strategy

### Unit Tests

- `__tests__/smoke.test.ts` — Basic smoke test (1 === 1) to verify Jest works
- `__tests__/App.render.test.tsx` — App component renders without crashing
- Coverage target: 100% for setup tests (trivial baseline)

### Integration Tests

- Not applicable for this setup ticket
- Future: Test navigation flows, API integration

### E2E Tests

- Not applicable for this setup ticket
- Future: Detox or Maestro for critical user flows

### Manual Verification (This Ticket)

1. `npm run lint` — passes with no errors
2. `npm run typecheck` — passes with no errors
3. `npm test` — both tests pass
4. `npx expo start` — app boots in Expo Go
5. Git hooks fire correctly on commit/push attempts
6. Commitlint rejects invalid messages
7. CI workflow passes all 6 gates

---

## Known Risks

**Issue:** Private repo on GitHub Free cannot enforce branch protection rules or rulesets (HTTP 403).

**Mitigations:**
1. AGENTS.md explicitly prohibits direct push to main
2. Kiro ASK permissions require approval for `git push`
3. Pre-push hook blocks `refs/heads/main` pushes
4. Pre-commit hook also blocks commits when branch is main
5. Rosyid manually merges every PR after green CI

**Residual Risk:** Developer with push access could bypass hooks with `--no-verify`, but agents are explicitly forbidden from using `--no-verify` — bypassing any hook requires Rosyid's explicit approval. Acceptable for single-developer project with this rule.

### Risk 2: KiroCrew Skill Loading

**Issue:** Crew skills normally load from `~/.kiro/crew/skills/`. Repo-local skills in `.kiro/skills/` may not be auto-discovered.

**Mitigations:**
1. Skills can be loaded via explicit path reference
2. Smoke test (T2-18) verifies skill discoverability
3. Document manual load path if auto-discovery fails

**Verification:** CP smoke test checks skill loads in KiroCrew session.

### Risk 3: TypeScript Suppression from Spike

**Issue:** G-expo-spike.md documents `@ts-ignore` needed for signal-ui-react-shared imports due to missing dist/ folder.

**Mitigations:**
1. Signal UI integration is in Ticket #3, not this ticket
2. This ticket establishes clean tsconfig; suppressions added in #3 as needed
3. Track as tech debt in #4 (switch to git URL after library PR lands)

### Risk 4: Signal UI Fixes Pending

**Issue:** Signal UI library has known issues per G-expo-spike.md:
- Button component returns raw string without Text wrapper
- Missing dist/index.mjs export

**Mitigations:**
1. Signal UI integration is Ticket #3 scope
2. Custom Metro resolver documented in spike report
3. Library PRs tracked in I-issue-draft.md §6

---

## Assessment Mapping

| Focus Area | Evidence | Rationale | Verification |
|------------|----------|-----------|--------------|
| **UI Implementation** | Expo app boots with placeholder screen | Foundation for UI work; visual features in later tickets | Manual QA in Expo Go |
| **Software Design** | Folder structure per Clean Architecture, AGENTS.md, steering files | Establishes architecture guardrails from day one | Code review of structure |
| **Software Construction** | Expo SDK 58.0.23, Nativewind 4.2.7, Poppins font per G-expo-spike.md | Proven stack from spike; consistent with web frontend patterns | `npx expo start`, visual QA |
| **Software Quality** | ESLint, Prettier, Jest, commitlint, pre-commit/pre-push hooks, boundary lint | Quality gates at every stage: edit, commit, push, CI | All gates pass; hooks execute |
| **Software Deployment** | GitHub Actions CI with 6 gates blocking merge | Automated verification before integration | CI green on initial setup |
| **Software Security** | .gitignore excludes secrets, pre-push blocks main, AGENTS.md security rules | Defense in depth despite GitHub Free limitations | No secrets in git, push blocked |

---

## Package Manager Decision Record

**Decision:** npm (not pnpm)

**Context:** Web frontend (fe-web-rusuh-war-ticketing) ADR-0018 mentions "pnpm test" but later notes "Package manager: npm (menggantikan pnpm sejak 2026-11-01)". Supervisor A ruling confirms npm for mobile repo.

**Rationale:**
1. Consistency with web frontend's current state (npm)
2. Better Expo compatibility (documented issues with pnpm workspaces)
3. Simpler CI caching (npm ci vs pnpm install --frozen-lockfile)

**Trade-offs:**
- npm is slower than pnpm for installs
- No built-in workspace support (not needed for single app)

**Recording:** This divergence from ADR-0018's original "pnpm" mention is intentional and documented here.
