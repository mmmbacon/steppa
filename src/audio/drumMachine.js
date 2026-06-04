import * as Tone from 'tone';
import { getSampleUrl, VoiceMode } from './soundRegistry';

function createSynthEngine(trackId, destination, reverb) {
  if (trackId === 'kick') {
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.045,
      octaves: 8,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.35,
        sustain: 0.01,
        release: 0.08,
      },
    }).connect(destination);

    return {
      trigger(time) {
        kick.triggerAttackRelease('C1', '8n', time);
      },
      dispose() {
        kick.dispose();
      },
    };
  }

  if (trackId === 'snare') {
    const snareNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.14,
        sustain: 0,
        release: 0.05,
      },
    }).connect(destination);

    const snareBody = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.08,
      },
    }).connect(destination);

    return {
      trigger(time) {
        snareNoise.triggerAttackRelease('16n', time);
        snareBody.triggerAttackRelease('G2', '16n', time);
      },
      dispose() {
        snareNoise.dispose();
        snareBody.dispose();
      },
    };
  }

  if (trackId === 'clap') {
    const clapOutput = new Tone.Gain(1.35).connect(destination);
    const clapFilter = new Tone.Filter({
      type: 'bandpass',
      frequency: 1050,
      Q: 3.5,
      rolloff: -24,
    });
    const clapHighpass = new Tone.Filter({
      type: 'highpass',
      frequency: 650,
      rolloff: -12,
    });
    const clapDrive = new Tone.Distortion({
      distortion: 0.22,
      wet: 0.35,
    });

    clapFilter.chain(clapHighpass, clapDrive, clapOutput);
    clapDrive.connect(reverb);

    const clapBursts = Array.from({ length: 4 }, (_, index) =>
      new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: {
          attack: 0.001,
          decay: index === 3 ? 0.04 : 0.012,
          sustain: 0,
          release: 0.006,
        },
        volume: index === 0 ? -3 : -5,
      }).connect(clapFilter),
    );

    const clapTail = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.11,
        sustain: 0,
        release: 0.035,
      },
      volume: -12,
    }).connect(clapFilter);

    return {
      trigger(time) {
        const startTime = time ?? Tone.now();

        clapBursts.forEach((burst, index) => {
          burst.triggerAttackRelease(0.012, startTime + index * 0.01);
        });

        clapTail.triggerAttackRelease(0.11, startTime + 0.03);
      },
      dispose() {
        clapBursts.forEach((burst) => burst.dispose());
        clapTail.dispose();
        clapDrive.dispose();
        clapHighpass.dispose();
        clapFilter.dispose();
        clapOutput.dispose();
      },
    };
  }

  if (trackId === 'closedHat') {
    const closedHat = new Tone.MetalSynth({
      frequency: 280,
      envelope: {
        attack: 0.001,
        decay: 0.06,
        release: 0.02,
      },
      harmonicity: 5.1,
      modulationIndex: 18,
      resonance: 5000,
      octaves: 1.5,
    }).connect(destination);

    return {
      trigger(time) {
        closedHat.triggerAttackRelease(closedHat.frequency.value, '32n', time, 0.55);
      },
      dispose() {
        closedHat.dispose();
      },
    };
  }

  if (trackId === 'openHat') {
    const openHat = new Tone.MetalSynth({
      frequency: 240,
      envelope: {
        attack: 0.001,
        decay: 0.48,
        release: 0.18,
      },
      harmonicity: 5.1,
      modulationIndex: 24,
      resonance: 6000,
      octaves: 1.8,
    }).connect(destination);

    return {
      trigger(time) {
        openHat.triggerAttackRelease(openHat.frequency.value, '8n', time, 0.45);
      },
      dispose() {
        openHat.dispose();
      },
    };
  }

  return {
    trigger() {},
    dispose() {},
  };
}

function createSampleEngine(sampleId, destination) {
  const url = getSampleUrl(sampleId);

  if (!url) {
    return {
      loaded: true,
      trigger() {},
      dispose() {},
    };
  }

  let loaded = false;
  const player = new Tone.Player({
    url,
    fadeOut: 0.02,
    onload: () => {
      loaded = true;
    },
  }).connect(destination);

  return {
    get loaded() {
      return loaded;
    },
    trigger(time) {
      if (loaded) {
        player.start(time);
      }
    },
    dispose() {
      player.dispose();
    },
  };
}

function createTrackEngine(trackId, voice, destination, reverb) {
  if (voice.mode === VoiceMode.SAMPLE && voice.sampleId) {
    return createSampleEngine(voice.sampleId, destination);
  }

  return createSynthEngine(trackId, destination, reverb);
}

/**
 * @param {Record<string, { mode: string, sampleId: string }>} voices
 * @param {string[]} trackIds
 */
export function createDrumMachine(voices, trackIds) {
  const limiter = new Tone.Limiter(-1).toDestination();
  const drumBus = new Tone.Gain(0.85).connect(limiter);
  const reverb = new Tone.Reverb({ decay: 1.2, wet: 0.16 }).connect(limiter);

  /** @type {Record<string, ReturnType<typeof createTrackEngine>>} */
  const engines = {};

  for (const trackId of trackIds) {
    engines[trackId] = createTrackEngine(trackId, voices[trackId], drumBus, reverb);
  }

  return {
    trigger(trackId, time) {
      engines[trackId]?.trigger(time);
    },
    setVoice(trackId, voice) {
      engines[trackId]?.dispose();
      engines[trackId] = createTrackEngine(trackId, voice, drumBus, reverb);
    },
    dispose() {
      Object.values(engines).forEach((engine) => engine.dispose());
      reverb.dispose();
      drumBus.dispose();
      limiter.dispose();
    },
  };
}
