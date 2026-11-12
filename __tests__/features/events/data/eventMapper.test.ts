/**
 * Event Mapper Tests
 *
 * GH-17: Unit tests for DTO to domain mapping
 * Test IDs: UT-EVT17-04 to UT-EVT17-12
 */
import { mapEventDTO, mapEventDTOs } from "@/features/events/data";
import type { EventDTO } from "@/features/events/data";

describe("eventMapper", () => {
  const baseDTO: EventDTO = {
    id: "evt_test",
    name: "Test Event",
    category: "LIVE MUSIC",
    location: "Test Venue, Jakarta",
    date: "2026-12-25",
    image_url: "/images/test.webp",
    queue_state: "OPEN",
    display: {
      enabled: true,
    },
  };

  describe("mapEventDTO - Valid States", () => {
    // UT-EVT17-04: SCHEDULED DTO maps correctly
    it("should map SCHEDULED DTO correctly", () => {
      const dto: EventDTO = {
        ...baseDTO,
        queue_state: "SCHEDULED",
        display: { enabled: false },
        sale_starts_at: "2026-12-20T10:00:00Z",
      };

      const result = mapEventDTO(dto);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.event.queueState).toBe("SCHEDULED");
        expect(result.event.display.enabled).toBe(false);
        expect(result.event.saleStartsAt).toBe("2026-12-20T10:00:00Z");
      }
    });

    // UT-EVT17-05: OPEN DTO maps correctly
    it("should map OPEN DTO correctly", () => {
      const dto: EventDTO = {
        ...baseDTO,
        queue_state: "OPEN",
        display: { enabled: true },
      };

      const result = mapEventDTO(dto);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.event.queueState).toBe("OPEN");
        expect(result.event.display.enabled).toBe(true);
      }
    });

    // UT-EVT17-06: FULL_QUEUE DTO maps correctly
    it("should map FULL_QUEUE DTO correctly", () => {
      const dto: EventDTO = {
        ...baseDTO,
        queue_state: "FULL_QUEUE",
        display: { enabled: false },
      };

      const result = mapEventDTO(dto);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.event.queueState).toBe("FULL_QUEUE");
        expect(result.event.display.enabled).toBe(false);
      }
    });

    // UT-EVT17-07: FULL_BOOKED DTO maps correctly (R7-AC2: enabled=true)
    it("should map FULL_BOOKED DTO correctly with enabled=true", () => {
      const dto: EventDTO = {
        ...baseDTO,
        queue_state: "FULL_BOOKED",
        display: { enabled: true },
      };

      const result = mapEventDTO(dto);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.event.queueState).toBe("FULL_BOOKED");
        expect(result.event.display.enabled).toBe(true);
      }
    });

    // UT-EVT17-08: CLOSED DTO maps correctly
    it("should map CLOSED DTO correctly", () => {
      const dto: EventDTO = {
        ...baseDTO,
        queue_state: "CLOSED",
        display: { enabled: false },
      };

      const result = mapEventDTO(dto);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.event.queueState).toBe("CLOSED");
        expect(result.event.display.enabled).toBe(false);
      }
    });
  });

  describe("mapEventDTO - Field Mapping", () => {
    // UT-EVT17-09: display.enabled passthrough
    it("should pass through display.enabled=true unchanged", () => {
      const dto: EventDTO = { ...baseDTO, display: { enabled: true } };
      const result = mapEventDTO(dto);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.event.display.enabled).toBe(true);
      }
    });

    it("should pass through display.enabled=false unchanged", () => {
      const dto: EventDTO = { ...baseDTO, display: { enabled: false } };
      const result = mapEventDTO(dto);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.event.display.enabled).toBe(false);
      }
    });

    // UT-EVT17-10: sale_starts_at null handling
    it("should handle sale_starts_at=null as undefined", () => {
      const dto: EventDTO = { ...baseDTO, sale_starts_at: null };
      const result = mapEventDTO(dto);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.event.saleStartsAt).toBeUndefined();
      }
    });

    it("should handle missing sale_starts_at as undefined", () => {
      const dto: EventDTO = { ...baseDTO };
      delete (dto as Partial<EventDTO>).sale_starts_at;
      const result = mapEventDTO(dto);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.event.saleStartsAt).toBeUndefined();
      }
    });

    it("should map snake_case image_url to camelCase imageUrl", () => {
      const result = mapEventDTO(baseDTO);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.event.imageUrl).toBe("/images/test.webp");
      }
    });

    it("should map snake_case queue_state to camelCase queueState", () => {
      const result = mapEventDTO(baseDTO);
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.event.queueState).toBe("OPEN");
      }
    });
  });

  describe("mapEventDTO - Validation Failures", () => {
    // UT-EVT17-11: Unknown queue_state rejects (no fallback)
    it("should reject unknown queue_state value", () => {
      const dto: EventDTO = { ...baseDTO, queue_state: "UNKNOWN_VALUE" };
      const result = mapEventDTO(dto);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("Invalid queue_state");
        expect(result.error).toContain("UNKNOWN_VALUE");
      }
    });

    it("should reject old queue_state NOT_OPEN (no silent fallback)", () => {
      const dto: EventDTO = { ...baseDTO, queue_state: "NOT_OPEN" };
      const result = mapEventDTO(dto);
      expect(result.valid).toBe(false);
    });

    it("should reject old queue_state DIRECT (no silent fallback)", () => {
      const dto: EventDTO = { ...baseDTO, queue_state: "DIRECT" };
      const result = mapEventDTO(dto);
      expect(result.valid).toBe(false);
    });

    it("should reject old queue_state FULL (no silent fallback)", () => {
      const dto: EventDTO = { ...baseDTO, queue_state: "FULL" };
      const result = mapEventDTO(dto);
      expect(result.valid).toBe(false);
    });

    // UT-EVT17-12: Malformed DTO rejects
    it("should reject DTO with missing id", () => {
      const dto = { ...baseDTO } as Record<string, unknown>;
      delete dto.id;
      const result = mapEventDTO(dto as unknown as EventDTO);
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain("Missing required field");
      }
    });

    it("should reject DTO with missing name", () => {
      const dto = { ...baseDTO } as Record<string, unknown>;
      delete dto.name;
      const result = mapEventDTO(dto as unknown as EventDTO);
      expect(result.valid).toBe(false);
    });

    it("should reject DTO with missing display", () => {
      const dto = { ...baseDTO } as Record<string, unknown>;
      delete dto.display;
      const result = mapEventDTO(dto as unknown as EventDTO);
      expect(result.valid).toBe(false);
    });

    it("should reject DTO with missing display.enabled", () => {
      const dto = { ...baseDTO, display: {} } as unknown as EventDTO;
      const result = mapEventDTO(dto);
      expect(result.valid).toBe(false);
    });

    it("should reject DTO with non-boolean display.enabled", () => {
      const dto = {
        ...baseDTO,
        display: { enabled: "true" },
      } as unknown as EventDTO;
      const result = mapEventDTO(dto);
      expect(result.valid).toBe(false);
    });
  });

  describe("mapEventDTOs", () => {
    it("should map multiple valid DTOs", () => {
      const dtos: EventDTO[] = [
        { ...baseDTO, id: "evt_1", queue_state: "SCHEDULED" },
        { ...baseDTO, id: "evt_2", queue_state: "OPEN" },
        { ...baseDTO, id: "evt_3", queue_state: "FULL_BOOKED" },
      ];

      const events = mapEventDTOs(dtos);
      expect(events).toHaveLength(3);
      expect(events[0].id).toBe("evt_1");
      expect(events[1].id).toBe("evt_2");
      expect(events[2].id).toBe("evt_3");
    });

    it("should filter out invalid DTOs and keep valid ones", () => {
      const dtos: EventDTO[] = [
        { ...baseDTO, id: "evt_valid", queue_state: "OPEN" },
        { ...baseDTO, id: "evt_invalid", queue_state: "UNKNOWN" },
      ];

      const events = mapEventDTOs(dtos);
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe("evt_valid");
    });

    it("should call onError callback for invalid DTOs", () => {
      const onError = jest.fn();
      const dtos: EventDTO[] = [
        { ...baseDTO, id: "evt_invalid", queue_state: "UNKNOWN" },
      ];

      mapEventDTOs(dtos, onError);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toContain("Invalid queue_state");
      expect(onError.mock.calls[0][1].id).toBe("evt_invalid");
    });

    it("should return empty array for empty input", () => {
      const events = mapEventDTOs([]);
      expect(events).toHaveLength(0);
    });
  });
});
