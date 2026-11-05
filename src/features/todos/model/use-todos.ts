import { useOptimistic, useState, useTransition } from 'react';

import { createTodo, renameTodo, type Todo, toggleTodo } from '../domain/todo';
import { applyChange, completedIds, type TodoChange } from '../domain/todo-list';
import { useTodoRepository } from './todo-repository-context';

export interface TodosModel {
  /** Confirmed state with pending optimistic changes applied on top. */
  readonly todos: readonly Todo[];
  /** Last failed operation, already rolled back. Shown with role="alert". */
  readonly error: string | null;
  /** Last successful operation, for the aria-live status region. */
  readonly announcement: string;
  readonly add: (title: string) => void;
  readonly toggle: (todo: Todo) => void;
  readonly rename: (todo: Todo, title: string) => void;
  readonly remove: (todo: Todo) => void;
  readonly clearCompleted: () => void;
  readonly dismissError: () => void;
}

interface Operation {
  readonly change: TodoChange;
  readonly persist: () => Promise<void>;
  readonly success: string;
  readonly failure: string;
}

/**
 * Optimistic updates with automatic rollback, built on React 19 Actions:
 * a change is shown immediately via useOptimistic and committed to `todos` only
 * after the repository confirms it. If persisting fails, the transition ends
 * without a commit, so React drops the optimistic value: that is the rollback.
 */
export function useTodos(initialTodos: readonly Todo[]): TodosModel {
  const repository = useTodoRepository();
  const [todos, setTodos] = useState(initialTodos);
  const [optimisticTodos, applyOptimistic] = useOptimistic(todos, applyChange);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [, startTransition] = useTransition();

  function run({ change, persist, success, failure }: Operation): void {
    setError(null);
    startTransition(async () => {
      applyOptimistic(change);
      try {
        await persist();
      } catch {
        setError(failure);
        return;
      }
      // State updates after an `await` need their own transition (React 19 caveat).
      startTransition(() => {
        setTodos((current) => applyChange(current, change));
        setAnnouncement(success);
      });
    });
  }

  return {
    todos: optimisticTodos,
    error,
    announcement,
    add: (title) => {
      const todo = createTodo(crypto.randomUUID(), title);
      run({
        change: { type: 'save', todo },
        persist: () => repository.save(todo),
        success: `Added “${title}”.`,
        failure: `Couldn’t add “${title}”. Please try again.`,
      });
    },
    toggle: (todo) => {
      const toggled = toggleTodo(todo);
      run({
        change: { type: 'save', todo: toggled },
        persist: () => repository.save(toggled),
        success: `Marked “${todo.title}” as ${toggled.completed ? 'completed' : 'active'}.`,
        failure: `Couldn’t update “${todo.title}”. Please try again.`,
      });
    },
    rename: (todo, title) => {
      const renamed = renameTodo(todo, title);
      run({
        change: { type: 'save', todo: renamed },
        persist: () => repository.save(renamed),
        success: `Renamed to “${title}”.`,
        failure: `Couldn’t rename “${todo.title}”. Please try again.`,
      });
    },
    remove: (todo) => {
      run({
        change: { type: 'remove', ids: [todo.id] },
        persist: () => repository.remove([todo.id]),
        success: `Deleted “${todo.title}”.`,
        failure: `Couldn’t delete “${todo.title}”. Please try again.`,
      });
    },
    clearCompleted: () => {
      const ids = completedIds(optimisticTodos);
      run({
        change: { type: 'remove', ids },
        persist: () => repository.remove(ids),
        success: `Cleared ${String(ids.length)} completed ${ids.length === 1 ? 'task' : 'tasks'}.`,
        failure: 'Couldn’t clear completed tasks. Please try again.',
      });
    },
    dismissError: () => {
      setError(null);
    },
  };
}
