/**
 * Header Composition Unit Tests
 *
 * Tests for header composition functions.
 * R7-AC1: Logged-in grant requires BOTH headers
 * R7-AC2: Guest grant requires X-Grant-Token AND X-Device-Id
 * R7-AC3: Queue requests require X-Queue-Token
 * R7-AC4: Account-only requires Authorization only
 * R16-AC3: Header composition tests
 *
 * @module __tests__/core/domain/auth/headers.test
 */

import {
  createAccountHeaders,
  createAccessToken,
  createDeviceId,
  createGrantHeaders,
  createGrantToken,
  createGuestDeviceHeaders,
  createQueueHeaders,
  createQueueToken,
  isAuthenticatedAuth,
  isGuestAuth,
  type AuthContext,
} from "@/core/domain";

describe("createQueueHeaders (R7-AC3)", () => {
  it("creates headers with X-Queue-Token", () => {
    const queueToken = createQueueToken("qt_abc123");

    const headers = createQueueHeaders(queueToken);

    expect(headers).toEqual({
      "X-Queue-Token": "qt_abc123",
    });
  });
});

describe("createGrantHeaders", () => {
  describe("authenticated user (R7-AC1)", () => {
    it("includes BOTH X-Grant-Token AND Authorization", () => {
      const grantToken = createGrantToken("gt_xyz789");
      const accessToken = createAccessToken("access_token_123");
      const authContext: AuthContext = {
        type: "authenticated",
        accessToken,
      };

      const headers = createGrantHeaders(grantToken, authContext);

      expect(headers).toEqual({
        "X-Grant-Token": "gt_xyz789",
        Authorization: "Bearer access_token_123",
      });
    });

    it("formats Authorization header correctly", () => {
      const grantToken = createGrantToken("gt_test");
      const accessToken = createAccessToken("my_jwt_token");
      const authContext: AuthContext = {
        type: "authenticated",
        accessToken,
      };

      const headers = createGrantHeaders(grantToken, authContext);

      expect("Authorization" in headers && headers.Authorization).toBe(
        "Bearer my_jwt_token"
      );
      expect("Authorization" in headers && headers.Authorization).toMatch(
        /^Bearer /
      );
    });
  });

  describe("guest user (R7-AC2)", () => {
    it("includes X-Grant-Token AND X-Device-Id", () => {
      const grantToken = createGrantToken("gt_xyz789");
      const deviceId = createDeviceId("550e8400-e29b-41d4-a716-446655440000");
      const authContext: AuthContext = {
        type: "guest",
        deviceId,
      };

      const headers = createGrantHeaders(grantToken, authContext);

      expect(headers).toEqual({
        "X-Grant-Token": "gt_xyz789",
        "X-Device-Id": "550e8400-e29b-41d4-a716-446655440000",
      });
    });

    it("does not include Authorization header", () => {
      const grantToken = createGrantToken("gt_test");
      const deviceId = createDeviceId("test-device-id");
      const authContext: AuthContext = {
        type: "guest",
        deviceId,
      };

      const headers = createGrantHeaders(grantToken, authContext);

      expect("Authorization" in headers).toBe(false);
    });
  });
});

describe("createAccountHeaders (R7-AC4)", () => {
  it("creates headers with only Authorization", () => {
    const accessToken = createAccessToken("jwt_token");

    const headers = createAccountHeaders(accessToken);

    expect(headers).toEqual({
      Authorization: "Bearer jwt_token",
    });
  });

  it("does not include X-Grant-Token", () => {
    const accessToken = createAccessToken("token");

    const headers = createAccountHeaders(accessToken);

    expect("X-Grant-Token" in headers).toBe(false);
  });
});

describe("createGuestDeviceHeaders", () => {
  it("creates headers with X-Device-Id", () => {
    const deviceId = createDeviceId("device-uuid");

    const headers = createGuestDeviceHeaders(deviceId);

    expect(headers).toEqual({
      "X-Device-Id": "device-uuid",
    });
  });
});

describe("AuthContext type guards", () => {
  it("isGuestAuth returns true for guest context", () => {
    const context: AuthContext = {
      type: "guest",
      deviceId: createDeviceId("device-id"),
    };

    expect(isGuestAuth(context)).toBe(true);
    expect(isAuthenticatedAuth(context)).toBe(false);
  });

  it("isAuthenticatedAuth returns true for authenticated context", () => {
    const context: AuthContext = {
      type: "authenticated",
      accessToken: createAccessToken("token"),
    };

    expect(isAuthenticatedAuth(context)).toBe(true);
    expect(isGuestAuth(context)).toBe(false);
  });

  it("type guards narrow correctly", () => {
    const guestContext: AuthContext = {
      type: "guest",
      deviceId: createDeviceId("id"),
    };

    if (isGuestAuth(guestContext)) {
      // TypeScript should know this is GuestAuthContext
      expect(guestContext.deviceId).toBeDefined();
    }

    const authContext: AuthContext = {
      type: "authenticated",
      accessToken: createAccessToken("token"),
    };

    if (isAuthenticatedAuth(authContext)) {
      // TypeScript should know this is AuthenticatedAuthContext
      expect(authContext.accessToken).toBeDefined();
    }
  });
});
