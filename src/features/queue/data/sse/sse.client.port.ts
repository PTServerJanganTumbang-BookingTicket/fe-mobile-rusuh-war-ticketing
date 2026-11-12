/**
 * SSE Client Port
 *
 * GH-9 T6: Port interface for SSE connection management.
 * Abstracts SSE transport for testability.
 *
 * @module features/queue/data/sse/sse.client.port
 */

import type { QueueUpdate } from "@/features/queue/domain";
import type { QueueError } from "@/features/queue/domain";

/**
 * SSE connection configuration.
 */
export interface SseConnectionConfig {
  /** SSE URL from join response (sse_url) */
  sseUrl: string;
  /** Queue token for X-Queue-Token header */
  queueToken: string;
  /** Maximum reconnect attempts */
  maxReconnectAttempts?: number;
  /** Reconnect delay in milliseconds */
  reconnectDelayMs?: number;
}

/**
 * Callbacks for SSE events.
 */
export interface SseCallbacks {
  /** Called when a queue update is received */
  onUpdate: (update: QueueUpdate) => void;
  /** Called on connection or parse errors */
  onError: (error: QueueError) => void;
  /** Called when connection is closed (terminal state or manual close) */
  onClose: () => void;
}

/**
 * Raw SSE event data before parsing.
 */
export interface SseEventData {
  /** Event type from SSE "event:" line */
  type?: string;
  /** Event data from SSE "data:" line */
  data: string;
}

/**
 * Port interface for SSE client.
 * Abstracts SSE transport for testability.
 */
export interface SseClientPort {
  /**
   * Connect to SSE stream.
   *
   * CONTRACT-BASELINE.md §2.5:
   * - Connect to sse_url from join response
   * - Include X-Queue-Token header
   *
   * @param config - Connection configuration
   * @param callbacks - Event callbacks
   */
  connect(config: SseConnectionConfig, callbacks: SseCallbacks): void;

  /**
   * Close the SSE connection.
   * Triggers onClose callback.
   */
  close(): void;

  /**
   * Reconnect to SSE stream with same config.
   * Uses same sse_url and queue_token.
   */
  reconnect(): void;

  /**
   * Check if currently connected.
   */
  isConnected(): boolean;

  /**
   * Get current reconnect attempt count.
   */
  getReconnectCount(): number;
}
