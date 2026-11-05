# 0012. Git hooks, commit conventions and CI

- Status: Accepted
- Date: 2026-11-05

## Decision

- **`pnpm check`** is the single quality gate: typecheck → lint → format check → knip → unit and
  integration tests with coverage → build + e2e. CI runs the same steps (split so failures are
  labelled), plus a commitlint step on pull requests.
- **lefthook** (`lefthook.yml`, installed by the `prepare` script):
  - `pre-commit`: ESLint `--fix` and Prettier on **staged files only**, then re-stages fixes.
    Fast enough not to tempt `--no-verify`.
  - `commit-msg`: commitlint with `@commitlint/config-conventional`.
- **CI** (`.github/workflows/ci.yml`): Node from `.nvmrc`, pnpm from `packageManager`, pnpm store
  cache, `--frozen-lockfile`, least-privilege `permissions: contents: read`, concurrency
  cancellation, actions pinned to SHAs, Playwright report uploaded on failure.
- **Dependabot** keeps npm dependencies and pinned actions current.

## Consequences

- Hooks are a convenience. CI is the enforcement, because hooks can be skipped locally.
- Typecheck and tests don't run in pre-commit (too slow for every commit). They run in `check`/CI.

## Alternatives considered

- **husky + lint-staged:** two packages for what one lefthook binary does, including staged-file
  globbing and re-staging.
- **simple-git-hooks:** no staged-file handling, so it would still need lint-staged.
