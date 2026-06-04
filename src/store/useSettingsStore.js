import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      reverbAmount: 24,
      setReverbAmount: (reverbAmount) =>
        set({ reverbAmount: Math.min(100, Math.max(0, reverbAmount)) }),
    }),
    {
      name: 'steppa-settings-v1',
      version: 1,
      migrate: (persistedState) => ({
        reverbAmount: persistedState?.reverbAmount ?? persistedState?.reverbWet ?? 24,
      }),
    },
  ),
);
