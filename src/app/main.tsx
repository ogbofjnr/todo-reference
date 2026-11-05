import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { createLocalStorageTodoRepository, withSimulatedNetwork } from '@/features/todos';
import { parseEnv } from '@/shared/config/env';

import { App } from './App';

// Composition root: the only place that knows which implementations are used.
// parseEnv throws a readable error at startup if the build-time environment is invalid.
const env = parseEnv(import.meta.env);

const todoRepository = withSimulatedNetwork(createLocalStorageTodoRepository(window.localStorage), {
  latencyMs: env.VITE_SIMULATED_LATENCY_MS,
  failureRate: env.VITE_SIMULATED_FAILURE_RATE,
});

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App todoRepository={todoRepository} />
  </StrictMode>,
);
