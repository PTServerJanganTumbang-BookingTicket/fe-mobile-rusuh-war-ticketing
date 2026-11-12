/**
 * Queue Data Source Factory
 *
 * GH-9 T8: Factory for creating Queue data sources.
 * Enables selection between FakeQueueDataSource and RealQueueDataSource.
 *
 * @module features/queue/data/queue-data-source.factory
 */

import type { AuthContext } from "@/core/domain";
import type {
  QueueScenario,
  QueueUpdate,
  QueueError,
} from "@/features/queue/domain";
import { FakeQueueDataSource } from "./FakeQueueDataSource";
import type { FakeQueueDataSourceConfig } from "./FakeQueueDataSource";
import { RealQueueDataSource } from "./RealQueueDataSource";
import type { RealQueueDataSourceConfig } from "./RealQueueDataSource";

/**
 * Data source mode.
 */
export type QueueDataSourceMode = "fake" | "real";

/**
 * Common callbacks for both data source types.
 */
export interface QueueDataSourceCallbacks {
  onUpdate?: (update: QueueUpdate) => void;
  onComplete?: () => void;
  onError?: (error: QueueError) => void;
}

/**
 * Configuration for fake data source.
 */
export interface FakeQueueConfig extends QueueDataSourceCallbacks {
  mode: "fake";
  /** Scenario to play */
  scenario?: QueueScenario;
}

/**
 * Configuration for real data source.
 */
export interface RealQueueConfig extends QueueDataSourceCallbacks {
  mode: "real";
  /** Event ID to join queue for */
  eventId: string;
  /** CAPTCHA verification token */
  captchaToken: string;
  /** Authentication context */
  authContext: AuthContext;
  /** API base URL */
  apiBaseUrl: string;
  /** HTTP request timeout in milliseconds */
  timeoutMs?: number;
  /** SSE max reconnect attempts */
  maxReconnectAttempts?: number;
  /** SSE reconnect delay in milliseconds */
  reconnectDelayMs?: number;
}

/**
 * Union type for factory configuration.
 */
export type QueueDataSourceConfig = FakeQueueConfig | RealQueueConfig;

/**
 * Common interface for queue data source operations.
 * Both FakeQueueDataSource and RealQueueDataSource implement these methods.
 */
export interface QueueDataSourceLike {
  start(): void | Promise<void>;
  stop(): void;
  retry(): void | Promise<void>;
  getCurrentState(): QueueUpdate | null;
  getIsRunning(): boolean;
  setCallbacks(callbacks: Partial<QueueDataSourceCallbacks>): void;
}

/**
 * Type guard for fake config.
 */
export function isFakeConfig(
  config: QueueDataSourceConfig
): config is FakeQueueConfig {
  return config.mode === "fake";
}

/**
 * Type guard for real config.
 */
export function isRealConfig(
  config: QueueDataSourceConfig
): config is RealQueueConfig {
  return config.mode === "real";
}

/**
 * Create a Queue data source based on configuration.
 *
 * @param config - Data source configuration
 * @returns FakeQueueDataSource or RealQueueDataSource
 *
 * @example
 * // Create fake data source for testing
 * const fake = createQueueDataSource({
 *   mode: 'fake',
 *   scenario: GRANT_FAST_SCENARIO,
 *   onUpdate: (update) => console.log(update),
 * });
 *
 * @example
 * // Create real data source for production
 * const real = createQueueDataSource({
 *   mode: 'real',
 *   eventId: 'evt_123',
 *   captchaToken: 'token',
 *   authContext: { type: 'guest', deviceId: createDeviceId('...') },
 *   apiBaseUrl: 'https://api.rusuh.id',
 *   onUpdate: (update) => console.log(update),
 * });
 */
export function createQueueDataSource(
  config: FakeQueueConfig
): FakeQueueDataSource;
export function createQueueDataSource(
  config: RealQueueConfig
): RealQueueDataSource;
export function createQueueDataSource(
  config: QueueDataSourceConfig
): FakeQueueDataSource | RealQueueDataSource;
export function createQueueDataSource(
  config: QueueDataSourceConfig
): FakeQueueDataSource | RealQueueDataSource {
  if (isFakeConfig(config)) {
    const fakeConfig: FakeQueueDataSourceConfig = {
      scenario: config.scenario,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onError: config.onError
        ? (error: Error) => {
            // Convert Error to QueueError for consistency
            const queueError: QueueError = {
              code: "UNKNOWN_ERROR",
              message: error.message,
              retryable: false,
            };
            config.onError?.(queueError);
          }
        : undefined,
    };

    return new FakeQueueDataSource(fakeConfig);
  }

  // Real config
  const realConfig: RealQueueDataSourceConfig = {
    eventId: config.eventId,
    captchaToken: config.captchaToken,
    authContext: config.authContext,
    apiBaseUrl: config.apiBaseUrl,
    onUpdate: config.onUpdate,
    onComplete: config.onComplete,
    onError: config.onError,
    timeoutMs: config.timeoutMs,
    maxReconnectAttempts: config.maxReconnectAttempts,
    reconnectDelayMs: config.reconnectDelayMs,
  };

  return new RealQueueDataSource(realConfig);
}

/**
 * Create a FakeQueueDataSource directly.
 * Convenience wrapper for explicit fake creation.
 */
export function createFakeQueueDataSource(
  config: Omit<FakeQueueConfig, "mode">
): FakeQueueDataSource {
  return createQueueDataSource({ ...config, mode: "fake" });
}

/**
 * Create a RealQueueDataSource directly.
 * Convenience wrapper for explicit real creation.
 */
export function createRealQueueDataSource(
  config: Omit<RealQueueConfig, "mode">
): RealQueueDataSource {
  return createQueueDataSource({ ...config, mode: "real" });
}
