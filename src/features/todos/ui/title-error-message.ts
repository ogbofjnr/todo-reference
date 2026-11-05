import { TITLE_MAX_LENGTH, type TitleError } from '../domain/todo';

export function titleErrorMessage(error: TitleError): string {
  switch (error) {
    case 'empty':
      return 'Task can’t be empty.';
    case 'too-long':
      return `Task must be at most ${String(TITLE_MAX_LENGTH)} characters.`;
  }
}
