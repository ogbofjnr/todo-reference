import { act, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import { createLocalStorageTodoRepository } from '@/features/todos';

import { App } from './App';

it('renders the page with the injected repository', async () => {
  await act(() => render(<App todoRepository={createLocalStorageTodoRepository(localStorage)} />));

  expect(screen.getByRole('heading', { level: 1, name: 'Todos' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'New task' })).toBeInTheDocument();
});
