/**
 * Queue Scenario Integration Tests
 *
 * GH-8 T11: End-to-end scenario flow tests.
 * Verifies complete flows and ensures no network calls.
 */

import {
  FakeQueueDataSource,
  SCENARIO_QUEUE_MOVING,
  SCENARIO_FULL_BOOKED_THEN_OPEN,
  SCENARIO_CLOSED,
  type QueueUpdate,
} from "@/features/queue";

describe("Queue Scenario Integration Tests", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("queue-moving scenario", () => {
    it("completes with GRANTED state", () => {
      const updates: QueueUpdate[] = [];
      const onComplete = jest.fn();

      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_QUEUE_MOVING,
        onUpdate: (update) => updates.push({ ...update }),
        onComplete,
      });

      dataSource.start();

      // Run through all steps (7 steps at ~1000ms each)
      jest.advanceTimersByTime(10000);

      expect(onComplete).toHaveBeenCalled();

      const finalUpdate = updates[updates.length - 1];
      expect(finalUpdate.engagementState).toBe("GRANTED");
      expect(finalUpdate.position).toBe(0);
      expect(finalUpdate.grant).toBeDefined();
    });

    it("decreases position monotonically", () => {
      const updates: QueueUpdate[] = [];

      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_QUEUE_MOVING,
        onUpdate: (update) => updates.push({ ...update }),
      });

      dataSource.start();
      jest.advanceTimersByTime(10000);

      // Verify position decreases
      for (let i = 1; i < updates.length; i++) {
        expect(updates[i].position).toBeLessThanOrEqual(
          updates[i - 1].position
        );
      }
    });
  });

  describe("full-booked-then-open scenario", () => {
    it("transitions through FULL_BOOKED and recovers", () => {
      const updates: QueueUpdate[] = [];
      const onComplete = jest.fn();

      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_FULL_BOOKED_THEN_OPEN,
        onUpdate: (update) => updates.push({ ...update }),
        onComplete,
      });

      dataSource.start();
      jest.advanceTimersByTime(20000);

      expect(onComplete).toHaveBeenCalled();

      // Verify FULL_BOOKED appeared
      const hadFullBooked = updates.some((u) => u.queueState === "FULL_BOOKED");
      expect(hadFullBooked).toBe(true);

      // Verify recovery to OPEN
      const fullBookedIndex = updates.findIndex(
        (u) => u.queueState === "FULL_BOOKED"
      );
      const recoveredToOpen = updates.some(
        (u, i) => i > fullBookedIndex && u.queueState === "OPEN"
      );
      expect(recoveredToOpen).toBe(true);

      // Final state is GRANTED
      const finalUpdate = updates[updates.length - 1];
      expect(finalUpdate.engagementState).toBe("GRANTED");
    });
  });

  describe("closed scenario", () => {
    it("terminates with CLOSED state", () => {
      const updates: QueueUpdate[] = [];
      const onComplete = jest.fn();

      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_CLOSED,
        onUpdate: (update) => updates.push({ ...update }),
        onComplete,
      });

      dataSource.start();
      jest.advanceTimersByTime(10000);

      expect(onComplete).toHaveBeenCalled();

      const finalUpdate = updates[updates.length - 1];
      expect(finalUpdate.queueState).toBe("CLOSED");
      expect(finalUpdate.engagementState).not.toBe("GRANTED");
    });
  });

  describe("no network calls verification", () => {
    it("performs zero fetch calls during scenario", () => {
      // Mock fetch to throw if called
      const originalFetch = globalThis.fetch;
      globalThis.fetch = jest.fn(() => {
        throw new Error(
          "Network call detected - FakeQueueDataSource should not make network calls"
        );
      });

      const dataSource = new FakeQueueDataSource({
        scenario: SCENARIO_QUEUE_MOVING,
        onUpdate: () => {},
      });

      dataSource.start();
      jest.advanceTimersByTime(10000);
      dataSource.stop();

      // If we get here without throwing, no fetch was called
      expect(globalThis.fetch).not.toHaveBeenCalled();

      globalThis.fetch = originalFetch;
    });
  });
});
