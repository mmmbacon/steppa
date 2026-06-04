import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const toBooleanPattern = (pattern) => pattern.map(Boolean);

export const usePatternStore = create(
  persist(
    (set) => ({
      patterns: {},
      initializePatterns: (tracks) =>
        set((state) => {
          const nextPatterns = { ...state.patterns };
          let changed = false;

          tracks.forEach((track) => {
            if (!nextPatterns[track.id]) {
              nextPatterns[track.id] = toBooleanPattern(track.pattern);
              changed = true;
            }
          });

          return changed ? { patterns: nextPatterns } : state;
        }),
      toggleStep: (track, stepIndex) =>
        set((state) => {
          const currentPattern = state.patterns[track.id] ?? toBooleanPattern(track.pattern);

          return {
            patterns: {
              ...state.patterns,
              [track.id]: currentPattern.map((isActive, index) =>
                index === stepIndex ? !isActive : isActive,
              ),
            },
          };
        }),
      clearTracks: (tracks, stepCount) =>
        set((state) => ({
          patterns: {
            ...state.patterns,
            ...tracks.reduce((nextPatterns, track) => {
              nextPatterns[track.id] = Array(stepCount).fill(false);
              return nextPatterns;
            }, {}),
          },
        })),
      resetTracks: (tracks) =>
        set((state) => ({
          patterns: {
            ...state.patterns,
            ...tracks.reduce((nextPatterns, track) => {
              nextPatterns[track.id] = toBooleanPattern(track.pattern);
              return nextPatterns;
            }, {}),
          },
        })),
    }),
    {
      name: 'steppa-patterns-v1',
      partialize: (state) => ({ patterns: state.patterns }),
    },
  ),
);
