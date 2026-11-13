# Requirements Document

## Introduction

Change the EventCard CTA button color from generic blue (#3b82f6) to Rusuh brand red (#EC1C2E) to match Figma designs. This ensures visual consistency with the brand identity.

**Figma Reference:** Node 10-9981 (Events Home — Mobile)  
**Screenshot:** `docs/figma-screens/events-home-10-9981.png`

## Glossary

| Term      | Definition                                         |
| --------- | -------------------------------------------------- |
| CTA       | Call-to-action button ("Beli Tiket", "Join Queue") |
| Brand Red | Rusuh primary brand color #EC1C2E                  |

## Requirements

### Functional Requirements

#### R1: Primary CTA Color Change

**Description:** EventCard CTA button uses brand red color for enabled/available events.

**Acceptance Criteria:**

- R1-AC1: CTA button background color is #EC1C2E when enabled
- R1-AC2: CTA button text color remains white (#FFFFFF)
- R1-AC3: Change applies to all event cards with enabled CTAs

#### R2: Disabled CTA Styling

**Description:** Disabled/unavailable CTA buttons use gray styling.

**Acceptance Criteria:**

- R2-AC1: Disabled CTA background is #E5E7EB (current, no change needed)
- R2-AC2: Disabled CTA text color is #9CA3AF (current, no change needed)

#### R3: Arrow Icon on CTA

**Description:** CTA text includes arrow icon (→) for visual affordance.

**Acceptance Criteria:**

- R3-AC1: Enabled CTA text includes " →" suffix (e.g., "Join Queue →")
- R3-AC2: Disabled CTA text ("Unavailable") does NOT include arrow

### Non-Functional Requirements

#### R4: Accessibility

**Description:** Color contrast meets WCAG AA standards.

**Acceptance Criteria:**

- R4-AC1: White text on #EC1C2E meets 4.5:1 contrast ratio (verified: 4.63:1)

## Constraints

- Only modify EventCard.tsx — no new files needed
- Use inline style for exact color (NativeWind doesn't have this brand color configured)

## Out of Scope

- Adding brand color to tailwind.config.js (future enhancement)
- Changing other buttons/CTAs in the app
- Full Figma "Beli Tiket" label change (label logic already exists)
