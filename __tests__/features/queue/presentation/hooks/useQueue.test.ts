/**
 * useQueue Hook Tests
 *
 * GH-8 T6: Integration tests for Queue state management hook.
 *
 * Note: @testing-library/react-native v14+ has async renderHook.
 * Tests use waitFor to handle async state updates.
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import {
  useQueue,
  type QueueDataSourceFactory,
} from "@/features/queue/presentation";
import {
  FakeQueueDataSource,
  SCENARIO_GRANTED_FAST,
  SCENARIO_QUEUE_MOVING,
} from "@/features/queue/data";
import type { QueueScenario } from "@/features/queue/domain";

// Factory function to create FakeQueueDataSource (DI pattern)
const createFakeDataSource: QueueDataSourceFactory = (
  scenario: QueueScenario
) => {
  const ds = new FakeQueueDataSource({ scenario });
  return {
    start: () => ds.start(),
    stop: () => ds.stop(),
    retry: () => ds.retry(),
    setCallbacks: (callbacks) => ds.setCallbacks(callbacks),
  };
};

describe("useQueue Hook", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("returns initial state after mount", async () => {
      const { result } = await renderHook(() =>
        useQueue({
          scenario: SCENARIO_GRANTED_FAST,
          createDataSource: createFakeDataSource,
        })
      );

      expect(result.current.position).toBe(
        SCENARIO_GRANTED_FAST.initialState.position
      );
      expect(result.current.queueState).toBe("OPEN");
      expect(result.current.engagementState).toBe("QUEUED");
      expect(result.current.isGranted).toBe(false);
      expect(result.current.grant).toBeNull();
    });

    it("sets loading to false after initial update", async () => {
      const { result } = await renderHook(() =>
        useQueue({
          scenario: SCENARIO_GRANTED_FAST,
          createDataSource: createFakeDataSource,
        })
      );

      expect(result.current.loading).toBe(false);
    });

    it("sets isRunning to true when started", async () => {
      const { result } = await renderHook(() =>
        useQueue({
          scenario: SCENARIO_GRANTED_FAST,
          createDataSource: createFakeDataSource,
        })
      );

      expect(result.current.isRunning).toBe(true);
    });
  });

  describe("state updates on QueueUpdate events", () => {
    it("updates position on scenario step", async () => {
      const { result } = await renderHook(() =>
        useQueue({
          scenario: SCENARIO_GRANTED_FAST,
          createDataSource: createFakeDataSource,
        })
      );

      expect(result.current.position).toBe(10);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(result.current.position).toBe(5);
      });
    });
  });

  describe("ETA calculation", () => {
    it("calculates ETA correctly", async () => {
      const { result } = await renderHook(() =>
        useQueue({
          scenario: SCENARIO_QUEUE_MOVING,
          createDataSource: createFakeDataSource,
        })
      );

      // Initial: position 100, rate 20 => ETA 5
      expect(result.current.etaMinutes).toBe(5);
      expect(result.current.etaDisplay).toBe("5 min");
    });
  });

  describe("progress calculation", () => {
    it("calculates progress correctly", async () => {
      const { result } = await renderHook(() =>
        useQueue({
          scenario: SCENARIO_GRANTED_FAST,
          createDataSource: createFakeDataSource,
        })
      );

      // Initial: position 10, initialPosition 10 => progress 0
      expect(result.current.progress).toBe(0);

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        // Progress: (10 - 5) / 10 * 100 = 50
        expect(result.current.progress).toBe(50);
      });
    });
  });

  describe("grant detection", () => {
    it("exposes grant info when GRANTED", async () => {
      const { result } = await renderHook(() =>
        useQueue({
          scenario: SCENARIO_GRANTED_FAST,
          createDataSource: createFakeDataSource,
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(result.current.isGranted).toBe(true);
        expect(result.current.grant).not.toBeNull();
      });

      expect(result.current.grant?.token).toMatch(/^gt_/);
      expect(result.current.grant?.expiresAt).toBeDefined();
    });

    it("calls onGranted callback when granted", async () => {
      const onGranted = jest.fn();
      await renderHook(() =>
        useQueue({
          scenario: SCENARIO_GRANTED_FAST,
          createDataSource: createFakeDataSource,
          onGranted,
        })
      );

      await act(async () => {
        jest.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(onGranted).toHaveBeenCalledTimes(1);
      });

      expect(onGranted).toHaveBeenCalledWith(
        expect.objectContaining({
          grant_token: expect.stringMatching(/^gt_/),
          booking_expires_at: expect.any(String),
        })
      );
    });
  });

  describe("cleanup on unmount", () => {
    it("stops data source on unmount", async () => {
      const { result, unmount } = await renderHook(() =>
        useQueue({
          scenario: SCENARIO_GRANTED_FAST,
          createDataSource: createFakeDataSource,
        })
      );

      expect(result.current.isRunning).toBe(true);

      unmount();

      // After unmount, advancing timers should not throw
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    });
  });
});
