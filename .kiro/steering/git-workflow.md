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

## Issue Verification Checkboxes

GitHub issues may contain task-list checkboxes (e.g., "Verification gate" section). Before closing a ticket or merging its PR:

1. Read the issue body and identify all `- [ ]` checkbox items
2. Verify each checkbox item against the implementation
3. Update the issue body to check off verified items (`- [x]`)
4. Leave a checkbox unchecked if verification fails or supporting evidence is insufficient
5. Do NOT close or merge with unchecked verification checkboxes

Never check an item solely to unblock merge or ticket closure.

Use `gh issue edit <n> --body '...'` to update checkboxes.

See `AGENTS.md` for full Git safety rules.
