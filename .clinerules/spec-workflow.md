---
name: Spec Workflow
description: Creating and managing feature specifications
---

# Spec Workflow

## Creating a Spec

1. Create directory: `.kiro/specs/GH-<n>-<slug>/`
2. Copy templates from `.kiro/specs/_templates/`
3. Fill out `requirements.md` with R-IDs and acceptance criteria
4. Fill out `design.md` with architecture decisions
5. Fill out `tasks.md` with implementation tasks

## Spec Structure

```
.kiro/specs/GH-<n>-<slug>/
├── requirements.md   # R-IDs, acceptance criteria
├── design.md         # Architecture, ADRs
└── tasks.md          # Implementation tasks
```

Use the `ticket-to-spec` skill to automate spec creation from GitHub issues.
