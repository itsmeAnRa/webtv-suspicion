import type { ViewMode } from "../types";

interface ModeToggleProps {
  mode: ViewMode;
  onSetMode: (mode: ViewMode) => void;
}

const modes: { mode: ViewMode; icon: string; label: string }[] = [
  { mode: "single", icon: "/mono-screen.png", label: "1 stream" },
  { mode: "dual", icon: "/dual-screen.png", label: "2 streams" },
  { mode: "quad", icon: "/quad-screen.png", label: "4 streams" },
];

export function ModeToggle({ mode, onSetMode }: ModeToggleProps) {
  return (
    <div className="flex justify-end mb-2">
      <div className="flex gap-1.5 items-center">
        {modes.map((m) => {
          const isActive = mode === m.mode;
          return (
            <button
              key={m.mode}
              onClick={() => onSetMode(m.mode)}
              title={m.label}
              className="rounded-lg p-1.5 cursor-pointer transition-all duration-300"
              style={{
                opacity: isActive ? 1 : 0.4,
                filter: isActive
                  ? "drop-shadow(0 0 6px rgba(139, 92, 246, 0.6)) drop-shadow(0 0 12px rgba(139, 92, 246, 0.3))"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.opacity = "0.7";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.opacity = "0.4";
              }}
            >
              <img src={m.icon} alt={m.label} className="w-7 h-7" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
