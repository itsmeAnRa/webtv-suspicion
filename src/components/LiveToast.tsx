import { useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Streamer } from "../types";

interface LiveToastProps {
  newlyLive: Streamer[] | null;
  onDismiss: () => void;
  onWatch: (channel: string) => void;
}

export function LiveToast({ newlyLive, onDismiss, onWatch }: LiveToastProps) {
  // Auto-dismiss after 8s
  useEffect(() => {
    if (!newlyLive || newlyLive.length === 0) return;
    const id = setTimeout(onDismiss, 8000);
    return () => clearTimeout(id);
  }, [newlyLive, onDismiss]);

  const handleWatch = useCallback(() => {
    if (newlyLive?.[0]) {
      onWatch(newlyLive[0].channelName);
    }
    onDismiss();
  }, [newlyLive, onWatch, onDismiss]);

  const show = newlyLive && newlyLive.length > 0;
  const names = newlyLive?.map((s) => s.displayName) ?? [];
  const message =
    names.length === 1
      ? `${names[0]} vient de lancer un live !`
      : `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]} viennent de lancer un live !`;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-6 right-6 z-[99999]"
          initial={{ opacity: 0, x: "calc(100% + 24px)" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "calc(100% + 24px)" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/30 p-4 max-w-sm backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex-shrink-0">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              </div>
              <p className="text-sm font-semibold text-white">{message}</p>
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors cursor-pointer"
                onClick={onDismiss}
              >
                Ignorer
              </button>
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                onClick={handleWatch}
              >
                Regarder
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
