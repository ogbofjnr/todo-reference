import type { MouseEvent } from 'react';

import { type Filter, FILTERS } from '../domain/todo-list';

interface TodoFooterProps {
  readonly activeCount: number;
  readonly completedCount: number;
  readonly filter: Filter;
  readonly hrefFor: (filter: Filter) => string;
  readonly onFilterChange: (filter: Filter) => void;
  readonly onClearCompleted: () => void;
}

const FILTER_LABELS: Record<Filter, string> = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
};

/** Let the browser handle new-tab / new-window clicks; handle plain clicks in-app. */
function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function TodoFooter({
  activeCount,
  completedCount,
  filter,
  hrefFor,
  onFilterChange,
  onClearCompleted,
}: TodoFooterProps) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 text-sm">
      <p>
        <strong>{activeCount}</strong> {activeCount === 1 ? 'item' : 'items'} left
      </p>
      <nav aria-label="Filter tasks">
        <ul className="flex gap-1">
          {FILTERS.map((value) => (
            <li key={value}>
              <a
                href={hrefFor(value)}
                aria-current={value === filter ? 'page' : undefined}
                onClick={(event) => {
                  if (!isPlainClick(event)) return;
                  event.preventDefault();
                  onFilterChange(value);
                }}
                className="rounded px-2 py-1 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 aria-[current=page]:bg-blue-50 aria-[current=page]:font-semibold aria-[current=page]:text-blue-800"
              >
                {FILTER_LABELS[value]}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {completedCount > 0 && (
        <button
          type="button"
          onClick={onClearCompleted}
          className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          Clear completed
        </button>
      )}
    </footer>
  );
}
