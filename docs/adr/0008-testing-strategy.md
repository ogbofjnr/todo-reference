# 0008. Testing strategy

- Status: Accepted
- Date: 2026-11-05

## Context

We want confidence per unit of maintenance cost. For a frontend, that usually means few unit tests
on pure logic, most tests at the integration level through the UI, and a small number of e2e
tests in a real browser.

## Decision

| Level       | Tool                                          | What                                                                                                                                                                                                            | Where                                |
| ----------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Unit        | Vitest                                        | Pure domain rules (validation, reducer, filters), repository implementations, env parsing, URL hook                                                                                                             | `*.test.ts` next to the code         |
| Integration | Vitest + Testing Library + user-event + jsdom | The whole feature through the UI, with a real localStorage repository or a fake one injected via context: CRUD, validation, focus management, URL filters, optimistic update and rollback, load error and retry | `TodosPage.test.tsx`, `App.test.tsx` |
| E2E         | Playwright (Chromium) + axe-core              | The main journey against the **production build**, including reload persistence and back/forward, plus a WCAG 2.2 AA audit                                                                                      | `e2e/`                               |

Rules:

- Query by role and accessible name (`getByRole('button', { name: 'Delete “Milk”' })`). If a test
  cannot find an element that way, the UI has an accessibility gap.
- Assert behaviour, not implementation: no snapshot tests, no checks on hook internals or
  component state.
- No MSW: there is no HTTP. The repository interface is the seam, and fakes are plain objects.
- `app/main.tsx` (pure wiring) is excluded from coverage. It runs in every e2e test.
- Coverage thresholds of 90% (lines, branches, functions, statements) fail `test:coverage`. The
  threshold is a floor, not a goal.

### React Compiler is off in Vitest

The compiler injects memo-cache branches into every component. A single render never takes the
"cache hit" side, so branch coverage reports gaps that are not in our code. The compiler is
documented as semantics-preserving, its lint rules keep the code compilable, and the **e2e suite
runs the compiled production build**, so compiled output is still exercised.

### Suspense in jsdom

Initial render goes through `await act(() => render(...))`, which lets React flush a resolved
`use(promise)`. Polling with `findBy*` alone did not with React 19.3 + RTL 16.3.

## Consequences

- `pnpm test` runs in about 4 seconds, and e2e in about 5 more.
- Only Chromium runs in e2e. Cross-browser issues are unlikely for this feature set, and adding
  WebKit/Firefox is one line in `playwright.config.ts`.

## Alternatives considered

- **Vitest Browser Mode** for integration tests: more realistic DOM, slower, and it overlaps with
  Playwright e2e here.
- **Component snapshot tests:** they break on markup changes without catching behaviour bugs.
