# Requirements Document

## Introduction

Change the ProgressBar fill color from blue (`bg-blue-600`) to brand red (#EC1C2E) to match Figma designs for the Waiting Room screen.

**Figma Reference:** Node 10-10143 (Waiting Room — Mobile)  
**Screenshot:** `docs/figma-screens/waiting-room-10-10143.png`

## Glossary

| Term         | Definition                                     |
| ------------ | ---------------------------------------------- |
| Progress Bar | Horizontal bar showing queue progress (0-100%) |
| Brand Red    | Rusuh primary brand color #EC1C2E              |

## Requirements

### Functional Requirements

#### R1: Progress Bar Fill Color

**Description:** ProgressBar fill uses brand red color.

**Acceptance Criteria:**

- R1-AC1: Progress bar fill color is #EC1C2E (was #2563EB / bg-blue-600)
- R1-AC2: Background track remains light gray (bg-gray-200 / #E5E7EB)

### Non-Functional Requirements

#### R2: Accessibility

**Description:** Color contrast meets WCAG standards.

**Acceptance Criteria:**

- R2-AC1: Red (#EC1C2E) on gray (#E5E7EB) provides sufficient visual distinction

## Constraints

- Single line change in ProgressBar.tsx
- Use NativeWind arbitrary value syntax: `bg-[#EC1C2E]`

## Out of Scope

- Adding brand color to tailwind.config.js
- Changing progress bar height or shape
