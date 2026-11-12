/**
 * Queue SSE Client Barrel
 *
 * @module features/queue/data/sse
 */

export type {
  SseClientPort,
  SseConnectionConfig,
  SseCallbacks,
  SseEventData,
} from "./sse.client.port";

export type { SseClientConfig } from "./sse.client";

export { SseClient, createSseClient } from "./sse.client";
