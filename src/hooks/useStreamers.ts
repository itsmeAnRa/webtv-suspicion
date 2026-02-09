import { useState, useEffect, useRef, useCallback } from "react";
import type { Streamer, LiveDiff } from "../types";

interface StreamerState {
  streamers: Streamer[];
  loading: boolean;
  error: string | null;
}

export function useStreamers(pollInterval = 60_000) {
  const [state, setState] = useState<StreamerState>({
    streamers: [],
    loading: true,
    error: null,
  });

  const [diff, setDiff] = useState<LiveDiff | null>(null);
  const prevRef = useRef<Map<string, Streamer>>(new Map());

  const fetchStreamers = useCallback(async () => {
    try {
      const res = await fetch("/api/streamers");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const newStreamers: Streamer[] = data.streamers;

      // Compute diff
      const prevMap = prevRef.current;
      if (prevMap.size > 0) {
        const newlyLive: Streamer[] = [];
        const wentOffline: string[] = [];
        const titleChanged: Streamer[] = [];

        for (const s of newStreamers) {
          const prev = prevMap.get(s.channelName);
          if (s.isLive && (!prev || !prev.isLive)) {
            newlyLive.push(s);
          } else if (s.isLive && prev?.isLive) {
            if (
              prev.streamTitle !== s.streamTitle ||
              prev.gameName !== s.gameName
            ) {
              titleChanged.push(s);
            }
          }
        }

        for (const [name, prev] of prevMap) {
          if (prev.isLive) {
            const current = newStreamers.find((s) => s.channelName === name);
            if (!current || !current.isLive) {
              wentOffline.push(name);
            }
          }
        }

        if (
          newlyLive.length > 0 ||
          wentOffline.length > 0 ||
          titleChanged.length > 0
        ) {
          setDiff({ newlyLive, wentOffline, titleChanged });
        }
      }

      // Update prev map
      const newMap = new Map<string, Streamer>();
      for (const s of newStreamers) newMap.set(s.channelName, s);
      prevRef.current = newMap;

      setState({ streamers: newStreamers, loading: false, error: null });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    fetchStreamers();
    const id = setInterval(fetchStreamers, pollInterval);
    return () => clearInterval(id);
  }, [fetchStreamers, pollInterval]);

  // Clear diff after consumption
  const clearDiff = useCallback(() => setDiff(null), []);

  // Inject a fake streamer (debug)
  const injectFake = useCallback(
    (fake: Streamer) => {
      setState((prev) => {
        if (prev.streamers.some((s) => s.channelName === fake.channelName))
          return prev;
        return { ...prev, streamers: [fake, ...prev.streamers] };
      });
      // Trigger diff manually
      setDiff((prev) => ({
        newlyLive: [...(prev?.newlyLive ?? []), fake],
        wentOffline: prev?.wentOffline ?? [],
        titleChanged: prev?.titleChanged ?? [],
      }));
    },
    []
  );

  const removeFake = useCallback((channelName: string) => {
    setState((prev) => ({
      ...prev,
      streamers: prev.streamers.filter((s) => s.channelName !== channelName),
    }));
  }, []);

  return {
    ...state,
    diff,
    clearDiff,
    injectFake,
    removeFake,
  };
}
