import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".expo/**",
      "coverage/**",
      "*.config.js",
      "*.config.mjs",
      "babel.config.js",
      "metro.config.js",
      "tailwind.config.js",
    ],
  },

  // Base TypeScript configuration
  ...tseslint.configs.recommended,

  // React configuration
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      // React rules
      "react/react-in-jsx-scope": "off", // Not needed in React 17+
      "react/prop-types": "off", // Using TypeScript
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",

      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // General rules
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // Prettier must be last to override conflicting rules
  prettierConfig
);
