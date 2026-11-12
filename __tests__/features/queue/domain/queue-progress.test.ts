/**
 * Queue Progress Utilities Tests
 *
 * GH-8 T3: Tests for progress percentage calculation.
 */

import { calculateProgress } from "@/features/queue/domain";

describe("Queue Progress Utilities", () => {
  describe("calculateProgress", () => {
    it("calculates 50% progress: (100, 50) = 50", () => {
      expect(calculateProgress(100, 50)).toBe(50);
    });

    it("returns 0 when no progress: (100, 100) = 0", () => {
      expect(calculateProgress(100, 100)).toBe(0);
    });

    it("returns 100 when granted: (100, 0) = 100", () => {
      expect(calculateProgress(100, 0)).toBe(100);
    });

    it("calculates correctly for different initial: (50, 25) = 50", () => {
      expect(calculateProgress(50, 25)).toBe(50);
    });

    it("returns 0 when starting at 1 with no progress: (1, 1) = 0", () => {
      expect(calculateProgress(1, 1)).toBe(0);
    });

    it("calculates 75% progress: (100, 25) = 75", () => {
      expect(calculateProgress(100, 25)).toBe(75);
    });

    it("calculates 25% progress: (100, 75) = 25", () => {
      expect(calculateProgress(100, 75)).toBe(25);
    });

    it("returns 100 for negative current position", () => {
      expect(calculateProgress(100, -5)).toBe(100);
    });

    it("returns 0 for initial position 0 (edge case)", () => {
      expect(calculateProgress(0, 50)).toBe(0);
    });

    it("returns 0 for negative initial position", () => {
      expect(calculateProgress(-10, 50)).toBe(0);
    });

    it("returns 0 when current exceeds initial (shouldn't happen, but defensive)", () => {
      expect(calculateProgress(50, 100)).toBe(0);
    });

    it("calculates correctly for small position: (10, 3) = 70", () => {
      expect(calculateProgress(10, 3)).toBe(70);
    });

    it("calculates correctly for large position: (1000, 250) = 75", () => {
      expect(calculateProgress(1000, 250)).toBe(75);
    });

    it("handles close to granted: (100, 1) = 99", () => {
      expect(calculateProgress(100, 1)).toBe(99);
    });

    it("handles initial 1 granted: (1, 0) = 100", () => {
      expect(calculateProgress(1, 0)).toBe(100);
    });
  });
});
