import type { Todo } from './todo';

/**
 * Every mutation of the list is one of these. The same reducer applies a change
 * optimistically, to confirmed state, and inside storage implementations.
 */
export type TodoChange =
  | { readonly type: 'save'; readonly todo: Todo }
  | { readonly type: 'remove'; readonly ids: readonly string[] };

export function applyChange(todos: readonly Todo[], change: TodoChange): readonly Todo[] {
  switch (change.type) {
    case 'save': {
      const index = todos.findIndex((todo) => todo.id === change.todo.id);
      return index === -1 ? [...todos, change.todo] : todos.with(index, change.todo);
    }
    case 'remove': {
      const ids = new Set(change.ids);
      return todos.filter((todo) => !ids.has(todo.id));
    }
  }
}

export const FILTERS = ['all', 'active', 'completed'] as const;
export type Filter = (typeof FILTERS)[number];

function isFilter(value: string): value is Filter {
  return FILTERS.some((filter) => filter === value);
}

/** Unknown or missing values fall back to 'all', so a hand-edited URL never breaks the page. */
export function parseFilter(value: string | null): Filter {
  return value !== null && isFilter(value) ? value : 'all';
}

export function filterTodos(todos: readonly Todo[], filter: Filter): readonly Todo[] {
  switch (filter) {
    case 'all':
      return todos;
    case 'active':
      return todos.filter((todo) => !todo.completed);
    case 'completed':
      return todos.filter((todo) => todo.completed);
  }
}

export function countActive(todos: readonly Todo[]): number {
  return todos.reduce((count, todo) => (todo.completed ? count : count + 1), 0);
}

export function completedIds(todos: readonly Todo[]): readonly string[] {
  return todos.filter((todo) => todo.completed).map((todo) => todo.id);
}
