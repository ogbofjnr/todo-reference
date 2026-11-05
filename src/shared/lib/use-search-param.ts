import { useSyncExternalStore } from 'react';

// history.pushState emits no event, so in-app navigations notify these listeners directly;
// popstate covers the browser's back/forward buttons.
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
  };
}

function getHref(): string {
  return window.location.href;
}

export interface SearchParam {
  readonly value: string | null;
  /** In-app URL (path + query + hash) with the parameter set to `value`, or removed for null. */
  readonly hrefWith: (value: string | null) => string;
  /** Navigates to `hrefWith(value)`, adding a history entry. */
  readonly setValue: (value: string | null) => void;
}

/**
 * One URL query parameter as React state: shareable, survives reloads and
 * follows back/forward navigation.
 */
export function useSearchParam(name: string): SearchParam {
  const href = useSyncExternalStore(subscribe, getHref);

  function hrefWith(value: string | null): string {
    const url = new URL(href);
    if (value === null) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
    return `${url.pathname}${url.search}${url.hash}`;
  }

  return {
    value: new URL(href).searchParams.get(name),
    hrefWith,
    setValue: (value) => {
      window.history.pushState(null, '', hrefWith(value));
      for (const listener of listeners) listener();
    },
  };
}
