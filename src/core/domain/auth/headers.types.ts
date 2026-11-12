/**
 * Authentication Header Policy Types
 *
 * Header composition rules for different authentication contexts.
 * Contract Evidence: docs/CONTRACT-BASELINE.md §3.2, §3.3, §3.4, §3.5
 *
 * @module core/domain/auth/headers.types
 */

import type {
  AccessToken,
  DeviceId,
  GrantToken,
  QueueToken,
} from "./tokens.types";

/**
 * Guest authentication context.
 * R7-AC2: Guest grant-protected requests require X-Grant-Token AND X-Device-Id
 */
export interface GuestAuthContext {
  type: "guest";
  deviceId: DeviceId;
}

/**
 * Authenticated user context.
 * R7-AC1: Logged-in grant-protected requests require BOTH X-Grant-Token AND Authorization
 */
export interface AuthenticatedAuthContext {
  type: "authenticated";
  accessToken: AccessToken;
}

/**
 * Authentication context discriminated union.
 * R7-AC6: Header policy types are composable without React dependencies
 */
export type AuthContext = GuestAuthContext | AuthenticatedAuthContext;

/**
 * Headers for queue-related requests.
 * R7-AC3: Queue requests require X-Queue-Token
 */
export interface QueueHeaders {
  "X-Queue-Token": string;
}

/**
 * Headers for guest grant-protected requests.
 * R7-AC2: Requires X-Grant-Token AND X-Device-Id
 * R7-AC5: Guest queue join requires X-Device-Id (DEVICE_ID_REQUIRED if missing)
 */
export interface GuestGrantHeaders {
  "X-Grant-Token": string;
  "X-Device-Id": string;
}

/**
 * Headers for authenticated grant-protected requests.
 * R7-AC1: Requires BOTH X-Grant-Token AND Authorization: Bearer
 */
export interface AuthenticatedGrantHeaders {
  "X-Grant-Token": string;
  Authorization: string;
}

/**
 * Headers for account-only requests (no grant required).
 * R7-AC4: Account-only requests require Authorization: Bearer only
 */
export interface AccountHeaders {
  Authorization: string;
}

/**
 * Headers for guest requests (no grant required).
 */
export interface GuestDeviceHeaders {
  "X-Device-Id": string;
}

/**
 * Create headers for queue requests.
 */
export function createQueueHeaders(queueToken: QueueToken): QueueHeaders {
  return {
    "X-Queue-Token": queueToken,
  };
}

/**
 * Create headers for grant-protected requests.
 * Composes correct headers based on auth context.
 */
export function createGrantHeaders(
  grantToken: GrantToken,
  authContext: AuthContext
): GuestGrantHeaders | AuthenticatedGrantHeaders {
  if (authContext.type === "guest") {
    return {
      "X-Grant-Token": grantToken,
      "X-Device-Id": authContext.deviceId,
    };
  }

  return {
    "X-Grant-Token": grantToken,
    Authorization: `Bearer ${authContext.accessToken}`,
  };
}

/**
 * Create headers for account-only requests.
 */
export function createAccountHeaders(accessToken: AccessToken): AccountHeaders {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

/**
 * Create headers for guest device-bound requests.
 */
export function createGuestDeviceHeaders(
  deviceId: DeviceId
): GuestDeviceHeaders {
  return {
    "X-Device-Id": deviceId,
  };
}

/**
 * Check if auth context is guest.
 */
export function isGuestAuth(context: AuthContext): context is GuestAuthContext {
  return context.type === "guest";
}

/**
 * Check if auth context is authenticated.
 */
export function isAuthenticatedAuth(
  context: AuthContext
): context is AuthenticatedAuthContext {
  return context.type === "authenticated";
}
