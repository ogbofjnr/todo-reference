# 0001. Record architecture decisions

- Status: Accepted
- Date: 2026-11-05

## Context

This repository is meant to show its reasoning, not just its result. A reviewer should be able
to find out why a tool or layer exists, and an agent working in the repo needs the same
context to avoid "fixing" deliberate choices.

## Decision

Every significant or non-obvious decision gets a short ADR in `docs/adr/`, in a lightweight MADR
format. The research behind the initial decisions is in [`docs/RESEARCH.md`](../RESEARCH.md).
We also record what we chose _not_ to do, with the condition that would change it
([ADR 0013](0013-deliberately-excluded.md)).

## Consequences

- Changing a recorded decision means writing a new ADR that supersedes the old one.
- ADRs must match the code. [ADR 0014](0014-review-findings.md) records the last check.
