import { useReducer, useCallback } from "react";
import type { SplitState, SplitAction, ViewMode } from "../types";

const SLOT_COUNTS: Record<ViewMode, number> = {
  single: 1,
  dual: 2,
  quad: 4,
};

const initialState: SplitState = {
  slots: [null, null, null, null],
  activeSlot: 0,
  mode: "single",
  unmutedSlot: 0,
};

function findFirstEmptySlot(slots: (string | null)[], count: number): number {
  for (let i = 0; i < count; i++) {
    if (slots[i] === null) return i;
  }
  return 0; // all full, default to 0
}

function splitReducer(state: SplitState, action: SplitAction): SplitState {
  switch (action.type) {
    case "assignChannel": {
      const { channel } = action;
      const newSlots = [...state.slots];
      const active = state.activeSlot;

      // Already in active slot? No-op
      if (newSlots[active] === channel) return state;

      // Already in another visible slot? Swap with active
      const count = SLOT_COUNTS[state.mode];
      const existingIdx = newSlots.slice(0, count).findIndex((s) => s === channel);
      if (existingIdx !== -1) {
        newSlots[existingIdx] = newSlots[active];
        newSlots[active] = channel;
      } else {
        newSlots[active] = channel;
      }

      // After assigning, auto-advance to next empty slot
      const nextEmpty = findFirstEmptySlot(newSlots, count);

      return { ...state, slots: newSlots, activeSlot: nextEmpty };
    }

    case "setMode": {
      const { mode } = action;
      const count = SLOT_COUNTS[mode];
      const newSlots = [...state.slots];

      // Clear excess slots
      for (let i = count; i < 4; i++) newSlots[i] = null;

      // Auto-select first empty slot in the new mode
      const nextActive = findFirstEmptySlot(newSlots, count);

      return {
        ...state,
        mode,
        slots: newSlots,
        activeSlot: nextActive,
        unmutedSlot: state.unmutedSlot >= count ? 0 : state.unmutedSlot,
      };
    }

    case "setActiveSlot":
      // Allow selecting any slot (occupied or empty) for swapping
      return { ...state, activeSlot: action.index };

    case "setUnmutedSlot":
      return { ...state, unmutedSlot: action.index };

    default:
      return state;
  }
}

export function useSplitView() {
  const [state, dispatch] = useReducer(splitReducer, initialState);

  const assignChannel = useCallback(
    (channel: string) => dispatch({ type: "assignChannel", channel }),
    []
  );

  const setMode = useCallback(
    (mode: ViewMode) => dispatch({ type: "setMode", mode }),
    []
  );

  const setActiveSlot = useCallback(
    (index: number) => dispatch({ type: "setActiveSlot", index }),
    []
  );

  const setUnmutedSlot = useCallback(
    (index: number) => dispatch({ type: "setUnmutedSlot", index }),
    []
  );

  const slotCount = SLOT_COUNTS[state.mode];

  const containsChannel = useCallback(
    (channel: string) => {
      for (let i = 0; i < slotCount; i++) {
        if (state.slots[i] === channel) return true;
      }
      return false;
    },
    [state.slots, slotCount]
  );

  const hasEmptySlot = state.slots.slice(0, slotCount).some((s) => s === null);

  return {
    state,
    dispatch,
    assignChannel,
    setMode,
    setActiveSlot,
    setUnmutedSlot,
    containsChannel,
    hasEmptySlot,
    slotCount,
  };
}
