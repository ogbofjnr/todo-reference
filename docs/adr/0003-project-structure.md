# 0003. Feature folders with three enforced layers

- Status: Accepted
- Date: 2026-11-05

## Context

The structure should show where code goes in a growing app, without ceremony that a todo app
cannot justify. A structure only helps if violating it fails the build.

## Decision

```
src/
  app/        composition root: main.tsx (wiring), App.tsx (layout, providers), global CSS
  features/
    todos/    one folder per product feature
      index.ts   the feature's public API, the only file others may import
      domain/    pure TypeScript: types, rules, reducers. No React.
      data/      repository interface + implementations
      model/     React hooks: state, context, URL state
      ui/        components
  shared/     feature-agnostic code: config/, lib/, ui/
  test/       test setup only
```

Dependency direction: **`app → features → shared`**. Enforced by ESLint
(`eslint-plugin-boundaries` and `no-restricted-imports`, see [ADR 0006](0006-linting-and-formatting.md)):

- `shared` imports only `shared`.
- A feature imports `shared` and **itself**, never another feature.
- `app` imports anything, but a feature only through `@/features/<name>` (its `index.ts`).

Inside a feature, `domain` stays React-free by convention, and its unit tests prove it (they
render nothing). We do not enforce the internal segment order with lint: with four segments
in one feature, a review catches violations more cheaply than another rule set.

## On barrel files

bulletproof-react now discourages barrel files: re-exporting a whole feature can defeat
tree-shaking and slow the dev server. We keep **one deliberately small** `index.ts` per feature
(five named exports) because it is the boundary lint enforces. It is a public API, not a
convenience re-export of every file. Everything in this feature is used by the single page, so
there is nothing to tree-shake away.

## Consequences

- A second feature that needs something from `todos` must either get it through `todos`' public
  API (if `app` composes them) or move the shared part into `shared/`. Features never couple
  directly.
- `app/main.tsx` lives in `app/` (not `src/`) so the composition root is part of a layer and
  covered by the boundary rules.

## Alternatives considered

- **Feature-Sliced Design:** its pages/widgets/features/entities split would leave most layers
  empty or holding one file each. We borrow its segment names (`ui`, `model`, `lib`, `config`).
- **Layer-first folders** (`components/`, `hooks/`, `services/`): splits one feature across the
  tree, and there is no meaningful boundary to enforce.
- **dependency-cruiser** for the rules: a second tool and config. The ESLint plugin reports in
  the editor and in the existing lint step.
