---
name: Spec Format
description: Specification file format rules for Kiro IDE compatibility (loads when editing .kiro/specs)
paths:
  - ".kiro/specs/**"
---

# Kiro Specification Format

This file loads when editing specification files in `.kiro/specs/`.

## Template Compliance

All specification files MUST follow the templates in `.kiro/specs/_templates/`:

- `requirements.md` — Requirements with R-IDs and acceptance criteria
- `design.md` — Architecture and design decisions
- `tasks.md` — Implementation plan with task IDs

## Required Sections

### requirements.md

```markdown
# Requirements Document

## Introduction

## Glossary

## Requirements

### Functional Requirements

#### R<n>: <Name>

### Non-Functional Requirements

## Constraints

## Out of Scope
```

### design.md

```markdown
# Design — GH-<n> <Title>

## Overview

## Architecture

### Domain Layer

### Data Layer

### Presentation Layer

## Component Diagram

## Data Flow

## Components and Interfaces

### Components

### Interfaces

## Data Models

## Correctness Properties

### Property <n>: <Name>

## Error Handling

## Testing Strategy

### Unit Tests

### Integration Tests

### E2E Tests

## ADRs (Architecture Decision Records)

### ADR-<n>: <Title>

## Dependencies

## Risks

## Open Questions
```

### tasks.md

```markdown
# Implementation Plan

## Overview

## Task Dependency Graph

## Tasks

### T<n>: <Task Name>

## Task Summary Table

## Notes
```

## Task Format

Each task MUST include:

```markdown
### T<n>: <Task Name>

**R-IDs:** R<n>, R<m>

**Description:** What to implement

**Files to create/modify:**

- `path/to/file.ts`

**Verification Gate:** How to verify completion

**Commit:**
\`\`\`
[GH-<n>][Rosyid] <type>(<scope>): <description>
\`\`\`
```

## Correctness Properties Format

Each property MUST follow this exact format for Kiro IDE compatibility:

```markdown
### Property <n>: <Descriptive Title>

**Validates: Requirements X.Y**

<Description of the invariant.> (<R-ID references for traceability>)
```

**Example:**

```markdown
### Property 1: FULL_QUEUE ≠ FULL_BOOKED

**Validates: Requirements 3.2, 3.5**

`FULL_QUEUE` (503, queue capacity) and `FULL_BOOKED` (409, inventory) are distinct discriminated union members. (R3-AC2, R3-AC5)
```

**Mapping rule:** R<n>-AC<m> → Requirements <n>.<m> (e.g., R3-AC2 → 3.2)

## Validation Rules

1. **Section Headers:** Use exact section names from templates
2. **R-ID Format:** Requirements use `R<n>` pattern (R1, R2, etc.)
3. **T-ID Format:** Tasks use `T<n>` pattern (T1, T2, etc.)
4. **AC Format:** Acceptance criteria use `R<n>-AC<m>` pattern
5. **No Extra Top-Level Headers:** Avoid headers not in template
6. **Property Validates Format:** Use `**Validates: Requirements X.Y**` (e.g., `**Validates: Requirements 3.2, 3.5**`). The number corresponds to R-IDs (R3 → 3, AC2 → .2). Include original R-IDs in parentheses at end of description for traceability.
7. **ADR Format:** Use "ADR-<n>: <Title>" with Context/Decision/Consequences
8. **Code Blocks:** Use triple backticks with language identifier
9. **Tables:** Use standard markdown table format with header row

## Kiro IDE Compatibility

The Kiro IDE parses spec files expecting specific structure:

- Avoid deeply nested headers beyond ### level
- Keep code blocks concise (not full implementations)
- Use standard markdown—no HTML tags
- Ensure consistent indentation in lists
- Close all code fences properly

See `AGENTS.md` for verification commands and CI gates.
