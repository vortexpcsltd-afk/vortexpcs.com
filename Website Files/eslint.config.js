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
      "backups/**",
      "api/**",
      "backend-examples/**",
      "scripts/**",
      "App_backup.tsx",
      "App_original.tsx",
      "backup-before-figma/**",
      "archive/**",
      "**/*.backup.tsx",
      "components/VisualPCConfigurator.backup.tsx",
      "src/test/**",
      "**/*.test.ts",
      "**/*.test.tsx",
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
      "utils/envGuard.ts",
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
      "no-console": ["warn", { allow: ["warn", "error"] }],
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
      globals: { ...globals.browser, JSX: "readonly" },
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
      "no-console": ["warn", { allow: ["warn", "error"] }],
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
