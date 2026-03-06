import { create } from "zustand";
import { DEFAULT_VOICE } from "@/lib/constants";

interface AppState {
  mode: "text" | "voice";
  setMode: (mode: "text" | "voice") => void;
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: "voice",
  setMode: (mode) => set({ mode }),
  selectedVoice: DEFAULT_VOICE,
  setSelectedVoice: (voice) => set({ selectedVoice: voice }),
}));
