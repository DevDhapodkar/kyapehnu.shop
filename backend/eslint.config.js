import js from '@eslint/js';

/**
 * Minimal flat ESLint config for the backend (ESM, Node). Keeps the gate
 * meaningful without being noisy: recommended correctness rules, plus a guard
 * against leftover debugging. Test files may use the Node test globals.
 */
export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        // Node 18+ web globals used by the Cloudinary upload path.
        fetch: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    ignores: ['node_modules/**'],
  },
];
