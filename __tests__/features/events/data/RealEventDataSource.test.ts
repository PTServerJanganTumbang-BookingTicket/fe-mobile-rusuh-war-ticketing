/**
 * RealEventDataSource Tests
 *
 * GH-17: Unit tests for HTTP adapter
 * Test IDs: UT-EVT17-01 to UT-EVT17-03, UT-EVT17-13 to UT-EVT17-15
 */
import {
  RealEventDataSource,
  ApiError,
} from "@/features/events/data/RealEventDataSource";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("RealEventDataSource", () => {
  let dataSource: RealEventDataSource;

  const mockEventDTO = {
    id: "evt_1",
    name: "Test Event",
    category: "LIVE MUSIC",
    location: { venue: "Test Venue", city: "Jakarta" },
    date: "2026-12-25",
    image_url: "/images/test.webp",
    queue_state: "OPEN",
    display: { enabled: true },
  };

  // Contract v2.27: { data: [...], meta: {...} } — data is the array directly
  const mockSuccessResponse = {
    data: [mockEventDTO],
    meta: {
      code: 200,
      message: "Success",
      pagination: { totalData: 1, totalPage: 1, limit: 10, offset: 0 },
    },
  };

  beforeEach(() => {
    mockFetch.mockClear();
    dataSource = new RealEventDataSource({
      baseUrl: "https://api.example.com",
      defaultLimit: 10,
      timeoutMs: 5000,
    });
  });

  describe("Request Construction", () => {
    // UT-EVT17-01: GET /events request with defaults
    it("should make GET request with default limit=10 and offset=0", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await dataSource.getEvents();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/events?limit=10&offset=0"),
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    // UT-EVT17-02: GET /events request with custom limit/offset
    it("should make request with custom pagination params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await dataSource.getEvents({ limit: 20, offset: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=20"),
        expect.anything()
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("offset=10"),
        expect.anything()
      );
    });

    // UT-EVT17-03: Request has no auth headers
    it("should not include authentication headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await dataSource.getEvents();

      const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
      expect(callArgs.headers).not.toHaveProperty("Authorization");
      expect(callArgs.headers).not.toHaveProperty("X-Grant-Token");
    });

    it("should include Accept: application/json header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await dataSource.getEvents();

      const callArgs = mockFetch.mock.calls[0][1] as RequestInit;
      expect(callArgs.headers).toHaveProperty("Accept", "application/json");
    });

    it("should NOT include filter parameter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      await dataSource.getEvents();

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).not.toContain("filter=");
    });
  });

  describe("Error Handling", () => {
    // UT-EVT17-13: 400 error mapping
    it("should map 400 response to VALIDATION_ERROR", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      await expect(dataSource.getEvents()).rejects.toThrow(ApiError);

      // Reset and call again for assertion
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

    // UT-EVT17-14: 503 error mapping
    it("should map 503 response to INTERNAL_ERROR", async () => {
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

    // UT-EVT17-15: Network error mapping
    it("should map network TypeError to NETWORK_ERROR", async () => {
      mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      try {
        await dataSource.getEvents();
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe("NETWORK_ERROR");
        expect(apiError.message).toContain("Network error");
      }
    });

    it("should map JSON parse error to PARSE_ERROR", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new SyntaxError("Invalid JSON")),
      });

      try {
        await dataSource.getEvents();
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe("PARSE_ERROR");
      }
    });

    it("should map malformed response envelope to PARSE_ERROR", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ foo: "bar" }), // Missing 'data' field
      });

      try {
        await dataSource.getEvents();
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe("PARSE_ERROR");
        expect(apiError.message).toContain("data");
      }
    });

    it("should map abort error to NETWORK_ERROR with timeout message", async () => {
      const abortError = new DOMException("Aborted", "AbortError");
      mockFetch.mockRejectedValueOnce(abortError);

      try {
        await dataSource.getEvents();
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe("NETWORK_ERROR");
        expect(apiError.message).toContain("timeout");
      }
    });

    it("should include URL in error context", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      try {
        await dataSource.getEvents();
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.url).toContain("https://api.example.com");
      }
    });
  });

  describe("Successful Response", () => {
    it("should return mapped domain events on success", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      const events = await dataSource.getEvents();

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe("evt_1");
      expect(events[0].queueState).toBe("OPEN");
      expect(events[0].imageUrl).toBe("/images/test.webp"); // snake_case mapped
    });

    it("should return empty array for empty items", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });

      const events = await dataSource.getEvents();

      expect(events).toHaveLength(0);
    });

    it("should map location object to combined 'venue, city' string", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSuccessResponse),
      });

      const events = await dataSource.getEvents();

      expect(events[0].location).toBe("Test Venue, Jakarta");
    });

    it("should reject old v2.12 envelope { data: { items: [...] } } as PARSE_ERROR", async () => {
      // Contract drift guard: v2.27 removed the items wrapper
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              items: [
                {
                  ...mockEventDTO,
                },
              ],
            },
          }),
      });

      try {
        await dataSource.getEvents();
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe("PARSE_ERROR");
        expect(apiError.message).toContain("data");
      }
    });

    it("should filter out invalid events and call onValidationError", async () => {
      const onValidationError = jest.fn();
      dataSource = new RealEventDataSource({
        baseUrl: "https://api.example.com",
        onValidationError,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
              {
                id: "evt_valid",
                name: "Valid Event",
                category: "LIVE MUSIC",
                location: { venue: "Test Venue", city: "Jakarta" },
                date: "2026-12-25",
                image_url: "/images/test.webp",
                queue_state: "OPEN",
                display: { enabled: true },
              },
              {
                id: "evt_invalid",
                name: "Invalid Event",
                category: "LIVE MUSIC",
                location: { venue: "Test Venue", city: "Jakarta" },
                date: "2026-12-25",
                image_url: "/images/test.webp",
                queue_state: "UNKNOWN_STATE",
                display: { enabled: true },
              },
            ],
            meta: { code: 200, message: "Success" },
          }),
      });

      const events = await dataSource.getEvents();

      expect(events).toHaveLength(1);
      expect(events[0].id).toBe("evt_valid");
      expect(onValidationError).toHaveBeenCalledTimes(1);
    });
  });

  describe("getEvent (GET /events/{id})", () => {
    it("should return mapped domain event on success", async () => {
      // Contract v2.27: detail data is the event object directly
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              ...mockEventDTO,
              time: "19:30",
              description: "Extra detail fields are ignored by the mapper",
              ticket_categories: [],
            },
            meta: { code: 200, message: "Success" },
          }),
      });

      const event = await dataSource.getEvent("evt_1");

      expect(event.id).toBe("evt_1");
      expect(event.name).toBe("Test Event");
      expect(event.location).toBe("Test Venue, Jakarta");
      expect(event.queueState).toBe("OPEN");
    });

    it("should request GET /events/{id} with encoded id", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: mockEventDTO,
            meta: { code: 200, message: "Success" },
          }),
      });

      await dataSource.getEvent("evt_1");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/events/evt_1",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should throw ApiError on 404 not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      try {
        await dataSource.getEvent("evt_missing");
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.statusCode).toBe(404);
      }
    });

    it("should throw CONTRACT_DRIFT when detail DTO is invalid", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { ...mockEventDTO, queue_state: "UNKNOWN_STATE" },
            meta: { code: 200, message: "Success" },
          }),
      });

      try {
        await dataSource.getEvent("evt_1");
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe("CONTRACT_DRIFT");
      }
    });

    it("should throw PARSE_ERROR when detail data is an array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [mockEventDTO] }),
      });

      try {
        await dataSource.getEvent("evt_1");
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.code).toBe("PARSE_ERROR");
      }
    });
  });
});
