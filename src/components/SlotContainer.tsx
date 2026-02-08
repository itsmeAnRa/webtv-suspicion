import { memo } from "react";
import { motion } from "framer-motion";

interface SlotContainerProps {
  index: number;
  channel: string | null;
  isActive: boolean;
  isUnmuted: boolean;
  showActiveRing: boolean;
  parentHost: string;
  onActivate: () => void;
  onToggleMute: () => void;
}

export const SlotContainer = memo(
  function SlotContainer({
    index,
    channel,
    isActive,
    isUnmuted,
    showActiveRing,
    parentHost,
    onActivate,
    onToggleMute,
  }: SlotContainerProps) {
    const slotLabel = String.fromCharCode(65 + index); // A, B, C, D
    const mutedParam = isUnmuted ? "" : "&muted=true";

    return (
      <div className="relative w-full h-full rounded-lg" onClick={onActivate}>
        {/* Iframe or placeholder */}
        {channel ? (
          <iframe
            src={`https://player.twitch.tv/?channel=${channel}&parent=${parentHost}${mutedParam}`}
            className="w-full h-full rounded-lg"
            style={{ display: "block" }}
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full rounded-lg border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-white/30">Slot {slotLabel}</p>
              <p className="text-xs text-white/20 mt-1">Cliquez une carte</p>
            </div>
          </div>
        )}

        {/* Active ring — only when there are empty slots */}
        {showActiveRing && isActive && (
          <div className="absolute inset-0 rounded-lg ring-2 ring-violet-500 pointer-events-none" />
        )}

        {/* Mute toggle */}
        <div className="absolute top-2 right-2 z-10">
          <button
            className="p-1.5 rounded-md bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-colors cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
          >
            {isUnmuted ? (
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-white/50"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    );
  },
  // Custom comparison: only re-render if channel, active, unmuted, or showActiveRing changes
  (prev, next) =>
    prev.channel === next.channel &&
    prev.isActive === next.isActive &&
    prev.isUnmuted === next.isUnmuted &&
    prev.showActiveRing === next.showActiveRing
);
