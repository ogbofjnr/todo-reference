# 0005. State management with React 19 Actions, no state library

- Status: Accepted
- Date: 2026-11-05

## Context

The state in this app comes in three kinds:

| Kind                                      | Here                                       | Lives in                                                                         |
| ----------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| Server state (persisted, async, may fail) | the todo list                              | `useTodos` (`model/use-todos.ts`), backed by the repository                      |
| URL state (shareable, survives reload)    | the active filter                          | the query string (`useTodoFilter`, [ADR 0007](0007-url-state-without-router.md)) |
| Local UI state                            | input drafts, edit mode, validation errors | `useState` in the component that owns it                                         |

Requirements for the server-state part: initial loading and error states, optimistic updates,
and rollback on failure.

## Decision

Use **React 19 primitives only**:

- **Loading:** `TodosPage` creates the `list()` promise once (state initialiser) and a child reads
  it with `use()` under `<Suspense>`. A load error goes to an `<ErrorBoundary>`. Retrying makes a
  new promise and remounts the boundary with a new `key`.
- **Mutations:** each operation is a `TodoChange` (`save` or `remove`). Inside
  `startTransition(async () => …)`, the change is applied with `useOptimistic`, persisted through the
  repository, then committed to confirmed state with the **same pure reducer** (`applyChange`).
- **Rollback:** if persisting throws, we never commit. When the transition ends, React drops the
  optimistic value and the UI returns to confirmed state, with no hand-written undo logic. The
  error is shown in a `role="alert"` banner. Success is announced in a `role="status"` live region.
- **Dependency injection:** the repository comes from `TodoRepositoryContext`, provided by the
  composition root (`app/main.tsx`) and replaced by fakes in tests.

All logic that can be pure (the reducer, filters, counts, validation) lives in `domain/` with unit
tests. The hook only orchestrates.

## Consequences

- No extra runtime dependency. The data flow is about 110 lines and uses documented React APIs.
- Concurrent mutations are safe: React keeps optimistic updates while any action is pending,
  and confirmed state is updated with functional `setTodos`.
- There is no caching, background refetch, retry or cross-tab sync. None is needed for one
  local data source read once per page load.

## When to revisit

Adopt **TanStack Query** when data comes from a real network API _and_ any of these appears:
several screens sharing the same server data, stale-while-revalidate/refetch-on-focus, retries
with backoff, pagination, or request deduplication. The repository interface would sit unchanged
under its `queryFn`/`mutationFn`.

## Alternatives considered

- **TanStack Query 5:** best in class for remote server state. For one in-browser source read
  once, its cache, staleness model and devtools would go unused.
- **Zustand / Jotai / Redux Toolkit:** these solve _shared client state_ across distant
  components. Here state has a single owner (`useTodos`) and is passed one or two levels down.
  A global store would add indirection and still need hand-written optimistic/rollback logic.
- **`useReducer` + Context:** close to what we have. `useOptimistic` gives rollback for free, which
  a plain reducer does not.
- **`<form action>` / `useActionState` for the inputs:** React resets uncontrolled forms after an
  action, which would wipe invalid input the user should correct. Validation needs controlled
  inputs, so forms use `onSubmit`.
