import type { TodoRepository } from './todo-repository';

export interface SimulatedNetworkOptions {
  /** Delay added to every call, in milliseconds. */
  readonly latencyMs: number;
  /** Probability (0–1) that a write is rejected. Reads never fail. */
  readonly failureRate: number;
  /** Injectable for deterministic tests. */
  readonly random?: () => number;
}

export class SimulatedNetworkError extends Error {
  override name = 'SimulatedNetworkError';
}

/**
 * Decorator that makes a local repository behave like a remote one, so loading,
 * optimistic and rollback states can be seen during development.
 * With both options at 0 (the default config) it returns the repository untouched.
 */
export function withSimulatedNetwork(
  repository: TodoRepository,
  { latencyMs, failureRate, random = Math.random }: SimulatedNetworkOptions,
): TodoRepository {
  if (latencyMs === 0 && failureRate === 0) return repository;

  const delay = () =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, latencyMs);
    });

  async function write(operation: () => Promise<void>): Promise<void> {
    await delay();
    if (random() < failureRate) throw new SimulatedNetworkError('Simulated network failure');
    await operation();
  }

  return {
    list: async () => {
      await delay();
      return repository.list();
    },
    save: (todo) => write(() => repository.save(todo)),
    remove: (ids) => write(() => repository.remove(ids)),
  };
}
