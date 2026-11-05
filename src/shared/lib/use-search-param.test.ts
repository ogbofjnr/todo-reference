import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useSearchParam } from './use-search-param';

describe('useSearchParam', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('reads the current value from the URL', () => {
    window.history.replaceState(null, '', '/?filter=active');
    const { result } = renderHook(() => useSearchParam('filter'));
    expect(result.current.value).toBe('active');
  });

  it('builds hrefs that keep other parameters and the hash', () => {
    window.history.replaceState(null, '', '/list?x=1&filter=active#top');
    const { result } = renderHook(() => useSearchParam('filter'));
    expect(result.current.hrefWith('completed')).toBe('/list?x=1&filter=completed#top');
    expect(result.current.hrefWith(null)).toBe('/list?x=1#top');
  });

  it('pushes a history entry and re-renders on write', () => {
    const { result } = renderHook(() => useSearchParam('filter'));
    const before = window.history.length;

    act(() => {
      result.current.setValue('completed');
    });

    expect(result.current.value).toBe('completed');
    expect(window.location.search).toBe('?filter=completed');
    expect(window.history.length).toBe(before + 1);
  });

  it('follows back/forward navigation', () => {
    const { result } = renderHook(() => useSearchParam('filter'));
    act(() => {
      window.history.replaceState(null, '', '/?filter=active');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(result.current.value).toBe('active');
  });
});
