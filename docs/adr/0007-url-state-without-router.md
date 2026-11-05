# 0007. Filter in the URL without a router

- Status: Accepted
- Date: 2026-11-05

## Context

The all/active/completed filter must live in the URL: shareable, kept on reload, and working
with back/forward. The app has a single page.

## Decision

A ~50-line hook, `shared/lib/use-search-param.ts`, exposes one query parameter as state through
`useSyncExternalStore`. It subscribes to `popstate` (back/forward) plus an internal listener set,
because `pushState` emits no event. Writes call `history.pushState`. `useTodoFilter` maps it to the
domain `Filter` type with `parseFilter`, so unknown values fall back to `all`.

Filters are real `<a href="?filter=active">` links with `aria-current="page"`. Plain clicks
navigate in-app. Modifier or middle clicks keep normal browser behaviour (open in a new tab).

## Consequences

- No routing dependency. The hook is generic and unit-tested.
- It is not a router: no path matching, nested layouts, loaders or code splitting.

## When to revisit

Adopt **TanStack Router** (type-safe search params with schema validation) or **React Router**
as soon as there is a second page or route-level data loading. `useTodoFilter` is the only caller
to migrate.

## Alternatives considered

- **TanStack Router / React Router 8:** a router bundle and a route tree, for one query param.
- **nuqs:** a good fit for typed search params, but it needs a router adapter or its own;
  a dependency for ~50 lines we can test.
- **Hash (`#/active`, TodoMVC style):** harder to combine with other params and anchors. The query
  string is the conventional place for view filters.
