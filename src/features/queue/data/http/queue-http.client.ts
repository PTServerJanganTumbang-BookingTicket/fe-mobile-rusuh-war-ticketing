/**
 * Queue HTTP Client
 *
 * GH-9 T5: HTTP client for /events/{id}/queue/join and /queue/me endpoints.
 * Uses existing header utilities from GH-5.
 * Returns Result<T, QueueError>.
 *
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.2, §2.5, §2.6
 *
 * @module features/queue/data/http/queue-http.client
 */

import {
  createGuestDeviceHeaders,
  createAccountHeaders,
  createQueueHeaders,
  createQueueToken,
  isGuestAuth,
} from "@/core/domain";
import {
  isQueueJoinResponse,
  isQueueMeResponse,
  isQueueErrorResponse,
  type QueueJoinResponseDto,
  type QueueMeResponseDto,
  type QueueErrorResponseDto,
} from "@/features/queue/data/dtos";
import {
  mapHttpError,
  mapNetworkError,
  mapTimeoutError,
} from "@/features/queue/data/mappers";
import type {
  QueueHttpClientPort,
  QueueHttpResult,
  QueueJoinRequest,
  QueueMeRequest,
} from "./queue-http.client.port";

/**
 * Configuration for QueueHttpClient.
 */
export interface QueueHttpClientConfig {
  /** Base URL for API (e.g., https://api.rusuh.id) */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Optional fetch implementation (for testing) */
  fetch?: typeof fetch;
}

/**
 * Default timeout for queue requests (30 seconds).
 */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Parse response body as JSON safely.
 */
async function parseJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Create AbortController with timeout.
 */
function createTimeoutController(timeoutMs: number): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timeoutId };
}

/**
 * Queue HTTP client implementation.
 */
export class QueueHttpClient implements QueueHttpClientPort {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: QueueHttpClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = config.fetch ?? fetch;
  }

  /**
   * Join the queue for an event.
   *
   * @param request - Join request with eventId, captchaToken, authContext
   * @returns Result with QueueJoinResponseDto or QueueError
   */
  async join(
    request: QueueJoinRequest
  ): Promise<QueueHttpResult<QueueJoinResponseDto>> {
    const url = `${this.baseUrl}/events/${request.eventId}/queue/join`;

    // Build headers based on auth context
    const authHeaders = isGuestAuth(request.authContext)
      ? createGuestDeviceHeaders(request.authContext.deviceId)
      : createAccountHeaders(request.authContext.accessToken);

    const { controller, timeoutId } = createTimeoutController(this.timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          captcha_token: request.captchaToken,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const body = await parseJsonBody(response);

      // Success response
      if (response.ok && isQueueJoinResponse(body)) {
        return { ok: true, data: body };
      }

      // Error response
      const errorDto = isQueueErrorResponse(body)
        ? (body as QueueErrorResponseDto)
        : undefined;

      return { ok: false, error: mapHttpError(response.status, errorDto) };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        return { ok: false, error: mapTimeoutError(this.timeoutMs) };
      }

      // Handle network errors
      return { ok: false, error: mapNetworkError(error) };
    }
  }

  /**
   * Get current queue status.
   *
   * @param request - Me request with eventId and queueToken
   * @returns Result with QueueMeResponseDto or QueueError
   */
  async getMe(
    request: QueueMeRequest
  ): Promise<QueueHttpResult<QueueMeResponseDto>> {
    const url = `${this.baseUrl}/events/${request.eventId}/queue/me`;

    const queueHeaders = createQueueHeaders(
      createQueueToken(request.queueToken)
    );

    const { controller, timeoutId } = createTimeoutController(this.timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        method: "GET",
        headers: {
          ...queueHeaders,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const body = await parseJsonBody(response);

      // Success response
      if (response.ok && isQueueMeResponse(body)) {
        return { ok: true, data: body };
      }

      // Error response
      const errorDto = isQueueErrorResponse(body)
        ? (body as QueueErrorResponseDto)
        : undefined;

      return { ok: false, error: mapHttpError(response.status, errorDto) };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        return { ok: false, error: mapTimeoutError(this.timeoutMs) };
      }

      // Handle network errors
      return { ok: false, error: mapNetworkError(error) };
    }
  }
}

/**
 * Create a QueueHttpClient instance.
 */
export function createQueueHttpClient(
  config: QueueHttpClientConfig
): QueueHttpClientPort {
  return new QueueHttpClient(config);
}
