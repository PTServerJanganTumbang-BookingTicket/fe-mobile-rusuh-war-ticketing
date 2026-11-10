/**
 * Commitlint configuration with custom parser for project commit format:
 * [GH-<number>][Rosyid] <type>(<scope>): <description>
 *
 * Requirements:
 * - Prefix: [GH-<number>][Rosyid] is REQUIRED
 * - Actor: Must be "Rosyid" (case-sensitive)
 * - Type: Must be one of: feat, fix, chore, docs, refactor, test
 * - Scope: Required, wrapped in parentheses
 * - Description: Required, following the colon
 */

module.exports = {
  // Custom parser to handle [GH-<n>][Actor] prefix
  parserPreset: {
    parserOpts: {
      // Custom header pattern to extract type, scope, and subject
      // from: [GH-<n>][Actor] type(scope): description
      headerPattern:
        /^\[GH-(\d+)\]\[(\w+)\] (feat|fix|chore|docs|refactor|test)\(([^)]+)\): (.+)$/,
      headerCorrespondence: [
        "ticket",
        "actor",
        "type",
        "scope",
        "subject",
      ],
    },
  },

  plugins: [
    {
      rules: {
        // Custom rule to validate actor is exactly "Rosyid"
        "actor-rosyid": (parsed) => {
          const { actor } = parsed;
          if (!actor) {
            return [
              false,
              `Commit message must start with [GH-<number>][Rosyid]`,
            ];
          }
          if (actor !== "Rosyid") {
            return [
              false,
              `Actor must be "Rosyid", got "${actor}"`,
            ];
          }
          return [true, ""];
        },

        // Custom rule to validate ticket number exists
        "ticket-present": (parsed) => {
          const { ticket } = parsed;
          if (!ticket) {
            return [
              false,
              `Commit message must include ticket number [GH-<number>]`,
            ];
          }
          return [true, ""];
        },
      },
    },
  ],

  rules: {
    // Validate actor is Rosyid
    "actor-rosyid": [2, "always"],

    // Validate ticket is present
    "ticket-present": [2, "always"],

    // Ensure type is one of the allowed values
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "chore", "docs", "refactor", "test"],
    ],

    // Type must not be empty (enforced by pattern)
    "type-empty": [2, "never"],

    // Scope must not be empty
    "scope-empty": [2, "never"],

    // Subject must not be empty
    "subject-empty": [2, "never"],

    // No max line length for header (project allows longer headers)
    "header-max-length": [0],

    // Subject should be lowercase (warning only)
    "subject-case": [1, "always", "lower-case"],
  },
};
