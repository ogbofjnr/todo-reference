import { type TodoRepository, TodoRepositoryContext, TodosPage } from '@/features/todos';

interface AppProps {
  readonly todoRepository: TodoRepository;
}

export function App({ todoRepository }: AppProps) {
  return (
    <TodoRepositoryContext value={todoRepository}>
      <main className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">Todos</h1>
        <TodosPage />
      </main>
    </TodoRepositoryContext>
  );
}
