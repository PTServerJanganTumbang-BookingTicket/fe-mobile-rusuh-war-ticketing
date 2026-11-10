import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginBoundaries from "eslint-plugin-boundaries";
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
      "jest.setup.js",
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

  // Boundaries configuration for Clean Architecture enforcement
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      boundaries: pluginBoundaries,
    },
    settings: {
      "boundaries/include": ["src/**/*"],
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
      "boundaries/elements": [
        // Feature domain layer - must come first for proper capture
        {
          type: "feature-domain",
          pattern: "src/features/*/domain",
          capture: ["feature"],
        },
        // Feature data layer
        {
          type: "feature-data",
          pattern: "src/features/*/data",
          capture: ["feature"],
        },
        // Feature presentation layer
        {
          type: "feature-presentation",
          pattern: "src/features/*/presentation",
          capture: ["feature"],
        },
        // Feature root (public API via index.ts barrel)
        {
          type: "feature-api",
          pattern: "src/features/*",
          capture: ["feature"],
        },
        // App layer - composition root, routes only
        {
          type: "app",
          pattern: "src/app",
        },
        // Core domain layer - business entities and interfaces
        {
          type: "core-domain",
          pattern: "src/core/domain",
        },
        // Core data layer - repositories, API clients
        {
          type: "core-data",
          pattern: "src/core/data",
        },
        // Core presentation layer - shared UI components
        {
          type: "core-presentation",
          pattern: "src/core/presentation",
        },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            // App layer can import from:
            // - feature APIs (via index.ts barrel exports)
            // - core presentation (shared components)
            // - core domain (types/interfaces)
            {
              from: { element: { type: "app" } },
              allow: [
                { to: { element: { type: "feature-api" } } },
                { to: { element: { type: "core-presentation" } } },
                { to: { element: { type: "core-domain" } } },
              ],
            },

            // Core domain: no internal dependencies (pure business logic)
            {
              from: { element: { type: "core-domain" } },
              allow: [],
            },

            // Core data: can depend on core domain only
            {
              from: { element: { type: "core-data" } },
              allow: [{ to: { element: { type: "core-domain" } } }],
            },

            // Core presentation: can depend on core domain only
            {
              from: { element: { type: "core-presentation" } },
              allow: [{ to: { element: { type: "core-domain" } } }],
            },

            // Feature API (root level, index.ts): can export from its own layers
            {
              from: { element: { type: "feature-api" } },
              allow: [
                {
                  to: {
                    element: {
                      type: "feature-domain",
                      captured: { feature: "{{from.feature}}" },
                    },
                  },
                },
                {
                  to: {
                    element: {
                      type: "feature-data",
                      captured: { feature: "{{from.feature}}" },
                    },
                  },
                },
                {
                  to: {
                    element: {
                      type: "feature-presentation",
                      captured: { feature: "{{from.feature}}" },
                    },
                  },
                },
              ],
            },

            // Feature domain: only core domain (for shared interfaces)
            {
              from: { element: { type: "feature-domain" } },
              allow: [{ to: { element: { type: "core-domain" } } }],
            },

            // Feature data: feature's own domain + core domain + core data
            {
              from: { element: { type: "feature-data" } },
              allow: [
                {
                  to: {
                    element: {
                      type: "feature-domain",
                      captured: { feature: "{{from.feature}}" },
                    },
                  },
                },
                { to: { element: { type: "core-domain" } } },
                { to: { element: { type: "core-data" } } },
              ],
            },

            // Feature presentation: feature's own domain + core domain + core presentation
            // NOTE: presentation CANNOT import from data layer directly
            {
              from: { element: { type: "feature-presentation" } },
              allow: [
                {
                  to: {
                    element: {
                      type: "feature-domain",
                      captured: { feature: "{{from.feature}}" },
                    },
                  },
                },
                { to: { element: { type: "core-domain" } } },
                { to: { element: { type: "core-presentation" } } },
              ],
            },
          ],
        },
      ],
      "boundaries/no-unknown-files": ["error"],
    },
  },

  // Prettier must be last to override conflicting rules
  prettierConfig
);
