/**
 * Payment TTL Utilities Tests
 *
 * GH-13 R7: Unit tests for TTL countdown utilities.
 * Verifies payment domain exports work correctly for payment expiration.
 *
 * @module __tests__/features/payment/domain/payment-ttl.test
 */

import {
  remainingMs,
  serverOffsetMs,
  PAYMENT_TTL_SECONDS,
  PAYMENT_TTL_MS,
} from "@/features/payment/domain";

describe("Payment TTL Constants", () => {
  it("PAYMENT_TTL_SECONDS is 600 (10 minutes)", () => {
    expect(PAYMENT_TTL_SECONDS).toBe(600);
  });

  it("PAYMENT_TTL_MS equals PAYMENT_TTL_SECONDS * 1000", () => {
    expect(PAYMENT_TTL_MS).toBe(PAYMENT_TTL_SECONDS * 1000);
    expect(PAYMENT_TTL_MS).toBe(600_000);
  });
});

describe("remainingMs (payment context)", () => {
  it("returns positive value when not expired", () => {
    const expiresAt = "2026-11-12T01:00:00.000Z";
    const clientNow = Date.parse("2026-11-12T00:55:00.000Z"); // 5 minutes before
    const offset = 0;

    const remaining = remainingMs(expiresAt, clientNow, offset);

    expect(remaining).toBe(5 * 60 * 1000); // 5 minutes
    expect(remaining).toBeGreaterThan(0);
  });

  it("returns 0 when expired", () => {
    const expiresAt = "2026-11-12T00:50:00.000Z";
    const clientNow = Date.parse("2026-11-12T01:00:00.000Z"); // 10 minutes after
    const offset = 0;

    const remaining = remainingMs(expiresAt, clientNow, offset);

    expect(remaining).toBe(0);
  });

  it("applies offset correctly (server ahead)", () => {
    const expiresAt = "2026-11-12T01:00:00.000Z";
    const clientNow = Date.parse("2026-11-12T00:55:00.000Z");
    const offset = 2 * 60 * 1000; // Server is 2 minutes ahead

    const remaining = remainingMs(expiresAt, clientNow, offset);

    // Server-equivalent = 00:55 + 00:02 = 00:57
    // Remaining = 01:00 - 00:57 = 3 minutes
    expect(remaining).toBe(3 * 60 * 1000);
  });

  it("applies offset correctly (server behind)", () => {
    const expiresAt = "2026-11-12T01:00:00.000Z";
    const clientNow = Date.parse("2026-11-12T00:55:00.000Z");
    const offset = -2 * 60 * 1000; // Server is 2 minutes behind

    const remaining = remainingMs(expiresAt, clientNow, offset);

    // Server-equivalent = 00:55 - 00:02 = 00:53
    // Remaining = 01:00 - 00:53 = 7 minutes
    expect(remaining).toBe(7 * 60 * 1000);
  });
});

describe("serverOffsetMs (payment context)", () => {
  it("calculates positive drift (server ahead)", () => {
    const serverTime = 1000;
    const responseReceivedAt = 900;

    const offset = serverOffsetMs(serverTime, responseReceivedAt);

    expect(offset).toBe(100);
    expect(offset).toBeGreaterThan(0);
  });

  it("calculates negative drift (server behind)", () => {
    const serverTime = 900;
    const responseReceivedAt = 1000;

    const offset = serverOffsetMs(serverTime, responseReceivedAt);

    expect(offset).toBe(-100);
    expect(offset).toBeLessThan(0);
  });

  it("handles equal times (0 offset)", () => {
    const time = 1000;

    const offset = serverOffsetMs(time, time);

    expect(offset).toBe(0);
  });
});
