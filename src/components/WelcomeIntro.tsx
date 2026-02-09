import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ─── Config ────────────────────────────────────────────────────────────────

const DEFAULT_MESSAGES = [
  "Bienvenue sauf si tu fais payer ton craft.",
  "Si t'es d'honolulu on a déjà ton ip.",
  "Thorfin a sûrement changé sa pfp.",
  "Valdum: 0.",
  "Doudou est bien confirmé dans les Epstein files",
];

const DEFAULT_DURATIONS = {
  messageFadeIn: 0.3,
  messageHold: 1.0,
  messageFadeOut: 0.2,
  logoFadeIn: 0.8,
  logoHold: 0.5,
  logoFly: 0.8,
  overlayFadeOut: 0.6,
};

// ─── Types ─────────────────────────────────────────────────────────────────

type IntroPhase = "message" | "logo-center" | "logo-fly" | "done";

interface WelcomeIntroProps {
  messages?: string[];
  durations?: Partial<typeof DEFAULT_DURATIONS>;
  /** Ref to the final logo container in the header — we read its rect to animate to it */
  logoTargetRef: React.RefObject<HTMLDivElement | null>;
  onComplete: () => void;
  debug?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function WelcomeIntro({
  messages = DEFAULT_MESSAGES,
  durations: durationOverrides,
  logoTargetRef,
  onComplete,
  debug = false,
}: WelcomeIntroProps) {
  const d = { ...DEFAULT_DURATIONS, ...durationOverrides };
  const [phase, setPhase] = useState<IntroPhase>("message");
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const message = useMemo(
    () => messages[Math.floor(Math.random() * messages.length)],
    [messages]
  );

  // Phase sequencer
  useEffect(() => {
    if (phase === "message") {
      const t = setTimeout(
        () => setPhase("logo-center"),
        (d.messageFadeIn + d.messageHold + d.messageFadeOut) * 1000
      );
      return () => clearTimeout(t);
    }

    if (phase === "logo-center") {
      const t = setTimeout(() => {
        // Measure where the final logo should land
        if (logoTargetRef.current) {
          setTargetRect(logoTargetRef.current.getBoundingClientRect());
        }
        setPhase("logo-fly");
      }, (d.logoFadeIn + d.logoHold) * 1000);
      return () => clearTimeout(t);
    }

    if (phase === "logo-fly") {
      const t = setTimeout(
        () => setPhase("done"),
        Math.max(d.logoFly, d.overlayFadeOut) * 1000 + 50
      );
      return () => clearTimeout(t);
    }

    if (phase === "done") {
      onComplete();
    }
  }, [phase, d, logoTargetRef, onComplete]);

  const isFlying = phase === "logo-fly";

  return (
    <>
      {/* ─── Dark overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase !== "done" && (
          <motion.div
            key="intro-overlay-bg"
            className="fixed inset-0 z-[99997]"
            style={{ backgroundColor: "#09090b" }}
            initial={{ opacity: 1 }}
            animate={{ opacity: isFlying ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: d.overlayFadeOut, ease: "easeInOut" }}
            // Content centered (only for message)
          >
            <div className="flex items-center justify-center w-full h-full">
              <AnimatePresence mode="wait">
                {phase === "message" && (
                  <motion.p
                    key="intro-message"
                    className="text-xl md:text-2xl font-semibold text-white/90 text-center px-8 max-w-2xl"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{
                      duration: d.messageFadeIn,
                      exit: { duration: d.messageFadeOut },
                    }}
                  >
                    {message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Logo — single element that animates from center → target ── */}
      <AnimatePresence>
        {(phase === "logo-center" || phase === "logo-fly") && (
          <motion.img
            key="intro-logo"
            src="/suspicion-logo.png"
            alt="Suspicion"
            className="fixed z-[99998] w-auto object-contain"
            // Center of viewport
            initial={{
              top: "50%",
              left: "50%",
              x: "-50%",
              y: "-50%",
              height: 112, // ~h-28
              opacity: 0,
              scale: 0.9,
            }}
            animate={
              isFlying && targetRect
                ? {
                    // Fly to the measured target position
                    top: targetRect.top,
                    left: targetRect.left,
                    x: 0,
                    y: 0,
                    height: targetRect.height,
                    opacity: 1,
                    scale: 1,
                  }
                : {
                    // Centered & visible
                    top: "50%",
                    left: "50%",
                    x: "-50%",
                    y: "-50%",
                    height: 112,
                    opacity: 1,
                    scale: 1,
                  }
            }
            exit={{ opacity: 0 }}
            transition={
              isFlying
                ? {
                    duration: d.logoFly,
                    ease: [0.16, 1, 0.3, 1],
                    opacity: { duration: d.logoFly * 0.5 },
                  }
                : {
                    duration: d.logoFadeIn,
                    ease: "easeOut",
                  }
            }
          />
        )}
      </AnimatePresence>

      {/* Debug replay */}
      {debug && phase === "done" && (
        <button
          className="fixed bottom-4 right-4 z-[99999] px-3 py-1.5 text-xs font-mono rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer"
          onClick={() => setPhase("message")}
        >
          🔄 Replay Intro
        </button>
      )}
    </>
  );
}

// ─── Persistent brand logo (always in the header) ──────────────────────────

export function BrandLogo({ visible }: { visible: boolean }) {
  return (
    <img
      src="/suspicion-logo.png"
      alt="Suspicion"
      className="h-8 md:h-10 w-auto object-contain transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    />
  );
}
