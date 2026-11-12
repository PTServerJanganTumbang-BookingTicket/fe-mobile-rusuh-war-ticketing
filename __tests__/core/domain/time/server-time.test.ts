/**
 * Server Time Unit Tests
 *
 * Tests for serverOffsetMs and remainingMs covering edge cases.
 * R5-AC1: serverOffsetMs tests
 * R5-AC2: remainingMs tests
 * R5-AC4: Drift handling tests
 * R5-AC5: Expired time returns 0 test
 * R16-AC1: Server time functions have unit tests
 *
 * @module __tests__/core/domain/time/server-time.test
 */

import {
  getExpiryInfo,
  parseServerTime,
  remainingMs,
  serverOffsetMs,
} from "@/core/domain";
import { FIXTURE_SERVER_TIME_MS } from "@/core/domain/__fixtures__";

describe("serverOffsetMs", () => {
  it("returns positive offset when server is ahead of client", () => {
    const serverTime = 1000;
    const clientTime = 900;

    const offset = serverOffsetMs(serverTime, clientTime);

    expect(offset).toBe(100);
  });

  it("returns negative offset when server is behind client", () => {
    const serverTime = 900;
    const clientTime = 1000;

    const offset = serverOffsetMs(serverTime, clientTime);

    expect(offset).toBe(-100);
  });

  it("returns zero when server and client times match", () => {
    const time = 1000;

    const offset = serverOffsetMs(time, time);

    expect(offset).toBe(0);
  });

  it("handles large time differences", () => {
    const serverTime = 1_700_000_000_000; // ~2024
    const clientTime = 1_600_000_000_000; // ~2020

    const offset = serverOffsetMs(serverTime, clientTime);

    expect(offset).toBe(100_000_000_000);
  });
});

describe("remainingMs", () => {
  it("returns remaining time when not expired", () => {
    const expiresAt = "2026-11-12T01:00:00.000Z";
    const clientNow = Date.parse("2026-11-12T00:30:00.000Z");
    const offset = 0;

    const remaining = remainingMs(expiresAt, clientNow, offset);

    expect(remaining).toBe(30 * 60 * 1000); // 30 minutes
  });

  it("returns 0 when expired (R5-AC5)", () => {
    const expiresAt = "2026-11-12T00:00:00.000Z";
    const clientNow = Date.parse("2026-11-12T01:00:00.000Z");
    const offset = 0;

    const remaining = remainingMs(expiresAt, clientNow, offset);

    expect(remaining).toBe(0);
  });

  it("never returns negative values (R5-AC5)", () => {
    const expiresAt = "2020-01-01T00:00:00.000Z"; // Long ago
    const clientNow = FIXTURE_SERVER_TIME_MS;
    const offset = 0;

    const remaining = remainingMs(expiresAt, clientNow, offset);

    expect(remaining).toBe(0);
    expect(remaining).toBeGreaterThanOrEqual(0);
  });

  it("accounts for positive offset (server ahead, R5-AC4)", () => {
    const expiresAt = "2026-11-12T01:00:00.000Z";
    const clientNow = Date.parse("2026-11-12T00:30:00.000Z");
    const offset = 5 * 60 * 1000; // Server is 5 minutes ahead

    const remaining = remainingMs(expiresAt, clientNow, offset);

    // Server-equivalent time = clientNow + offset = 00:35
    // Remaining = 01:00 - 00:35 = 25 minutes
    expect(remaining).toBe(25 * 60 * 1000);
  });

  it("accounts for negative offset (server behind)", () => {
    const expiresAt = "2026-11-12T01:00:00.000Z";
    const clientNow = Date.parse("2026-11-12T00:30:00.000Z");
    const offset = -5 * 60 * 1000; // Server is 5 minutes behind

    const remaining = remainingMs(expiresAt, clientNow, offset);

    // Server-equivalent time = clientNow + offset = 00:25
    // Remaining = 01:00 - 00:25 = 35 minutes
    expect(remaining).toBe(35 * 60 * 1000);
  });

  it("returns 0 for invalid date string", () => {
    const expiresAt = "invalid-date";
    const clientNow = 1000;
    const offset = 0;

    const remaining = remainingMs(expiresAt, clientNow, offset);

    expect(remaining).toBe(0);
  });

  it("handles exact expiry time", () => {
    const expiresAt = "2026-11-12T01:00:00.000Z";
    const clientNow = Date.parse("2026-11-12T01:00:00.000Z");
    const offset = 0;

    const remaining = remainingMs(expiresAt, clientNow, offset);

    expect(remaining).toBe(0);
  });
});

describe("parseServerTime", () => {
  it("parses valid ISO timestamp", () => {
    const serverTimeStr = "2026-11-12T00:00:00.000Z";
    const clientNow = Date.parse("2026-11-12T00:00:05.000Z");

    const result = parseServerTime(serverTimeStr, clientNow);

    expect(result).not.toBeNull();
    expect(result!.serverTimeMs).toBe(FIXTURE_SERVER_TIME_MS);
    expect(result!.clientReceivedMs).toBe(clientNow);
    expect(result!.offsetMs).toBe(-5000); // Server is 5 seconds behind
  });

  it("returns null for invalid timestamp", () => {
    const result = parseServerTime("not-a-date", 1000);

    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = parseServerTime("", 1000);

    expect(result).toBeNull();
  });
});

describe("getExpiryInfo", () => {
  it("returns expired info when time has passed", () => {
    const expiresAt = "2026-11-12T00:00:00.000Z";
    const clientNow = Date.parse("2026-11-12T01:00:00.000Z");
    const offset = 0;

    const info = getExpiryInfo(expiresAt, clientNow, offset);

    expect(info.remainingMs).toBe(0);
    expect(info.isExpired).toBe(true);
  });

  it("returns active info when time remains", () => {
    const expiresAt = "2026-11-12T01:00:00.000Z";
    const clientNow = Date.parse("2026-11-12T00:30:00.000Z");
    const offset = 0;

    const info = getExpiryInfo(expiresAt, clientNow, offset);

    expect(info.remainingMs).toBe(30 * 60 * 1000);
    expect(info.isExpired).toBe(false);
  });
});
