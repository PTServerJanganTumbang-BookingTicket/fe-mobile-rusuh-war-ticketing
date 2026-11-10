---
inclusion: always
name: Git Workflow
description: Branch naming, commit format, and PR rules
---

# Git Workflow

## Branch Naming

- `story/GH-<n>-<slug>` — feature work
- `fix/GH-<n>-<slug>` — bug fixes
- `chore/GH-<n>-<slug>` — tooling, docs, maintenance

## Commit Format

```
[GH-<n>][Actor] <type>(<scope>): <description>
```

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `style`, `perf`

## PR Rules

- One ticket per PR
- All CI gates must pass
- Rosyid approves before merge

See `AGENTS.md` for full Git safety rules.
