import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createDefaultVoice, normalizeVoice } from '../audio/soundRegistry';

/** @type {import('../audio/soundRegistry').TrackId[]} */
export const DRUM_TRACK_IDS = ['kick', 'snare', 'clap', 'closedHat', 'openHat'];

export const useDrumVoiceStore = create(
  persist(
    (set) => ({
      voices: {},
      setVoice: (trackId, voice) =>
        set((state) => ({
          voices: {
            ...state.voices,
            [trackId]: normalizeVoice(trackId, voice),
          },
        })),
    }),
    {
      name: 'steppa-drum-voices-v1',
      partialize: (state) => ({ voices: state.voices }),
    },
  ),
);

export const getPersistedDrumVoice = (trackId, voices) =>
  voices[trackId] ?? createDefaultVoice(trackId);
