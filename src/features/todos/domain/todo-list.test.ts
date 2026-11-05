import { describe, expect, it } from 'vitest';

import { createTodo, type Todo, toggleTodo } from './todo';
import { applyChange, completedIds, countActive, filterTodos, parseFilter } from './todo-list';

const a = createTodo('a', 'A');
const b = toggleTodo(createTodo('b', 'B'));
const c = createTodo('c', 'C');
const todos: readonly Todo[] = [a, b, c];

describe('applyChange', () => {
  it('appends a todo with a new id', () => {
    const d = createTodo('d', 'D');
    expect(applyChange(todos, { type: 'save', todo: d })).toEqual([a, b, c, d]);
  });

  it('replaces a todo with an existing id in place', () => {
    const renamed = { ...b, title: 'B2' };
    expect(applyChange(todos, { type: 'save', todo: renamed })).toEqual([a, renamed, c]);
  });

  it('removes todos by id and ignores unknown ids', () => {
    expect(applyChange(todos, { type: 'remove', ids: ['a', 'c', 'zzz'] })).toEqual([b]);
  });

  it('never mutates its input', () => {
    const snapshot = structuredClone(todos);
    applyChange(todos, { type: 'save', todo: createTodo('d', 'D') });
    applyChange(todos, { type: 'remove', ids: ['a'] });
    expect(todos).toEqual(snapshot);
  });
});

describe('parseFilter', () => {
  it.each(['all', 'active', 'completed'] as const)('accepts %s', (value) => {
    expect(parseFilter(value)).toBe(value);
  });

  it.each([null, '', 'ACTIVE', 'done'])('falls back to all for %j', (value) => {
    expect(parseFilter(value)).toBe('all');
  });
});

describe('selectors', () => {
  it('filters by completion state', () => {
    expect(filterTodos(todos, 'all')).toEqual([a, b, c]);
    expect(filterTodos(todos, 'active')).toEqual([a, c]);
    expect(filterTodos(todos, 'completed')).toEqual([b]);
  });

  it('counts active todos', () => {
    expect(countActive(todos)).toBe(2);
    expect(countActive([])).toBe(0);
  });

  it('lists completed ids', () => {
    expect(completedIds(todos)).toEqual(['b']);
  });
});
