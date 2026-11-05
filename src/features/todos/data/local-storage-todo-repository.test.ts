import { beforeEach, describe, expect, it } from 'vitest';

import { createTodo, toggleTodo } from '../domain/todo';
import {
  CorruptedStorageError,
  createLocalStorageTodoRepository,
  STORAGE_KEY,
} from './local-storage-todo-repository';

describe('createLocalStorageTodoRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty', async () => {
    await expect(createLocalStorageTodoRepository(localStorage).list()).resolves.toEqual([]);
  });

  it('persists saves and removals across instances', async () => {
    const first = createLocalStorageTodoRepository(localStorage);
    const todo = createTodo('1', 'Persist me');
    await first.save(todo);
    await first.save(createTodo('2', 'Remove me'));
    await first.save(toggleTodo(todo));
    await first.remove(['2']);

    const second = createLocalStorageTodoRepository(localStorage);
    await expect(second.list()).resolves.toEqual([{ ...todo, completed: true }]);
  });

  it('rejects with CorruptedStorageError on invalid JSON', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    await expect(createLocalStorageTodoRepository(localStorage).list()).rejects.toBeInstanceOf(
      CorruptedStorageError,
    );
  });

  it('rejects with CorruptedStorageError on an unexpected shape', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 1, title: null }]));
    await expect(createLocalStorageTodoRepository(localStorage).list()).rejects.toBeInstanceOf(
      CorruptedStorageError,
    );
  });

  it('rejects instead of throwing when the storage refuses a write', async () => {
    const full: Storage = {
      length: 0,
      clear: () => undefined,
      key: () => null,
      removeItem: () => undefined,
      getItem: () => null,
      setItem: () => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      },
    };
    await expect(createLocalStorageTodoRepository(full).save(createTodo('1', 'x'))).rejects.toThrow(
      'Quota exceeded',
    );
  });
});
