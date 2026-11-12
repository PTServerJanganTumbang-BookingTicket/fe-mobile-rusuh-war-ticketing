/**
 * Real Events Integration Tests
 *
 * GH-17: Integration tests for RealEventDataSource with fetch mocking
 * Test IDs: IT-EVT17-01 to IT-EVT17-08
 *
 * These tests verify the integration of HTTP adapter, mapper, and validation
 * without requiring MSW - using Jest's fetch mock instead.
 */
import { RealEventDataSource, ApiError } from "@/features/events/data";
import type { Event } from "@/features/events/domain";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("Real Events Integration", () => {
  let dataSource: RealEventDataSource;
  let validationErrors: Array<{ error: string; id: string }>;

  const createMockResponse = (
    items: unknown[],
    meta?: { total?: number; limit?: number; offset?: number }
  ) => ({
    data: { items },
    meta,
  });

  const createValidEventDTO = (
    id: string,
    queueState: string,
    enabled = true
  ) => ({
    id,
    name: `Event ${id}`,
    category: "LIVE MUSIC",
    location: "Jakarta",
    date: "2026-12-25",
    image_url: "/images/test.webp",
    queue_state: queueState,
    display: { enabled },
  });

  beforeEach(() => {
    mockFetch.mockClear();
    validationErrors = [];

    dataSource = new RealEventDataSource({
      baseUrl: "https://api.test.com",
      onValidationError: (error, dto) => {
        validationErrors.push({ error, id: dto.id });
      },
    });
  });

  // IT-EVT17-01: Successful GET /events
  describe("IT-EVT17-01: Successful response handling", () => {
    it("should return Event[] from valid API response", async () => {
      const items = [
        createValidEventDTO("evt_1", "OPEN"),
        createValidEventDTO("evt_2", "SCHEDULED", false),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse(items)),
      });

      const events = await dataSource.getEvents();

      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({
        id: "evt_1",
        queueState: "OPEN",
        display: { enabled: true },
      } satisfies Partial<Event>);
      expect(events[1]).toMatchObject({
        id: "evt_2",
        queueState: "SCHEDULED",
        display: { enabled: false },
      } satisfies Partial<Event>);
    });

    it("should correctly map all domain fields", async () => {
      const items = [
        {
          id: "evt_mapped",
          name: "Mapped Event",
          category: "LIVE MUSIC",
          location: "Test Venue",
          date: "2026-12-25",
          image_url: "/images/mapped.webp",
          queue_state: "OPEN",
          sale_starts_at: "2026-12-20T10:00:00Z",
          display: { enabled: true },
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse(items)),
      });

      const events = await dataSource.getEvents();

      expect(events[0]).toEqual({
        id: "evt_mapped",
        name: "Mapped Event",
        category: "LIVE MUSIC",
        location: "Test Venue",
        date: "2026-12-25",
        imageUrl: "/images/mapped.webp", // Mapped from image_url
        queueState: "OPEN", // Mapped from queue_state
        saleStartsAt: "2026-12-20T10:00:00Z", // Mapped from sale_starts_at
        display: { enabled: true },
      } satisfies Event);
    });
  });

  // IT-EVT17-02: Empty collection
  describe("IT-EVT17-02: Empty collection handling", () => {
    it("should return empty array for empty response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse([])),
      });

      const events = await dataSource.getEvents();

      expect(events).toEqual([]);
      expect(events).toHaveLength(0);
    });
  });

  // IT-EVT17-03: Pagination params
  describe("IT-EVT17-03: Pagination parameters", () => {
    it("should pass pagination params to request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse([])),
      });

      await dataSource.getEvents({ limit: 25, offset: 50 });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("limit=25");
      expect(url).toContain("offset=50");
    });
  });

  // IT-EVT17-04: All 5 queue states in response
  describe("IT-EVT17-04: All 5 queue states handling", () => {
    it("should correctly map all 5 queue states", async () => {
      const items = [
        createValidEventDTO("evt_1", "SCHEDULED", false),
        createValidEventDTO("evt_2", "OPEN", true),
        createValidEventDTO("evt_3", "FULL_QUEUE", false),
        createValidEventDTO("evt_4", "FULL_BOOKED", true),
        createValidEventDTO("evt_5", "CLOSED", false),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse(items)),
      });

      const events = await dataSource.getEvents();

      expect(events).toHaveLength(5);
      expect(events.map((e) => e.queueState)).toEqual([
        "SCHEDULED",
        "OPEN",
        "FULL_QUEUE",
        "FULL_BOOKED",
        "CLOSED",
      ]);
    });

    it("should preserve display.enabled correctly per queue state", async () => {
      const items = [
        createValidEventDTO("evt_1", "SCHEDULED", false),
        createValidEventDTO("evt_2", "OPEN", true),
        createValidEventDTO("evt_3", "FULL_QUEUE", false),
        createValidEventDTO("evt_4", "FULL_BOOKED", true), // R7-AC2
        createValidEventDTO("evt_5", "CLOSED", false),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse(items)),
      });

      const events = await dataSource.getEvents();

      expect(events[0].display.enabled).toBe(false); // SCHEDULED
      expect(events[1].display.enabled).toBe(true); // OPEN
      expect(events[2].display.enabled).toBe(false); // FULL_QUEUE
      expect(events[3].display.enabled).toBe(true); // FULL_BOOKED
      expect(events[4].display.enabled).toBe(false); // CLOSED
    });
  });

  // IT-EVT17-05: 400 response handling
  describe("IT-EVT17-05: 400 error propagation", () => {
    it("should propagate 400 error as VALIDATION_ERROR", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      try {
        await dataSource.getEvents();
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe("VALIDATION_ERROR");
        expect(apiError.statusCode).toBe(400);
      }
    });
  });

  // IT-EVT17-06: 503 response handling
  describe("IT-EVT17-06: 503 error propagation", () => {
    it("should propagate 503 error as INTERNAL_ERROR", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      try {
        await dataSource.getEvents();
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe("INTERNAL_ERROR");
        expect(apiError.statusCode).toBe(503);
      }
    });
  });

  // IT-EVT17-07: Network failure handling
  describe("IT-EVT17-07: Network failure propagation", () => {
    it("should propagate network error", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      try {
        await dataSource.getEvents();
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe("NETWORK_ERROR");
      }
    });
  });

  // IT-EVT17-08: Contract drift detection (unknown queue_state)
  describe("IT-EVT17-08: Contract drift detection", () => {
    it("should detect and report unknown queue_state", async () => {
      const items = [
        createValidEventDTO("evt_valid", "OPEN"),
        createValidEventDTO("evt_drift", "UNKNOWN_NEW_STATE"),
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse(items)),
      });

      const events = await dataSource.getEvents();

      // Valid event should be returned
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe("evt_valid");

      // Drift should be reported via callback
      expect(validationErrors).toHaveLength(1);
      expect(validationErrors[0].id).toBe("evt_drift");
      expect(validationErrors[0].error).toContain("Invalid queue_state");
    });

    it("should reject removed queue states as contract drift", async () => {
      const items = [
        createValidEventDTO("evt_1", "NOT_OPEN"), // Removed in GH-17
        createValidEventDTO("evt_2", "DIRECT"), // Removed in GH-17
        createValidEventDTO("evt_3", "FULL"), // Replaced by FULL_QUEUE/FULL_BOOKED
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(createMockResponse(items)),
      });

      const events = await dataSource.getEvents();

      // All should be rejected
      expect(events).toHaveLength(0);
      expect(validationErrors).toHaveLength(3);
    });
  });
});
