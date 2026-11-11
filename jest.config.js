/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Direct component imports (used in wrapper module)
    "^signal-ui-react-shared/components/Button$":
      "<rootDir>/__mocks__/signal-ui-react-shared/components/Button.tsx",
    "^signal-ui-react-shared/components/Text$":
      "<rootDir>/__mocks__/signal-ui-react-shared/components/Text.tsx",
    "^signal-ui-react-shared/components/TextField$":
      "<rootDir>/__mocks__/signal-ui-react-shared/components/TextField.tsx",
    // Barrel import (for type exports)
    "^signal-ui-react-shared$": "<rootDir>/__mocks__/signal-ui-react-shared.tsx",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind)",
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/__tests__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["lcov", "text", "text-summary"],
};
