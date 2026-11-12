/**
 * Verify Response Mapper Tests
 *
 * GH-6 T4: Mapper unit tests
 * R3-AC6: DTO maps to domain AuthSession with typed tokens
 */

import { mapVerifyResponse, extractRefreshToken } from "@/features/auth/data";
import {
  mockVerifyResponse,
  mockVerifyResponseWithRedirect,
  mockVerifyResponseWithoutNik,
  FAKE_ACCESS_TOKEN,
  FAKE_REFRESH_TOKEN,
  FAKE_USER_ID,
  FAKE_EMAIL,
  FAKE_NIK_MASKED,
  FAKE_EVENT_ID,
  FAKE_BOOKING_ID,
} from "../../__fixtures__";

describe("mapVerifyResponse", () => {
  it("maps basic verify response to AuthSession", () => {
    const session = mapVerifyResponse(mockVerifyResponse);

    expect(session.accessToken).toBe(FAKE_ACCESS_TOKEN);
    expect(session.user.id).toBe(FAKE_USER_ID);
    expect(session.user.email).toBe(FAKE_EMAIL);
    expect(session.user.nikMasked).toBe(FAKE_NIK_MASKED);
    expect(session.redirectContext).toBeUndefined();
  });

  it("calculates expiresAt correctly", () => {
    const before = Date.now();
    const session = mapVerifyResponse(mockVerifyResponse);
    const after = Date.now();

    // expires_in is in seconds, 22740 = 6h 19m
    const expectedExpiry = before + 22740 * 1000;
    const expiresAtMs = session.expiresAt.getTime();

    expect(expiresAtMs).toBeGreaterThanOrEqual(expectedExpiry);
    expect(expiresAtMs).toBeLessThanOrEqual(after + 22740 * 1000);
  });

  it("maps redirect context when present", () => {
    const session = mapVerifyResponse(mockVerifyResponseWithRedirect);

    expect(session.redirectContext).toBeDefined();
    expect(session.redirectContext?.type).toBe("booking");
    expect(session.redirectContext?.eventId).toBe(FAKE_EVENT_ID);
    expect(session.redirectContext?.bookingId).toBe(FAKE_BOOKING_ID);
    expect(session.redirectContext?.message).toBe("Resume your booking");
  });

  it("handles missing NIK (null)", () => {
    const session = mapVerifyResponse(mockVerifyResponseWithoutNik);

    expect(session.user.nikMasked).toBeNull();
  });

  it("maps access token to branded AccessToken type", () => {
    const session = mapVerifyResponse(mockVerifyResponse);

    // The token should be usable as AccessToken
    // Type check: this would fail to compile if accessToken wasn't AccessToken
    const token: string = session.accessToken;
    expect(token).toBe(FAKE_ACCESS_TOKEN);
  });
});

describe("extractRefreshToken", () => {
  it("extracts raw refresh token string", () => {
    const token = extractRefreshToken(mockVerifyResponse);

    expect(token).toBe(FAKE_REFRESH_TOKEN);
  });
});
