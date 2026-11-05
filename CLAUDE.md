# CLAUDE.md

React 19 + TypeScript SPA. Architecture: @docs/ARCHITECTURE.md. Decisions: `docs/adr/`.

## Commands

- `pnpm dev`: dev server
- `pnpm typecheck` · `pnpm lint` (`lint:fix`) · `pnpm format`
- `pnpm test` (Vitest) · `pnpm test:e2e` (builds, then Playwright)
- `pnpm check`: full gate, identical to CI

Node 26 (`.nvmrc`), pnpm 12. Never use npm or yarn.

## Definition of done

`pnpm check` is green. New behaviour has tests. Docs and ADRs match the code. Commits follow
Conventional Commits (`feat: …`, `fix: …`, `docs: …`, `chore: …`, `test: …`, `refactor: …`),
one logical change each, each passing `check`.

## Rules

- Layers: `app → features → shared`. Never import one feature from another. Import a feature only
  via `@/features/<name>`. Lint enforces this: do not work around it, move code to `shared/` or
  compose in `app/`.
- Business logic goes in `features/<name>/domain/` as pure functions with unit tests, without React.
- Data access goes only through a repository interface injected via context. Components never touch
  `localStorage`/`fetch`.
- `import.meta.env` is read only in `app/main.tsx` via `parseEnv`. New variable: update the schema,
  `.env.example` and ADR 0010 together. No secrets in `VITE_*`.
- No `useMemo`/`useCallback`/`memo`: the React Compiler handles memoisation.
- No `any`. No `as` (lint error). If unavoidable:
  `// eslint-disable-next-line <rule> -- <reason>`.
- No `TODO`/`FIXME` comments: open an issue.
- No native `alert`/`confirm`/`prompt`. Errors go to `role="alert"`, success to the `role="status"` region.
- Tests: query by role and accessible name, assert user-visible behaviour, no snapshots. Render
  components that suspend inside `await act(...)`.
- Styling: Tailwind utilities. Express state through ARIA attributes (`aria-invalid:`, `aria-[current=page]:`).
- New dependency: justify it (ADR or PR description). pnpm refuses versions younger than 24h;
  never add `minimumReleaseAgeExclude`.

## Where things are

- Feature code: `src/features/todos/{domain,data,model,ui}`, public API `index.ts`
- Wiring (which implementations, env): `src/app/main.tsx`
- Lint architecture rules: `eslint.config.ts` (_Architecture_ block)
- Test setup: `src/test/setup.ts`. E2E: `e2e/`
