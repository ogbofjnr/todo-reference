import { useSearchParam } from '@/shared/lib/use-search-param';

import { type Filter, parseFilter } from '../domain/todo-list';

export interface TodoFilter {
  readonly filter: Filter;
  readonly hrefFor: (filter: Filter) => string;
  readonly setFilter: (filter: Filter) => void;
}

const toParam = (filter: Filter): string | null => (filter === 'all' ? null : filter);

/** The active filter lives in the URL (`?filter=active`); 'all' is the absence of the param. */
export function useTodoFilter(): TodoFilter {
  const { value, hrefWith, setValue } = useSearchParam('filter');
  return {
    filter: parseFilter(value),
    hrefFor: (filter) => hrefWith(toParam(filter)),
    setFilter: (filter) => {
      setValue(toParam(filter));
    },
  };
}
