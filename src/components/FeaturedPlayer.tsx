import { AnimatePresence, motion } from "framer-motion";
import { SlotContainer } from "./SlotContainer";
import type { SplitState } from "../types";

interface FeaturedPlayerProps {
  splitState: SplitState;
  hasEmptySlot: boolean;
  parentHost: string;
  onActivateSlot: (index: number) => void;
  onToggleMute: (index: number) => void;
}

const layoutTransition = {
  initial: { opacity: 0, scale: 0.96, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.96, filter: "blur(4px)" },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
};

export function FeaturedPlayer({
  splitState,
  hasEmptySlot,
  parentHost,
  onActivateSlot,
  onToggleMute,
}: FeaturedPlayerProps) {
  const { slots, mode, activeSlot, unmutedSlot } = splitState;

  const renderSlot = (index: number) => (
    <SlotContainer
      key={`slot-${index}-${slots[index] ?? "empty"}`}
      index={index}
      channel={slots[index]}
      isActive={activeSlot === index}
      isUnmuted={unmutedSlot === index}
      showActiveRing={hasEmptySlot}
      parentHost={parentHost}
      onActivate={() => onActivateSlot(index)}
      onToggleMute={() => onToggleMute(index)}
    />
  );

  return (
    <div className="w-full h-full relative">
      <AnimatePresence mode="wait">
        {mode === "single" && (
          <motion.div key="single" className="w-full h-full" {...layoutTransition}>
            {slots[0] ? (
              <iframe
                src={`https://player.twitch.tv/?channel=${slots[0]}&parent=${parentHost}`}
                className="w-full h-full rounded-xl"
                style={{ display: "block" }}
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full rounded-xl border border-white/10 bg-white/5">
                <div className="text-center">
                  <p className="text-xl font-semibold text-white/40">
                    Frérot y'a personne qui stream
                  </p>
                  <p className="text-sm text-white/20 mt-2">
                    Reviens plus tard 👀
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {mode === "dual" && (
          <motion.div
            key="dual"
            className="w-full h-full grid grid-cols-2 gap-3"
            {...layoutTransition}
          >
            {renderSlot(0)}
            {renderSlot(1)}
          </motion.div>
        )}

        {mode === "quad" && (
          <motion.div
            key="quad"
            className="w-full h-full grid grid-cols-2 grid-rows-2 gap-3"
            {...layoutTransition}
          >
            {renderSlot(0)}
            {renderSlot(1)}
            {renderSlot(2)}
            {renderSlot(3)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
