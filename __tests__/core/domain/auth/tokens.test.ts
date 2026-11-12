/**
 * Token Factory Unit Tests
 *
 * Tests for branded token factories verifying type safety.
 * R6-AC1-AC5: Branded token tests
 * R16-AC3: Branded type construction tests
 *
 * @module __tests__/core/domain/auth/tokens.test
 */

import {
  createAccessToken,
  createDeviceId,
  createETicketToken,
  createGrantToken,
  createQueueToken,
  type AccessToken,
  type DeviceId,
  type ETicketToken,
  type GrantToken,
  type QueueToken,
} from "@/core/domain";

describe("QueueToken", () => {
  it("creates branded QueueToken from string", () => {
    const token = createQueueToken("qt_abc123");

    expect(token).toBe("qt_abc123");
    // Type assertion - the token should be usable as QueueToken
    const typedToken: QueueToken = token;
    expect(typedToken).toBe("qt_abc123");
  });

  it("preserves string value", () => {
    const value = "qt_test_12345";
    const token = createQueueToken(value);

    expect(String(token)).toBe(value);
    expect(token.length).toBe(value.length);
  });
});

describe("GrantToken", () => {
  it("creates branded GrantToken from string", () => {
    const token = createGrantToken("gt_xyz789");

    expect(token).toBe("gt_xyz789");
    const typedToken: GrantToken = token;
    expect(typedToken).toBe("gt_xyz789");
  });

  it("handles typical grant token format", () => {
    const token = createGrantToken("gt_event123_user456_slot789");

    expect(token).toContain("gt_");
    expect(token.length).toBeGreaterThan(3);
  });
});

describe("DeviceId", () => {
  it("creates branded DeviceId from UUID string", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const deviceId = createDeviceId(uuid);

    expect(deviceId).toBe(uuid);
    const typedDeviceId: DeviceId = deviceId;
    expect(typedDeviceId).toBe(uuid);
  });

  it("preserves UUID format", () => {
    const uuid = "123e4567-e89b-12d3-a456-426614174000";
    const deviceId = createDeviceId(uuid);

    // UUID format validation (128-bit UUID)
    expect(deviceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});

describe("ETicketToken", () => {
  it("creates branded ETicketToken from string", () => {
    const token = createETicketToken("et_booking123_ticket456");

    expect(token).toBe("et_booking123_ticket456");
    const typedToken: ETicketToken = token;
    expect(typedToken).toBe("et_booking123_ticket456");
  });
});

describe("AccessToken", () => {
  it("creates branded AccessToken from JWT-like string", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    const token = createAccessToken(jwt);

    expect(token).toBe(jwt);
    const typedToken: AccessToken = token;
    expect(typedToken).toBe(jwt);
  });

  it("handles bearer token format", () => {
    const bearerToken = "abc123def456";
    const token = createAccessToken(bearerToken);

    expect(token).toBe(bearerToken);
  });
});

describe("Type Safety", () => {
  it("different token types are not assignable to each other at runtime value level", () => {
    const queueToken = createQueueToken("token_value");
    const grantToken = createGrantToken("token_value");

    // At runtime, they have the same value
    expect(String(queueToken)).toBe(String(grantToken));

    // But TypeScript would prevent: queueToken = grantToken (compile-time)
    // We verify they are created independently
    expect(queueToken).toBe("token_value");
    expect(grantToken).toBe("token_value");
  });

  it("tokens work as string keys in objects", () => {
    const token = createQueueToken("qt_key");
    const map: Record<string, number> = {};

    map[token] = 42;

    expect(map["qt_key"]).toBe(42);
  });

  it("tokens can be compared to strings", () => {
    const token = createQueueToken("qt_test");

    expect(token === "qt_test").toBe(true);
    expect(token === "qt_other").toBe(false);
  });
});
