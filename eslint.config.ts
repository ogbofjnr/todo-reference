import js from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Rationale for every block lives in docs/adr/0006-linting-and-formatting.md.
export default defineConfig(
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results']),

  // --- Baseline: JS + type-aware TypeScript --------------------------------
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      // `as` silences the compiler; allow it only behind an explained eslint-disable.
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // TODOs rot. Open an issue instead.
      'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'xxx', 'hack'] }],
      'no-console': 'error',
      // Native dialogs block the page and can't be styled or made accessible: use in-page UI.
      'no-alert': 'error',
      eqeqeq: 'error',
    },
  },

  // Every eslint-disable must name its rule and say why.
  eslintComments.recommended,
  {
    rules: {
      '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],
      '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
    },
  },

  // Deterministic import order (autofixable).
  {
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },

  // --- React application code ---------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      // Includes the React Compiler rules (purity, refs, set-state-in-render, ...).
      reactHooks.configs.flat['recommended-latest'],
      jsxA11y.flatConfigs.strict,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
  },

  // --- Architecture: layer boundaries --------------------------------------
  // app -> features -> shared. Features never import each other. See docs/ARCHITECTURE.md.
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.app.json' } },
      'boundaries/legacy-templates': false,
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app' },
        { type: 'feature', pattern: 'src/features/*', capture: ['featureName'] },
        { type: 'shared', pattern: 'src/shared' },
        { type: 'test-support', pattern: 'src/test' },
      ],
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: { to: { element: { types: ['app', 'feature', 'shared'] } } },
            },
            {
              from: { element: { type: 'feature' } },
              allow: {
                to: [
                  { element: { type: 'shared' } },
                  {
                    element: {
                      type: 'feature',
                      captured: { featureName: '{{ from.element.captured.featureName }}' },
                    },
                  },
                ],
              },
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } },
            },
            {
              from: { element: { type: 'test-support' } },
              allow: { to: { element: { types: ['shared', 'test-support'] } } },
            },
          ],
        },
      ],
      // A feature is consumed only through its public API (index.ts).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*', '**/features/*/*'],
              message: 'Import a feature through its public API: @/features/<name>.',
            },
          ],
        },
      ],
    },
  },

  // --- Node-side files (configs, e2e) --------------------------------------
  {
    files: ['*.config.ts', 'e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },

  // Must stay last: turns off stylistic rules that Prettier owns.
  prettier,
);
