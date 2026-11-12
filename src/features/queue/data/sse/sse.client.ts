/**
 * SSE Client
 *
 * GH-9 T6: Wrapper for SSE connection lifecycle management.
 * Handles connection, message parsing, error handling, and reconnection.
 *
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.5
 *
 * @module features/queue/data/sse/sse.client
 */

import { createSseConnectionError } from "@/features/queue/domain";
import {
  parseSseMessage,
  isHeartbeat,
  isErrorMessage,
  extractErrorDetails,
} from "@/features/queue/data/mappers";
import type {
  SseClientPort,
  SseConnectionConfig,
  SseCallbacks,
} from "./sse.client.port";

/**
 * Configuration for SseClient.
 */
export interface SseClientConfig {
  /** Factory to create EventSource instances (for testing) */
  eventSourceFactory?: EventSourceFactory;
}

/**
 * Factory type for creating EventSource-like instances.
 */
export type EventSourceFactory = (
  url: string,
  init?: EventSourceInit
) => EventSourceLike;

/**
 * Minimal interface matching EventSource behavior.
 */
export interface EventSourceLike {
  readonly readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  close(): void;
  addEventListener(type: string, listener: (event: MessageEvent) => void): void;
  removeEventListener(
    type: string,
    listener: (event: MessageEvent) => void
  ): void;
}

/**
 * EventSource ready states.
 */
const READY_STATE = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSED: 2,
} as const;

/**
 * Default configuration values.
 */
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 3;
const DEFAULT_RECONNECT_DELAY_MS = 1000;

/**
 * SSE Client implementation.
 */
export class SseClient implements SseClientPort {
  private eventSource: EventSourceLike | null = null;
  private config: SseConnectionConfig | null = null;
  private callbacks: SseCallbacks | null = null;
  private reconnectCount = 0;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly eventSourceFactory: EventSourceFactory;

  constructor(clientConfig?: SseClientConfig) {
    // Default to native EventSource if available
    this.eventSourceFactory =
      clientConfig?.eventSourceFactory ??
      ((url: string) => new EventSource(url) as unknown as EventSourceLike);
  }

  /**
   * Connect to SSE stream.
   */
  connect(config: SseConnectionConfig, callbacks: SseCallbacks): void {
    // Store config and callbacks for reconnection
    this.config = config;
    this.callbacks = callbacks;
    this.reconnectCount = 0;

    this.doConnect();
  }

  /**
   * Internal connection logic.
   */
  private doConnect(): void {
    if (!this.config || !this.callbacks) {
      return;
    }

    // Close existing connection if any
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      // Create EventSource with headers via URL or custom transport
      // Note: Standard EventSource doesn't support custom headers,
      // so queue_token may need to be in URL or via polyfill
      const url = this.buildSseUrl(this.config.sseUrl, this.config.queueToken);

      this.eventSource = this.eventSourceFactory(url);

      this.setupEventHandlers();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create SSE connection";
      this.callbacks.onError(createSseConnectionError(message));
    }
  }

  /**
   * Build SSE URL with queue token.
   * Appends token as query param since EventSource doesn't support custom headers.
   */
  private buildSseUrl(baseUrl: string, queueToken: string): string {
    const url = new URL(baseUrl);
    url.searchParams.set("token", queueToken);
    return url.toString();
  }

  /**
   * Setup event handlers for EventSource.
   */
  private setupEventHandlers(): void {
    if (!this.eventSource || !this.callbacks) {
      return;
    }

    this.eventSource.onopen = () => {
      // Reset reconnect count on successful connection
      this.reconnectCount = 0;
    };

    this.eventSource.onmessage = (event: MessageEvent) => {
      this.handleMessage(event.data, undefined);
    };

    this.eventSource.onerror = () => {
      // Handle connection errors
      if (this.eventSource?.readyState === READY_STATE.CLOSED) {
        // Connection closed by server
        this.handleDisconnect();
      }
      // Transient error - EventSource will auto-reconnect
      // We track this for max attempt limiting
    };

    // Add listeners for typed events
    const eventTypes = ["position", "state", "grant", "heartbeat", "error"];
    for (const eventType of eventTypes) {
      this.eventSource.addEventListener(eventType, (event: MessageEvent) => {
        this.handleMessage(event.data, eventType);
      });
    }
  }

  /**
   * Handle incoming SSE message.
   */
  private handleMessage(data: string, eventType?: string): void {
    if (!this.callbacks) {
      return;
    }

    // Skip heartbeats (no data update)
    if (isHeartbeat(data, eventType)) {
      return;
    }

    // Handle error events
    if (isErrorMessage(data, eventType)) {
      const details = extractErrorDetails(data);
      this.callbacks.onError(
        createSseConnectionError(details?.message ?? "SSE error")
      );
      return;
    }

    // Parse message to QueueUpdate
    const update = parseSseMessage(data, eventType);
    if (update) {
      this.callbacks.onUpdate(update);
    }
    // Ignore unparseable messages (graceful degradation)
  }

  /**
   * Handle disconnection.
   */
  private handleDisconnect(): void {
    if (!this.config || !this.callbacks) {
      return;
    }

    const maxAttempts =
      this.config.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS;

    if (this.reconnectCount < maxAttempts) {
      // Attempt reconnect
      this.scheduleReconnect();
    } else {
      // Max reconnects reached - emit error and close
      this.callbacks.onError(
        createSseConnectionError(
          `Max reconnect attempts (${maxAttempts}) reached`
        )
      );
      this.callbacks.onClose();
    }
  }

  /**
   * Schedule a reconnection attempt.
   */
  private scheduleReconnect(): void {
    if (!this.config) {
      return;
    }

    const delayMs = this.config.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY_MS;

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectCount++;
      this.doConnect();
    }, delayMs);
  }

  /**
   * Close the SSE connection.
   */
  close(): void {
    // Clear any pending reconnect
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    // Close EventSource
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Notify closure
    if (this.callbacks) {
      this.callbacks.onClose();
    }
  }

  /**
   * Reconnect to SSE stream with same config.
   */
  reconnect(): void {
    if (!this.config || !this.callbacks) {
      return;
    }

    // Close existing and reconnect
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.reconnectCount++;
    this.doConnect();
  }

  /**
   * Check if currently connected.
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === READY_STATE.OPEN;
  }

  /**
   * Get current reconnect attempt count.
   */
  getReconnectCount(): number {
    return this.reconnectCount;
  }
}

/**
 * Create an SseClient instance.
 */
export function createSseClient(config?: SseClientConfig): SseClientPort {
  return new SseClient(config);
}
