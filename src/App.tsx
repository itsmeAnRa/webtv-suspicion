import { useState, useEffect, useCallback, useRef } from "react";
import { LayoutGroup } from "framer-motion";
import { useStreamers } from "./hooks/useStreamers";
import { useSplitView } from "./hooks/useSplitView";
import { FeaturedPlayer } from "./components/FeaturedPlayer";
import { StreamerCard } from "./components/StreamerCard";
import { ModeToggle } from "./components/ModeToggle";
import { LiveToast } from "./components/LiveToast";
import { DebugPanel } from "./components/DebugPanel";

const PARENT_HOST = window.location.hostname;

export default function App() {
  const {
    streamers,
    loading,
    error,
    diff,
    clearDiff,
    injectFake,
    removeFake,
  } = useStreamers();

  const {
    state: splitState,
    assignChannel,
    setMode,
    setActiveSlot,
    setUnmutedSlot,
    containsChannel,
    hasEmptySlot,
  } = useSplitView();

  // Track "just went live" channels for animation (auto-clear after 2s)
  const [justLiveSet, setJustLiveSet] = useState<Set<string>>(new Set());
  const initRef = useRef(false);

  // Auto-assign first live streamer on initial load
  useEffect(() => {
    if (!loading && streamers.length > 0 && !initRef.current) {
      initRef.current = true;
      const firstLive = streamers.find((s) => s.isLive);
      if (firstLive) {
        assignChannel(firstLive.channelName);
      }
    }
  }, [loading, streamers, assignChannel]);

  // Handle live diff: toast + just-went-live animation
  useEffect(() => {
    if (!diff || diff.newlyLive.length === 0) return;

    const channels = new Set(diff.newlyLive.map((s) => s.channelName));
    setJustLiveSet(channels);
    const timeout = setTimeout(() => setJustLiveSet(new Set()), 2000);

    // Auto-assign if no stream is featured
    if (splitState.slots[0] === null && diff.newlyLive[0]) {
      assignChannel(diff.newlyLive[0].channelName);
    }

    return () => clearTimeout(timeout);
  }, [diff, splitState.slots, assignChannel]);

  const handleCardClick = useCallback(
    (channelName: string) => {
      assignChannel(channelName);
    },
    [assignChannel]
  );

  const handleToastWatch = useCallback(
    (channel: string) => {
      assignChannel(channel);
    },
    [assignChannel]
  );

  return (
    <LayoutGroup>
      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Toast */}
        <LiveToast
          newlyLive={diff?.newlyLive ?? null}
          onDismiss={clearDiff}
          onWatch={handleToastWatch}
        />

        <div className="px-4 py-6 max-w-[1400px] mx-auto">
          {/* Mode toggle + Player */}
          {loading ? (
            <div className="w-full aspect-video rounded-xl bg-white/5 animate-pulse flex items-center justify-center">
              <p className="text-white/40">Chargement...</p>
            </div>
          ) : (
            <>
              <ModeToggle mode={splitState.mode} onSetMode={setMode} />
              <div className="w-full aspect-video">
                <FeaturedPlayer
                  splitState={splitState}
                  hasEmptySlot={hasEmptySlot}
                  parentHost={PARENT_HOST}
                  onActivateSlot={setActiveSlot}
                  onToggleMute={setUnmutedSlot}
                />
              </div>
            </>
          )}

          {/* Roster */}
          <div className="my-12">
            <h2 className="text-xl font-bold mb-4">Roster</h2>
            {loading ? (
              <p className="text-white/40">Chargement des streamers...</p>
            ) : error ? (
              <p className="text-red-400">Erreur: {error}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                {streamers.map((streamer) => (
                  <StreamerCard
                    key={streamer.channelName}
                    streamer={streamer}
                    isSelected={containsChannel(streamer.channelName)}
                    isViewing={containsChannel(streamer.channelName)}
                    isJustLive={justLiveSet.has(streamer.channelName)}
                    mode={splitState.mode}
                    onClick={() => handleCardClick(streamer.channelName)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Debug */}
          <DebugPanel onInjectFake={injectFake} onRemoveFake={removeFake} />
        </div>
      </div>
    </LayoutGroup>
  );
}
