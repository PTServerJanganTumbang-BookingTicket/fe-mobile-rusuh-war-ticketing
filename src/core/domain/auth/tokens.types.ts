/**
 * Token Branded Types
 *
 * Branded string types for tokens to prevent accidental misuse.
 * Contract Evidence: docs/CONTRACT-BASELINE.md §3.5
 *
 * @module core/domain/auth/tokens.types
 */

/**
 * Brand utility type for nominal typing.
 * Creates a branded type that is structurally distinct from plain strings.
 */
declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

/**
 * Queue position token sent as X-Queue-Token header.
 * R6-AC1: Branded string type, not plain string
 */
export type QueueToken = Brand<string, 'QueueToken'>;

/**
 * Grant token proving slot ownership, sent as X-Grant-Token header.
 * R6-AC2: Branded string type, not plain string
 */
export type GrantToken = Brand<string, 'GrantToken'>;

/**
 * Device identifier for guest device binding (128-bit UUID).
 * Sent as X-Device-Id header for guests.
 * R6-AC3: Branded string type, not plain string
 */
export type DeviceId = Brand<string, 'DeviceId'>;

/**
 * E-ticket access token for viewing/downloading e-tickets.
 * R6-AC4: Branded string type, not plain string
 */
export type ETicketToken = Brand<string, 'ETicketToken'>;

/**
 * Access token for authenticated API requests.
 * Sent as Authorization: Bearer header.
 */
export type AccessToken = Brand<string, 'AccessToken'>;

/**
 * Factory function to create a QueueToken from a raw string.
 * R6-AC5: Raw string assignment to branded type produces TypeScript error without factory
 */
export function createQueueToken(value: string): QueueToken {
  return value as QueueToken;
}

/**
 * Factory function to create a GrantToken from a raw string.
 */
export function createGrantToken(value: string): GrantToken {
  return value as GrantToken;
}

/**
 * Factory function to create a DeviceId from a raw string.
 */
export function createDeviceId(value: string): DeviceId {
  return value as DeviceId;
}

/**
 * Factory function to create an ETicketToken from a raw string.
 */
export function createETicketToken(value: string): ETicketToken {
  return value as ETicketToken;
}

/**
 * Factory function to create an AccessToken from a raw string.
 */
export function createAccessToken(value: string): AccessToken {
  return value as AccessToken;
}
