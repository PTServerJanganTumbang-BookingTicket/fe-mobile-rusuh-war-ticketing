/**
 * FakeEventDataSource Tests
 *
 * GH-16: Verify data source behavior including delay and error simulation.
 */
import { FakeEventDataSource, FAKE_EVENTS } from "@/features/events/data";

describe("FakeEventDataSource", () => {
  describe("getEvents", () => {
    it("should return all fixture events", async () => {
      const dataSource = new FakeEventDataSource();
      const events = await dataSource.getEvents();

      expect(events).toEqual(FAKE_EVENTS);
    });

    it("should return a copy of fixtures (not the same reference)", async () => {
      const dataSource = new FakeEventDataSource();
      const events = await dataSource.getEvents();

      expect(events).not.toBe(FAKE_EVENTS);
      expect(events).toEqual(FAKE_EVENTS);
    });
  });

  describe("getEvent", () => {
    it("should return specific event by ID", async () => {
      const dataSource = new FakeEventDataSource();
      const event = await dataSource.getEvent("evt_konser_a");

      expect(event.id).toBe("evt_konser_a");
      expect(event.name).toBe("Konser A");
    });

    it("should throw error for non-existent event ID", async () => {
      const dataSource = new FakeEventDataSource();

      await expect(dataSource.getEvent("nonexistent")).rejects.toThrow(
        "Event not found: nonexistent"
      );
    });

    it("should return a copy of event (not the same reference)", async () => {
      const dataSource = new FakeEventDataSource();
      const event1 = await dataSource.getEvent("evt_konser_a");
      const event2 = await dataSource.getEvent("evt_konser_a");

      expect(event1).not.toBe(event2);
      expect(event1).toEqual(event2);
    });
  });

  describe("delay simulation", () => {
    it("should support configurable delay", async () => {
      const dataSource = new FakeEventDataSource({ delayMs: 50 });

      const start = Date.now();
      await dataSource.getEvents();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(50);
    });

    it("should default to no delay (0ms)", async () => {
      const dataSource = new FakeEventDataSource();

      const start = Date.now();
      await dataSource.getEvents();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });

  describe("error simulation", () => {
    it("should throw error when shouldError is true", async () => {
      const dataSource = new FakeEventDataSource({ shouldError: true });

      await expect(dataSource.getEvents()).rejects.toThrow(
        "Failed to fetch events"
      );
    });

    it("should use custom error message", async () => {
      const dataSource = new FakeEventDataSource({
        shouldError: true,
        errorMessage: "Custom error message",
      });

      await expect(dataSource.getEvents()).rejects.toThrow(
        "Custom error message"
      );
    });

    it("should throw error on getEvent when shouldError is true", async () => {
      const dataSource = new FakeEventDataSource({ shouldError: true });

      await expect(dataSource.getEvent("evt_konser_a")).rejects.toThrow();
    });
  });

  describe("updateConfig", () => {
    it("should allow runtime configuration updates", async () => {
      const dataSource = new FakeEventDataSource();

      // First call should succeed
      const events = await dataSource.getEvents();
      expect(events).toEqual(FAKE_EVENTS);

      // Update to error mode
      dataSource.updateConfig({ shouldError: true });

      // Second call should throw
      await expect(dataSource.getEvents()).rejects.toThrow();
    });

    it("should allow partial config updates", async () => {
      const dataSource = new FakeEventDataSource({
        delayMs: 0,
        shouldError: false,
      });

      dataSource.updateConfig({ delayMs: 10 });

      // Should still work, just with delay
      const events = await dataSource.getEvents();
      expect(events).toEqual(FAKE_EVENTS);
    });
  });
});
