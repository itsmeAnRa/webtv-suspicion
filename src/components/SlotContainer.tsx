import { memo, useRef, useEffect } from "react";

interface SlotContainerProps {
  index: number;
  channel: string | null;
  isActive: boolean;
  isUnmuted: boolean;
  showActiveRing: boolean;
  parentHost: string;
  isSingleMode: boolean;
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
    isSingleMode,
    onActivate,
    onToggleMute,
  }: SlotContainerProps) {
    const slotLabel = String.fromCharCode(65 + index);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // ─── Mute/unmute via Twitch iframe postMessage ───────────────────
    // We load the iframe always muted in the URL, then use postMessage
    // to control audio without changing the src (which would reload).
    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe || !channel) return;

      // Small delay to let the player initialize
      const t = setTimeout(() => {
        try {
          iframe.contentWindow?.postMessage(
            JSON.stringify({
              eventName: "setMuted",
              params: { muted: !isUnmuted },
              namespace: "twitch-embed-player-proxy",
            }),
            "https://player.twitch.tv"
          );
        } catch {
          // Cross-origin may block this; fallback is user controls inside player
        }
      }, 300);

      return () => clearTimeout(t);
    }, [isUnmuted, channel]);

    return (
      <div
        className="relative w-full h-full rounded-lg"
        onClick={isSingleMode ? undefined : onActivate}
      >
        {/* Iframe — src never changes for same channel (always muted in URL) */}
        {channel ? (
          <iframe
            ref={iframeRef}
            src={`https://player.twitch.tv/?channel=${channel}&parent=${parentHost}&muted=true`}
            className="w-full h-full rounded-lg"
            style={{ display: "block" }}
            allowFullScreen
          />
        ) : index === 0 ? null : (
          <div className="w-full h-full rounded-lg border-2 border-dashed border-white/10 bg-white/5 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-white/30">Slot {slotLabel}</p>
              <p className="text-xs text-white/20 mt-1">Cliquez une carte</p>
            </div>
          </div>
        )}

        {/* Active ring */}
        {!isSingleMode && showActiveRing && isActive && (
          <div className="absolute inset-0 rounded-lg ring-2 ring-violet-500 pointer-events-none" />
        )}

        {/* Mute toggle — only show when there's a channel to mute */}
        {!isSingleMode && channel && (
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
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.channel === next.channel &&
    prev.isActive === next.isActive &&
    prev.isUnmuted === next.isUnmuted &&
    prev.showActiveRing === next.showActiveRing &&
    prev.isSingleMode === next.isSingleMode
);
