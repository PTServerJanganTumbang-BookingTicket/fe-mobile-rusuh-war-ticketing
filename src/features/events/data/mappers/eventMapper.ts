/**
 * Event DTO Mapper
 *
 * GH-17: Validates and maps EventDTO to domain Event.
 * Implements strict validation - unknown queue_state values fail deterministically.
 * NO silent fallback to any known state (R17-AC4).
 */

import type { Event, QueueState } from "../../domain";
import type { EventDTO } from "../dto";
import { isValidQueueState } from "../dto";

/**
 * Validation result for EventDTO mapping
 */
export type EventDTOValidationResult =
  | { valid: true; event: Event }
  | { valid: false; error: string; dto: EventDTO };

/**
 * Required fields for EventDTO validation
 */
const REQUIRED_FIELDS: (keyof EventDTO)[] = [
  "id",
  "name",
  "category",
  "location",
  "date",
  "image_url",
  "queue_state",
  "display",
];

/**
 * Validates the location object (contract v2.27): must be an object
 * with non-empty venue and city strings.
 */
function validateLocation(dto: EventDTO): string | null {
  const location = dto.location as unknown;

  if (typeof location !== "object" || location === null) {
    return "Invalid location: expected object with venue and city";
  }

  const { venue, city } = location as { venue?: unknown; city?: unknown };

  if (typeof venue !== "string" || venue.trim() === "") {
    return "Invalid location: missing venue";
  }

  if (typeof city !== "string" || city.trim() === "") {
    return "Invalid location: missing city";
  }

  return null;
}

/**
 * Validates that all required fields are present and non-null
 */
function validateRequiredFields(dto: EventDTO): string | null {
  for (const field of REQUIRED_FIELDS) {
    if (dto[field] === undefined || dto[field] === null) {
      return `Missing required field: ${field}`;
    }
  }

  // Validate display.enabled is boolean
  if (typeof dto.display?.enabled !== "boolean") {
    return "Missing or invalid display.enabled field";
  }

  return null;
}

/**
 * Maps and validates EventDTO to domain Event
 *
 * @param dto - Raw API event response
 * @returns Validation result with either mapped Event or error details
 *
 * Validation rules:
 * - All required fields must be present
 * - queue_state must be one of: SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED
 * - Unknown queue_state values FAIL (no silent fallback)
 */
export function mapEventDTO(dto: EventDTO): EventDTOValidationResult {
  // Validate required fields
  const fieldError = validateRequiredFields(dto);
  if (fieldError) {
    return {
      valid: false,
      error: fieldError,
      dto,
    };
  }

  // Validate location object (contract v2.27)
  const locationError = validateLocation(dto);
  if (locationError) {
    return {
      valid: false,
      error: locationError,
      dto,
    };
  }

  // Validate queue_state - STRICT, no fallback
  if (!isValidQueueState(dto.queue_state)) {
    return {
      valid: false,
      error: `Invalid queue_state: "${dto.queue_state}" is not one of SCHEDULED, OPEN, FULL_QUEUE, FULL_BOOKED, CLOSED`,
      dto,
    };
  }

  // Map DTO to domain Event
  const event: Event = {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    // Contract v2.27: location is { venue, city }; domain uses a combined string
    location: `${dto.location.venue}, ${dto.location.city}`,
    date: dto.date,
    imageUrl: dto.image_url, // snake_case → camelCase
    queueState: dto.queue_state as QueueState, // Validated above
    display: {
      enabled: dto.display.enabled,
    },
    // Optional field: map null to undefined
    ...(dto.sale_starts_at && { saleStartsAt: dto.sale_starts_at }),
  };

  return {
    valid: true,
    event,
  };
}

/**
 * Maps multiple EventDTOs, returning only valid events
 * Logs errors for invalid events but does not throw
 *
 * @param dtos - Array of raw API event responses
 * @param onError - Optional callback for validation errors
 * @returns Array of valid domain Events
 */
export function mapEventDTOs(
  dtos: EventDTO[],
  onError?: (error: string, dto: EventDTO) => void
): Event[] {
  const events: Event[] = [];

  for (const dto of dtos) {
    const result = mapEventDTO(dto);
    if (result.valid) {
      events.push(result.event);
    } else if (onError) {
      onError(result.error, result.dto);
    }
  }

  return events;
}
