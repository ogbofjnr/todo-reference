import type { Todo } from '../domain/todo';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  readonly todos: readonly Todo[];
  readonly emptyMessage: string;
  readonly onToggle: (todo: Todo) => void;
  readonly onRename: (todo: Todo, title: string) => void;
  readonly onRemove: (todo: Todo) => void;
}

export function TodoList({ todos, emptyMessage, ...handlers }: TodoListProps) {
  if (todos.length === 0) return <p className="py-4 text-slate-500">{emptyMessage}</p>;

  return (
    <ul aria-label="Tasks" className="divide-y divide-slate-200">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} {...handlers} />
      ))}
    </ul>
  );
}
