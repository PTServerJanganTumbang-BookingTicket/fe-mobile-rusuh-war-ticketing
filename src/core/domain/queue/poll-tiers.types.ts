/**
 * Poll Tiers Types
 *
 * Server-provided polling guidance structure.
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.8
 *
 * @module core/domain/queue/poll-tiers.types
 */

/**
 * Single poll tier definition.
 *
 * R10-AC1: max_position: number | null, poll_after_ms: number
 * R10-AC2: null max_position = unbounded tier
 */
export interface PollTier {
  /**
   * Upper bound for this tier.
   * null represents unbounded (applies to all positions above previous tiers).
   */
  max_position: number | null;
  /** Suggested polling interval in milliseconds */
  poll_after_ms: number;
}

/**
 * Array of poll tiers ordered by max_position.
 * R10-AC3: Orderable by max_position
 */
export type PollTiers = readonly PollTier[];

/**
 * Default poll interval when no tiers match (fallback).
 * 10 seconds is a reasonable default for positions not covered by tiers.
 */
export const DEFAULT_POLL_INTERVAL_MS = 10_000;

/**
 * Get the appropriate poll interval for a queue position.
 *
 * @param position - Current queue position (1-based)
 * @param tiers - Poll tiers from server (ordered by max_position)
 * @returns Poll interval in milliseconds
 */
export function getPollIntervalMs(position: number, tiers: PollTiers): number {
  if (tiers.length === 0) {
    return DEFAULT_POLL_INTERVAL_MS;
  }

  // Find the first tier that covers this position
  for (const tier of tiers) {
    // null max_position = unbounded, covers all remaining positions
    if (tier.max_position === null || position <= tier.max_position) {
      return tier.poll_after_ms;
    }
  }

  // No matching tier (position above all bounded tiers without unbounded tier)
  return DEFAULT_POLL_INTERVAL_MS;
}

/**
 * Sort poll tiers by max_position (null last as unbounded).
 *
 * @param tiers - Unsorted poll tiers
 * @returns New array sorted by max_position ascending (null last)
 */
export function sortPollTiers(tiers: PollTiers): PollTier[] {
  return [...tiers].sort((a, b) => {
    // null goes last (unbounded tier)
    if (a.max_position === null) return 1;
    if (b.max_position === null) return -1;
    return a.max_position - b.max_position;
  });
}

/**
 * Validate poll tiers structure.
 *
 * @param tiers - Poll tiers to validate
 * @returns true if valid structure
 */
export function isValidPollTiers(tiers: unknown): tiers is PollTiers {
  if (!Array.isArray(tiers)) {
    return false;
  }

  return tiers.every(
    (tier) =>
      typeof tier === "object" &&
      tier !== null &&
      (tier.max_position === null || typeof tier.max_position === "number") &&
      typeof tier.poll_after_ms === "number" &&
      tier.poll_after_ms > 0
  );
}
