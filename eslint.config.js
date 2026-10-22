// ESLint covers the browser scripts and plain JS tooling. TypeScript sources
// are checked by `tsc --noEmit` (strict, no unused locals or parameters).
export default [
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', '**/*.ts'] },
  {
    files: ['public/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: { window: 'readonly', document: 'readonly', FormData: 'readonly', fetch: 'readonly', Date: 'readonly' },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      eqeqeq: 'error',
      'no-var': 'off',
      strict: ['error', 'function'],
    },
  },
  {
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module', globals: { console: 'readonly', process: 'readonly' } },
    rules: { 'no-undef': 'error', 'no-unused-vars': 'error', eqeqeq: 'error' },
  },
];
