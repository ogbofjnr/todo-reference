# 0014. Self-review: objections considered

- Status: Accepted
- Date: 2026-11-05

## Context

Before publishing, the project was reviewed from the position of a skeptical senior engineer
looking for both sloppiness and over-engineering. Each objection was either fixed or answered
with a recorded reason. The docs were then checked against the code.

## Fixed

| Objection                                                                                                                   | Fix                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `retry()` called `repository.list()` inside a `setState` updater. Updaters must be pure (StrictMode runs them twice).       | The promise is created before `setLoad`. The initialiser's double call in dev is commented as harmless. |
| `TodoItem` handled both view and edit modes (~140 lines, two state machines).                                               | The edit form is extracted into `TodoEditForm`. `TodoItem` owns only mode and focus.                    |
| The footer read `window.location` during render, which is impure and does not re-render on navigation.                      | `useSearchParam` exposes `hrefWith()` built from the subscribed URL snapshot.                           |
| "No native `alert`/`confirm`" was only a convention.                                                                        | `no-alert` lint rule.                                                                                   |
| Entering edit mode did not focus the field in all engines (`select()` alone does not focus). Caught by an integration test. | Explicit `focus()` then `select()`.                                                                     |
| Mixed `^` and exact versions.                                                                                               | All exact, `saveExact: true`, Dependabot for upgrades.                                                  |
| pnpm's default release-age cooldown is non-strict: it silently added exclusions for packages published that morning.        | `minimumReleaseAge` set explicitly (strict). Previous versions pinned instead.                          |
| The same Tailwind class string was duplicated in two components.                                                            | `ui/class-names.ts`.                                                                                    |
| No LICENSE for a public reference repo.                                                                                     | MIT.                                                                                                    |
| Docs quoted stale line counts and missed a component and the coverage exclusion.                                            | Corrected (ADRs 0005, 0007, 0008, 0013, ARCHITECTURE).                                                  |

## Kept, with reasons

| Objection                                                                        | Answer                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Server state without TanStack Query?"                                           | One local source read once. React 19's `useOptimistic` gives rollback for free. Trigger to adopt is in [ADR 0005](0005-state-management.md).                                                              |
| "A hand-rolled URL hook instead of a router?"                                    | One query param, ~50 tested lines. Trigger: a second page ([ADR 0007](0007-url-state-without-router.md)).                                                                                                 |
| "bulletproof-react says no barrel files."                                        | One five-export public API per feature, enforced by lint, nothing to tree-shake ([ADR 0003](0003-project-structure.md)).                                                                                  |
| "Unit tests run without the React Compiler, so they test different code."        | Compiler branches distort coverage. The compiler preserves semantics, its lint rules guard compilability, and e2e runs the compiled build ([ADR 0008](0008-testing-strategy.md)).                         |
| "TypeScript 6 in late 2026?"                                                     | TS 7 has no API for typescript-eslint yet ([ADR 0002](0002-stack-and-toolchain.md)).                                                                                                                      |
| "jsx-a11y with an overridden peer range."                                        | Upstream has not released ESLint 10 support. Rules verified to run. Scoped override with an exit plan ([ADR 0006](0006-linting-and-formatting.md)).                                                       |
| "Simulated latency/failure is dev tooling in the production bundle."             | ~50 lines. With the defaults (0/0) it returns the repository untouched. It is the only practical way to see optimistic UI and rollback by hand ([ADR 0010](0010-environment-configuration.md)).           |
| "A repository interface for localStorage is over-abstraction."                   | It is a requirement (swap storage = one new implementation), and it is the seam every integration test uses to inject failures.                                                                           |
| "Delete without confirmation or undo."                                           | Native `confirm` is banned, and a modal for a todo is friction. Undo toast is the documented next step ([ADR 0013](0013-deliberately-excluded.md)).                                                       |
| "Corrupted storage errors on every retry."                                       | Only reachable by editing storage by hand. A destructive reset UI is not justified ([ADR 0011](0011-persistence.md)).                                                                                     |
| "`crypto.randomUUID` fails on plain-HTTP LAN dev servers."                       | Secure-context API. Fine on localhost and HTTPS ([ADR 0011](0011-persistence.md)).                                                                                                                        |
| "Integration tests call `act()` directly."                                       | Needed so React 19 flushes `use(promise)` in jsdom. Commented in the helper ([ADR 0008](0008-testing-strategy.md)).                                                                                       |
| "Repeating the same action twice may not re-announce the same live-region text." | Known screen-reader behaviour. Acceptable for success messages. Failures are not affected: the alert is removed at the start of every operation and re-inserted on failure, so it is announced each time. |
| "Chromium-only e2e."                                                             | One line to add browsers when a browser-specific risk appears ([ADR 0008](0008-testing-strategy.md)).                                                                                                     |

## Documentation check

Each ADR was compared with the code it describes (configs, scripts, file paths, rule names,
exported API). Statements now true by construction:

- Every script in README and CLAUDE.md exists in `package.json`. `pnpm check` equals the CI steps,
  except that CI adds commitlint on PRs and builds in a separate step.
- The lint rules listed in ADR 0006 are in `eslint.config.ts`. The boundary recipe in
  ARCHITECTURE.md was run and fails as described.
- The env variables in `.env.example`, ADR 0010 and `env.ts` match.
