# 0002. Stack and toolchain

- Status: Accepted
- Date: 2026-11-05

## Context

We need a client-only React app with current, supported tooling. Versions were checked on the npm
registry on 2026-11-05 ([research](../RESEARCH.md)).

## Decision

| Concern                          | Choice                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------- |
| UI                               | React 19.3 + React DOM                                                        |
| Memoisation                      | React Compiler 1.0 through `@rolldown/plugin-babel` + `reactCompilerPreset()` |
| Build/dev server                 | Vite 8 (Rolldown) + `@vitejs/plugin-react` 6                                  |
| Language                         | TypeScript **6.0**                                                            |
| Runtime                          | Node.js 26 (Active LTS), pinned in `.nvmrc` and `engines`                     |
| Package manager                  | pnpm 12, pinned via `packageManager`                                          |
| Runtime dependency besides React | zod 4 (storage and env validation)                                            |

Supporting rules:

- **No manual `useMemo`/`useCallback`/`memo`.** react.dev recommends relying on the compiler in
  new code. The compiler lint rules (`eslint-plugin-react-hooks` `recommended-latest`) keep the
  code compilable.
- **Exact versions** in `package.json` (`saveExact`), lockfile committed, Dependabot proposes
  upgrades weekly (dev tooling grouped).
- **Supply-chain guard:** `minimumReleaseAge: 1440` is set explicitly in `pnpm-workspace.yaml`. The
  pnpm 11+ default is non-strict and silently adds exclusions. Explicit makes it strict. Only
  `lefthook` may run install scripts (`allowBuilds`). GitHub Actions are pinned to commit SHAs.

## Why TypeScript 6 and not 7

TypeScript 7.0 (the Go-native compiler) is npm `latest`, but it ships without the programmatic
API that `typescript-eslint` needs. `typescript-eslint@8.72` declares `typescript <6.1.0`.
Type-aware linting is one of this repo's main guarantees. A native `tsgo` typecheck alongside
TS 6 would give two compilers that can disagree, to save about 2 seconds. **Revisit** when
typescript-eslint supports TS 7 (expected with 7.1's new API).

## Consequences

- Contributors need Node 26 (`nvm use`) and pnpm 12. Node 26 no longer ships Corepack, so pnpm
  is installed via `npm i -g pnpm@12` or `pnpm/action-setup` in CI.
- A dependency published less than 24h ago cannot be installed. That is intended: wait a day or
  pin the previous version.

## Alternatives considered

- **A framework** (Next.js, React Router framework mode, TanStack Start): react.dev recommends one
  for new apps, but its value (SSR, data loading, server functions, routing) goes unused by an
  offline, single-screen SPA with localStorage. See [ADR 0013](0013-deliberately-excluded.md).
- **npm / Bun:** npm has no release-age cooldown or script allow-list by default. Bun adds a
  second runtime to support.
- **Rust React Compiler** (`react({ compiler: true })`): marked experimental by plugin-react.
