import { createContext, use } from 'react';

import type { TodoRepository } from '../data/todo-repository';

/** Dependency injection seam: the app provides a repository, tests provide fakes. */
export const TodoRepositoryContext = createContext<TodoRepository | null>(null);

export function useTodoRepository(): TodoRepository {
  const repository = use(TodoRepositoryContext);
  if (repository === null) {
    throw new Error('useTodoRepository must be used inside <TodoRepositoryContext value={...}>');
  }
  return repository;
}
