---
inclusion: fileMatch
pattern: src/**
name: Architecture Boundaries
description: Clean Architecture layer dependency rules
---

# Architecture Boundaries

This file loads when editing files in `src/`.

## Layer Dependency Rules

| Layer        | May Import From                                                 |
| ------------ | --------------------------------------------------------------- |
| domain       | nothing external (pure TypeScript)                              |
| data         | domain                                                          |
| presentation | domain (MUST NOT import feature `data`; use DI from `src/app/`) |

## Boundary Enforcement

Use `npm run boundary-check` to verify imports.

eslint-plugin-boundaries is configured to enforce these rules. Violations fail CI.

See `AGENTS.md` §3 Layer Dependency Rules for full rules.
