---
name: Testing & TDD
description: Test patterns and TDD workflow (loads when editing test files)
paths:
  - "**/*.test.{ts,tsx}"
  - "**/__tests__/**"
---

# Testing & TDD

This file loads when editing test files.

## Test Structure

- Unit tests: `__tests__/<module>.test.ts`
- Component tests: `__tests__/<Component>.render.test.tsx`
- Collocated tests: `<file>.test.ts` alongside source

## TDD Workflow

1. Write failing test
2. Implement minimal code to pass
3. Refactor with confidence

## Verification

```bash
npm test           # Run all tests
npm run typecheck  # Type check
```

See `AGENTS.md` for coverage requirements.
