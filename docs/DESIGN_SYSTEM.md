# Eventure Design System

This document is the visual contract for both contributors. Reuse these tokens and patterns before adding new ones. Any shared-token change should be reviewed by both contributors because it can affect every page.

## Design direction

Eventure should feel editorial, warm, and trustworthy rather than like a generic admin template. The public experience combines large serif display type with restrained sans-serif UI copy, tactile ticket-inspired shapes, and an Indonesian event palette. Dashboard pages use the same colors and radii with denser spacing.

## Design tokens

Tokens live in `apps/web/src/app/globals.css` under `:root`.

| Token                  | Value     | Use                              |
| ---------------------- | --------- | -------------------------------- |
| `--color-ink`          | `#172027` | Primary text and strong borders  |
| `--color-muted`        | `#657079` | Secondary text                   |
| `--color-canvas`       | `#f7f4ed` | Page background                  |
| `--color-surface`      | `#fffdf9` | Cards, forms, menus              |
| `--color-line`         | `#ddd7ca` | Dividers and quiet borders       |
| `--color-primary`      | `#c94f43` | Primary action and active state  |
| `--color-primary-dark` | `#96382f` | Primary hover state              |
| `--color-teal`         | `#176d65` | Secondary accent and data series |
| `--color-gold`         | `#e5aa3d` | Highlight, focus, warning accent |
| `--color-night`        | `#202b3b` | Dark sections and dashboard nav  |
| `--radius-sm`          | `0.65rem` | Inputs and compact controls      |
| `--radius-md`          | `1.1rem`  | Cards and panels                 |
| `--radius-lg`          | `1.75rem` | Hero and large callouts          |

## Typography

- Display headings: `Georgia, "Times New Roman", serif`; tight tracking and short line length.
- UI/body: `Inter` when locally available, followed by the system sans-serif stack.
- Eyebrows: uppercase, `0.78rem`, weight `800`, letter spacing `0.12em`.
- Body copy: minimum `1rem` for long-form public content and `0.875rem` for compact metadata.
- Do not add a remote font dependency unless both contributors agree; remote font fetching can break builds.

## Components

- Buttons are pill-shaped. Use `.button` with `--primary`, `--ghost`, or `--light` modifiers.
- Cards use a light surface, one-pixel line, `--radius-md`, and a subtle shadow.
- Forms always show visible labels. Placeholder text never replaces a label.
- Confirmation is required before destructive or state-changing edits.
- Every list has loading, error, and empty states. The shared `EmptyState` is the baseline.
- Status badges must use text and color; color alone cannot communicate status.
- Currency uses `formatIdr` from `apps/web/src/lib/currency.ts`.
- Dates are persisted as UTC and rendered in the `Asia/Jakarta` time zone.

## Responsive rules

Build mobile-first and verify at approximately 375 px, 768 px, 1024 px, and 1440 px.

- At or below 640 px, forms and cards stack into one column.
- At or below 900 px, primary desktop navigation collapses and multi-column hero/dashboard layouts stack.
- Never introduce fixed-width content wider than its container.
- Touch targets must be at least 44 by 44 CSS pixels.
- Tables require a mobile alternative or horizontal overflow with a clear label.

## Accessibility and UX states

- Keep the existing gold focus ring or an equally visible replacement.
- Use semantic landmarks, headings in order, and explicit form labels.
- Respect `prefers-reduced-motion`.
- Loading states should reserve final layout space to avoid large shifts.
- Error messages explain how to recover; empty states suggest the next useful action.
- Dialogs must trap focus, close on Escape, and return focus to their trigger.

## Dashboard charts

Use Recharts, with API aggregation rather than frontend aggregation. Recommended series order:

1. Primary coral
2. Teal
3. Gold
4. Night blue

Every chart needs a title, readable axis labels, a text summary or accessible table, a loading skeleton, an empty state, and an error state.

## New UI checklist

- Uses existing tokens and shared primitives
- Works at all four target widths
- Has loading, empty, error, and success feedback
- Uses IDR-only currency formatting
- Supports keyboard navigation and visible focus
- Includes a focused component or flow test
