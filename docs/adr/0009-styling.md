# 0009. Tailwind CSS v4

- Status: Accepted
- Date: 2026-11-05

## Context

Small UI, no design system, one developer-facing goal: styles that stay consistent and leave no
dead CSS behind.

## Decision

**Tailwind CSS 4** through `@tailwindcss/vite`. The only stylesheet is `src/app/styles.css`
(`@import 'tailwindcss'` plus a base layer). No `tailwind.config.js`: v4 configures in CSS.

## Consequences

- Styles sit next to markup. Unused utilities never ship, and there are no class names to invent.
- Long `className` strings. A component that repeats a style extracts a constant (`buttonClass`
  in `TodoItem`), not a new abstraction.
- State styling uses ARIA, not extra state: `aria-invalid:border-red-600`,
  `aria-[current=page]:…`. The style follows the accessible state, so they cannot drift apart.

## Alternatives considered

- **CSS Modules** (zero dependencies, built into Vite): class names are untyped. Vite types them
  as an index signature, so with `noUncheckedIndexedAccess` a typo is `string | undefined` and
  compiles. Fixing that needs a typed-CSS-modules generator, which is another tool.
- **CSS-in-JS:** runtime cost, and poor fit with the React Compiler and future server rendering.
- **A component library** (MUI, Radix Themes, …): far more than five controls need.
