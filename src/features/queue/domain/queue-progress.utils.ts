/**
 * Queue Progress Calculation Utilities
 *
 * GH-8 T3: Pure functions for calculating progress percentage.
 *
 * @module features/queue/domain/queue-progress.utils
 */

/**
 * Calculate progress percentage based on position change.
 *
 * Progress = ((initialPosition - currentPosition) / initialPosition) * 100
 *
 * @param initialPosition - Starting queue position (must be >= 1)
 * @param currentPosition - Current queue position (must be >= 0)
 * @returns Progress percentage (0-100)
 *
 * @example
 * calculateProgress(100, 50)  // => 50
 * calculateProgress(100, 100) // => 0 (no progress yet)
 * calculateProgress(100, 0)   // => 100 (granted)
 * calculateProgress(50, 25)   // => 50
 * calculateProgress(1, 1)     // => 0
 */
export function calculateProgress(
  initialPosition: number,
  currentPosition: number
): number {
  // Handle edge cases
  if (initialPosition <= 0) {
    return 0;
  }

  if (currentPosition <= 0) {
    return 100;
  }

  if (currentPosition >= initialPosition) {
    return 0;
  }

  const progress =
    ((initialPosition - currentPosition) / initialPosition) * 100;

  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, progress));
}
