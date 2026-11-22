import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
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
      // JSX usage (<motion.div>, <Illustration />) isn't seen by no-unused-vars without
      // eslint-plugin-react, so names used only in JSX are exempted here.
      'no-unused-vars': ['error', { varsIgnorePattern: '^(motion|[A-Z_])', argsIgnorePattern: '^[A-Z_]' }],
      // Context files export a provider plus its hook on purpose; only dev hot-reload is affected.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
])
