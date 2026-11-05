# 0004. TypeScript strictness flags

- Status: Accepted
- Date: 2026-11-05

## Context

TypeScript's guarantees come from its flags. `tsconfig.base.json` holds the shared set,
`tsconfig.app.json` (browser code, `vite/client` types) and `tsconfig.node.json` (configs,
e2e, `node` types) extend it, so Node globals never leak into browser code.

## Decision

| Flag                                              | Why                                                                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `strict`                                          | Baseline: null checks, strict function types, `noImplicitAny`, …                                                                                        |
| `noUncheckedIndexedAccess`                        | `arr[i]` and `record[key]` are `T \| undefined`. Out-of-range reads are a classic runtime bug.                                                          |
| `exactOptionalPropertyTypes`                      | `{ a?: string }` does not accept `{ a: undefined }`. Keeps "absent" and "explicitly undefined" distinct.                                                |
| `noImplicitOverride`                              | Overriding a base member (e.g. in `ErrorBoundary`) must say `override`, so a rename in the base class is caught.                                        |
| `noImplicitReturns`, `noFallthroughCasesInSwitch` | Cheap protection against incomplete control flow.                                                                                                       |
| `noPropertyAccessFromIndexSignature`              | Index-signature reads must use `obj['key']`, so it is visible that the key may not exist (e.g. `process.env['CI']`).                                    |
| `verbatimModuleSyntax`                            | Type-only imports are written `import type` and are erased predictably. Required for correct single-file transpilation.                                 |
| `isolatedModules`                                 | Every file can be transpiled alone, which is what Vite/Rolldown and Babel do.                                                                           |
| `erasableSyntaxOnly`                              | Bans `enum`, `namespace` and parameter properties: syntax that is not just erased. Keeps the code compatible with type-stripping runtimes and bundlers. |
| `noUncheckedSideEffectImports`                    | A typo in `import './styles.css'` becomes an error instead of a silent no-op.                                                                           |
| `moduleResolution: bundler`                       | Matches how Vite resolves imports.                                                                                                                      |
| `skipLibCheck`                                    | We check our code, not `.d.ts` files in `node_modules`. Library type conflicts are not ours to fix, and checking them slows every run.                  |
| `noEmit`                                          | Vite builds. `tsc` only checks.                                                                                                                         |

Not enabled: `noUnusedLocals`/`noUnusedParameters`. ESLint's `no-unused-vars` already reports
these, with better messages and autofix-friendly behaviour, so enabling both would duplicate errors.

## Consequences

- No `as` casts in application code. Lint enforces it (see [ADR 0006](0006-linting-and-formatting.md)).
  Untrusted data (localStorage, env) is parsed with zod, which yields proper types without casts.
- `target`/`lib` is ES2024 (`Array.prototype.with`, `Promise.withResolvers`), which is within
  Vite 8's default "baseline widely available" browser target.
