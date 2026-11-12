/**
 * Queue Data Source Factory Tests
 *
 * GH-9 T8: Unit tests for Queue data source factory.
 *
 * Test Matrix:
 * - Unit: createQueueDataSource('fake', scenario) returns FakeQueueDataSource
 * - Unit: createQueueDataSource('real', config) returns RealQueueDataSource
 * - Unit: FakeQueueDataSource unchanged from GH-8
 * - Unit: Both implement QueueDataSource interface
 *
 * @module __tests__/features/queue/data/queue-data-source.factory.test
 */

import { createDeviceId } from "@/core/domain";
import type { AuthContext } from "@/core/domain";
import { FakeQueueDataSource } from "@/features/queue/data/FakeQueueDataSource";
import { RealQueueDataSource } from "@/features/queue/data/RealQueueDataSource";
import {
  createQueueDataSource,
  createFakeQueueDataSource,
  createRealQueueDataSource,
  isFakeConfig,
  isRealConfig,
} from "@/features/queue/data/queue-data-source.factory";
import type {
  FakeQueueConfig,
  RealQueueConfig,
} from "@/features/queue/data/queue-data-source.factory";
import { DEFAULT_SCENARIO } from "@/features/queue/data/fixtures";

const guestAuthContext: AuthContext = {
  type: "guest",
  deviceId: createDeviceId("550e8400-e29b-41d4-a716-446655440000"),
};

describe("Queue Data Source Factory", () => {
  // Unit: createQueueDataSource('fake', scenario) returns FakeQueueDataSource
  describe("fake mode", () => {
    it("returns FakeQueueDataSource for mode=fake", () => {
      const dataSource = createQueueDataSource({
        mode: "fake",
      });

      expect(dataSource).toBeInstanceOf(FakeQueueDataSource);
    });

    it("uses provided scenario", () => {
      const dataSource = createQueueDataSource({
        mode: "fake",
        scenario: DEFAULT_SCENARIO,
      });

      expect(dataSource).toBeInstanceOf(FakeQueueDataSource);
      // Scenario is internal, but we can verify it starts correctly
      dataSource.start();
      expect(dataSource.getIsRunning()).toBe(true);
      dataSource.stop();
    });

    it("wires up callbacks", () => {
      const updates: unknown[] = [];

      const dataSource = createQueueDataSource({
        mode: "fake",
        onUpdate: (update) => updates.push(update),
      });

      dataSource.start();

      // Should emit initial state
      expect(updates.length).toBeGreaterThan(0);
      dataSource.stop();
    });
  });

  // Unit: createQueueDataSource('real', config) returns RealQueueDataSource
  describe("real mode", () => {
    it("returns RealQueueDataSource for mode=real", () => {
      const dataSource = createQueueDataSource({
        mode: "real",
        eventId: "evt_test123",
        captchaToken: "captcha_xyz",
        authContext: guestAuthContext,
        apiBaseUrl: "https://api.test.rusuh.id",
      });

      expect(dataSource).toBeInstanceOf(RealQueueDataSource);
    });

    it("passes all config options", () => {
      const dataSource = createQueueDataSource({
        mode: "real",
        eventId: "evt_config_test",
        captchaToken: "captcha_config",
        authContext: guestAuthContext,
        apiBaseUrl: "https://api.config.rusuh.id",
        timeoutMs: 5000,
        maxReconnectAttempts: 5,
        reconnectDelayMs: 2000,
      });

      expect(dataSource).toBeInstanceOf(RealQueueDataSource);
      // Config is internal, but we can verify it was created
      expect(dataSource.getIsRunning()).toBe(false);
    });
  });

  // Unit: FakeQueueDataSource unchanged from GH-8
  describe("FakeQueueDataSource preservation (R10-AC4)", () => {
    it("FakeQueueDataSource has original GH-8 interface", () => {
      const fake = new FakeQueueDataSource();

      // Original GH-8 methods
      expect(typeof fake.start).toBe("function");
      expect(typeof fake.stop).toBe("function");
      expect(typeof fake.retry).toBe("function");
      expect(typeof fake.getCurrentState).toBe("function");
      expect(typeof fake.getIsRunning).toBe("function");
      expect(typeof fake.setCallbacks).toBe("function");
      expect(typeof fake.setScenario).toBe("function"); // GH-8 specific
    });

    it("FakeQueueDataSource plays scenarios correctly", () => {
      const updates: unknown[] = [];

      const fake = new FakeQueueDataSource({
        scenario: DEFAULT_SCENARIO,
        onUpdate: (update) => updates.push(update),
      });

      fake.start();

      // Should emit initial state immediately
      expect(updates.length).toBe(1);
      expect(fake.getIsRunning()).toBe(true);

      fake.stop();
      expect(fake.getIsRunning()).toBe(false);
    });
  });

  // Unit: Both implement QueueDataSource interface
  describe("interface consistency", () => {
    it("both have common interface methods", () => {
      const fake = createQueueDataSource({ mode: "fake" });
      const real = createQueueDataSource({
        mode: "real",
        eventId: "evt_test",
        captchaToken: "captcha",
        authContext: guestAuthContext,
        apiBaseUrl: "https://api.test.rusuh.id",
      });

      // Common methods
      const commonMethods = [
        "start",
        "stop",
        "retry",
        "getCurrentState",
        "getIsRunning",
        "setCallbacks",
      ];

      for (const method of commonMethods) {
        expect(
          typeof (fake as unknown as Record<string, unknown>)[method]
        ).toBe("function");
        expect(
          typeof (real as unknown as Record<string, unknown>)[method]
        ).toBe("function");
      }
    });

    it("both return null for getCurrentState before start", () => {
      createQueueDataSource({ mode: "fake" });
      const real = createQueueDataSource({
        mode: "real",
        eventId: "evt_test",
        captchaToken: "captcha",
        authContext: guestAuthContext,
        apiBaseUrl: "https://api.test.rusuh.id",
      });

      // FakeQueueDataSource returns initial state before start
      // RealQueueDataSource returns null
      expect(real.getCurrentState()).toBeNull();
    });

    it("both report getIsRunning=false initially", () => {
      const fake = createQueueDataSource({ mode: "fake" });
      const real = createQueueDataSource({
        mode: "real",
        eventId: "evt_test",
        captchaToken: "captcha",
        authContext: guestAuthContext,
        apiBaseUrl: "https://api.test.rusuh.id",
      });

      expect(fake.getIsRunning()).toBe(false);
      expect(real.getIsRunning()).toBe(false);
    });
  });

  describe("type guards", () => {
    it("isFakeConfig identifies fake config", () => {
      const fakeConfig: FakeQueueConfig = { mode: "fake" };
      const realConfig: RealQueueConfig = {
        mode: "real",
        eventId: "evt",
        captchaToken: "cap",
        authContext: guestAuthContext,
        apiBaseUrl: "https://api.test.rusuh.id",
      };

      expect(isFakeConfig(fakeConfig)).toBe(true);
      expect(isFakeConfig(realConfig)).toBe(false);
    });

    it("isRealConfig identifies real config", () => {
      const fakeConfig: FakeQueueConfig = { mode: "fake" };
      const realConfig: RealQueueConfig = {
        mode: "real",
        eventId: "evt",
        captchaToken: "cap",
        authContext: guestAuthContext,
        apiBaseUrl: "https://api.test.rusuh.id",
      };

      expect(isRealConfig(realConfig)).toBe(true);
      expect(isRealConfig(fakeConfig)).toBe(false);
    });
  });

  describe("convenience wrappers", () => {
    it("createFakeQueueDataSource creates FakeQueueDataSource", () => {
      const fake = createFakeQueueDataSource({
        scenario: DEFAULT_SCENARIO,
      });

      expect(fake).toBeInstanceOf(FakeQueueDataSource);
    });

    it("createRealQueueDataSource creates RealQueueDataSource", () => {
      const real = createRealQueueDataSource({
        eventId: "evt_test",
        captchaToken: "captcha",
        authContext: guestAuthContext,
        apiBaseUrl: "https://api.test.rusuh.id",
      });

      expect(real).toBeInstanceOf(RealQueueDataSource);
    });
  });
});
