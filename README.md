# STEPPY.DEV

Live Preview
## [https://steppa-two.vercel.app/](https://steppa-two.vercel.app/)

STEPPY.DEV is a browser-based drum machine and 16-step sequencer built with React, Vite, Tone.js, and [Zustand](https://github.com/pmndrs/zustand) for app state (pattern, voices, settings).

I built this for fun, and because I love electronic music!

## Screenshots

<img width="3840" height="2160" alt="screenshot1" src="https://github.com/user-attachments/assets/cd87992e-792e-4a47-9a75-628f351c2823" />

<img width="3840" height="2160" alt="screenshot2" src="https://github.com/user-attachments/assets/04c73e00-fb34-4dd1-a834-673262145479" />

## How to use

Open the [live app](https://steppa-two.vercel.app/) or run `npm start`, then press **Play** (or **Space**) to start the transport. The browser needs that click or keypress to unlock audio.

### Sequencer

- **D** and **B** switch the view between the **drum machine** (five tracks) and **bassline** (four tracks). Both sections keep playing while the transport runs; switching only changes which grid you edit.
- Click a step to toggle it on or off. The playhead highlights the current step while playing.
- Click a track label (**BD**, **SN**, **B1**, etc.) to preview that voice once.
- **Reset** restores the default pattern for the visible instrument. **Clear** turns off every step for those tracks.
- Patterns, drum voice choices, and settings are saved in the browser (Zustand `persist`).

### Transport

- **BPM** and **Swing** adjust tempo and shuffle on 16th-note steps.
- On the bassline view, the **reverb** knob sends more of the bass into a shared reverb (decay follows the knob).

### Drum machine (synth and samples)

Each drum row has a voice selector:

- **Syn** — built-in Tone.js synthesis (default).
- **Smp** — TR-909-style samples from `src/audio/TR909/` (kick `bd`, snare `sd`, clap `cp`, closed hat `hh`, open hat `oh`). Pick a variant in the sample dropdown.

| Track | Synth voice |
|-------|-------------|
| **BD** (kick) | `MembraneSynth` — short decay, low sine thump |
| **SN** (snare) | White noise burst plus a short triangle body |
| **CP** (clap) | Layered noise bursts through bandpass, highpass, and light distortion |
| **CH** (closed hat) | `MetalSynth` — bright, very short |
| **OH** (open hat) | `MetalSynth` — longer decay than closed hat |

Drum voices are remembered per track when you reload.

### Bassline synth

Four bass rows (**B1**–**B4**) each play a **MonoSynth** (sawtooth, low-pass filter with envelope) on the active step. They are not sample-based.

Pitch comes from the toolbar **Scale** controls:

- **Root** — key (C through B).
- **Dark** / **Bright** — minor or major triad.

Each row is mapped to a degree of that chord:

| Track | Role |
|-------|------|
| **B1** | Root |
| **B2** | Third (minor or major) |
| **B3** | Fifth |
| **B4** | Root one octave up |

Change the scale anytime; the four notes update together while your step pattern stays the same.

## Scripts

- `npm start` / `npm run dev` starts the Vite dev server.
- `npm run build` creates a production build in `dist`.
- `npm run preview` serves the production build locally.

## Future plans

- Mixer
- Track level volume
- House Piano
- Recording / Timeline
- Export

## Notes

Drums default to synth voices; TR-909 samples are optional per track. Bass is synth-only.

## Screenshots



