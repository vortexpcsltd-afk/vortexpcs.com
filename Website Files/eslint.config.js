import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "dist",
      "node_modules",
      "build",
      ".vite",
      "api/**",
      "backend-examples/**",
      "scripts/**",
      "App_backup.tsx",
      "App_original.tsx",
      "backup-before-figma/**",
    ],
  },
  // Configuration for Node.js backend/service files
  {
    files: [
      "vite.config.ts",
      "*.config.ts",
      "*.config.js",
      "services/email.ts",
      "api/**/*.{ts,js}",
      "backend-examples/**/*.{ts,js}",
      "scripts/**/*.{ts,js}",
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.node },
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  // Configuration for React/TypeScript files
  {
    files: ["**/*.{ts,tsx}"],
    ignores: [
      "*.config.ts",
      "services/email.ts",
      "api/**",
      "backend-examples/**",
      "scripts/**",
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
