/**
 * Register Types Re-export
 *
 * GH-6: Registration-related types.
 * This file exists for symmetry with design.md task list.
 * Actual types are in auth-user.types.ts to avoid duplication.
 *
 * @module features/auth/domain
 */

export type {
  RegisterParams,
  RegisterConsent,
  RegisterResult,
} from "./auth-user.types";
