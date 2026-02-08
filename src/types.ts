export interface Streamer {
  channelName: string;
  displayName: string;
  avatarUrl: string;
  isLive: boolean;
  viewerCount: number | null;
  streamTitle: string | null;
  gameName: string | null;
}

export type ViewMode = "single" | "dual" | "quad";

export interface SplitState {
  slots: (string | null)[];
  activeSlot: number;
  mode: ViewMode;
  unmutedSlot: number;
}

export type SplitAction =
  | { type: "assignChannel"; channel: string }
  | { type: "setMode"; mode: ViewMode }
  | { type: "setActiveSlot"; index: number }
  | { type: "setUnmutedSlot"; index: number };

export interface LiveDiff {
  newlyLive: Streamer[];
  wentOffline: string[];
  titleChanged: Streamer[];
}
