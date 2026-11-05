import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { parseEnv } from '@/shared/config/env';

import { App } from './App';

// Composition root. parseEnv throws a readable error at startup if the build-time
// environment is invalid.
parseEnv(import.meta.env);

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
