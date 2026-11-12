/**
 * RealQueueDataSource
 *
 * GH-9 T7: Real backend Queue integration data source.
 * Orchestrates QueueHttpClient and SseClient to provide real-time queue updates.
 * Implements same interface pattern as FakeQueueDataSource for consistency.
 *
 * Contract Evidence: docs/CONTRACT-BASELINE.md §2.2, §2.5, §2.6
 *
 * @module features/queue/data/RealQueueDataSource
 */

import type { AuthContext } from "@/core/domain";
import type { QueueUpdate, QueueError } from "@/features/queue/domain";
import { extractGrantMetadata } from "@/features/queue/data/dtos";
import type { QueueHttpClientPort } from "@/features/queue/data/http";
import { QueueHttpClient } from "@/features/queue/data/http";
import type {
  SseClientPort,
  SseConnectionConfig,
} from "@/features/queue/data/sse";
import { SseClient } from "@/features/queue/data/sse";

/**
 * Configuration for RealQueueDataSource.
 */
export interface RealQueueDataSourceConfig {
  /** Event ID to join queue for */
  eventId: string;
  /** CAPTCHA verification token */
  captchaToken: string;
  /** Authentication context (guest or authenticated) */
  authContext: AuthContext;
  /** API base URL */
  apiBaseUrl: string;
  /** Callback for state updates */
  onUpdate?: (update: QueueUpdate) => void;
  /** Callback when queue flow completes (terminal state) */
  onComplete?: () => void;
  /** Callback on errors */
  onError?: (error: QueueError) => void;
  /** HTTP client (injectable for testing) */
  httpClient?: QueueHttpClientPort;
  /** SSE client (injectable for testing) */
  sseClient?: SseClientPort;
  /** HTTP request timeout in milliseconds */
  timeoutMs?: number;
  /** SSE max reconnect attempts */
  maxReconnectAttempts?: number;
  /** SSE reconnect delay in milliseconds */
  reconnectDelayMs?: number;
}

/**
 * RealQueueDataSource
 *
 * Manages real queue integration:
 * 1. Joins queue via HTTP POST
 * 2. Connects to SSE stream for real-time updates
 * 3. Detects grant state and fetches grant metadata via /me
 * 4. Handles terminal states (CLOSED) and errors
 */
export class RealQueueDataSource {
  private readonly config: RealQueueDataSourceConfig;
  private readonly httpClient: QueueHttpClientPort;
  private readonly sseClient: SseClientPort;

  private isRunning: boolean = false;
  private queueToken: string | null = null;
  private sseUrl: string | null = null;
  private currentState: QueueUpdate | null = null;

  private onUpdate: ((update: QueueUpdate) => void) | null;
  private onComplete: (() => void) | null;
  private onError: ((error: QueueError) => void) | null;

  constructor(config: RealQueueDataSourceConfig) {
    this.config = config;
    this.onUpdate = config.onUpdate ?? null;
    this.onComplete = config.onComplete ?? null;
    this.onError = config.onError ?? null;

    // Use injected clients or create defaults
    this.httpClient =
      config.httpClient ??
      new QueueHttpClient({
        baseUrl: config.apiBaseUrl,
        timeoutMs: config.timeoutMs,
      });

    this.sseClient = config.sseClient ?? new SseClient();
  }

  /**
   * Start the queue integration flow.
   * 1. Join queue via HTTP
   * 2. Connect SSE on success
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return; // Idempotent
    }

    this.isRunning = true;

    // Step 1: Join queue
    const joinResult = await this.httpClient.join({
      eventId: this.config.eventId,
      captchaToken: this.config.captchaToken,
      authContext: this.config.authContext,
    });

    if (!joinResult.ok) {
      this.isRunning = false;
      this.emitError(joinResult.error);
      return;
    }

    // Store tokens from join response
    this.queueToken = joinResult.data.queue_token;
    this.sseUrl = joinResult.data.sse_url;

    // Handle rejoin case
    if (joinResult.data.rejoined && joinResult.data.state) {
      // Emit initial state from rejoin
      this.emitInitialStateFromRejoin(joinResult.data);
    }

    // Step 2: Connect SSE
    this.connectSse();
  }

  /**
   * Stop the queue integration.
   * Closes SSE connection.
   */
  stop(): void {
    this.isRunning = false;
    this.sseClient.close();
  }

  /**
   * Retry the queue integration.
   * Stops current flow and restarts.
   */
  async retry(): Promise<void> {
    this.stop();
    await this.start();
  }

  /**
   * Get current state (for testing/debugging).
   */
  getCurrentState(): QueueUpdate | null {
    return this.currentState ? { ...this.currentState } : null;
  }

  /**
   * Check if currently running.
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get queue token (for external use).
   */
  getQueueToken(): string | null {
    return this.queueToken;
  }

  /**
   * Update callbacks at runtime.
   */
  setCallbacks(
    callbacks: Partial<
      Pick<RealQueueDataSourceConfig, "onUpdate" | "onComplete" | "onError">
    >
  ): void {
    if (callbacks.onUpdate !== undefined) {
      this.onUpdate = callbacks.onUpdate;
    }
    if (callbacks.onComplete !== undefined) {
      this.onComplete = callbacks.onComplete;
    }
    if (callbacks.onError !== undefined) {
      this.onError = callbacks.onError;
    }
  }

  /**
   * Connect to SSE stream.
   */
  private connectSse(): void {
    if (!this.sseUrl || !this.queueToken) {
      return;
    }

    const sseConfig: SseConnectionConfig = {
      sseUrl: this.sseUrl,
      queueToken: this.queueToken,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      reconnectDelayMs: this.config.reconnectDelayMs,
    };

    this.sseClient.connect(sseConfig, {
      onUpdate: (update) => this.handleSseUpdate(update),
      onError: (error) => this.handleSseError(error),
      onClose: () => this.handleSseClose(),
    });
  }

  /**
   * Handle SSE update events.
   */
  private async handleSseUpdate(update: QueueUpdate): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.currentState = update;

    // Check for grant state - need to fetch grant metadata via /me
    if (update.engagementState === "GRANTED" && !update.grant) {
      await this.fetchGrantMetadata(update);
      return; // fetchGrantMetadata will emit the update
    }

    // Check for terminal state
    if (update.queueState === "CLOSED") {
      this.emitUpdate(update);
      this.handleTerminalState();
      return;
    }

    this.emitUpdate(update);
  }

  /**
   * Handle SSE error events.
   */
  private handleSseError(error: QueueError): void {
    this.emitError(error);
  }

  /**
   * Handle SSE connection close.
   */
  private handleSseClose(): void {
    if (this.isRunning) {
      // Unexpected close
      this.isRunning = false;
    }
  }

  /**
   * Fetch grant metadata via /me endpoint.
   */
  private async fetchGrantMetadata(baseUpdate: QueueUpdate): Promise<void> {
    if (!this.queueToken) {
      this.emitUpdate(baseUpdate);
      return;
    }

    const meResult = await this.httpClient.getMe({
      eventId: this.config.eventId,
      queueToken: this.queueToken,
    });

    if (!meResult.ok) {
      // Still emit the update without grant metadata
      this.emitUpdate(baseUpdate);
      this.emitError(meResult.error);
      return;
    }

    // Extract grant metadata
    const grantMetadata = extractGrantMetadata(meResult.data);

    const enrichedUpdate: QueueUpdate = {
      ...baseUpdate,
      grant: grantMetadata
        ? {
            grant_token: grantMetadata.grantToken,
            booking_expires_at: grantMetadata.expiresAt,
          }
        : undefined,
    };

    this.currentState = enrichedUpdate;
    this.emitUpdate(enrichedUpdate);
  }

  /**
   * Handle terminal state (CLOSED).
   */
  private handleTerminalState(): void {
    this.isRunning = false;
    this.sseClient.close();
    this.emitComplete();
  }

  /**
   * Emit initial state from rejoin response.
   */
  private emitInitialStateFromRejoin(joinData: {
    ticket_no: number;
    joined_at: string;
    state?: string;
  }): void {
    // Create initial update from rejoin data
    const initialUpdate: QueueUpdate = {
      position: joinData.ticket_no,
      queueState: "OPEN", // Assume OPEN on rejoin
      engagementState:
        (joinData.state as QueueUpdate["engagementState"]) ?? "QUEUED",
      serverTime: joinData.joined_at,
    };

    this.currentState = initialUpdate;
    this.emitUpdate(initialUpdate);
  }

  private emitUpdate(update: QueueUpdate): void {
    if (this.onUpdate) {
      try {
        this.onUpdate(update);
      } catch {
        // Ignore callback errors
      }
    }
  }

  private emitComplete(): void {
    if (this.onComplete) {
      try {
        this.onComplete();
      } catch {
        // Ignore callback errors
      }
    }
  }

  private emitError(error: QueueError): void {
    if (this.onError) {
      try {
        this.onError(error);
      } catch {
        // Ignore callback errors
      }
    }
  }
}

/**
 * Create a RealQueueDataSource instance.
 */
export function createRealQueueDataSource(
  config: RealQueueDataSourceConfig
): RealQueueDataSource {
  return new RealQueueDataSource(config);
}
