import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

describe('parseEnv', () => {
  it('applies defaults when variables are absent', () => {
    expect(parseEnv({})).toEqual({ VITE_SIMULATED_LATENCY_MS: 0, VITE_SIMULATED_FAILURE_RATE: 0 });
  });

  it('coerces string values, as Vite provides them', () => {
    expect(
      parseEnv({ VITE_SIMULATED_LATENCY_MS: '250', VITE_SIMULATED_FAILURE_RATE: '0.5' }),
    ).toEqual({ VITE_SIMULATED_LATENCY_MS: 250, VITE_SIMULATED_FAILURE_RATE: 0.5 });
  });

  it('fails with a message naming the invalid variable', () => {
    expect(() => parseEnv({ VITE_SIMULATED_FAILURE_RATE: '2' })).toThrow(
      /VITE_SIMULATED_FAILURE_RATE/,
    );
  });
});
