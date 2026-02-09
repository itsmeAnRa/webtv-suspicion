import { useState, useEffect, useRef, useMemo } from "react";
import { SlotContainer } from "./SlotContainer";
import type { SplitState, ViewMode } from "../types";

interface FeaturedPlayerProps {
  splitState: SplitState;
  hasEmptySlot: boolean;
  parentHost: string;
  onActivateSlot: (index: number) => void;
  onToggleMute: (index: number) => void;
}

// ─── Config ────────────────────────────────────────────────────────────────

const SLOT_COUNT: Record<ViewMode, number> = { single: 1, dual: 2, quad: 4 };
const GAP = 12;
const SCAN_DURATION = 1600; // doubled
const SLOT_TRANSITION_MS = 600;
const SLOT_TRANSITION = `all ${SLOT_TRANSITION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`;

// ─── Slot position calculator ──────────────────────────────────────────────

interface SlotRect {
  top: string;
  left: string;
  width: string;
  height: string;
}

function getSlotRects(
  mode: ViewMode,
  containerW: number,
  containerH: number
): SlotRect[] {
  const gapX = containerW > 0 ? (GAP / containerW) * 100 : 0;
  const gapY = containerH > 0 ? (GAP / containerH) * 100 : 0;

  if (mode === "single") {
    return [
      { top: "0%", left: "0%", width: "100%", height: "100%" },
      { top: "0%", left: "110%", width: "0%", height: "0%" },
      { top: "0%", left: "110%", width: "0%", height: "0%" },
      { top: "0%", left: "110%", width: "0%", height: "0%" },
    ];
  }

  if (mode === "dual") {
    const slotW = `${(100 - gapX) / 2}%`;
    const rightLeft = `${(100 + gapX) / 2}%`;
    return [
      { top: "0%", left: "0%", width: slotW, height: "100%" },
      { top: "0%", left: rightLeft, width: slotW, height: "100%" },
      { top: "0%", left: "110%", width: "0%", height: "0%" },
      { top: "0%", left: "110%", width: "0%", height: "0%" },
    ];
  }

  const slotW = `${(100 - gapX) / 2}%`;
  const slotH = `${(100 - gapY) / 2}%`;
  const rightLeft = `${(100 + gapX) / 2}%`;
  const bottomTop = `${(100 + gapY) / 2}%`;
  return [
    { top: "0%", left: "0%", width: slotW, height: slotH },
    { top: "0%", left: rightLeft, width: slotW, height: slotH },
    { top: bottomTop, left: "0%", width: slotW, height: slotH },
    { top: bottomTop, left: rightLeft, width: slotW, height: slotH },
  ];
}

// ─── Component ─────────────────────────────────────────────────────────────

export function FeaturedPlayer({
  splitState,
  hasEmptySlot,
  parentHost,
  onActivateSlot,
  onToggleMute,
}: FeaturedPlayerProps) {
  const { slots, mode, activeSlot, unmutedSlot } = splitState;
  const slotCount = SLOT_COUNT[mode];
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 1200, h: 675 });

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Scan + delayed layout switch ──────────────────────────────────────

  // layoutMode = the mode currently applied to slot positions
  // It updates at 50% of the scan, not immediately
  const [layoutMode, setLayoutMode] = useState(mode);
  const [scanning, setScanning] = useState(false);
  const [showScanline, setShowScanline] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [glitchOffset, setGlitchOffset] = useState(0);

  const prevModeRef = useRef(mode);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const layoutSwitchedRef = useRef(false);

  useEffect(() => {
    if (prevModeRef.current !== mode) {
      const fromSingle = prevModeRef.current === "single";
      prevModeRef.current = mode;

      // Only show scanline when transitioning FROM single
      setShowScanline(fromSingle);
      setScanning(true);
      setScanProgress(0);
      layoutSwitchedRef.current = false;
      startTimeRef.current = performance.now();

      const duration = fromSingle ? SCAN_DURATION : SLOT_TRANSITION_MS;

      const animate = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const t = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        if (fromSingle) {
          setScanProgress(eased);
        }

        // Glitch between 15-55% — all transitions
        if (t > 0.15 && t < 0.55 && Math.random() > 0.65) {
          setGlitchOffset((Math.random() - 0.5) * 5);
        } else {
          setGlitchOffset(0);
        }

        // Switch layout at 50% of animation
        if (t >= 0.5 && !layoutSwitchedRef.current) {
          layoutSwitchedRef.current = true;
          setLayoutMode(mode);
        }

        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setLayoutMode(mode);
          setScanning(false);
          setScanProgress(0);
          setGlitchOffset(0);
          setShowScanline(false);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(rafRef.current);
    }
  }, [mode]);

  const slotRects = useMemo(
    () => getSlotRects(layoutMode, containerSize.w, containerSize.h),
    [layoutMode, containerSize.w, containerSize.h]
  );

  const scanPct = scanProgress * 100;
  const layoutSlotCount = SLOT_COUNT[layoutMode];
  const showEmptyState = layoutMode === "single" && !slots[0];

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden rounded-xl"
      style={{
        transform: scanning ? `translateX(${glitchOffset}px)` : "none",
      }}
    >
      {/* Empty state */}
      {showEmptyState && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <div className="text-center">
            <p className="text-xl font-semibold text-white/40">
              Frérot y'a personne qui stream
            </p>
            <p className="text-sm text-white/20 mt-2">Reviens plus tard 👀</p>
          </div>
        </div>
      )}

      {/* Slots — always mounted, CSS-animated positions */}
      {Array.from({ length: 4 }, (_, i) => {
        const rect = slotRects[i];
        const isVisible = i < layoutSlotCount;

        return (
          <div
            key={`slot-${i}`}
            className="absolute rounded-lg"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              opacity: isVisible ? 1 : 0,
              transition: SLOT_TRANSITION,
              zIndex: isVisible ? 1 : 0,
              pointerEvents: isVisible ? "auto" : "none",
            }}
          >
            <SlotContainer
              index={i}
              channel={isVisible ? slots[i] : null}
              isActive={activeSlot === i}
              isUnmuted={unmutedSlot === i}
              showActiveRing={hasEmptySlot}
              parentHost={parentHost}
              isSingleMode={layoutMode === "single"}
              onActivate={() => onActivateSlot(i)}
              onToggleMute={() => onToggleMute(i)}
            />
          </div>
        );
      })}

      {/* Scanline — only from single mode */}
      {scanning && showScanline && (
        <>
          <div
            className="absolute top-0 bottom-0 z-40 pointer-events-none"
            style={{
              left: `${scanPct}%`,
              transform: "translateX(-50%)",
              width: "2px",
              background: "rgba(220, 38, 38, 0.85)",
              boxShadow:
                "0 0 6px 1px rgba(220, 38, 38, 0.5), 0 0 16px 3px rgba(220, 38, 38, 0.2)",
            }}
          />

          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none"
            style={{
              left: `${scanPct}%`,
              transform: "translateX(-50%)",
              width: "40px",
              background:
                "radial-gradient(ellipse at center, rgba(220, 38, 38, 0.12) 0%, transparent 70%)",
            }}
          />
        </>
      )}

      {/* Glitch horizontal slice — all mode transitions */}
      {scanning && glitchOffset !== 0 && (
        <div
          className="absolute left-0 right-0 z-50 pointer-events-none"
          style={{
            top: `${25 + Math.random() * 50}%`,
            height: "2px",
            background: "rgba(220, 38, 38, 0.85)",
            boxShadow:
              "0 0 6px 1px rgba(220, 38, 38, 0.5), 0 0 16px 3px rgba(220, 38, 38, 0.2)",
            transform: `translateX(${glitchOffset * 4}px)`,
          }}
        />
      )}
    </div>
  );
}
