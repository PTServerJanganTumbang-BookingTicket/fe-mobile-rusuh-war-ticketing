/**
 * HttpEventRepository Tests
 *
 * GH-17: Unit tests for the real HTTP repository (contract v2.27).
 * Verifies delegation to RealEventDataSource and the EventRepository port.
 */
import { HttpEventRepository, ApiError } from "@/features/events/data";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("HttpEventRepository", () => {
  let repository: HttpEventRepository;

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

  beforeEach(() => {
    mockFetch.mockClear();
    repository = new HttpEventRepository({
      baseUrl: "https://api.example.com",
    });
  });

  it("should fetch events via GET /events and map to domain", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: [mockEventDTO],
          meta: { code: 200, message: "Success" },
        }),
    });

    const events = await repository.getEvents();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/events?limit=10&offset=0"),
      expect.objectContaining({ method: "GET" })
    );
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "evt_1",
      name: "Test Event",
      location: "Test Venue, Jakarta",
      queueState: "OPEN",
    });
  });

  it("should fetch a single event via GET /events/{id}", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: mockEventDTO,
          meta: { code: 200, message: "Success" },
        }),
    });

    const event = await repository.getEvent("evt_1");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/events/evt_1",
      expect.objectContaining({ method: "GET" })
    );
    expect(event.id).toBe("evt_1");
    expect(event.location).toBe("Test Venue, Jakarta");
  });

  it("should propagate ApiError from the data source", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    await expect(repository.getEvents()).rejects.toBeInstanceOf(ApiError);
  });

  it("should propagate ApiError from getEvent on not found", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(repository.getEvent("evt_missing")).rejects.toBeInstanceOf(
      ApiError
    );
  });
});
