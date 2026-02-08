import { motion } from "framer-motion";
import type { Streamer } from "../types";

interface StreamerCardProps {
  streamer: Streamer;
  isSelected: boolean;
  isViewing: boolean;
  isJustLive: boolean;
  mode: string;
  onClick: () => void;
}

export function StreamerCard({
  streamer,
  isSelected,
  isViewing,
  isJustLive,
  mode,
  onClick,
}: StreamerCardProps) {
  const { channelName, displayName, avatarUrl, isLive, viewerCount, streamTitle } =
    streamer;
  const imgSrc = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channelName}-854x480.jpg`;

  return (
    <motion.div
      className="group relative w-72 rounded-lg transition-all duration-300"
      animate={
        isJustLive
          ? {
              scale: [0.92, 1.04, 1],
              boxShadow: [
                "0 0 0 0 rgba(220,38,38,0.6), 0 0 20px 4px rgba(220,38,38,0.3)",
                "0 0 0 0 rgba(220,38,38,0.1), 0 0 8px 1px rgba(220,38,38,0.05)",
                "none",
              ],
            }
          : {}
      }
      transition={isJustLive ? { duration: 2, ease: "easeOut" } : {}}
      whileHover={{ scale: 1.02 }}
      style={{
        outline: isSelected ? "2px solid rgb(139, 92, 246)" : "none",
        outlineOffset: isSelected ? "2px" : "0",
      }}
    >
      <div className="relative aspect-video rounded-lg overflow-hidden">
        {/* Thumbnail — layoutId for shared element transition in single mode */}
        <motion.img
          layoutId={mode === "single" ? `thumb-${channelName}` : undefined}
          src={imgSrc}
          alt="Stream Preview"
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Live shimmer overlay */}
        {isLive && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 55%, transparent 60%)",
              backgroundSize: "250% 100%",
              animation: "shimmer 4s ease-in-out infinite",
            }}
          />
        )}

        {/* Offline overlay */}
        {!isLive && (
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        )}

        {/* Click overlay with play button */}
        <button
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-all duration-300 hover:bg-black/40 cursor-pointer focus:outline-none"
          onClick={onClick}
          disabled={!isLive}
        >
          {isLive && (
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
              <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/25">
                <svg
                  className="w-6 h-6 text-black ml-0.5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </button>

        {/* LIVE / OFFLINE badge */}
        {isLive ? (
          <span
            className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md text-xs font-semibold text-white bg-red-600/80 backdrop-blur-sm"
            style={{ animation: "badge-pulse 3s ease-in-out infinite" }}
          >
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              LIVE
            </span>
          </span>
        ) : (
          <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md text-xs font-semibold text-white/60 bg-white/10 backdrop-blur-sm">
            OFFLINE
          </span>
        )}

        {/* Viewer count */}
        {viewerCount != null && (
          <span className="absolute bottom-2 right-2 z-20 px-2 py-0.5 rounded-md text-xs font-medium text-white/80 bg-black/60 backdrop-blur-sm">
            {viewerCount.toLocaleString()} viewers
          </span>
        )}

        {/* "En cours" viewing indicator */}
        {isViewing && (
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-600/80 backdrop-blur-sm">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="text-xs font-medium text-white">En cours</span>
          </div>
        )}
      </div>

      {/* Channel info */}
      <div className="flex items-center mx-2 my-3">
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-9 h-9 rounded-full object-cover mr-2"
        />
        <div className="flex flex-col overflow-hidden">
          <p className="text-sm font-semibold text-white truncate">
            {streamTitle || ""}
          </p>
          <p className="text-sm text-white/50">{displayName}</p>
        </div>
      </div>
    </motion.div>
  );
}
