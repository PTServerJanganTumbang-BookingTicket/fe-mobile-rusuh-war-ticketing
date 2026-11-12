/**
 * FakeQueueDataSource Tests
 *
 * GH-8 T5: Integration tests for deterministic scenario player.
 */

import {
  FakeQueueDataSource,
  SCENARIO_QUEUE_MOVING,
  SCENARIO_QUEUE_STUCK,
  SCENARIO_FULL_BOOKED_THEN_OPEN,
  SCENARIO_CLOSED,
  SCENARIO_GRANTED_FAST,
} from "@/features/queue/data";
import type { QueueUpdate } from "@/features/queue/domain";

describe("FakeQueueDataSource", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("start()", () => {
    it("emits initial state immediately", () => {
      const onUpdate = jest.fn();
      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_GRANTED_FAST,
        onUpdate,
      });

      dataSource.start();

      expect(onUpdate).toHaveBeenCalledTimes(1);
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          position: SCENARIO_GRANTED_FAST.initialState.position,
          queueState: SCENARIO_GRANTED_FAST.initialState.queueState,
          engagementState: SCENARIO_GRANTED_FAST.initialState.engagementState,
        })
      );
    });

    it("is idempotent when called twice", () => {
      const onUpdate = jest.fn();
      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_GRANTED_FAST,
        onUpdate,
      });

      dataSource.start();
      dataSource.start(); // Second call should be no-op

      expect(onUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe("updates arrive at correct intervals", () => {
    it("emits updates after specified delays", () => {
      const onUpdate = jest.fn();
      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_GRANTED_FAST,
        onUpdate,
      });

      dataSource.start();
      expect(onUpdate).toHaveBeenCalledTimes(1); // Initial

      // First step delay is 500ms
      jest.advanceTimersByTime(500);
      expect(onUpdate).toHaveBeenCalledTimes(2);

      // Second step delay is 500ms
      jest.advanceTimersByTime(500);
      expect(onUpdate).toHaveBeenCalledTimes(3);
    });
  });

  describe("stop()", () => {
    it("stops further updates", () => {
      const onUpdate = jest.fn();
      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_GRANTED_FAST,
        onUpdate,
      });

      dataSource.start();
      expect(onUpdate).toHaveBeenCalledTimes(1);

      dataSource.stop();

      // Advance past all step delays
      jest.advanceTimersByTime(2000);
      expect(onUpdate).toHaveBeenCalledTimes(1); // No new updates
    });
  });

  describe("onComplete", () => {
    it("is called when scenario ends", () => {
      const onComplete = jest.fn();
      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_GRANTED_FAST,
        onComplete,
      });

      dataSource.start();

      // Run through all steps
      jest.advanceTimersByTime(1000); // 500 + 500

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("queue-moving scenario", () => {
    it("progresses from initial position to GRANTED", () => {
      const updates: QueueUpdate[] = [];
      const onUpdate = (update: QueueUpdate) => updates.push({ ...update });
      const onComplete = jest.fn();

      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_QUEUE_MOVING,
        onUpdate,
        onComplete,
      });

      dataSource.start();

      // Run through all steps (7 steps at 1000ms each)
      jest.advanceTimersByTime(8000);

      expect(onComplete).toHaveBeenCalled();

      // Check final state is GRANTED
      const finalUpdate = updates[updates.length - 1];
      expect(finalUpdate.engagementState).toBe("GRANTED");
      expect(finalUpdate.position).toBe(0);
      expect(finalUpdate.grant).toBeDefined();
      expect(finalUpdate.grant?.grant_token).toMatch(/^gt_/);
    });
  });

  describe("queue-stuck scenario", () => {
    it("stalls at same position then resumes", () => {
      const updates: QueueUpdate[] = [];
      const onUpdate = (update: QueueUpdate) => updates.push({ ...update });

      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_QUEUE_STUCK,
        onUpdate,
      });

      dataSource.start();

      // Run through all steps
      jest.advanceTimersByTime(10000);

      // Find stuck updates (same position as initial)
      const stuckUpdates = updates.filter(
        (u) => u.position === SCENARIO_QUEUE_STUCK.initialState.position
      );
      expect(stuckUpdates.length).toBeGreaterThanOrEqual(2);

      // Verify eventual progress
      const finalUpdate = updates[updates.length - 1];
      expect(finalUpdate.position).toBeLessThan(
        SCENARIO_QUEUE_STUCK.initialState.position
      );
    });
  });

  describe("full-booked-then-open scenario", () => {
    it("transitions through FULL_BOOKED and recovers", () => {
      const updates: QueueUpdate[] = [];
      const onUpdate = (update: QueueUpdate) => updates.push({ ...update });

      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_FULL_BOOKED_THEN_OPEN,
        onUpdate,
      });

      dataSource.start();

      // Run through all steps
      jest.advanceTimersByTime(15000);

      // Check FULL_BOOKED appeared
      const fullBookedUpdates = updates.filter(
        (u) => u.queueState === "FULL_BOOKED"
      );
      expect(fullBookedUpdates.length).toBeGreaterThan(0);

      // Check recovery to OPEN
      const recoveryIndex = updates.findIndex(
        (u, i) =>
          i > 0 &&
          updates[i - 1].queueState === "FULL_BOOKED" &&
          u.queueState === "OPEN"
      );
      expect(recoveryIndex).toBeGreaterThan(-1);

      // Final state is GRANTED
      const finalUpdate = updates[updates.length - 1];
      expect(finalUpdate.engagementState).toBe("GRANTED");
    });
  });

  describe("closed scenario", () => {
    it("terminates with CLOSED state", () => {
      const updates: QueueUpdate[] = [];
      const onUpdate = (update: QueueUpdate) => updates.push({ ...update });
      const onComplete = jest.fn();

      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_CLOSED,
        onUpdate,
        onComplete,
      });

      dataSource.start();

      // Run through all steps
      jest.advanceTimersByTime(5000);

      expect(onComplete).toHaveBeenCalled();

      // Final state is CLOSED
      const finalUpdate = updates[updates.length - 1];
      expect(finalUpdate.queueState).toBe("CLOSED");
      // Not GRANTED
      expect(finalUpdate.engagementState).not.toBe("GRANTED");
    });
  });

  describe("grant metadata", () => {
    it("includes grant_token and booking_expires_at when GRANTED", () => {
      const updates: QueueUpdate[] = [];
      const onUpdate = (update: QueueUpdate) => updates.push({ ...update });

      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_GRANTED_FAST,
        onUpdate,
      });

      dataSource.start();
      jest.advanceTimersByTime(1500);

      const grantedUpdate = updates.find(
        (u) => u.engagementState === "GRANTED"
      );
      expect(grantedUpdate).toBeDefined();
      expect(grantedUpdate?.grant).toBeDefined();
      expect(grantedUpdate?.grant?.grant_token).toMatch(/^gt_/);
      expect(grantedUpdate?.grant?.booking_expires_at).toBeDefined();
    });
  });

  describe("retry()", () => {
    it("resets and restarts scenario", () => {
      const onUpdate = jest.fn();
      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_GRANTED_FAST,
        onUpdate,
      });

      dataSource.start();
      jest.advanceTimersByTime(500); // Partial progress
      expect(onUpdate).toHaveBeenCalledTimes(2);

      dataSource.retry();
      expect(onUpdate).toHaveBeenCalledTimes(3); // New initial state

      // First call after retry should be initial state
      expect(onUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          position: SCENARIO_GRANTED_FAST.initialState.position,
        })
      );
    });
  });

  describe("setScenario()", () => {
    it("switches to new scenario", () => {
      const onUpdate = jest.fn();
      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_GRANTED_FAST,
        onUpdate,
      });

      dataSource.start();
      dataSource.setScenario(SCENARIO_CLOSED);

      // Should have stopped
      expect(dataSource.getIsRunning()).toBe(false);

      // New scenario state
      expect(dataSource.getCurrentState()).toEqual(
        expect.objectContaining({
          position: SCENARIO_CLOSED.initialState.position,
        })
      );
    });
  });

  describe("getCurrentState()", () => {
    it("returns current state copy", () => {
      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_GRANTED_FAST,
      });

      dataSource.start();
      const state = dataSource.getCurrentState();

      // Should be a copy
      state.position = 999;
      expect(dataSource.getCurrentState().position).not.toBe(999);
    });
  });

  describe("error handling", () => {
    it("calls onError when onUpdate throws", () => {
      const onError = jest.fn();
      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_GRANTED_FAST,
        onUpdate: () => {
          throw new Error("Test error");
        },
        onError,
      });

      dataSource.start();

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Test error" })
      );
    });
  });
});
