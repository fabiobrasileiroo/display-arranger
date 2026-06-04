import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // dist (frontend build) and src-tauri (Rust crate + generated build assets).
  globalIgnores(['dist', 'src-tauri']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // We intentionally kick off data loading (queryOutputs/listProfiles) from
      // a mount effect; the state updates happen in async callbacks. This rule
      // false-positives on that common pattern.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // shadcn/ui primitives export a component plus its `*Variants` helper from
    // the same file by design — that's fine, just not fast-refresh-friendly.
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
])
