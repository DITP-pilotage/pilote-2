import js from '@eslint/js';
import { fixupPluginRules } from '@eslint/compat';
import nextPlugin from '@next/eslint-plugin-next';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import jestPlugin from 'eslint-plugin-jest';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import noRelativeImportPathsPlugin from 'eslint-plugin-no-relative-import-paths';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Ignores globaux
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'public/**',
      '*.config.js',
      '*.config.mjs',
      'copy-assets.js',
      'src/pages/centre-aide-pilote-2/**',
    ],
  },

  // Configuration de base JS
  js.configs.recommended,

  // Configuration TypeScript
  ...tseslint.configs.recommended,

  // Configuration React
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],

  // Configuration Prettier (doit etre en dernier pour overrider les autres)
  prettierConfig,

  // Configuration principale pour tous les fichiers TS/TSX
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      import: fixupPluginRules(importPlugin),
      sonarjs: sonarjsPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      'no-relative-import-paths': noRelativeImportPathsPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // Next.js rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,

      // React Hooks
      ...reactHooksPlugin.configs.recommended.rules,

      // JSX A11y
      ...jsxA11yPlugin.configs.recommended.rules,
      'jsx-a11y/label-has-associated-control': 'off',

      // SonarJS
      ...sonarjsPlugin.configs.recommended.rules,
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      'sonarjs/no-small-switch': 'off',
      'sonarjs/no-duplicate-string': 'off',

      // TypeScript
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'function',
          format: ['camelCase', 'PascalCase'],
          leadingUnderscore: 'allow',
          filter: {
            regex: '^(_+|[A-Za-z]+_[A-Z][a-z]+)$',
            match: false,
          },
        },
      ],

      // Import
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.{ts,tsx}',
            '**/*.spec.{ts,tsx}',
            './jest.setup.ts',
            'src/server/infrastructure/test/global.d.ts',
            './playwright.config.ts',
            'tests/**/*.ts',
          ],
          optionalDependencies: false,
        },
      ],
      'import/order': [
        'error',
        {
          groups: ['external', 'builtin', 'internal', 'sibling', 'parent', 'index'],
        },
      ],

      // No relative import paths
      'no-relative-import-paths/no-relative-import-paths': [
        'warn',
        {
          allowSameFolder: true,
          rootDir: 'src',
          prefix: '@',
        },
      ],

      // Custom rules
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/'/]",
          message: "Utilisation interdite de l'apostrophe typographique. Utilisez ' à la place.",
        },
        {
          selector: "JSXText[value=/'/]",
          message: "Évitez d'utiliser l'apostrophe typographique dans le texte JSX. Utilisez ' à la place.",
        },
      ],
      'no-console': 'error',
      'no-unused-vars': 'off',

      // React rules (desactivation des regles trop strictes)
      'react/jsx-handler-names': 'off',
      'react/jsx-no-bind': 'off',
      'react/jsx-no-literals': 'off',
      'react/destructuring-assignment': 'off',
      'react/forbid-component-props': 'off',
      'react/require-default-props': 'off',
      'react/jsx-max-depth': 'off',
      'react/function-component-definition': 'off',
      'react/no-unescaped-entities': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/no-array-index-key': 'off',
      'react/prefer-read-only-props': 'off',
      'react/no-multi-comp': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',

      // Prettier
      'prettier/prettier': 'error',
    },
  },

  // Configuration specifique pour les fichiers de test
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    plugins: {
      jest: jestPlugin,
      'testing-library': testingLibraryPlugin,
    },
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
      ...testingLibraryPlugin.configs['flat/react'].rules,
    },
  },

  // Configuration pour les scripts
  {
    files: ['scripts/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  }
);
