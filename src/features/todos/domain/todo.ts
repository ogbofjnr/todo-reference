export interface Todo {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
}

export const TITLE_MAX_LENGTH = 200;

type TitleError = 'empty' | 'too-long';

export type TitleValidation =
  | { readonly ok: true; readonly title: string }
  | { readonly ok: false; readonly error: TitleError };

/** Normalises user input into a valid title, or explains why it is not one. */
export function validateTitle(input: string): TitleValidation {
  const title = input.trim();
  if (title.length === 0) return { ok: false, error: 'empty' };
  if (title.length > TITLE_MAX_LENGTH) return { ok: false, error: 'too-long' };
  return { ok: true, title };
}

export function createTodo(id: string, title: string): Todo {
  return { id, title, completed: false };
}

export function toggleTodo(todo: Todo): Todo {
  return { ...todo, completed: !todo.completed };
}

export function renameTodo(todo: Todo, title: string): Todo {
  return { ...todo, title };
}
