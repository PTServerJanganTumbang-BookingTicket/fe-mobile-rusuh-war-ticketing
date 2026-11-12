/**
 * Refresh Response Mapper Tests
 *
 * GH-6 T4: Mapper unit tests
 * R5-AC8: DTO maps to domain Result<AuthSession, AuthError>
 */

import {
  mapRefreshResponse,
  extractRefreshTokenFromRefresh,
} from "@/features/auth/data";
import {
  mockRefreshResponse,
  mockAuthUser,
  FAKE_ACCESS_TOKEN,
  FAKE_NEW_REFRESH_TOKEN,
} from "../../__fixtures__";

describe("mapRefreshResponse", () => {
  it("maps refresh response to AuthSession with existing user", () => {
    const session = mapRefreshResponse(mockRefreshResponse, mockAuthUser);

    expect(session.accessToken).toBe(FAKE_ACCESS_TOKEN);
    expect(session.user).toEqual(mockAuthUser);
    expect(session.redirectContext).toBeUndefined();
  });

  it("calculates expiresAt correctly", () => {
    const before = Date.now();
    const session = mapRefreshResponse(mockRefreshResponse, mockAuthUser);
    const after = Date.now();

    // expires_in is in seconds, 22740 = 6h 19m
    const expectedExpiry = before + 22740 * 1000;
    const expiresAtMs = session.expiresAt.getTime();

    expect(expiresAtMs).toBeGreaterThanOrEqual(expectedExpiry);
    expect(expiresAtMs).toBeLessThanOrEqual(after + 22740 * 1000);
  });

  it("preserves existing user info", () => {
    const customUser = {
      id: "usr_custom",
      email: "custom@example.com",
      nikMasked: "1234********5678",
    };

    const session = mapRefreshResponse(mockRefreshResponse, customUser);

    expect(session.user).toEqual(customUser);
  });
});

describe("extractRefreshTokenFromRefresh", () => {
  it("extracts new refresh token", () => {
    const token = extractRefreshTokenFromRefresh(mockRefreshResponse);

    expect(token).toBe(FAKE_NEW_REFRESH_TOKEN);
  });
});
