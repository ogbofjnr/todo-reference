import { Suspense, use, useRef, useState } from 'react';

import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';

import type { Todo } from '../domain/todo';
import { countActive, type Filter, filterTodos } from '../domain/todo-list';
import { useTodoRepository } from '../model/todo-repository-context';
import { useTodoFilter } from '../model/use-todo-filter';
import { useTodos } from '../model/use-todos';
import { NewTodoForm } from './NewTodoForm';
import { TodoFooter } from './TodoFooter';
import { TodoList } from './TodoList';

const EMPTY_MESSAGES: Record<Filter, string> = {
  all: 'Nothing to do yet. Add your first task above.',
  active: 'No active tasks. Nice work!',
  completed: 'No completed tasks yet.',
};

/** Loads the todos once and owns the loading and load-error states. */
export function TodosPage() {
  const repository = useTodoRepository();
  // The promise must outlive re-renders, so it is created once and kept in state. (StrictMode
  // calls the initialiser twice in development; the extra read is discarded and harmless.)
  const [load, setLoad] = useState(() => ({ attempt: 0, todos: repository.list() }));

  function retry(): void {
    const todos = repository.list(); // outside the updater: updaters must stay pure
    setLoad(({ attempt }) => ({ attempt: attempt + 1, todos }));
  }

  return (
    // A new key remounts the boundary, clearing its error for the retry.
    <ErrorBoundary
      key={load.attempt}
      fallback={
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
          <p>Couldn’t load your tasks.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-2 rounded-md bg-red-700 px-3 py-1 font-medium text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            Try again
          </button>
        </div>
      }
    >
      <Suspense fallback={<p role="status">Loading tasks…</p>}>
        <Todos todosPromise={load.todos} />
      </Suspense>
    </ErrorBoundary>
  );
}

function Todos({ todosPromise }: { readonly todosPromise: Promise<readonly Todo[]> }) {
  const model = useTodos(use(todosPromise));
  const { filter, hrefFor, setFilter } = useTodoFilter();
  const newTodoInputRef = useRef<HTMLInputElement>(null);

  const activeCount = countActive(model.todos);

  // Deleting the focused row would drop focus to <body>; send it somewhere useful.
  function focusNewTodo(): void {
    newTodoInputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      <NewTodoForm onAdd={model.add} inputRef={newTodoInputRef} />

      {model.error !== null && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-red-800"
        >
          <p>{model.error}</p>
          <button
            type="button"
            onClick={model.dismissError}
            className="rounded px-2 text-sm hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      <p role="status" className="sr-only">
        {model.announcement}
      </p>

      {model.todos.length === 0 ? (
        <p className="py-4 text-slate-500">{EMPTY_MESSAGES.all}</p>
      ) : (
        <>
          <TodoList
            todos={filterTodos(model.todos, filter)}
            emptyMessage={EMPTY_MESSAGES[filter]}
            onToggle={model.toggle}
            onRename={model.rename}
            onRemove={(todo) => {
              model.remove(todo);
              focusNewTodo();
            }}
          />
          <TodoFooter
            activeCount={activeCount}
            completedCount={model.todos.length - activeCount}
            filter={filter}
            hrefFor={hrefFor}
            onFilterChange={setFilter}
            onClearCompleted={() => {
              model.clearCompleted();
              focusNewTodo();
            }}
          />
        </>
      )}
    </div>
  );
}
