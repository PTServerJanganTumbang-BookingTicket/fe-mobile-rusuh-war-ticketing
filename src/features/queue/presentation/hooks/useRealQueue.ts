/**
 * useRealQueue Hook
 *
 * Real-backend queue waiting room state management. The data source (and a
 * /queue/me poll adapter) are injected by the app layer to respect layer
 * boundaries (presentation cannot import the data layer directly).
 * Updates are consumed via:
 * - SSE stream when the runtime provides EventSource (browsers/node)
 * - Polling GET /queue/me when EventSource is unavailable (React Native/Hermes),
 *   deriving position from ticket_no - now_serving (deployed contract v2.27)
 *
 * Returns the same UseQueueResult shape as useQueue, so WaitingRoomScreen
 * renders unchanged for fake and real sources.
 *
 * @module features/queue/presentation/hooks/useRealQueue
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { QueueState, EngagementState } from "@/core/domain";
import type {
  QueueUpdate,
  GrantInfo,
  QueueError,
} from "@/features/queue/domain";
import {
  calculateEta,
  formatEta,
  calculateProgress,
} from "@/features/queue/domain";
import type { UseQueueResult, GrantPresentationInfo } from "./useQueue";

/** Poll /queue/me every 4 seconds when SSE is unavailable. */
const DEFAULT_POLL_INTERVAL_MS = 4_000;

/**
 * Minimal data source surface this hook needs.
 * Implemented by the real queue data source (injected from the app layer).
 */
export interface RealQueueDataSourcePort {
  /** Join the queue and start consuming updates. */
  start(): void | Promise<void>;
  /** Stop consuming updates. */
  stop(): void;
  /** Stop and restart the flow. */
  retry(): void | Promise<void>;
  /** Register update callbacks. */
  setCallbacks(callbacks: {
    onUpdate?: (update: QueueUpdate) => void;
    onComplete?: () => void;
    onError?: (error: QueueError) => void;
  }): void;
  /** Queue token issued by the backend after a successful join. */
  getQueueToken(): string | null;
}

/**
 * One /queue/me snapshot (structural subset of the backend response; the
 * app layer adapts QueueHttpClient.getMe results to this shape).
 */
export interface QueuePollSnapshot {
  /** Engagement state (e.g. QUEUED, GRANTED) */
  state?: string;
  /** Current queue position if still queued */
  position?: number;
  /** Our ticket number (deployed contract v2.27) */
  ticket_no?: number;
  /** Ticket currently being served */
  now_serving?: number;
  /** Rate per minute for ETA calculation */
  rate_per_min?: number;
  /** Grant token when state is GRANTED */
  grant_token?: string;
  /** ISO 8601 timestamp when grant expires */
  booking_expires_at?: string;
  /** Server time */
  server_time: string;
}

/** Adapter performing one /queue/me request; resolves null on failure. */
export type PollMeFn = (
  queueToken: string
) => Promise<QueuePollSnapshot | null>;

/**
 * Configuration for useRealQueue hook.
 */
export interface UseRealQueueConfig {
  /** Real queue data source (injected; owns join + SSE). */
  dataSource: RealQueueDataSourcePort;
  /** /queue/me poll adapter (injected; used when SSE is unavailable). */
  pollMe: PollMeFn;
  /** Auto-start (join) on mount. Defaults to true. */
  autoStart?: boolean;
  /** Callback when a grant is received. */
  onGranted?: (grant: GrantInfo) => void;
  /** /queue/me poll interval when SSE transport is unavailable (default 4s). */
  pollIntervalMs?: number;
}

/**
 * Derive a QueueUpdate from a /queue/me snapshot.
 * The deployed backend (contract v2.27) returns ticket_no + now_serving;
 * position = ticket_no - now_serving (minimum 1 while QUEUED).
 */
function updateFromMe(
  me: QueuePollSnapshot,
  previousPosition: number,
  previousQueueState: QueueState
): QueueUpdate {
  const derived =
    me.ticket_no !== undefined && me.now_serving !== undefined
      ? Math.max(me.ticket_no - me.now_serving, 1)
      : undefined;

  const engagementState = (me.state as EngagementState) || "QUEUED";

  return {
    position: me.position ?? derived ?? previousPosition,
    // /queue/me does not carry the event-level queue state; keep the last one.
    queueState: previousQueueState,
    engagementState,
    serverTime: me.server_time,
    ratePerMin: me.rate_per_min,
    ...(me.grant_token &&
      me.booking_expires_at && {
        grant: {
          grant_token: me.grant_token,
          booking_expires_at: me.booking_expires_at,
        },
      }),
  };
}

/**
 * useRealQueue Hook
 *
 * Joins the real queue and provides presentation state for the waiting room.
 */
export function useRealQueue(config: UseRealQueueConfig): UseQueueResult {
  const {
    dataSource,
    pollMe,
    autoStart = true,
    onGranted,
    pollIntervalMs,
  } = config;

  // Presentation state (same shape as useQueue)
  const [position, setPosition] = useState(0);
  const [initialPosition, setInitialPosition] = useState(0);
  const [queueState, setQueueState] = useState<QueueState>("OPEN");
  const [engagementState, setEngagementState] =
    useState<EngagementState>("QUEUED");
  const [ratePerMin, setRatePerMin] = useState(20);
  const [grant, setGrant] = useState<GrantPresentationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const dataSourceRef = useRef<RealQueueDataSourcePort | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Latest values for poll-derived updates (avoid stale closures)
  const positionRef = useRef(position);
  const queueStateRef = useRef(queueState);
  const initialPositionRef = useRef(0);

  // No EventSource in React Native/Hermes — poll instead of SSE
  const sseAvailable = typeof EventSource !== "undefined";

  // Calculated values (same as useQueue)
  const etaMinutes = calculateEta(position, ratePerMin);
  const etaDisplay = formatEta(etaMinutes);
  const progress = calculateProgress(initialPosition || position, position);
  const isGranted = engagementState === "GRANTED";

  const handleUpdate = useCallback(
    (update: QueueUpdate) => {
      // First observed position becomes the progress baseline
      if (initialPositionRef.current === 0 && update.position > 0) {
        initialPositionRef.current = update.position;
        setInitialPosition(update.position);
      }
      setPosition(update.position);
      positionRef.current = update.position;
      setQueueState(update.queueState);
      queueStateRef.current = update.queueState;
      setEngagementState(update.engagementState);
      if (update.ratePerMin !== undefined) {
        setRatePerMin(update.ratePerMin);
      }
      setLoading(false);

      if (update.engagementState === "GRANTED" && update.grant) {
        setGrant({
          token: update.grant.grant_token,
          expiresAt: update.grant.booking_expires_at,
        });
        onGranted?.(update.grant);
      }
    },
    [onGranted]
  );

  const handleComplete = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleError = useCallback((err: Error) => {
    setError(err);
    setLoading(false);
    setIsRunning(false);
  }, []);

  // Retry: restart the data source lifecycle
  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setGrant(null);
    dataSourceRef.current?.retry();
    setIsRunning(true);
  }, []);

  // Initialize and manage the real data source lifecycle
  useEffect(() => {
    if (!autoStart) {
      return;
    }

    let cancelled = false;

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const startPolling = () => {
      if (pollTimerRef.current) {
        return; // already polling
      }

      const poll = async () => {
        const queueToken = dataSource.getQueueToken();
        if (!queueToken) {
          return; // join not finished yet
        }
        try {
          const me = await pollMe(queueToken);
          if (!cancelled && me) {
            handleUpdate(
              updateFromMe(me, positionRef.current, queueStateRef.current)
            );
          }
          // Poll failures are tolerated; the next tick retries.
        } catch {
          // ignore — polling continues
        }
      };

      void poll();
      pollTimerRef.current = setInterval(
        () => void poll(),
        pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS
      );
    };

    // The app layer constructs the data source; this hook owns the callbacks.
    dataSource.setCallbacks({
      onUpdate: handleUpdate,
      onComplete: handleComplete,
      onError: (queueError) => handleError(new Error(queueError.message)),
    });
    dataSourceRef.current = dataSource;

    void Promise.resolve(dataSource.start()).then(() => {
      if (cancelled) {
        return;
      }
      if (!sseAvailable) {
        // Hermes/React Native: SSE connect failed (expected) — clear the
        // SSE error and fall back to polling /queue/me for updates.
        setError(null);
        startPolling();
      }
    });
    setIsRunning(true);

    return () => {
      cancelled = true;
      stopPolling();
      dataSource.stop();
      dataSourceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, dataSource, pollMe]);

  return {
    position,
    initialPosition,
    etaMinutes,
    etaDisplay,
    progress,
    queueState,
    engagementState,
    isGranted,
    grant,
    loading,
    error,
    retry,
    isRunning,
  };
}
