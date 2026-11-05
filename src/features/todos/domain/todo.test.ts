import { describe, expect, it } from 'vitest';

import { createTodo, renameTodo, TITLE_MAX_LENGTH, toggleTodo, validateTitle } from './todo';

describe('validateTitle', () => {
  it('trims surrounding whitespace', () => {
    expect(validateTitle('  Buy milk \n')).toEqual({ ok: true, title: 'Buy milk' });
  });

  it.each(['', '   ', '\t\n'])('rejects blank input %j', (input) => {
    expect(validateTitle(input)).toEqual({ ok: false, error: 'empty' });
  });

  it('accepts a title of exactly the maximum length', () => {
    const title = 'a'.repeat(TITLE_MAX_LENGTH);
    expect(validateTitle(title)).toEqual({ ok: true, title });
  });

  it('rejects a title over the maximum length', () => {
    expect(validateTitle('a'.repeat(TITLE_MAX_LENGTH + 1))).toEqual({
      ok: false,
      error: 'too-long',
    });
  });

  it('measures length after trimming', () => {
    expect(validateTitle(` ${'a'.repeat(TITLE_MAX_LENGTH)} `).ok).toBe(true);
  });
});

describe('todo operations', () => {
  const todo = createTodo('1', 'Write tests');

  it('creates an active todo', () => {
    expect(todo).toEqual({ id: '1', title: 'Write tests', completed: false });
  });

  it('toggles completion without mutating the original', () => {
    expect(toggleTodo(todo).completed).toBe(true);
    expect(toggleTodo(toggleTodo(todo)).completed).toBe(false);
    expect(todo.completed).toBe(false);
  });

  it('renames without touching other fields', () => {
    expect(renameTodo(todo, 'Ship it')).toEqual({ id: '1', title: 'Ship it', completed: false });
  });
});
