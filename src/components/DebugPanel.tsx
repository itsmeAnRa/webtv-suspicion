import type { Streamer } from "../types";

interface DebugPanelProps {
  onInjectFake: (fake: Streamer) => void;
  onRemoveFake: (channelName: string) => void;
}

const FAKE_STREAMER: Streamer = {
  displayName: "TestBouchon",
  channelName: "kamet0",
  avatarUrl:
    "https://static-cdn.jtvnw.net/jtv_user_pictures/kamet0-profile_image-300x300.png",
  isLive: true,
  viewerCount: 1337,
  streamTitle: "🔴 Stream de test bouchon !",
  gameName: "League of Legends",
};

export function DebugPanel({ onInjectFake, onRemoveFake }: DebugPanelProps) {
  return (
    <div className="my-8 p-4 border border-dashed border-yellow-500/50 rounded-xl bg-yellow-500/5">
      <p className="text-xs text-yellow-500/70 mb-3 font-mono">
        ⚠ DEBUG — Supprimer en prod
      </p>
      <div className="flex gap-2 flex-wrap">
        <button
          className="px-4 py-2 text-sm font-medium rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 transition-colors cursor-pointer"
          onClick={() => onInjectFake(FAKE_STREAMER)}
        >
          🟢 Simuler un go-live
        </button>
        <button
          className="px-4 py-2 text-sm font-medium rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors cursor-pointer"
          onClick={() => onRemoveFake("kamet0")}
        >
          🔴 Retirer le bouchon
        </button>
      </div>
    </div>
  );
}
