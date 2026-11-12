/**
 * useQueue Hook
 *
 * GH-8 T6: React hook for Queue waiting room state management.
 * Uses dependency injection for data source (receives config via props).
 *
 * @module features/queue/presentation/hooks/useQueue
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { QueueState, EngagementState } from "@/core/domain";
import type {
  QueueScenario,
  QueueUpdate,
  GrantInfo,
} from "@/features/queue/domain";
import {
  calculateEta,
  formatEta,
  calculateProgress,
} from "@/features/queue/domain";

/**
 * Interface for queue data source (allows DI).
 */
export interface QueueDataSource {
  start(): void;
  stop(): void;
  retry(): void;
  setCallbacks(callbacks: {
    onUpdate?: (update: QueueUpdate) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  }): void;
}

/**
 * Factory function type for creating queue data sources.
 */
export type QueueDataSourceFactory = (
  scenario: QueueScenario
) => QueueDataSource;

/**
 * Grant information for presentation.
 */
export interface GrantPresentationInfo {
  /** Grant token for booking API */
  token: string;
  /** ISO timestamp when grant expires */
  expiresAt: string;
}

/**
 * Result of useQueue hook.
 */
export interface UseQueueResult {
  /** Current queue position (1-based, 0 when granted) */
  position: number;
  /** Initial position at scenario start */
  initialPosition: number;
  /** Calculated ETA in minutes */
  etaMinutes: number;
  /** Formatted ETA for display */
  etaDisplay: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current queue state */
  queueState: QueueState;
  /** Current engagement state */
  engagementState: EngagementState;
  /** True when engagement state is GRANTED */
  isGranted: boolean;
  /** Grant info when granted */
  grant: GrantPresentationInfo | null;
  /** True while loading initial state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Restart scenario */
  retry: () => void;
  /** True when scenario is running */
  isRunning: boolean;
}

/**
 * Configuration for useQueue hook.
 */
export interface UseQueueConfig {
  /** Scenario to play. */
  scenario: QueueScenario;
  /** Data source factory (for DI). */
  createDataSource: QueueDataSourceFactory;
  /** Callback when grant is received. */
  onGranted?: (grant: GrantInfo) => void;
  /** Auto-start on mount. Defaults to true. */
  autoStart?: boolean;
}

/**
 * useQueue Hook
 *
 * Consumes a QueueDataSource (injected) and provides presentation state
 * for the waiting room screen.
 */
export function useQueue(config: UseQueueConfig): UseQueueResult {
  const { scenario, createDataSource, onGranted, autoStart = true } = config;

  const dataSourceRef = useRef<QueueDataSource | null>(null);

  // Presentation state
  const [position, setPosition] = useState(scenario.initialState.position);
  const [initialPosition] = useState(scenario.initialState.position);
  const [queueState, setQueueState] = useState<QueueState>(
    scenario.initialState.queueState
  );
  const [engagementState, setEngagementState] = useState<EngagementState>(
    scenario.initialState.engagementState
  );
  const [ratePerMin, setRatePerMin] = useState(
    scenario.initialState.ratePerMin ?? 20
  );
  const [grant, setGrant] = useState<GrantPresentationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Calculated values
  const etaMinutes = calculateEta(position, ratePerMin);
  const etaDisplay = formatEta(etaMinutes);
  const progress = calculateProgress(initialPosition, position);
  const isGranted = engagementState === "GRANTED";

  // Handle update from data source
  const handleUpdate = useCallback(
    (update: QueueUpdate) => {
      setPosition(update.position);
      setQueueState(update.queueState);
      setEngagementState(update.engagementState);
      if (update.ratePerMin !== undefined) {
        setRatePerMin(update.ratePerMin);
      }
      setLoading(false);

      // Handle grant
      if (update.engagementState === "GRANTED" && update.grant) {
        const grantInfo: GrantPresentationInfo = {
          token: update.grant.grant_token,
          expiresAt: update.grant.booking_expires_at,
        };
        setGrant(grantInfo);
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
    setIsRunning(false);
    setLoading(false);
  }, []);

  // Retry function
  const retry = useCallback(() => {
    setError(null);
    setLoading(true);
    setGrant(null);
    dataSourceRef.current?.retry();
    setIsRunning(true);
  }, []);

  // Initialize and manage data source
  useEffect(() => {
    const dataSource = createDataSource(scenario);
    dataSource.setCallbacks({
      onUpdate: handleUpdate,
      onComplete: handleComplete,
      onError: handleError,
    });
    dataSourceRef.current = dataSource;

    if (autoStart) {
      dataSource.start();
      setIsRunning(true);
    }

    return () => {
      dataSource.stop();
      dataSourceRef.current = null;
    };
  }, [
    scenario,
    createDataSource,
    handleUpdate,
    handleComplete,
    handleError,
    autoStart,
  ]);

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
