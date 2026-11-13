# Requirements Document

## Introduction

Add a shared Header component displaying the Rusuh brand logo (brand mark + wordmark) that appears consistently across all mobile screens. The header operates in guest mode — no login button is needed.

**Figma Reference:** Nodes 10-9981, 10-10143, 10-10342, 10-10577  
**Screenshots:** `docs/figma-screens/*.png`

## Glossary

| Term       | Definition                                       |
| ---------- | ------------------------------------------------ |
| Brand mark | The red logo icon (stylized sound wave/ticket)   |
| Wordmark   | Text "rusuh." in bold + "BOOKING TIKET" subtitle |
| Guest mode | App operates without user authentication         |

## Requirements

### Functional Requirements

#### R1: Header Component Structure

**Description:** The Header component displays brand mark and wordmark in a horizontal layout.

**Acceptance Criteria:**

- R1-AC1: Header contains brand mark icon on the left
- R1-AC2: Header contains "rusuh." text (bold) adjacent to brand mark
- R1-AC3: Header contains "BOOKING TIKET" subtitle below/adjacent to wordmark
- R1-AC4: No login button or user-related UI elements (guest mode)

#### R2: Header Integration

**Description:** Header is integrated into the app layout so it appears on all screens.

**Acceptance Criteria:**

- R2-AC1: Header renders at the top of every screen via `_layout.tsx`
- R2-AC2: Header does not overlap or interfere with screen content
- R2-AC3: Header maintains consistent position during navigation

#### R3: Visual Styling

**Description:** Header matches Figma design specifications.

**Acceptance Criteria:**

- R3-AC1: Brand mark uses brand red color (#EC1C2E)
- R3-AC2: "rusuh." text uses dark color (#1F2937), bold weight
- R3-AC3: "BOOKING TIKET" text uses lighter gray, smaller size
- R3-AC4: Background is white (#FFFFFF)
- R3-AC5: Appropriate horizontal padding (16px/px-4)
- R3-AC6: Minimal vertical height to maximize content area

### Non-Functional Requirements

#### R4: Accessibility

**Description:** Header is accessible to screen readers.

**Acceptance Criteria:**

- R4-AC1: Brand mark has appropriate accessibilityLabel
- R4-AC2: Header region has accessibilityRole="header"

#### R5: Performance

**Description:** Header renders efficiently without layout shifts.

**Acceptance Criteria:**

- R5-AC1: Header uses static/fixed height (no dynamic sizing)
- R5-AC2: No layout shift during initial render

## Constraints

- Must use NativeWind (Tailwind CSS) for styling to match existing codebase
- Brand mark can be a simple SVG or styled View (no external icon library required)
- Component must work in Expo Go guest mode

## Out of Scope

- Login/authentication UI (explicitly removed for guest mode)
- Navigation back button (handled by Expo Router)
- Footer component
- Search or filter UI in header
