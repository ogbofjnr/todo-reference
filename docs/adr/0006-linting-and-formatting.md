# 0006. ESLint (type-aware) + Prettier

- Status: Accepted
- Date: 2026-11-05

## Context

Rules a reviewer would otherwise enforce by hand should be machine-checked: layer boundaries,
React and compiler rules, accessibility, unchecked casts, unexplained suppressions.

## Decision

**ESLint 10 flat config** (`eslint.config.ts`), `--max-warnings=0`. Every rule is an error:
there are no warnings to ignore.

| Block                                                                                             | What it enforces                                                                                                     |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `@eslint/js` recommended + typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`         | Type-aware correctness: floating promises, unsafe `any` flows, unnecessary conditions, misused spreads, …            |
| `consistent-type-assertions: never`                                                               | No `as` casts. A cast needs an `eslint-disable` with a reason (below), which makes it a visible, reviewed exception. |
| `switch-exhaustiveness-check`                                                                     | Adding a `TodoChange` or `Filter` variant fails lint wherever it is not handled.                                     |
| `no-warning-comments` (todo, fixme, xxx, hack)                                                    | No TODOs in code: open an issue.                                                                                     |
| `no-alert`                                                                                        | No native `alert`/`confirm`/`prompt`: errors and confirmations are in-page and accessible.                           |
| `eslint-comments`: `require-description`, `no-unlimited-disable`, `reportUnusedDisableDirectives` | A suppression names its rule, explains why (`-- reason`), and is removed when no longer needed.                      |
| `react-hooks` `recommended-latest`                                                                | Rules of Hooks plus the React Compiler rules (`purity`, `refs`, `set-state-in-render`, `immutability`, …).           |
| `jsx-a11y` `strict`                                                                               | Static accessibility checks on JSX.                                                                                  |
| `react-refresh` (vite)                                                                            | Component files export only components, so Fast Refresh keeps working.                                               |
| `simple-import-sort`                                                                              | Deterministic, autofixed import order.                                                                               |
| `boundaries/dependencies` + `no-restricted-imports`                                               | Layer direction, no cross-feature imports, public API only ([ADR 0003](0003-project-structure.md)).                  |
| `eslint-config-prettier` (last)                                                                   | Turns off stylistic rules that Prettier owns.                                                                        |

**Prettier** formats. `.editorconfig` covers editors that don't run Prettier.
**knip** reports unused files, exports and dependencies.

### Verified, not assumed

During setup we added deliberate violations: a cross-feature import, `shared → feature`, a
deep import past a feature's `index.ts`, a `div` with `onClick`, an `img` without `alt`, an
`as` cast, a `TODO`, and an undescribed `eslint-disable`. Lint reported all 9 errors, and we
then deleted the files. [ARCHITECTURE.md](../ARCHITECTURE.md#verifying-the-boundaries) shows how
to repeat this.

### jsx-a11y on ESLint 10

`eslint-plugin-jsx-a11y@6.10.2` (latest, October 2024) declares `peer eslint ^3 … ^9`. Its rules run
correctly on ESLint 10 (verified above). The peer range is allowed explicitly in
`pnpm-workspace.yaml` (`peerDependencyRules.allowedVersions`) rather than ignored globally.
**Revisit** when upstream publishes ESLint 10 support. If it breaks before then, switch to the
`eslint-plugin-jsx-a11y-x` fork.

## Consequences

- Type-aware linting takes a few seconds, not milliseconds. The pre-commit hook lints only staged
  files.
- Tests follow the same rules as production code. There are no relaxed overrides.

## Alternatives considered

- **Biome 2 / oxlint 1:** far faster, but they have no equivalent of type-aware
  typescript-eslint, the React Compiler rules or eslint-plugin-boundaries. Speed is not a
  bottleneck at this size.
- **eslint-plugin-import-x:** wider scope (cycles, unresolved imports), but TypeScript already
  reports unresolved imports, and its import-order rules are slower than simple-import-sort.
