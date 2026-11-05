import { describe, expect, it, onTestFinished, vi } from 'vitest';

import { createTodo } from '../domain/todo';
import type { TodoRepository } from './todo-repository';
import { SimulatedNetworkError, withSimulatedNetwork } from './with-simulated-network';

function fakeRepository(): TodoRepository {
  return {
    list: vi.fn(() => Promise.resolve([])),
    save: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
  };
}

describe('withSimulatedNetwork', () => {
  it('returns the same repository when disabled', () => {
    const repository = fakeRepository();
    expect(withSimulatedNetwork(repository, { latencyMs: 0, failureRate: 0 })).toBe(repository);
  });

  it('delays calls by the configured latency', async () => {
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const repository = fakeRepository();
    const slow = withSimulatedNetwork(repository, { latencyMs: 500, failureRate: 0 });

    const saving = slow.save(createTodo('1', 'x'));
    await vi.advanceTimersByTimeAsync(499);
    expect(repository.save).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await saving;
    expect(repository.save).toHaveBeenCalledOnce();
  });

  it('fails writes when the random draw is below the failure rate', async () => {
    const repository = fakeRepository();
    const flaky = withSimulatedNetwork(repository, {
      latencyMs: 0,
      failureRate: 0.5,
      random: () => 0.4,
    });

    await expect(flaky.remove(['1'])).rejects.toBeInstanceOf(SimulatedNetworkError);
    expect(repository.remove).not.toHaveBeenCalled();
  });

  it('passes writes through when the draw is at or above the failure rate', async () => {
    const repository = fakeRepository();
    const flaky = withSimulatedNetwork(repository, {
      latencyMs: 0,
      failureRate: 0.5,
      random: () => 0.5,
    });

    await flaky.remove(['1']);
    expect(repository.remove).toHaveBeenCalledWith(['1']);
  });

  it('never fails reads', async () => {
    const flaky = withSimulatedNetwork(fakeRepository(), {
      latencyMs: 0,
      failureRate: 1,
      random: () => 0,
    });
    await expect(flaky.list()).resolves.toEqual([]);
  });
});
