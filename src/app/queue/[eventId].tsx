/**
 * Queue Waiting Room Route
 *
 * Joins the queue for the event and renders the waiting room.
 * - Real backend (guest mode) when EXPO_PUBLIC_API_BASE_URL is set.
 *   The deployed test environment accepts a dummy CAPTCHA token.
 * - Deterministic fake scenario otherwise (offline development).
 *
 * Note: React Native (Hermes) has no EventSource; useRealQueue falls back
 * to polling GET /queue/me for live position updates.
 */
import React, { useCallback, useMemo } from "react";
import { useLocalSearchParams } from "expo-router";
import type { AuthContext, DeviceId } from "@/core/domain";
import {
  FakeQueueDataSource,
  QueueHttpClient,
  RealQueueDataSource,
  SCENARIO_QUEUE_MOVING,
  WaitingRoomScreen,
  useQueue,
  useRealQueue,
} from "@/features/queue";
import type { QueuePollSnapshot, UseQueueResult } from "@/features/queue";

// Deployed test environment accepts any CAPTCHA token (mock provider)
const DUMMY_CAPTCHA_TOKEN = "0.AbCdEfGhIjKlMnOpQrStUvWxYz123456789";

/**
 * Generate a 32-char hex device ID for guest queue auth.
 */
function generateDeviceId(): DeviceId {
  const timestamp = Date.now().toString(16).padStart(12, "0");
  const random = Math.random().toString(16).substring(2, 22).padStart(20, "0");
  return `${timestamp}${random}`.substring(0, 32) as DeviceId;
}

export default function QueueScreen() {
  const params = useLocalSearchParams<{ eventId: string }>();
  const eventId = typeof params.eventId === "string" ? params.eventId : "";

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  // Stable guest identity for this waiting-room session
  const deviceId = useMemo(generateDeviceId, []);
  const authContext = useMemo<AuthContext>(
    () => ({ type: "guest", deviceId }),
    [deviceId]
  );

  // App layer wires the data layer (presentation hooks receive injections):
  // the real data source owns join + SSE.
  const realDataSource = useMemo(
    () =>
      new RealQueueDataSource({
        eventId: eventId || "offline",
        captchaToken: DUMMY_CAPTCHA_TOKEN,
        authContext,
        apiBaseUrl: apiBaseUrl ?? "",
      }),
    [eventId, apiBaseUrl, authContext]
  );

  // /queue/me poll adapter used when SSE is unavailable (React Native/Hermes).
  // Deployed contract v2.27 also requires X-Device-Id for guests.
  const pollMe = useCallback(
    async (queueToken: string): Promise<QueuePollSnapshot | null> => {
      if (!apiBaseUrl || !eventId) {
        return null;
      }
      const client = new QueueHttpClient({ baseUrl: apiBaseUrl });
      const me = await client.getMe({ eventId, queueToken, authContext });
      return me.ok ? me.data : null;
    },
    [apiBaseUrl, eventId, authContext]
  );

  // Real queue when a backend URL is configured; fake scenario otherwise.
  // Both hooks must be called unconditionally; only the active one auto-starts.
  const realQueue = useRealQueue({
    dataSource: realDataSource,
    pollMe,
    autoStart: Boolean(apiBaseUrl) && eventId !== "",
  });

  const fakeQueue = useQueue({
    scenario: SCENARIO_QUEUE_MOVING,
    createDataSource: (scenario) => new FakeQueueDataSource({ scenario }),
    autoStart: !apiBaseUrl && eventId !== "",
  });

  const queueState: UseQueueResult = apiBaseUrl ? realQueue : fakeQueue;

  // WaitingRoomScreen owns its bottom-edge safe area.
  return <WaitingRoomScreen queueState={queueState} />;
}
