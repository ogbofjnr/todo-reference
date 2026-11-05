# Architecture Decision Records

Format: lightweight [MADR](https://adr.github.io/madr/): status, context, decision,
consequences, alternatives. One decision per file, numbered, never deleted: a reversed
decision gets a new ADR that supersedes the old one.

| #                                             | Decision                                                       | Status   |
| --------------------------------------------- | -------------------------------------------------------------- | -------- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions                                  | Accepted |
| [0002](0002-stack-and-toolchain.md)           | Stack and toolchain (React 19, Vite 8, TS 6, Node 26, pnpm 12) | Accepted |
| [0003](0003-project-structure.md)             | Feature folders with three enforced layers                     | Accepted |
| [0004](0004-typescript-strictness.md)         | TypeScript strictness flags                                    | Accepted |
| [0005](0005-state-management.md)              | State management with React 19 Actions, no state library       | Accepted |
| [0006](0006-linting-and-formatting.md)        | ESLint (type-aware) + Prettier                                 | Accepted |
| [0007](0007-url-state-without-router.md)      | Filter in the URL without a router                             | Accepted |
| [0008](0008-testing-strategy.md)              | Testing strategy                                               | Accepted |
| [0009](0009-styling.md)                       | Tailwind CSS v4                                                | Accepted |
| [0010](0010-environment-configuration.md)     | Validated build-time environment                               | Accepted |
| [0011](0011-persistence.md)                   | Repository interface, localStorage implementation              | Accepted |
| [0012](0012-git-hooks-and-ci.md)              | Git hooks, commit conventions and CI                           | Accepted |
| [0013](0013-deliberately-excluded.md)         | What we deliberately did not add                               | Accepted |
| [0014](0014-review-findings.md)               | Self-review: objections considered                             | Accepted |
