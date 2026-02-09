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
      ".next/**",
      "node_modules/**",
      "out/**",
      "public/**",
      "auth/**",
      "data_management/**",
      "scripts/**/*.js",
      "*.config.js",
      "*.config.mjs",
      "copy-assets.js",
      "jest.env.setup.js",
      "src/pages/centre-aide-pilote-2/**",
    ],
  },

  // Configuration de base JS
  js.configs.recommended,

  // Configuration TypeScript
  ...tseslint.configs.recommended,

  // Configuration React
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],

  // Configuration Prettier (doit etre en dernier pour overrider les autres)
  prettierConfig,

  // Configuration principale pour tous les fichiers TS/TSX
  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": jsxA11yPlugin,
      import: fixupPluginRules(importPlugin),
      sonarjs: sonarjsPlugin,
      "simple-import-sort": simpleImportSortPlugin,
      "no-relative-import-paths": noRelativeImportPathsPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    rules: {
      // Next.js rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // React Hooks
      ...reactHooksPlugin.configs.recommended.rules,

      // JSX A11y
      ...jsxA11yPlugin.configs.recommended.rules,
      "jsx-a11y/label-has-associated-control": "off",

      // SonarJS
      ...sonarjsPlugin.configs.recommended.rules,
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-nested-template-literals": "off",
      "sonarjs/no-small-switch": "off",
      "sonarjs/no-duplicate-string": "off",
      // Disable sonarjs v2 rules that weren't in v1 recommended
      "sonarjs/class-name": "off",
      "sonarjs/no-nested-conditional": "off",
      "sonarjs/prefer-read-only-props": "off",
      "sonarjs/no-primitive-wrappers": "off",
      "sonarjs/different-types-comparison": "off",
      "sonarjs/todo-tag": "off",
      "sonarjs/deprecation": "off",
      "sonarjs/function-return-type": "off",
      "sonarjs/no-misleading-array-reverse": "off",
      "sonarjs/no-alphabetical-sort": "off",
      "sonarjs/use-type-alias": "off",
      "sonarjs/slow-regex": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/no-selector-parameter": "off",
      "sonarjs/sonar-prefer-read-only-props": "off",
      "sonarjs/sonar-no-unused-vars": "off",
      "sonarjs/no-redundant-assignments": "off",
      "sonarjs/redundant-type-aliases": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/no-ignored-exceptions": "off",
      "sonarjs/fixme-tag": "off",
      "sonarjs/unused-import": "off",
      "sonarjs/no-skipped-tests": "off",
      "sonarjs/no-inverted-boolean-check": "off",
      "sonarjs/no-dead-store": "off",
      "sonarjs/content-length": "off",
      "sonarjs/concise-regex": "off",

      // Disable rules that TypeScript handles or that weren't in old config
      "no-undef": "off",
      "prefer-const": "off",
      "no-extra-boolean-cast": "off",
      "no-useless-escape": "off",
      "no-irregular-whitespace": "off",
      "no-async-promise-executor": "off",

      // TypeScript
      "@typescript-eslint/dot-notation": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "allow",
          filter: {
            regex: "^(_+|[A-Za-z]+_[A-Z][a-z]+)$",
            match: false,
          },
        },
      ],

      // Import
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/*.test.{ts,tsx}",
            "**/*.spec.{ts,tsx}",
            "./jest.setup.ts",
            "src/server/infrastructure/test/global.d.ts",
            "./playwright.config.ts",
            "tests/**/*.ts",
          ],
          optionalDependencies: false,
        },
      ],
      "import/order": [
        "error",
        {
          groups: [
            "external",
            "builtin",
            "internal",
            "sibling",
            "parent",
            "index",
          ],
        },
      ],

      // No relative import paths
      "no-relative-import-paths/no-relative-import-paths": [
        "warn",
        {
          allowSameFolder: true,
          rootDir: "src",
          prefix: "@",
        },
      ],

      // Custom rules
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/’/]",
          message:
            "Utilisation interdite de l'apostrophe typographique. Utilisez ' à la place.",
        },
        {
          selector: "JSXText[value=/’/]",
          message:
            "Évitez d'utiliser l'apostrophe typographique dans le texte JSX. Utilisez ' à la place.",
        },
      ],
      "no-console": "error",
      "no-unused-vars": "off",

      // React rules (desactivation des regles trop strictes)
      "react/jsx-handler-names": "off",
      "react/jsx-no-bind": "off",
      "react/jsx-no-literals": "off",
      "react/destructuring-assignment": "off",
      "react/forbid-component-props": "off",
      "react/require-default-props": "off",
      "react/jsx-max-depth": "off",
      "react/function-component-definition": "off",
      "react/no-unescaped-entities": "off",
      "react/jsx-props-no-spreading": "off",
      "react/no-array-index-key": "off",
      "react/prefer-read-only-props": "off",
      "react/no-multi-comp": "off",
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",

      // Prettier
      "prettier/prettier": "error",
    },
  },

  // Configuration specifique pour les fichiers de test
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    plugins: {
      jest: jestPlugin,
      "testing-library": testingLibraryPlugin,
    },
    rules: {
      ...jestPlugin.configs["flat/recommended"].rules,
      ...testingLibraryPlugin.configs["flat/react"].rules,
      // Disable rules not in old config to avoid mass pre-existing errors
      "testing-library/prefer-screen-queries": "off",
      "testing-library/no-node-access": "off",
      "testing-library/no-render-in-lifecycle": "off",
      "testing-library/no-wait-for-side-effects": "off",
      "jest/expect-expect": "off",
      "jest/valid-title": "off",
      "jest/no-conditional-expect": "off",
    },
  },

  // Configuration pour les scripts
  {
    files: ["scripts/**/*.{ts,tsx}"],
    rules: {
      "no-console": "off",
    },
  },
);
