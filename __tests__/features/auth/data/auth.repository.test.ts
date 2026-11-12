/**
 * Auth Repository Tests
 *
 * GH-6 T10: Repository unit tests
 * R7-AC2: Repository consumes AuthRemoteDataSource
 * R7-AC3: Repository manages token storage lifecycle
 */

import { AuthRepository } from "@/features/auth/data/auth.repository";
import type { AuthRemoteDataSource, TokenStorage } from "@/features/auth/data";
import {
  mockVerifyResponse,
  mockRefreshResponse,
  mockRegisterResponse,
  mockMagicLinkResponse,
  FAKE_ACCESS_TOKEN,
  FAKE_REFRESH_TOKEN,
  FAKE_NEW_REFRESH_TOKEN,
  FAKE_EMAIL,
  FAKE_NIK,
  FAKE_POLICY_VERSION,
} from "../__fixtures__";

describe("AuthRepository", () => {
  let repository: AuthRepository;
  let mockDataSource: jest.Mocked<AuthRemoteDataSource>;
  let mockTokenStorage: jest.Mocked<TokenStorage>;

  beforeEach(() => {
    mockDataSource = {
      requestMagicLink: jest.fn(),
      resendMagicLink: jest.fn(),
      verifyMagicLink: jest.fn(),
      register: jest.fn(),
      refreshSession: jest.fn(),
    };

    mockTokenStorage = {
      getAccessToken: jest.fn(),
      setAccessToken: jest.fn(),
      clearAccessToken: jest.fn(),
      getRefreshToken: jest.fn(),
      setRefreshToken: jest.fn(),
      clearRefreshToken: jest.fn(),
      clearAll: jest.fn(),
    };

    repository = new AuthRepository(mockDataSource, mockTokenStorage);
  });

  describe("requestMagicLink", () => {
    it("calls dataSource.requestMagicLink and returns success", async () => {
      mockDataSource.requestMagicLink.mockResolvedValue({
        ok: true,
        value: mockMagicLinkResponse,
      });

      const result = await repository.requestMagicLink(FAKE_EMAIL);

      expect(result.ok).toBe(true);
      expect(mockDataSource.requestMagicLink).toHaveBeenCalledWith({
        email: FAKE_EMAIL,
      });
    });

    it("propagates error on failure", async () => {
      mockDataSource.requestMagicLink.mockResolvedValue({
        ok: false,
        error: { code: "RATE_LIMITED", retryAfterMs: 60000 },
      });

      const result = await repository.requestMagicLink(FAKE_EMAIL);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("RATE_LIMITED");
      }
    });
  });

  describe("resendMagicLink", () => {
    it("calls dataSource.resendMagicLink and returns success", async () => {
      mockDataSource.resendMagicLink.mockResolvedValue({
        ok: true,
        value: mockMagicLinkResponse,
      });

      const result = await repository.resendMagicLink(FAKE_EMAIL);

      expect(result.ok).toBe(true);
      expect(mockDataSource.resendMagicLink).toHaveBeenCalledWith({
        email: FAKE_EMAIL,
      });
    });
  });

  describe("verifyMagicLink", () => {
    it("stores tokens and returns session on success", async () => {
      mockDataSource.verifyMagicLink.mockResolvedValue({
        ok: true,
        value: mockVerifyResponse,
      });
      mockTokenStorage.setRefreshToken.mockResolvedValue({
        ok: true,
        value: undefined,
      });

      const result = await repository.verifyMagicLink("magic_token");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.accessToken).toBe(FAKE_ACCESS_TOKEN);
        expect(result.value.user.email).toBe(FAKE_EMAIL);
      }

      // R8-AC1: Access token stored in memory
      expect(mockTokenStorage.setAccessToken).toHaveBeenCalled();

      // R8-AC2: Refresh token stored in SecureStore
      expect(mockTokenStorage.setRefreshToken).toHaveBeenCalledWith(
        FAKE_REFRESH_TOKEN
      );
    });

    it("clears access token and returns error on storage failure", async () => {
      mockDataSource.verifyMagicLink.mockResolvedValue({
        ok: true,
        value: mockVerifyResponse,
      });
      mockTokenStorage.setRefreshToken.mockResolvedValue({
        ok: false,
        error: { code: "STORAGE_ERROR", message: "SecureStore unavailable" },
      });

      const result = await repository.verifyMagicLink("magic_token");

      expect(result.ok).toBe(false);
      expect(mockTokenStorage.clearAccessToken).toHaveBeenCalled();
    });

    it("updates getCurrentSession after successful verify", async () => {
      mockDataSource.verifyMagicLink.mockResolvedValue({
        ok: true,
        value: mockVerifyResponse,
      });
      mockTokenStorage.setRefreshToken.mockResolvedValue({
        ok: true,
        value: undefined,
      });

      await repository.verifyMagicLink("magic_token");

      const session = repository.getCurrentSession();
      expect(session).not.toBeNull();
      expect(session?.user.email).toBe(FAKE_EMAIL);
    });
  });

  describe("register", () => {
    it("strips non-digits from NIK before sending", async () => {
      mockDataSource.register.mockResolvedValue({
        ok: true,
        value: mockRegisterResponse,
      });

      await repository.register({
        email: FAKE_EMAIL,
        nik: "0000-0000-0000-0000", // With dashes
        consent: { accepted: true, policyVersion: FAKE_POLICY_VERSION },
      });

      expect(mockDataSource.register).toHaveBeenCalledWith({
        email: FAKE_EMAIL,
        nik: FAKE_NIK, // Dashes stripped
        consent: { accepted: true, policy_version: FAKE_POLICY_VERSION },
      });
    });

    it("returns RegisterResult on success", async () => {
      mockDataSource.register.mockResolvedValue({
        ok: true,
        value: mockRegisterResponse,
      });

      const result = await repository.register({
        email: FAKE_EMAIL,
        nik: FAKE_NIK,
        consent: { accepted: true, policyVersion: FAKE_POLICY_VERSION },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.userId).toBeDefined();
      }
    });

    it("propagates NIK_ALREADY_REGISTERED error", async () => {
      mockDataSource.register.mockResolvedValue({
        ok: false,
        error: { code: "NIK_ALREADY_REGISTERED", message: "NIK registered" },
      });

      const result = await repository.register({
        email: FAKE_EMAIL,
        nik: FAKE_NIK,
        consent: { accepted: true, policyVersion: FAKE_POLICY_VERSION },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NIK_ALREADY_REGISTERED");
      }
    });
  });

  describe("refreshSession", () => {
    beforeEach(() => {
      // Set up initial session (needed for refresh)
      mockDataSource.verifyMagicLink.mockResolvedValue({
        ok: true,
        value: mockVerifyResponse,
      });
      mockTokenStorage.setRefreshToken.mockResolvedValue({
        ok: true,
        value: undefined,
      });
    });

    it("replaces tokens on successful refresh", async () => {
      // First verify to establish session
      await repository.verifyMagicLink("magic_token");

      mockTokenStorage.getRefreshToken.mockResolvedValue({
        ok: true,
        value: FAKE_REFRESH_TOKEN,
      });
      mockDataSource.refreshSession.mockResolvedValue({
        ok: true,
        value: mockRefreshResponse,
      });
      mockTokenStorage.setRefreshToken.mockResolvedValue({
        ok: true,
        value: undefined,
      });

      const result = await repository.refreshSession();

      expect(result.ok).toBe(true);

      // R5-AC3: NEW access token stored
      expect(mockTokenStorage.setAccessToken).toHaveBeenCalled();

      // R5-AC4, R5-AC5: NEW refresh token replaces OLD
      expect(mockTokenStorage.setRefreshToken).toHaveBeenCalledWith(
        FAKE_NEW_REFRESH_TOKEN
      );
    });

    it("returns error when no refresh token stored", async () => {
      await repository.verifyMagicLink("magic_token");

      mockTokenStorage.getRefreshToken.mockResolvedValue({
        ok: true,
        value: null,
      });

      const result = await repository.refreshSession();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("TOKEN_INVALID");
      }
    });

    it("returns error when no active session", async () => {
      // Don't establish session first
      mockTokenStorage.getRefreshToken.mockResolvedValue({
        ok: true,
        value: FAKE_REFRESH_TOKEN,
      });

      const result = await repository.refreshSession();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("TOKEN_INVALID");
      }
    });

    it("clears session on TOKEN_INVALID error", async () => {
      await repository.verifyMagicLink("magic_token");

      mockTokenStorage.getRefreshToken.mockResolvedValue({
        ok: true,
        value: FAKE_REFRESH_TOKEN,
      });
      mockDataSource.refreshSession.mockResolvedValue({
        ok: false,
        error: { code: "TOKEN_INVALID", message: "Replay detected" },
      });
      mockTokenStorage.clearAll.mockResolvedValue({
        ok: true,
        value: undefined,
      });

      const result = await repository.refreshSession();

      expect(result.ok).toBe(false);
      // R5-AC6: Session cleared on TOKEN_INVALID
      expect(mockTokenStorage.clearAll).toHaveBeenCalled();
    });

    it("clears session on TOKEN_EXPIRED error", async () => {
      await repository.verifyMagicLink("magic_token");

      mockTokenStorage.getRefreshToken.mockResolvedValue({
        ok: true,
        value: FAKE_REFRESH_TOKEN,
      });
      mockDataSource.refreshSession.mockResolvedValue({
        ok: false,
        error: { code: "TOKEN_EXPIRED", message: "Token expired" },
      });
      mockTokenStorage.clearAll.mockResolvedValue({
        ok: true,
        value: undefined,
      });

      const result = await repository.refreshSession();

      expect(result.ok).toBe(false);
      // R5-AC7: Session cleared on TOKEN_EXPIRED
      expect(mockTokenStorage.clearAll).toHaveBeenCalled();
    });

    it("does NOT retry on failure (single-use tokens)", async () => {
      await repository.verifyMagicLink("magic_token");

      mockTokenStorage.getRefreshToken.mockResolvedValue({
        ok: true,
        value: FAKE_REFRESH_TOKEN,
      });
      mockDataSource.refreshSession.mockResolvedValue({
        ok: false,
        error: { code: "NETWORK_ERROR", message: "Connection failed" },
      });

      const result = await repository.refreshSession();

      expect(result.ok).toBe(false);
      // Only called once - no retry
      expect(mockDataSource.refreshSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("session management", () => {
    it("getCurrentSession returns null initially", () => {
      expect(repository.getCurrentSession()).toBeNull();
    });

    it("clearSession clears all tokens", async () => {
      mockTokenStorage.clearAll.mockResolvedValue({
        ok: true,
        value: undefined,
      });

      await repository.clearSession();

      expect(mockTokenStorage.clearAll).toHaveBeenCalled();
    });

    it("clearSession sets currentSession to null", async () => {
      // Establish session
      mockDataSource.verifyMagicLink.mockResolvedValue({
        ok: true,
        value: mockVerifyResponse,
      });
      mockTokenStorage.setRefreshToken.mockResolvedValue({
        ok: true,
        value: undefined,
      });
      await repository.verifyMagicLink("magic_token");
      expect(repository.getCurrentSession()).not.toBeNull();

      mockTokenStorage.clearAll.mockResolvedValue({
        ok: true,
        value: undefined,
      });
      await repository.clearSession();

      expect(repository.getCurrentSession()).toBeNull();
    });

    it("hasStoredRefreshToken returns true when token exists", async () => {
      mockTokenStorage.getRefreshToken.mockResolvedValue({
        ok: true,
        value: FAKE_REFRESH_TOKEN,
      });

      const result = await repository.hasStoredRefreshToken();

      expect(result).toBe(true);
    });

    it("hasStoredRefreshToken returns false when no token", async () => {
      mockTokenStorage.getRefreshToken.mockResolvedValue({
        ok: true,
        value: null,
      });

      const result = await repository.hasStoredRefreshToken();

      expect(result).toBe(false);
    });

    it("hasStoredRefreshToken returns false on storage error", async () => {
      mockTokenStorage.getRefreshToken.mockResolvedValue({
        ok: false,
        error: { code: "STORAGE_ERROR", message: "Failed" },
      });

      const result = await repository.hasStoredRefreshToken();

      expect(result).toBe(false);
    });
  });
});
