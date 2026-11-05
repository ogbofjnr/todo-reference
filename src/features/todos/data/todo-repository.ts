import type { Todo } from '../domain/todo';

/**
 * The only way the feature reads or writes todos. The UI depends on this
 * interface, never on a concrete storage. Every method is async so an HTTP
 * implementation can replace localStorage without touching callers.
 */
export interface TodoRepository {
  readonly list: () => Promise<readonly Todo[]>;
  /** Creates or replaces the todo with the same id (idempotent upsert). */
  readonly save: (todo: Todo) => Promise<void>;
  readonly remove: (ids: readonly string[]) => Promise<void>;
}
