import './App.css';
import { useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { createDrumMachine } from './audio/drumMachine';
import {
  createDefaultVoice,
  normalizeVoice,
} from './audio/soundRegistry';
import StepButton from './components/StepButton';
import TrackVoiceControls from './components/TrackVoiceControls';
import { usePatternStore } from './store/usePatternStore';

const STEP_COUNT = 16;
const STEPS = Array.from({ length: STEP_COUNT }, (_, index) => index);
const SCALE_ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALE_MODES = {
  minor: {
    id: 'minor',
    label: 'Dark',
    quality: 'Minor',
    intervals: [0, 3, 7],
  },
  major: {
    id: 'major',
    label: 'Bright',
    quality: 'Major',
    intervals: [0, 4, 7],
  },
};

const DRUM_TRACKS = [
  {
    id: 'kick',
    label: 'BD',
    name: 'Kick',
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  },
  {
    id: 'snare',
    label: 'SN',
    name: 'Snare',
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  {
    id: 'clap',
    label: 'CP',
    name: 'Clap',
    pattern: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  {
    id: 'closedHat',
    label: 'CH',
    name: 'Closed hat',
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  {
    id: 'openHat',
    label: 'OH',
    name: 'Open hat',
    pattern: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  },
];

const BASSLINE_TRACKS = [
  {
    id: 'bassOne',
    label: 'B1',
    name: 'Bass one',
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  },
  {
    id: 'bassTwo',
    label: 'B2',
    name: 'Bass two',
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  },
  {
    id: 'bassThree',
    label: 'B3',
    name: 'Bass three',
    pattern: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
  },
  {
    id: 'bassFour',
    label: 'B4',
    name: 'Bass four',
    pattern: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
];

const INSTRUMENTS = {
  drums: {
    id: 'drums',
    letter: 'D',
    name: 'Drum machine',
    theme: 'theme-drums',
    tracks: DRUM_TRACKS,
  },
  bassline: {
    id: 'bassline',
    letter: 'B',
    name: 'Bassline',
    theme: 'theme-bassline',
    tracks: BASSLINE_TRACKS,
  },
};

const INSTRUMENT_LIST = Object.values(INSTRUMENTS);
const ALL_TRACKS = INSTRUMENT_LIST.flatMap((instrument) => instrument.tracks);
const ALL_TRACK_IDS = ALL_TRACKS.map((track) => track.id);

const noteFromMidi = (midiNote) => {
  const note = SCALE_ROOTS[((midiNote % 12) + 12) % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  return `${note}${octave}`;
};

const getBassVoiceNotes = (rootIndex, mode = SCALE_MODES.minor.id) => {
  const rootMidi = 36 + rootIndex;
  const intervals = SCALE_MODES[mode]?.intervals ?? SCALE_MODES.minor.intervals;

  return {
    bassOne: noteFromMidi(rootMidi + intervals[0]),
    bassTwo: noteFromMidi(rootMidi + intervals[1]),
    bassThree: noteFromMidi(rootMidi + intervals[2]),
    bassFour: noteFromMidi(rootMidi + 12),
  };
};

const createInitialTrackVoices = () =>
  ALL_TRACKS.reduce((voices, track) => {
    const bassVoiceNotes = getBassVoiceNotes(0);
    voices[track.id] = {
      ...createDefaultVoice(track.id),
      ...(bassVoiceNotes[track.id] ? { note: bassVoiceNotes[track.id] } : {}),
    };
    return voices;
  }, {});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function App() {
  const [activeInstrumentId, setActiveInstrumentId] = useState(INSTRUMENTS.drums.id);
  const [activeStep, setActiveStep] = useState(-1);
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(0);
  const [bassScaleRoot, setBassScaleRoot] = useState(0);
  const [bassScaleMode, setBassScaleMode] = useState(SCALE_MODES.minor.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackVoices, setTrackVoices] = useState(createInitialTrackVoices);
  const pattern = usePatternStore((state) => state.patterns);
  const initializePatterns = usePatternStore((state) => state.initializePatterns);
  const togglePatternStep = usePatternStore((state) => state.toggleStep);
  const clearTracks = usePatternStore((state) => state.clearTracks);
  const resetTracks = usePatternStore((state) => state.resetTracks);

  const activeInstrument = INSTRUMENTS[activeInstrumentId];
  const activeTracks = activeInstrument.tracks;
  const bassVoiceNotes = getBassVoiceNotes(bassScaleRoot, bassScaleMode);
  const getTrackVoice = (trackId) => ({
    ...createDefaultVoice(trackId),
    ...(bassVoiceNotes[trackId] ? { note: bassVoiceNotes[trackId] } : {}),
    ...(trackVoices[trackId] ?? {}),
  });

  const drumMachineRef = useRef(null);
  const patternRef = useRef(pattern);
  const trackVoicesRef = useRef(trackVoices);
  const stepRef = useRef(0);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    initializePatterns(ALL_TRACKS);
  }, [initializePatterns]);

  useEffect(() => {
    const nextTrackVoices = {
      ...trackVoices,
      ...ALL_TRACK_IDS.reduce((voices, trackId) => {
        voices[trackId] = getTrackVoice(trackId);
        return voices;
      }, {}),
    };

    trackVoicesRef.current = nextTrackVoices;
  }, [trackVoices, bassScaleRoot, bassScaleMode]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.swing = swing / 100;
    Tone.Transport.swingSubdivision = '16n';
  }, [bpm, swing]);

  useEffect(() => {
    if (!drumMachineRef.current) {
      return;
    }

    ALL_TRACK_IDS.forEach((trackId) => {
      drumMachineRef.current?.setVoice(
        trackId,
        normalizeVoice(trackId, getTrackVoice(trackId)),
      );
    });
  }, [trackVoices]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.swing = swing / 100;
    Tone.Transport.swingSubdivision = '16n';

    return () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      drumMachineRef.current?.dispose();
      drumMachineRef.current = null;
    };
  }, []);

  const initializeAudio = async () => {
    await Tone.start();

    if (drumMachineRef.current) {
      return;
    }

    const voices = ALL_TRACK_IDS.reduce((acc, trackId) => {
      acc[trackId] = normalizeVoice(trackId, trackVoicesRef.current[trackId] ?? getTrackVoice(trackId));
      return acc;
    }, {});

    drumMachineRef.current = createDrumMachine(voices, ALL_TRACK_IDS);
    Tone.Transport.cancel();
    Tone.Transport.scheduleRepeat((time) => {
      const step = stepRef.current;
      const currentPattern = patternRef.current;

      ALL_TRACKS.forEach((track) => {
        if (currentPattern[track.id]?.[step]) {
          drumMachineRef.current?.trigger(track.id, time);
        }
      });

      Tone.Draw.schedule(() => {
        setActiveStep(step);
      }, time);

      stepRef.current = (step + 1) % STEP_COUNT;
    }, '16n');
  };

  const handlePlay = async () => {
    await initializeAudio();
    stepRef.current = 0;
    Tone.Transport.stop();
    Tone.Transport.position = 0;
    Tone.Transport.start();
    setIsPlaying(true);
  };

  const handleStop = () => {
    Tone.Transport.stop();
    stepRef.current = 0;
    setActiveStep(-1);
    setIsPlaying(false);
  };

  useEffect(() => {
    const handleSpaceTransport = (event) => {
      const target = event.target;
      const isFormControl = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(
        target?.tagName,
      );

      if (event.code !== 'Space' || event.repeat || isFormControl || target?.isContentEditable) {
        return;
      }

      event.preventDefault();

      if (isPlaying) {
        handleStop();
      } else {
        handlePlay();
      }
    };

    window.addEventListener('keydown', handleSpaceTransport);

    return () => {
      window.removeEventListener('keydown', handleSpaceTransport);
    };
  }, [isPlaying]);

  const previewTrack = async (trackId) => {
    await initializeAudio();
    drumMachineRef.current?.trigger(trackId, Tone.now());
  };

  const handleVoiceChange = (trackId, nextVoice) => {
    setTrackVoices((currentVoices) => ({
      ...currentVoices,
      [trackId]: normalizeVoice(trackId, nextVoice),
    }));
  };

  const handleBpmChange = (increment) => {
    setBpm((currentBpm) => clamp(currentBpm + increment, 40, 240));
  };

  const handleSwingChange = (increment) => {
    setSwing((currentSwing) => clamp(currentSwing + increment, 0, 75));
  };

  const handleBassScaleChange = (event) => {
    const rootIndex = Number(event.target.value);
    const bassVoiceNotes = getBassVoiceNotes(rootIndex, bassScaleMode);

    setBassScaleRoot(rootIndex);
    setTrackVoices((currentVoices) => ({
      ...currentVoices,
      bassOne: normalizeVoice('bassOne', {
        ...currentVoices.bassOne,
        note: bassVoiceNotes.bassOne,
      }),
      bassTwo: normalizeVoice('bassTwo', {
        ...currentVoices.bassTwo,
        note: bassVoiceNotes.bassTwo,
      }),
      bassThree: normalizeVoice('bassThree', {
        ...currentVoices.bassThree,
        note: bassVoiceNotes.bassThree,
      }),
      bassFour: normalizeVoice('bassFour', {
        ...currentVoices.bassFour,
        note: bassVoiceNotes.bassFour,
      }),
    }));
  };

  const handleBassModeChange = (event) => {
    const mode = event.target.value;
    const bassVoiceNotes = getBassVoiceNotes(bassScaleRoot, mode);

    setBassScaleMode(mode);
    setTrackVoices((currentVoices) => ({
      ...currentVoices,
      bassOne: normalizeVoice('bassOne', {
        ...currentVoices.bassOne,
        note: bassVoiceNotes.bassOne,
      }),
      bassTwo: normalizeVoice('bassTwo', {
        ...currentVoices.bassTwo,
        note: bassVoiceNotes.bassTwo,
      }),
      bassThree: normalizeVoice('bassThree', {
        ...currentVoices.bassThree,
        note: bassVoiceNotes.bassThree,
      }),
      bassFour: normalizeVoice('bassFour', {
        ...currentVoices.bassFour,
        note: bassVoiceNotes.bassFour,
      }),
    }));
  };

  const toggleStep = (trackId, stepIndex) => {
    const track = ALL_TRACKS.find((candidateTrack) => candidateTrack.id === trackId);

    if (track) {
      togglePatternStep(track, stepIndex);
    }
  };

  const clearPattern = () => {
    clearTracks(activeTracks, STEP_COUNT);
  };

  const resetPattern = () => {
    resetTracks(activeTracks);
  };

  return (
    <main className={`app-shell ${activeInstrument.theme}`}>
      <nav className="instrument-toolbar" aria-label="Instruments">
        <div className="instrument-options">
          {INSTRUMENT_LIST.map((instrument) => (
            <button
              aria-label={`Open ${instrument.name}`}
              aria-pressed={activeInstrumentId === instrument.id}
              className={`instrument-option ${
                activeInstrumentId === instrument.id ? 'is-active' : ''
              }`}
              key={instrument.id}
              onClick={() => setActiveInstrumentId(instrument.id)}
              title={instrument.name}
              type="button"
            >
              {instrument.letter}
            </button>
          ))}
        </div>

        <div className="transport">
          <div className="control-group" aria-label="Bassline scale controls">
            <span className="control-label">Scale</span>
            <select
              aria-label="Bassline scale root"
              className="toolbar-select"
              onChange={handleBassScaleChange}
              value={bassScaleRoot}
            >
              {SCALE_ROOTS.map((root, index) => (
                <option key={root} value={index}>
                  {root}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group" aria-label="Bassline scale mode controls">
            <select
              aria-label="Bassline scale mode"
              className="toolbar-select"
              onChange={handleBassModeChange}
              value={bassScaleMode}
            >
              {Object.values(SCALE_MODES).map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label} ({mode.quality})
                </option>
              ))}
            </select>
          </div>

          <div className="control-group" aria-label="Tempo controls">
            <span className="control-label">BPM</span>
            <button type="button" onClick={() => handleBpmChange(-1)}>
              -
            </button>
            <strong>{bpm}</strong>
            <button type="button" onClick={() => handleBpmChange(1)}>
              +
            </button>
          </div>

          <div className="control-group" aria-label="Swing controls">
            <span className="control-label">Swing</span>
            <button type="button" onClick={() => handleSwingChange(-5)}>
              -
            </button>
            <strong>{swing}%</strong>
            <button type="button" onClick={() => handleSwingChange(5)}>
              +
            </button>
          </div>

          <div className="transport-buttons">
            <button
              className="primary-button"
              type="button"
              onClick={isPlaying ? handleStop : handlePlay}
            >
              {isPlaying ? 'Stop' : 'Play'}
            </button>
            <button type="button" onClick={resetPattern}>
              Reset
            </button>
            <button type="button" onClick={clearPattern}>
              Clear
            </button>
          </div>
        </div>
      </nav>

      <section className="machine-panel" aria-label={`STEPPY.DEV ${activeInstrument.name}`}>
        <div className="hero">
          <p className="eyebrow">computer controlled</p>
          <h1>STEPPY.DEV</h1>
          <p className="subtitle">
            A modern React and Tone.js step drum machine.
          </p>
        </div>

        <div className="sequencer" role="grid" aria-label="16-step sequencer">
          <div className="step-header" aria-hidden="true">
            <span />
            {STEPS.map((step) => (
              <span key={step}>{step + 1}</span>
            ))}
          </div>

          {activeTracks.map((track) => (
            <div className="track-row" role="row" key={track.id}>
              <TrackVoiceControls
                onPreview={previewTrack}
                onVoiceChange={handleVoiceChange}
                track={track}
                voice={getTrackVoice(track.id)}
              />

              {STEPS.map((step) => (
                <StepButton
                  key={step}
                  activeStep={activeStep === step}
                  emphasized={step % 4 === 0}
                  enabled={(pattern[track.id] ?? track.pattern.map(Boolean))[step]}
                  label={`${track.name} step ${step + 1}`}
                  onClick={() => toggleStep(track.id, step)}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
