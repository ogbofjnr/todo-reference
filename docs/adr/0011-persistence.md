# 0011. Repository interface, localStorage implementation

- Status: Accepted
- Date: 2026-11-05

## Context

Todos must survive reloads. The UI should not know where data comes from: replacing the storage
should mean writing one new implementation. Options were localStorage, or a mock HTTP API with
MSW.

## Decision

```ts
interface TodoRepository {
  readonly list: () => Promise<readonly Todo[]>;
  readonly save: (todo: Todo) => Promise<void>; // idempotent upsert by id
  readonly remove: (ids: readonly string[]) => Promise<void>;
}
```

- **Async on purpose,** even though localStorage is synchronous. Callers are written for a
  network, so the swap needs no changes to them.
- **Client-generated ids** (`crypto.randomUUID()`) make `save` an idempotent upsert, the same
  shape as `PUT /todos/:id`, and let optimistic items have stable React keys from the start.
- **`createLocalStorageTodoRepository(storage, key)`** is the production implementation. Stored data
  is treated as untrusted (other tabs, older versions, users) and parsed with zod. Invalid
  JSON or shape raises `CorruptedStorageError`. Quota errors from `setItem` become rejections, which
  trigger the normal optimistic rollback. The key is versioned (`…/v1`) for future migrations.
- **`withSimulatedNetwork(repository, options)`** is a decorator that adds latency and write
  failures from env ([ADR 0010](0010-environment-configuration.md)). It shows the interface's
  point: behaviour composes without the UI knowing.
- The repository reaches the UI through `TodoRepositoryContext`. Only `app/main.tsx` chooses
  implementations.

Swapping to an HTTP backend means writing `createHttpTodoRepository(baseUrl)` and changing one line
in `main.tsx`.

## Consequences

- With latency at 0 (the default), the optimistic UI is effectively instant. Set
  `VITE_SIMULATED_LATENCY_MS` to see it.
- Corrupted storage keeps failing on retry. A "reset data" action would fix it, but it is
  destructive UI for a case that only happens if storage is edited by hand. Not built.
- `crypto.randomUUID()` exists only in secure contexts. `localhost` and HTTPS qualify, but
  `pnpm dev --host` opened via a plain-HTTP LAN IP does not, and adding a task fails there.
  Accepted: production is served over HTTPS.
- No cross-tab sync (`storage` event): out of scope (see [ADR 0013](0013-deliberately-excluded.md)).

## Alternatives considered

- **MSW-backed fake REST API:** it would show request/response handling, but it adds a service
  worker in production builds, or makes the "real" app a mock. It also tests MSW handlers rather
  than storage. The repository seam already proves swappability, and an HTTP implementation can
  be tested with MSW when it exists.
- **IndexedDB:** async and larger quota, but a todo list fits in localStorage, and the IDB API
  (or a wrapper dependency) adds complexity without benefit.
