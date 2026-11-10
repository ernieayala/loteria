// ESLint flat config (ESLint 10 + typescript-eslint), non-type-checked `recommended` preset. Strict
// TypeScript already covers the type-level checks; `no-undef` is off for TS per typescript-eslint.

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/build/**', '**/coverage/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.ts'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  {
    files: ['packages/server/**/*.ts', '*.js', '**/*.config.ts'],
    languageOptions: { globals: { ...globals.node } },
  },

  {
    files: ['packages/web/src/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
  },
);
