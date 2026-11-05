import { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import type { Todo } from '../domain/todo';
import { secondaryButtonClass } from './class-names';
import { TodoEditForm } from './TodoEditForm';

interface TodoItemProps {
  readonly todo: Todo;
  readonly onToggle: (todo: Todo) => void;
  readonly onRename: (todo: Todo, title: string) => void;
  readonly onRemove: (todo: Todo) => void;
}

export function TodoItem({ todo, onToggle, onRename, onRemove }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const checkboxId = useId();

  // flushSync commits the DOM change first, so focus can move to the element just rendered.
  function startEditing(): void {
    flushSync(() => {
      setIsEditing(true);
    });
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  function stopEditing(): void {
    flushSync(() => {
      setIsEditing(false);
    });
    editButtonRef.current?.focus();
  }

  if (isEditing) {
    return (
      <li className="py-2">
        <TodoEditForm
          title={todo.title}
          inputRef={inputRef}
          onCancel={stopEditing}
          onSave={(title) => {
            if (title !== todo.title) onRename(todo, title);
            stopEditing();
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 py-2">
      <input
        id={checkboxId}
        type="checkbox"
        checked={todo.completed}
        onChange={() => {
          onToggle(todo);
        }}
        className="size-5 accent-blue-700"
      />
      <label
        htmlFor={checkboxId}
        className={`flex-1 break-words ${todo.completed ? 'text-slate-500 line-through' : ''}`}
      >
        {todo.title}
      </label>
      <button
        ref={editButtonRef}
        type="button"
        className={secondaryButtonClass}
        aria-label={`Edit “${todo.title}”`}
        onClick={startEditing}
      >
        Edit
      </button>
      <button
        type="button"
        className={secondaryButtonClass}
        aria-label={`Delete “${todo.title}”`}
        onClick={() => {
          onRemove(todo);
        }}
      >
        Delete
      </button>
    </li>
  );
}
