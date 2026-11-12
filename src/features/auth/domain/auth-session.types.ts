/**
 * Auth Session Domain Types
 *
 * GH-6: Domain models for authenticated sessions.
 * Pure TypeScript - no React/React Native imports.
 *
 * Contract Evidence: api-contracts.md §1.3, §1.4
 * @module features/auth/domain
 */

import type { AccessToken } from "@/core/domain";

/**
 * Authenticated session domain model.
 * Represents a logged-in user with valid tokens.
 *
 * R3-AC6: DTO maps to domain AuthSession with typed tokens
 */
export interface AuthSession {
  /** JWT access token (from GH-5 core/domain branded type) */
  readonly accessToken: AccessToken;
  /** Token expiration timestamp */
  readonly expiresAt: Date;
  /** Authenticated user info */
  readonly user: AuthUser;
  /** Optional redirect context for booking recovery */
  readonly redirectContext?: RedirectContext;
}

/**
 * Authenticated user info.
 * Subset of account data returned on login.
 *
 * R3-AC2: Response DTO user includes id, email, nik? (masked)
 */
export interface AuthUser {
  /** User ID (usr_xxx format) */
  readonly id: string;
  /** User email address */
  readonly email: string;
  /** Masked NIK if registered, null otherwise */
  readonly nikMasked: string | null;
}

/**
 * Redirect context from active engagement.
 * Returned when user logs in with existing booking/queue position.
 *
 * R3-AC3: Response DTO optionally includes redirect_context for booking recovery
 */
export interface RedirectContext {
  /** Context type */
  readonly type: "booking" | "queue";
  /** Event ID */
  readonly eventId: string;
  /** Booking ID (only if type is 'booking') */
  readonly bookingId?: string;
  /** Optional message */
  readonly message?: string;
}
