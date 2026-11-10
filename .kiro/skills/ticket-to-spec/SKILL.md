# Ticket-to-Spec Skill

Convert a GitHub issue into a full spec (requirements, design, tasks).

## When to Use

Activate this skill when starting work on a new GitHub issue that needs specification.

## Workflow

1. **Read the GitHub issue** — Fetch issue details via `gh issue view <n>`
2. **Create spec directory** — `.kiro/specs/GH-<n>-<slug>/`
3. **Copy templates** — From `.kiro/specs/_templates/`
4. **Fill requirements.md** — Extract requirements from issue, assign R-IDs
5. **Fill design.md** — Architecture decisions, component structure
6. **Fill tasks.md** — Implementation tasks with commits

## Templates Location

```
.kiro/specs/_templates/
├── requirements.md
├── design.md
└── tasks.md
```

## Output Structure

```
.kiro/specs/GH-<n>-<slug>/
├── requirements.md   # R-IDs with acceptance criteria
├── design.md         # Architecture and ADRs
└── tasks.md          # Implementation tasks
```

## Naming Convention

- Directory: `GH-<issue-number>-<kebab-case-slug>`
- Example: `GH-42-user-login-flow`

## Commit

After creating the spec:
```
[GH-<n>][Rosyid] docs(spec): add GH-<n> spec for <feature>
```
