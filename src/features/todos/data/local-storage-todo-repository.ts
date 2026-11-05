import { z } from 'zod';

import type { Todo } from '../domain/todo';
import { applyChange, type TodoChange } from '../domain/todo-list';
import type { TodoRepository } from './todo-repository';

/** Bump the version when the stored shape changes (and add a migration). */
export const STORAGE_KEY = 'todo-reference/todos/v1';

// Stored data is untrusted input: another tab, an older version or a user may have written it.
const storedTodosSchema = z.array(
  z.object({ id: z.string().min(1), title: z.string(), completed: z.boolean() }),
);

export class CorruptedStorageError extends Error {
  override name = 'CorruptedStorageError';
}

/** Runs synchronous storage work as a promise; a thrown error becomes a rejection. */
function defer<T>(work: () => T): Promise<T> {
  return new Promise((resolve) => {
    resolve(work());
  });
}

export function createLocalStorageTodoRepository(
  storage: Storage,
  key: string = STORAGE_KEY,
): TodoRepository {
  function read(): readonly Todo[] {
    const raw = storage.getItem(key);
    if (raw === null) return [];

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (cause) {
      throw new CorruptedStorageError(`"${key}" does not contain valid JSON`, { cause });
    }

    const result = storedTodosSchema.safeParse(json);
    if (!result.success) {
      throw new CorruptedStorageError(`"${key}" has an unexpected shape`, { cause: result.error });
    }
    return result.data;
  }

  function write(change: TodoChange): void {
    // setItem throws on quota errors; the rejection triggers an optimistic rollback.
    storage.setItem(key, JSON.stringify(applyChange(read(), change)));
  }

  return {
    list: () => defer(read),
    save: (todo) =>
      defer(() => {
        write({ type: 'save', todo });
      }),
    remove: (ids) =>
      defer(() => {
        write({ type: 'remove', ids });
      }),
  };
}
