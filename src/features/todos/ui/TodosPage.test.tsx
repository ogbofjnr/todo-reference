import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLocalStorageTodoRepository } from '../data/local-storage-todo-repository';
import type { TodoRepository } from '../data/todo-repository';
import { createTodo, TITLE_MAX_LENGTH, toggleTodo } from '../domain/todo';
import { TodoRepositoryContext } from '../model/todo-repository-context';
import { TodosPage } from './TodosPage';

/** Renders inside act() so React flushes the initial `use(promise)` before assertions. */
async function renderTodos(
  repository: TodoRepository = createLocalStorageTodoRepository(localStorage),
) {
  const user = userEvent.setup();
  const result = await act(() =>
    render(
      <TodoRepositoryContext value={repository}>
        <TodosPage />
      </TodoRepositoryContext>,
    ),
  );
  return { user, repository, ...result };
}

async function seed(...titles: string[]) {
  const repository = createLocalStorageTodoRepository(localStorage);
  for (const [index, title] of titles.entries()) {
    await repository.save(createTodo(String(index), title));
  }
  return repository;
}

const newTaskInput = () => screen.findByRole('textbox', { name: 'New task' });
const taskList = () => screen.getByRole('list', { name: 'Tasks' });
const taskNames = () =>
  within(taskList())
    .getAllByRole('checkbox')
    .map((checkbox) => checkbox.closest('li')?.textContent ?? '');

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('TodosPage', () => {
  it('shows a loading state, then the empty state', async () => {
    const { promise, resolve } = Promise.withResolvers<readonly []>();
    await renderTodos({ ...(await seed()), list: () => promise });
    expect(screen.getByRole('status')).toHaveTextContent('Loading tasks…');

    await act(async () => {
      resolve([]);
      await promise;
    });
    expect(screen.getByText(/Nothing to do yet/)).toBeInTheDocument();
  });

  describe('adding', () => {
    it('adds a trimmed task, clears the input and announces it', async () => {
      const { user, repository } = await renderTodos();
      await user.type(await newTaskInput(), '  Buy milk  {Enter}');

      expect(screen.getByRole('checkbox', { name: 'Buy milk' })).not.toBeChecked();
      expect(await newTaskInput()).toHaveValue('');
      expect(screen.getByText('item', { exact: false })).toHaveTextContent('1 item left');
      expect(await screen.findByText('Added “Buy milk”.')).toBeInTheDocument();
      await expect(repository.list()).resolves.toMatchObject([{ title: 'Buy milk' }]);
    });

    it('rejects an empty task with an accessible error', async () => {
      const { user } = await renderTodos();
      const input = await newTaskInput();
      await user.type(input, '   ');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      expect(input).toBeInvalid();
      expect(input).toHaveAccessibleDescription('Task can’t be empty.');
      expect(screen.queryByRole('list', { name: 'Tasks' })).not.toBeInTheDocument();

      await user.type(input, 'x');
      expect(input).toBeValid();
    });

    it('rejects a task over the length limit and keeps the input', async () => {
      const { user } = await renderTodos();
      const input = await newTaskInput();
      const tooLong = 'a'.repeat(TITLE_MAX_LENGTH + 1);
      await user.click(input);
      await user.paste(tooLong);
      await user.keyboard('{Enter}');

      expect(input).toHaveAccessibleDescription(
        `Task must be at most ${String(TITLE_MAX_LENGTH)} characters.`,
      );
      expect(input).toHaveValue(tooLong);
    });
  });

  it('toggles a task and updates the counter', async () => {
    const { user } = await renderTodos(await seed('Write docs', 'Ship'));
    const checkbox = await screen.findByRole('checkbox', { name: 'Write docs' });

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByText('item', { exact: false })).toHaveTextContent('1 item left');

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText('items', { exact: false })).toHaveTextContent('2 items left');
  });

  describe('inline editing', () => {
    it('renames with Enter and returns focus to the Edit button', async () => {
      const { user } = await renderTodos(await seed('Draft'));
      await user.click(await screen.findByRole('button', { name: 'Edit “Draft”' }));

      const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'Edit “Draft”' });
      expect(input).toHaveFocus();
      expect([input.selectionStart, input.selectionEnd]).toEqual([0, 'Draft'.length]);
      await user.clear(input);
      await user.type(input, 'Final{Enter}');

      expect(screen.getByRole('checkbox', { name: 'Final' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit “Final”' })).toHaveFocus();
    });

    it('cancels with Escape without saving', async () => {
      const { user } = await renderTodos(await seed('Keep me'));
      await user.click(await screen.findByRole('button', { name: 'Edit “Keep me”' }));
      await user.type(screen.getByRole('textbox', { name: 'Edit “Keep me”' }), ' changed{Escape}');

      expect(screen.getByRole('checkbox', { name: 'Keep me' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit “Keep me”' })).toHaveFocus();
    });

    it('keeps editing when the new title is invalid', async () => {
      const { user } = await renderTodos(await seed('Task'));
      await user.click(await screen.findByRole('button', { name: 'Edit “Task”' }));
      const input = screen.getByRole('textbox', { name: 'Edit “Task”' });
      await user.clear(input);
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(input).toHaveAccessibleDescription('Task can’t be empty.');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.getByRole('checkbox', { name: 'Task' })).toBeInTheDocument();
    });
  });

  it('deletes a task and moves focus to the new-task input', async () => {
    const { user } = await renderTodos(await seed('Delete me', 'Stay'));
    await user.click(await screen.findByRole('button', { name: 'Delete “Delete me”' }));

    expect(taskNames()).toEqual([expect.stringContaining('Stay')]);
    expect(await newTaskInput()).toHaveFocus();
    expect(await screen.findByText('Deleted “Delete me”.')).toBeInTheDocument();
  });

  it('clears completed tasks; the button only shows when there are any', async () => {
    const repository = await seed('Done', 'Todo');
    await repository.save(toggleTodo(createTodo('0', 'Done')));
    const { user } = await renderTodos(repository);

    await user.click(await screen.findByRole('button', { name: 'Clear completed' }));

    expect(taskNames()).toEqual([expect.stringContaining('Todo')]);
    expect(screen.queryByRole('button', { name: 'Clear completed' })).not.toBeInTheDocument();
    expect(await screen.findByText('Cleared 1 completed task.')).toBeInTheDocument();
  });

  describe('filters', () => {
    async function seedMixed() {
      const repository = await seed('Active one', 'Done one');
      await repository.save(toggleTodo(createTodo('1', 'Done one')));
      return repository;
    }

    it('filters via links and stores the filter in the URL', async () => {
      const { user } = await renderTodos(await seedMixed());
      const nav = await screen.findByRole('navigation', { name: 'Filter tasks' });

      await user.click(within(nav).getByRole('link', { name: 'Completed' }));
      expect(window.location.search).toBe('?filter=completed');
      expect(within(nav).getByRole('link', { name: 'Completed' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(taskNames()).toEqual([expect.stringContaining('Done one')]);

      await user.click(within(nav).getByRole('link', { name: 'All' }));
      expect(window.location.search).toBe('');
      expect(taskNames()).toHaveLength(2);
    });

    it('reads the initial filter from the URL and shows a filter-specific empty state', async () => {
      window.history.replaceState(null, '', '/?filter=active');
      const repository = await seed('Only');
      await repository.save(toggleTodo(createTodo('0', 'Only')));
      await renderTodos(repository);

      expect(await screen.findByText('No active tasks. Nice work!')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Active' })).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('optimistic updates', () => {
    it('shows a change before it is saved and rolls it back if saving fails', async () => {
      let rejectSave: (reason: Error) => void = () => undefined;
      const repository: TodoRepository = {
        list: () => Promise.resolve([]),
        save: vi.fn(
          () =>
            new Promise<void>((_, reject) => {
              rejectSave = reject;
            }),
        ),
        remove: () => Promise.resolve(),
      };
      const { user } = await renderTodos(repository);

      await user.type(await newTaskInput(), 'Flaky{Enter}');
      expect(screen.getByRole('checkbox', { name: 'Flaky' })).toBeInTheDocument();

      await act(async () => {
        rejectSave(new Error('offline'));
        await Promise.resolve();
      });

      expect(screen.queryByRole('checkbox', { name: 'Flaky' })).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Couldn’t add “Flaky”. Please try again.',
      );

      await user.click(screen.getByRole('button', { name: 'Dismiss' }));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('restores a deleted task when the removal fails', async () => {
      const base = await seed('Precious');
      const repository: TodoRepository = {
        ...base,
        remove: () => Promise.reject(new Error('offline')),
      };
      const { user } = await renderTodos(repository);

      await user.click(await screen.findByRole('button', { name: 'Delete “Precious”' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t delete “Precious”.');
      expect(await screen.findByRole('checkbox', { name: 'Precious' })).toBeInTheDocument();
    });
  });

  it('shows a load error and recovers on retry', async () => {
    const list = vi
      .fn<TodoRepository['list']>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([createTodo('1', 'Recovered')]);
    // React logs errors caught by error boundaries; keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { user } = await renderTodos({ ...(await seed()), list });

    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load your tasks.');
    // The retry suspends on a fresh promise; act() lets React flush its resolution.
    await act(() => user.click(screen.getByRole('button', { name: 'Try again' })));

    expect(await screen.findByRole('checkbox', { name: 'Recovered' })).toBeInTheDocument();
  });

  it('persists tasks across reloads', async () => {
    const { user, unmount } = await renderTodos();
    await user.type(await newTaskInput(), 'Remember me{Enter}');
    await screen.findByText('Added “Remember me”.');
    unmount();

    await renderTodos();
    expect(await screen.findByRole('checkbox', { name: 'Remember me' })).toBeInTheDocument();
  });
});
