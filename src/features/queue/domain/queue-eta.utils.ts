/**
 * Queue ETA Calculation Utilities
 *
 * GH-8 T2: Pure functions for calculating estimated time of arrival.
 *
 * @module features/queue/domain/queue-eta.utils
 */

/**
 * Calculate ETA in minutes from current position and rate.
 *
 * Formula: ceil(position / ratePerMin)
 *
 * @param position - Current queue position (must be >= 0)
 * @param ratePerMin - Processing rate per minute (must be > 0)
 * @returns ETA in minutes, minimum 1
 *
 * @example
 * calculateEta(100, 20) // => 5
 * calculateEta(1, 20)   // => 1 (minimum)
 * calculateEta(10, 3)   // => 4 (ceiling)
 */
export function calculateEta(position: number, ratePerMin: number): number {
  if (position <= 0) {
    return 0;
  }

  if (ratePerMin <= 0) {
    return 0;
  }

  const eta = Math.ceil(position / ratePerMin);
  return Math.max(eta, 1);
}

/**
 * Format ETA for display.
 *
 * - >= 180 minutes: "more than 3 hours"
 * - Otherwise: "{minutes} min"
 *
 * @param minutes - ETA in minutes
 * @returns Formatted string for display
 *
 * @example
 * formatEta(180) // => "more than 3 hours"
 * formatEta(45)  // => "45 min"
 * formatEta(1)   // => "1 min"
 */
export function formatEta(minutes: number): string {
  if (minutes >= 180) {
    return "more than 3 hours";
  }

  return `${minutes} min`;
}
