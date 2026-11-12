/**
 * EventsHomeScreen Render Tests
 *
 * GH-16: Verify screen renders correct state based on data.
 */
import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import { EventsHomeScreen } from "@/features/events/presentation";
import type { EventRepository, Event } from "@/features/events/domain";
import { FAKE_EVENTS } from "@/features/events/data";

describe("EventsHomeScreen", () => {
  // Mock repository for testing different states
  const createMockRepository = (options: {
    events?: Event[];
    shouldError?: boolean;
    errorMessage?: string;
    delay?: number;
  }): EventRepository => ({
    getEvents: async () => {
      if (options.delay) {
        await new Promise((resolve) => setTimeout(resolve, options.delay));
      }
      if (options.shouldError) {
        throw new Error(options.errorMessage ?? "Test error");
      }
      return options.events ?? [];
    },
    getEvent: async (id: string) => {
      const event = (options.events ?? []).find((e) => e.id === id);
      if (!event) throw new Error("Event not found");
      return event;
    },
  });

  // RT-EVT17-06: Mixed states list (GH-17)
  describe("GH-17 Render Tests", () => {
    it("RT-EVT17-06: should render mixed queue states list", async () => {
      const repository = createMockRepository({ events: FAKE_EVENTS });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      await waitFor(() => {
        // All 5 queue state events should be visible
        expect(result!.getByText("Konser A")).toBeTruthy(); // SCHEDULED
        expect(result!.getByText("Konser B")).toBeTruthy(); // OPEN
        expect(result!.getByText("Konser C")).toBeTruthy(); // FULL_QUEUE
        expect(result!.getByText("Konser D")).toBeTruthy(); // FULL_BOOKED
        expect(result!.getByText("Konser E")).toBeTruthy(); // CLOSED
      });
    });

    it("RT-EVT17-07: should render EmptyState when no events", async () => {
      const repository = createMockRepository({ events: [] });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      await waitFor(() => {
        expect(result!.getByText("No Events Available")).toBeTruthy();
      });
    });

    it("RT-EVT17-08: should render EventList (GH-16 regression)", async () => {
      const repository = createMockRepository({ events: FAKE_EVENTS });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      await waitFor(() => {
        // List should render without error - core GH-16 regression test
        expect(result!.getByText("Konser A")).toBeTruthy();
      });
    });
  });

  describe("Loading state", () => {
    it("should render loading state initially", async () => {
      const repository = createMockRepository({
        delay: 1000,
        events: FAKE_EVENTS,
      });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      // Check for loading text instead of role since role matching has issues
      expect(result!.getByText("Loading events...")).toBeTruthy();
    });

    it("should not render EventCard during loading", async () => {
      const repository = createMockRepository({
        delay: 1000,
        events: FAKE_EVENTS,
      });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      expect(result!.queryByText("Konser A")).toBeNull();
    });
  });

  describe("Populated state", () => {
    it("should render event list after loading", async () => {
      const repository = createMockRepository({ events: FAKE_EVENTS });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      await waitFor(() => {
        expect(result!.getByText("Konser A")).toBeTruthy();
      });
    });

    it("should render multiple events", async () => {
      const repository = createMockRepository({ events: FAKE_EVENTS });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      await waitFor(() => {
        expect(result!.getByText("Konser A")).toBeTruthy();
        expect(result!.getByText("Konser B")).toBeTruthy();
      });
    });

    it("should not render loading state after data loads", async () => {
      const repository = createMockRepository({ events: FAKE_EVENTS });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      await waitFor(() => {
        expect(result!.getByText("Konser A")).toBeTruthy();
      });

      expect(result!.queryByText("Loading events...")).toBeNull();
    });
  });

  describe("Empty state", () => {
    it("should render empty state when no events", async () => {
      const repository = createMockRepository({ events: [] });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      await waitFor(() => {
        expect(result!.getByText("No Events Available")).toBeTruthy();
      });
    });

    it("should not render any EventCard when empty", async () => {
      const repository = createMockRepository({ events: [] });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      await waitFor(() => {
        expect(result!.getByText("No Events Available")).toBeTruthy();
      });

      expect(result!.queryByText("Konser A")).toBeNull();
    });
  });

  describe("Error state", () => {
    it("should render error state when fetch fails", async () => {
      const repository = createMockRepository({
        shouldError: true,
        errorMessage: "Network error",
      });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      await waitFor(() => {
        expect(result!.getByText("Oops!")).toBeTruthy();
        expect(result!.getByText("Network error")).toBeTruthy();
      });
    });

    it("should render retry button in error state", async () => {
      const repository = createMockRepository({ shouldError: true });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      await waitFor(() => {
        expect(result!.getByText("Oops!")).toBeTruthy();
      });

      expect(result!.getByText("Try Again")).toBeTruthy();
    });
  });

  describe("State exclusivity", () => {
    it("should render exactly one state at a time", async () => {
      const repository = createMockRepository({
        delay: 500,
        events: FAKE_EVENTS,
      });

      let result: Awaited<ReturnType<typeof render>>;
      await act(async () => {
        result = await render(<EventsHomeScreen repository={repository} />);
      });

      // Initially loading
      expect(result!.getByText("Loading events...")).toBeTruthy();
      expect(result!.queryByText("No Events Available")).toBeNull();
      expect(result!.queryByText("Oops!")).toBeNull();
      expect(result!.queryByText("Konser A")).toBeNull();

      // After loading
      await waitFor(() => {
        expect(result!.getByText("Konser A")).toBeTruthy();
      });

      expect(result!.queryByText("Loading events...")).toBeNull();
      expect(result!.queryByText("No Events Available")).toBeNull();
      expect(result!.queryByText("Oops!")).toBeNull();
    });
  });
});
