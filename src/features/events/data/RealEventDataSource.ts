/**
 * RealEventDataSource
 *
 * GH-17: HTTP adapter for GET /events endpoint.
 * Implements real API integration while preserving repository port pattern.
 *
 * Contract: sjtrbt20261112.openapi.json
 * - No authentication required
 * - Query: limit (default 10, max 50), offset (default 0)
 * - NO filter parameter (backend ignores it)
 */

import type { Event } from "../domain";
import type { EventsResponseDTO, EventDTO } from "./dto";
import { mapEventDTOs } from "./mappers";

/**
 * API error types for error handling
 */
export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "CONTRACT_DRIFT"
  | "UNKNOWN";

/**
 * Structured API error for domain layer consumption
 */
export class ApiError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode?: number,
    public readonly url?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Configuration for RealEventDataSource
 */
export type RealEventDataSourceConfig = {
  /** Base URL for API requests (e.g., "https://api.example.com") */
  baseUrl: string;
  /** Default limit for pagination (default: 10) */
  defaultLimit?: number;
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number;
  /** Error callback for validation failures */
  onValidationError?: (error: string, dto: EventDTO) => void;
};

/**
 * Pagination parameters for getEvents
 */
export type GetEventsParams = {
  /** Number of events to return (1-50, default 10) */
  limit?: number;
  /** Offset for pagination (default 0) */
  offset?: number;
};

/**
 * HTTP data source for events
 * Makes real API calls to GET /events
 */
export class RealEventDataSource {
  private config: Required<
    Omit<RealEventDataSourceConfig, "onValidationError">
  > & {
    onValidationError?: (error: string, dto: EventDTO) => void;
  };

  constructor(config: RealEventDataSourceConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      defaultLimit: config.defaultLimit ?? 10,
      timeoutMs: config.timeoutMs ?? 30000,
      onValidationError: config.onValidationError,
    };
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(params: GetEventsParams): string {
    const url = new URL("/events", this.config.baseUrl);
    const limit = params.limit ?? this.config.defaultLimit;
    const offset = params.offset ?? 0;

    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", String(offset));

    // NOTE: No 'filter' parameter - backend ignores it (R2-AC5)

    return url.toString();
  }

  /**
   * Create abort controller with timeout
   */
  private createTimeoutController(): AbortController {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), this.config.timeoutMs);
    return controller;
  }

  /**
   * Fetch events from real API
   * @param params - Pagination parameters
   * @returns Array of domain Event objects
   * @throws ApiError on failure
   */
  async getEvents(params: GetEventsParams = {}): Promise<Event[]> {
    const url = this.buildUrl(params);
    const controller = this.createTimeoutController();

    try {
      const response = await fetch(url, {
        method: "GET",
        // NOTE: No auth headers - endpoint is public (R2-AC2)
        headers: {
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      // Handle HTTP errors
      if (!response.ok) {
        return this.handleHttpError(response, url);
      }

      // Parse JSON response
      const json = await this.parseJsonResponse(response, url);

      // Validate response envelope
      const responseDTO = this.validateResponseEnvelope(json, url);

      // Map DTOs to domain events (with validation)
      const events = mapEventDTOs(
        responseDTO.data.items,
        this.config.onValidationError
      );

      return events;
    } catch (error) {
      // Re-throw ApiError as-is
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError(
          "NETWORK_ERROR",
          `Request timeout after ${this.config.timeoutMs}ms`,
          undefined,
          url
        );
      }

      // Handle network errors
      if (error instanceof TypeError) {
        throw new ApiError(
          "NETWORK_ERROR",
          `Network error: ${error.message}`,
          undefined,
          url
        );
      }

      // Unknown error
      throw new ApiError(
        "UNKNOWN",
        error instanceof Error ? error.message : "Unknown error",
        undefined,
        url
      );
    }
  }

  /**
   * Handle HTTP error responses
   */
  private handleHttpError(response: Response, url: string): never {
    const statusCode = response.status;

    if (statusCode === 400) {
      throw new ApiError(
        "VALIDATION_ERROR",
        `Bad request (400)`,
        statusCode,
        url
      );
    }

    if (statusCode === 503) {
      throw new ApiError(
        "INTERNAL_ERROR",
        `Service unavailable (503)`,
        statusCode,
        url
      );
    }

    throw new ApiError("UNKNOWN", `HTTP error ${statusCode}`, statusCode, url);
  }

  /**
   * Parse JSON response safely
   */
  private async parseJsonResponse(
    response: Response,
    url: string
  ): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new ApiError(
        "PARSE_ERROR",
        "Failed to parse JSON response",
        response.status,
        url
      );
    }
  }

  /**
   * Validate response envelope structure
   */
  private validateResponseEnvelope(
    json: unknown,
    url: string
  ): EventsResponseDTO {
    if (!json || typeof json !== "object") {
      throw new ApiError(
        "PARSE_ERROR",
        "Response is not an object",
        undefined,
        url
      );
    }

    const obj = json as Record<string, unknown>;

    if (!obj.data || typeof obj.data !== "object") {
      throw new ApiError(
        "PARSE_ERROR",
        "Response missing 'data' field",
        undefined,
        url
      );
    }

    const data = obj.data as Record<string, unknown>;

    if (!Array.isArray(data.items)) {
      throw new ApiError(
        "PARSE_ERROR",
        "Response 'data.items' is not an array",
        undefined,
        url
      );
    }

    return json as EventsResponseDTO;
  }
}
