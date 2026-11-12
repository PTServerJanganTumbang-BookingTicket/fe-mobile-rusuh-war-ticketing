/**
 * Queue ETA Utilities Tests
 *
 * GH-8 T2: Tests for ETA calculation and formatting.
 */

import { calculateEta, formatEta } from "@/features/queue/domain";

describe("Queue ETA Utilities", () => {
  describe("calculateEta", () => {
    it("calculates basic ETA correctly: 100 / 20 = 5", () => {
      expect(calculateEta(100, 20)).toBe(5);
    });

    it("returns minimum of 1 when calculated ETA is less: 1 / 20", () => {
      expect(calculateEta(1, 20)).toBe(1);
    });

    it("applies ceiling: 10 / 3 = 4 (not 3.33)", () => {
      expect(calculateEta(10, 3)).toBe(4);
    });

    it("calculates correctly for large position: 1000 / 50 = 20", () => {
      expect(calculateEta(1000, 50)).toBe(20);
    });

    it("handles position exactly divisible by rate: 60 / 20 = 3", () => {
      expect(calculateEta(60, 20)).toBe(3);
    });

    it("returns 0 for position 0 (granted)", () => {
      expect(calculateEta(0, 20)).toBe(0);
    });

    it("returns 0 for negative position", () => {
      expect(calculateEta(-5, 20)).toBe(0);
    });

    it("returns 0 for rate 0 (division by zero protection)", () => {
      expect(calculateEta(100, 0)).toBe(0);
    });

    it("returns 0 for negative rate", () => {
      expect(calculateEta(100, -10)).toBe(0);
    });

    it("handles small rate for long wait: 200 / 5 = 40", () => {
      expect(calculateEta(200, 5)).toBe(40);
    });

    it("handles very small decimal rate: 10 / 0.5 = 20", () => {
      expect(calculateEta(10, 0.5)).toBe(20);
    });
  });

  describe("formatEta", () => {
    it('formats minutes below threshold: 45 -> "45 min"', () => {
      expect(formatEta(45)).toBe("45 min");
    });

    it('formats single minute: 1 -> "1 min"', () => {
      expect(formatEta(1)).toBe("1 min");
    });

    it('formats exactly 3 hours as threshold: 180 -> "more than 3 hours"', () => {
      expect(formatEta(180)).toBe("more than 3 hours");
    });

    it('formats above threshold: 200 -> "more than 3 hours"', () => {
      expect(formatEta(200)).toBe("more than 3 hours");
    });

    it('formats just below threshold: 179 -> "179 min"', () => {
      expect(formatEta(179)).toBe("179 min");
    });

    it('formats zero: 0 -> "0 min"', () => {
      expect(formatEta(0)).toBe("0 min");
    });

    it('formats 60 minutes (1 hour) as minutes: "60 min"', () => {
      expect(formatEta(60)).toBe("60 min");
    });

    it('formats 120 minutes (2 hours) as minutes: "120 min"', () => {
      expect(formatEta(120)).toBe("120 min");
    });
  });
});
