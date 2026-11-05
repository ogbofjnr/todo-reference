import { type Ref, useId, useState } from 'react';

import { validateTitle } from '../domain/todo';
import { secondaryButtonClass } from './class-names';
import { titleErrorMessage } from './title-error-message';

interface TodoEditFormProps {
  readonly title: string;
  readonly onSave: (title: string) => void;
  readonly onCancel: () => void;
  readonly inputRef: Ref<HTMLInputElement>;
}

export function TodoEditForm({ title, onSave, onCancel, inputRef }: TodoEditFormProps) {
  const [draft, setDraft] = useState(title);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  return (
    <form
      noValidate
      className="flex flex-col gap-1"
      onSubmit={(event) => {
        event.preventDefault();
        const result = validateTitle(draft);
        if (result.ok) onSave(result.title);
        else setError(titleErrorMessage(result.error));
      }}
    >
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onCancel();
          }}
          aria-label={`Edit “${title}”`}
          aria-invalid={error !== null}
          aria-describedby={error === null ? undefined : errorId}
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 focus-visible:outline-2 focus-visible:outline-blue-600 aria-invalid:border-red-600"
        />
        <button type="submit" className={secondaryButtonClass}>
          Save
        </button>
        <button type="button" className={secondaryButtonClass} onClick={onCancel}>
          Cancel
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
