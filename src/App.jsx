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

const STEP_COUNT = 16;
const STEPS = Array.from({ length: STEP_COUNT }, (_, index) => index);

const TRACKS = [
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

const TRACK_IDS = TRACKS.map((track) => track.id);

const createInitialPattern = () =>
  TRACKS.reduce((pattern, track) => {
    pattern[track.id] = track.pattern.map(Boolean);
    return pattern;
  }, {});

const createInitialTrackVoices = () =>
  TRACKS.reduce((voices, track) => {
    voices[track.id] = createDefaultVoice(track.id);
    return voices;
  }, {});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function App() {
  const [activeStep, setActiveStep] = useState(-1);
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pattern, setPattern] = useState(createInitialPattern);
  const [trackVoices, setTrackVoices] = useState(createInitialTrackVoices);

  const drumMachineRef = useRef(null);
  const patternRef = useRef(pattern);
  const trackVoicesRef = useRef(trackVoices);
  const stepRef = useRef(0);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  useEffect(() => {
    trackVoicesRef.current = trackVoices;
  }, [trackVoices]);

  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.swing = swing / 100;
    Tone.Transport.swingSubdivision = '16n';
  }, [bpm, swing]);

  useEffect(() => {
    if (!drumMachineRef.current) {
      return;
    }

    TRACK_IDS.forEach((trackId) => {
      drumMachineRef.current?.setVoice(
        trackId,
        normalizeVoice(trackId, trackVoices[trackId]),
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

    const voices = TRACK_IDS.reduce((acc, trackId) => {
      acc[trackId] = normalizeVoice(trackId, trackVoicesRef.current[trackId]);
      return acc;
    }, {});

    drumMachineRef.current = createDrumMachine(voices, TRACK_IDS);
    Tone.Transport.cancel();
    Tone.Transport.scheduleRepeat((time) => {
      const step = stepRef.current;
      const currentPattern = patternRef.current;

      TRACKS.forEach((track) => {
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

  const toggleStep = (trackId, stepIndex) => {
    setPattern((currentPattern) => ({
      ...currentPattern,
      [trackId]: currentPattern[trackId].map((isActive, index) =>
        index === stepIndex ? !isActive : isActive,
      ),
    }));
  };

  const clearPattern = () => {
    setPattern(
      TRACKS.reduce((nextPattern, track) => {
        nextPattern[track.id] = Array(STEP_COUNT).fill(false);
        return nextPattern;
      }, {}),
    );
  };

  const resetPattern = () => {
    setPattern(createInitialPattern());
  };

  return (
    <main className="app-shell">
      <section className="machine-panel" aria-label="STEPPY.DEV drum machine">
        <div className="hero">
          <p className="eyebrow">Browser drum machine</p>
          <h1>STEPPY.DEV</h1>
          <p className="subtitle">
            A modern React and Tone.js step sequencer, rebuilt to be fast,
            hackable, and fun to keep expanding.
          </p>
        </div>

        <div className="transport">
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

        <div className="sequencer" role="grid" aria-label="16-step sequencer">
          <div className="step-header" aria-hidden="true">
            <span />
            {STEPS.map((step) => (
              <span key={step}>{step + 1}</span>
            ))}
          </div>

          {TRACKS.map((track) => (
            <div className="track-row" role="row" key={track.id}>
              <TrackVoiceControls
                onPreview={previewTrack}
                onVoiceChange={handleVoiceChange}
                track={track}
                voice={trackVoices[track.id]}
              />

              {STEPS.map((step) => (
                <StepButton
                  key={step}
                  activeStep={activeStep === step}
                  emphasized={step % 4 === 0}
                  enabled={pattern[track.id][step]}
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
