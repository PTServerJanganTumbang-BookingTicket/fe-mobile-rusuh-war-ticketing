# Requirements Document — GH-2 Repo Setup

## Introduction

**Ticket:** #2 [Chore] Repo setup: Expo SDK 58, tooling, AGENTS.md, CI gates

This ticket establishes the foundational repository setup for the Rusuh Booking Tiket mobile application. The goal is to create a well-structured, maintainable codebase with proper tooling, governance documentation, and CI/CD gates that enforce quality standards from day one.

**Dependencies:** #1 (P0 spike — closed, validated Expo Go + Nativewind + Signal UI compatibility)

**Decisions made in this ticket:**
- **Package manager:** npm (per Supervisor A ruling; note: web repo ADR-0018 uses pnpm, this is a documented divergence)
- **Boundary enforcement tool:** eslint-plugin-boundaries

---

## User Stories

### US1: Repository Initialization

**As a** developer joining the Rusuh mobile project,  
**I want** the repository to have a complete Expo SDK 58 scaffold with proper configuration,  
**so that** I can start building features immediately without environment setup issues.

### US2: Architecture Governance

**As a** developer,  
**I want** AGENTS.md and steering files to clearly document operating rules, architecture boundaries, and commit conventions,  
**so that** human and AI agents work consistently within established guardrails.

### US3: Code Quality Tooling

**As a** developer,  
**I want** ESLint, Prettier, Jest, and TypeScript configured with pre-commit hooks,  
**so that** code quality issues are caught before commits and reviews.

### US4: Continuous Integration

**As a** developer,  
**I want** GitHub Actions CI to run lint, typecheck, test, expo-doctor, expo export, and boundary checks on every push and PR,  
**so that** broken code cannot be merged to main.

### US5: Specification-Driven Development

**As a** developer,  
**I want** a ticket-to-spec skill available in the repo,  
**so that** every implementation ticket follows a consistent specification process.

---

## Requirements (EARS Format)

### R1: Expo SDK 58 Scaffold

**WHEN** a developer clones the repository and runs `npm install`,  
**THE** system **SHALL** install Expo SDK 58.0.23 with React Native 0.88.1 and React 19.3.0,  
**SO THAT** the app boots in Expo Go without native build requirements.

**Acceptance Criteria:**
- [ ] R1-AC1: `expo` version is ~58.0.23 in package.json
- [ ] R1-AC2: `react-native` version is 0.88.1 in package.json
- [ ] R1-AC3: `react` version is 19.3.0 in package.json
- [ ] R1-AC4: App loads in Expo Go on physical device

### R2: Nativewind 4.2.7 Integration

**WHEN** a developer adds Tailwind CSS classes to a React Native component,  
**THE** system **SHALL** apply the corresponding styles via Nativewind 4.2.7,  
**SO THAT** developers can use familiar Tailwind utility classes.

**Acceptance Criteria:**
- [ ] R2-AC1: `nativewind` version is ^4.2.7 in package.json
- [ ] R2-AC2: Babel config includes `nativewind/babel` preset
- [ ] R2-AC3: Metro config includes `withNativeWind` wrapper
- [ ] R2-AC4: `global.css` exists with Tailwind directives
- [ ] R2-AC5: A component with `className="bg-blue-500"` renders blue background

### R3: Poppins Font Configuration

**WHEN** the app loads,  
**THE** system **SHALL** include Poppins font family via @expo-google-fonts/poppins,  
**SO THAT** typography matches the design system.

**Acceptance Criteria:**
- [ ] R3-AC1: `@expo-google-fonts/poppins` is installed
- [ ] R3-AC2: `useFonts` hook loads Poppins variants in root layout
- [ ] R3-AC3: Text with Poppins font renders correctly in Expo Go

### R4: Folder Structure (Clean Architecture Feature-First)

**WHEN** a developer navigates the src directory,  
**THE** system **SHALL** have the following structure:  
- `src/app/` — Expo Router file-based routing only
- `src/core/{domain,data,presentation}/` — shared logic per layer
- `src/features/<x>/{domain,data,presentation}/` with `index.ts` public API

**SO THAT** code organization follows Clean Architecture with clear boundaries.

**Acceptance Criteria:**
- [ ] R4-AC1: `src/app/` exists with `_layout.tsx` and `index.tsx`
- [ ] R4-AC2: `src/core/domain/`, `src/core/data/`, `src/core/presentation/` exist
- [ ] R4-AC3: At least one feature placeholder exists with proper subfolders
- [ ] R4-AC4: Each feature has `index.ts` exporting public API

### R5: AGENTS.md Constitution

**WHEN** a human or AI agent works on this repository,  
**THE** repository **SHALL** contain AGENTS.md at the root with:  
- Architecture and layer rules
- Git workflow and commit conventions
- Verification commands
- Multi-agent isolation rules
- Security boundaries

**SO THAT** all agents operate consistently within documented guardrails.

**Acceptance Criteria:**
- [ ] R5-AC1: `AGENTS.md` exists at repository root
- [ ] R5-AC2: Document includes Clean Architecture layer rules
- [ ] R5-AC3: Document includes commit message format: `[GH-<n>][Rosyid] <type>(<scope>): <desc>`
- [ ] R5-AC4: Document includes verification commands: lint, typecheck, test
- [ ] R5-AC5: Document references steering files, never duplicates their content

### R6: Steering Files

**WHEN** an AI agent loads context for this repository,  
**THE** .kiro/steering/ directory **SHALL** contain steering files with proper `inclusion` modes,  
**SO THAT** agents receive relevant context automatically or on-demand.

**Acceptance Criteria:**
- [ ] R6-AC1: `.kiro/steering/` directory exists
- [ ] R6-AC2: `release-train.md` exists with `inclusion: manual`
- [ ] R6-AC3: Release-train steering covers: release/X.Y.Z from main, FT/NFT/Security gates, tagging, mergeback, hotfix from release/* not main, rollback procedure, cherry-pick conflict resolution
- [ ] R6-AC4: Always-on steering files stay under 2,000 tokens combined

### R7: Spec Templates

**WHEN** a developer creates a new ticket specification,  
**THE** repository **SHALL** provide templates in `.kiro/specs/_templates/`,  
**SO THAT** specifications follow consistent structure.

**Acceptance Criteria:**
- [ ] R7-AC1: `.kiro/specs/_templates/` directory exists
- [ ] R7-AC2: `requirements.md` template exists with user stories and EARS format
- [ ] R7-AC3: `design.md` template exists with file tree and layer mappings
- [ ] R7-AC4: `tasks.md` template exists with traceability to R-IDs

### R8: Ticket-to-Spec Skill

**WHEN** a developer or agent needs to create a specification from a GitHub issue,  
**THE** repository **SHALL** provide `.kiro/skills/ticket-to-spec/SKILL.md`,  
**SO THAT** the process is standardized and repeatable.

**Acceptance Criteria:**
- [ ] R8-AC1: `.kiro/skills/ticket-to-spec/SKILL.md` exists
- [ ] R8-AC2: Skill documents the spec creation workflow
- [ ] R8-AC3: Skill references the templates in `.kiro/specs/_templates/`

### R9: ESLint Configuration

**WHEN** a developer runs `npm run lint`,  
**THE** system **SHALL** check TypeScript and React Native code against configured rules,  
**SO THAT** code style and potential bugs are caught early.

**Acceptance Criteria:**
- [ ] R9-AC1: ESLint is installed with React Native preset
- [ ] R9-AC2: `npm run lint` script exists and runs ESLint on `src/`
- [ ] R9-AC3: ESLint passes on initial scaffold with no errors

### R10: Prettier Configuration

**WHEN** a developer runs `npm run format`,  
**THE** system **SHALL** format code according to project standards,  
**SO THAT** code style is consistent across the codebase.

**Acceptance Criteria:**
- [ ] R10-AC1: Prettier is installed
- [ ] R10-AC2: `.prettierrc` or equivalent config exists
- [ ] R10-AC3: Prettier integrates with ESLint (no conflicts)

### R11: Jest Test Framework

**WHEN** a developer runs `npm test`,  
**THE** system **SHALL** execute Jest tests with React Native Testing Library support,  
**SO THAT** unit and component tests run in a consistent environment.

**Acceptance Criteria:**
- [ ] R11-AC1: Jest is installed with `jest-expo` preset
- [ ] R11-AC2: `@testing-library/react-native` is installed
- [ ] R11-AC3: At least one smoke test exists and passes
- [ ] R11-AC4: `npm test` script runs without interactive watch mode in CI

### R12: TypeScript Configuration

**WHEN** a developer runs `npm run typecheck`,  
**THE** system **SHALL** validate TypeScript without emitting files,  
**SO THAT** type errors are caught before runtime.

**Acceptance Criteria:**
- [ ] R12-AC1: `tsconfig.json` exists with strict mode
- [ ] R12-AC2: `npm run typecheck` script runs `tsc --noEmit`
- [ ] R12-AC3: Typecheck passes on initial scaffold

### R13: Commitlint Configuration

**WHEN** a developer attempts to commit,  
**THE** system **SHALL** validate the commit message format against:  
`[GH-<n>][Actor] <type>(<scope>): <desc>`

**SO THAT** commit history is consistent and traceable.

**Acceptance Criteria:**
- [ ] R13-AC1: `commitlint` is installed with custom config
- [ ] R13-AC2: Regex pattern enforces: `^\[GH-\d+\]\[.+\] (feat|fix|chore|docs|refactor|test)\(.+\): .+$`
- [ ] R13-AC3: Invalid commit messages are rejected by hook

### R14: Pre-commit Hook

**WHEN** a developer stages files and runs `git commit`,  
**THE** system **SHALL** run lint-staged to check staged files,  
**SO THAT** only clean code is committed.

**Acceptance Criteria:**
- [ ] R14-AC1: `husky` or `simple-git-hooks` is installed
- [ ] R14-AC2: `lint-staged` is configured for `.ts`, `.tsx` files
- [ ] R14-AC3: Pre-commit hook runs ESLint and Prettier on staged files

### R15: Pre-push Hook (Main Branch Protection)

**WHEN** a developer attempts to push to `refs/heads/main`,  
**THE** system **SHALL** reject the push with an error message,  
**SO THAT** direct pushes to main are prevented despite GitHub Free plan limitations.

**Acceptance Criteria:**
- [ ] R15-AC1: Pre-push hook script exists and is executable
- [ ] R15-AC2: `git push origin main` is rejected with informative error
- [ ] R15-AC3: Pushes to other branches succeed normally

### R16: Boundary Lint (eslint-plugin-boundaries)

**WHEN** a developer runs `npm run boundary-check`,  
**THE** system **SHALL** verify that imports respect Clean Architecture boundaries:  
- Features cannot import from other features except via `index.ts`
- Domain layer cannot import from data or presentation
- Data layer cannot import from presentation

**SO THAT** architecture boundaries are enforced automatically.

**Acceptance Criteria:**
- [ ] R16-AC1: `eslint-plugin-boundaries` is installed
- [ ] R16-AC2: Boundary rules are configured per Clean Architecture layers
- [ ] R16-AC3: `npm run boundary-check` exits 0 on valid imports
- [ ] R16-AC4: Intentional bad import is rejected by boundary check

### R17: CI Workflow — Lint Gate

**WHEN** code is pushed to a branch or a PR is opened,  
**THE** CI **SHALL** run `npm run lint` and fail if there are errors,  
**SO THAT** lint violations block merge.

**Acceptance Criteria:**
- [ ] R17-AC1: `.github/workflows/ci.yml` includes lint job
- [ ] R17-AC2: Lint failure causes CI to fail

### R18: CI Workflow — Typecheck Gate

**WHEN** code is pushed to a branch or a PR is opened,  
**THE** CI **SHALL** run `npm run typecheck` and fail if there are type errors,  
**SO THAT** type violations block merge.

**Acceptance Criteria:**
- [ ] R18-AC1: `.github/workflows/ci.yml` includes typecheck job
- [ ] R18-AC2: Typecheck failure causes CI to fail

### R19: CI Workflow — Test Gate

**WHEN** code is pushed to a branch or a PR is opened,  
**THE** CI **SHALL** run `npm test` and fail if tests fail,  
**SO THAT** broken tests block merge.

**Acceptance Criteria:**
- [ ] R19-AC1: `.github/workflows/ci.yml` includes test job
- [ ] R19-AC2: Test failure causes CI to fail

### R20: CI Workflow — Expo Doctor Gate

**WHEN** code is pushed to a branch or a PR is opened,  
**THE** CI **SHALL** run `npx expo-doctor` and fail if there are compatibility issues,  
**SO THAT** Expo SDK compatibility issues block merge.

**Acceptance Criteria:**
- [ ] R20-AC1: `.github/workflows/ci.yml` includes expo-doctor job
- [ ] R20-AC2: Expo-doctor failure causes CI to fail

### R21: CI Workflow — Expo Export Gate

**WHEN** code is pushed to a branch or a PR is opened,  
**THE** CI **SHALL** run `npx expo export` and fail if bundles cannot be created,  
**SO THAT** build failures block merge.

**Acceptance Criteria:**
- [ ] R21-AC1: `.github/workflows/ci.yml` includes expo-export job
- [ ] R21-AC2: Export failure causes CI to fail
- [ ] R21-AC3: iOS and Android bundles are created successfully

### R22: CI Workflow — Boundary Check Gate

**WHEN** code is pushed to a branch or a PR is opened,  
**THE** CI **SHALL** run `npm run boundary-check` and fail if boundaries are violated,  
**SO THAT** architecture violations block merge.

**Acceptance Criteria:**
- [ ] R22-AC1: `.github/workflows/ci.yml` includes boundary-check job
- [ ] R22-AC2: Boundary violation causes CI to fail

### R23: Security — Gitignore Configuration

**WHEN** sensitive files exist in the working directory,  
**THE** `.gitignore` **SHALL** exclude `.env*`, `*.pem`, `*.key`, and other secrets,  
**SO THAT** credentials are never committed.

**Acceptance Criteria:**
- [ ] R23-AC1: `.gitignore` excludes `.env*` patterns
- [ ] R23-AC2: `.gitignore` excludes `*.pem`, `*.key` patterns
- [ ] R23-AC3: `git status` shows no sensitive files

---

## DoR Test Case List

| ID | Gate | Given | When | Then | Blocking |
|----|------|-------|------|------|----------|
| T2-01 | CI | Fresh clone, lockfile exists | Run `npm ci` | Exits 0, node_modules populated | Yes |
| T2-02 | Static | ESLint config present | Run `npm run lint` | Exits 0, no lint errors | Yes |
| T2-03 | Static | tsconfig.json exists | Run `npm run typecheck` | Exits 0, no type errors | Yes |
| T2-04 | Unit | Smoke test file exists | Run `npm test` | At least 1 test passes | Yes |
| T2-05 | Render | App component exists | Run render test | Component renders without crash | Yes |
| T2-06 | Architecture | Boundary rules configured | Bad import in test file | Boundary check rejects | Yes |
| T2-07 | CI | Expo config valid | Run `npx expo-doctor` | No project-blocking issues | Yes |
| T2-08 | CI | App source exists | Run `npx expo export` | iOS/Android bundles created | Yes |
| T2-09 | CI | Workflow file committed | Push to branch | Workflow triggers | Yes |
| T2-10 | CI | CI gates defined | Introduce lint failure | CI fails | Yes |
| T2-11 | Static | Repository root | Check AGENTS.md | File exists with content | Yes |
| T2-12 | Security | .gitignore configured | Check git status | No secrets tracked | Yes |
| T2-13 | Hook | Pre-commit configured | Stage bad file, commit | Hook rejects or fixes | Yes |
| T2-14 | Hook | Pre-push configured | Push to main | Push rejected | Yes |
| T2-15 | Hook | Commitlint configured | Invalid commit message | Commit rejected | Yes |
| T2-16 | Steering | .kiro/steering/ exists | Check directory | Files present | Yes |
| T2-17 | Skill | .kiro/skills/ticket-to-spec/ | Check directory | SKILL.md present | Yes |
| T2-18 | Smoke | KiroCrew session in repo | Load steering and skill | Steering loads, skill discoverable | Yes |

---

## Glossary

| Term | Definition |
|------|------------|
| **AGENTS.md** | Repository constitution documenting operating rules for human and AI agents |
| **Steering file** | Kiro-specific context file with `inclusion` mode (auto, manual, fileMatch) |
| **Skill** | Kiro-specific reusable procedure with SKILL.md instructions |
| **Clean Architecture** | Software architecture with domain at center, framework at edge |
| **Feature-first** | Organizing code by feature/module rather than technical layer |
| **Boundary lint** | Static analysis enforcing import rules between modules |
| **Pre-push hook** | Git hook running before push; used here to block direct main pushes |
| **Release train** | Coordinated release process with testing gates and tag management |
