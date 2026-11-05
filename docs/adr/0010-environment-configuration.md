# 0010. Validated build-time environment

- Status: Accepted
- Date: 2026-11-05

## Context

Vite inlines every `import.meta.env.VITE_*` value into the **public** bundle at build time. A
misspelled or malformed variable otherwise surfaces as odd runtime behaviour, far from its cause.

## Decision

- `src/shared/config/env.ts` defines a zod schema and `parseEnv(source)`. On failure it throws
  `Invalid environment variables:` followed by zod's per-field messages.
- The **composition root** (`app/main.tsx`) calls `parseEnv(import.meta.env)` once, before
  rendering, and passes typed values to the code that needs them. Nothing else reads
  `import.meta.env`, so modules have no import-time side effects and are easy to test.
- `.env.example` documents every variable. All `.env*` files except the example are git-ignored.

Current variables are both optional, default `0`, and exist to make async behaviour visible
during development:

| Variable                      | Effect                                                                     |
| ----------------------------- | -------------------------------------------------------------------------- |
| `VITE_SIMULATED_LATENCY_MS`   | Delay on every storage call: loading and optimistic states become visible. |
| `VITE_SIMULATED_FAILURE_RATE` | Probability that a write fails: exercises rollback by hand.                |

## Rules

- **Never put secrets in `VITE_*` variables.** Anything a browser bundle contains is public.
  Secrets belong to a server or a backend-for-frontend.
- Every new variable is added to the schema, `.env.example` and this table in the same change.

## Alternatives considered

- **t3-env:** its main value is enforcing the server/client split. An SPA has only a client.
  A plain zod schema does the rest.
- **valibot:** smaller, but zod is already used for storage validation, and two schema libraries
  is one too many.
- **Runtime config** (`/config.json` fetched at start): needed only to promote one build across
  environments. There is a single static build here.
