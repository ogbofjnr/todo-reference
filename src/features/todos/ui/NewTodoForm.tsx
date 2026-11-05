import { type Ref, useId, useState } from 'react';

import { validateTitle } from '../domain/todo';
import { titleErrorMessage } from './title-error-message';

interface NewTodoFormProps {
  readonly onAdd: (title: string) => void;
  /** Lets the page return focus here after the focused item is deleted. */
  readonly inputRef: Ref<HTMLInputElement>;
}

export function NewTodoForm({ onAdd, inputRef }: NewTodoFormProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  return (
    <form
      noValidate
      className="flex flex-col gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        const result = validateTitle(value);
        if (!result.ok) {
          setError(titleErrorMessage(result.error));
          return;
        }
        onAdd(result.title);
        setValue('');
      }}
    >
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        New task
      </label>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          id={inputId}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          placeholder="What needs to be done?"
          autoComplete="off"
          aria-invalid={error !== null}
          aria-describedby={error === null ? undefined : errorId}
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 focus-visible:outline-2 focus-visible:outline-blue-600 aria-invalid:border-red-600"
        />
        <button
          type="submit"
          className="rounded-md bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Add
        </button>
      </div>
      {error !== null && (
        <p id={errorId} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
