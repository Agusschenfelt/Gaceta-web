import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.skills', 'heardle-gaceta']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' }],
      // Best-effort calls (storage, media, ScrollTrigger) intentionally swallow errors
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Context providers co-locate their consumer hook; a full reload on edit is acceptable
      'react-refresh/only-export-components': ['error', { allowConstantExport: true, allowExportNames: ['useMenu', 'usePageTransition'] }],
    },
  },
])
