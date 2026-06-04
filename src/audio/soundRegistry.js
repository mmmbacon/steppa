/** @typedef {'kick' | 'snare' | 'clap' | 'closedHat' | 'openHat'} TrackId */

/** @typedef {'kick' | 'snare' | 'clap' | 'closedHat' | 'openHat'} SoundCategory */

/**
 * How a track produces sound.
 * @readonly
 */
export const VoiceMode = {
  SYNTH: 'synth',
  SAMPLE: 'sample',
};

/**
 * TR-909-style sample families mapped to sequencer tracks.
 * @readonly
 */
export const SoundCategory = {
  KICK: 'kick',
  SNARE: 'snare',
  CLAP: 'clap',
  CLOSED_HAT: 'closedHat',
  OPEN_HAT: 'openHat',
};

/** Filename prefix (before digits) → track / category id */
const PREFIX_TO_CATEGORY = {
  bd: SoundCategory.KICK,
  sd: SoundCategory.SNARE,
  cp: SoundCategory.CLAP,
  hh: SoundCategory.CLOSED_HAT,
  oh: SoundCategory.OPEN_HAT,
};

const sampleModules = import.meta.glob('./TR909/*.{wav,mp3}', {
  eager: true,
  query: '?url',
  import: 'default',
});

/** @type {Record<string, string>} */
const sampleUrlById = {};

/** @type {Record<SoundCategory, string[]>} */
const sampleIdsByCategory = {
  [SoundCategory.KICK]: [],
  [SoundCategory.SNARE]: [],
  [SoundCategory.CLAP]: [],
  [SoundCategory.CLOSED_HAT]: [],
  [SoundCategory.OPEN_HAT]: [],
};

for (const path of Object.keys(sampleModules)) {
  const fileName = path.split('/').pop() ?? '';
  const sampleId = fileName.replace(/\.(wav|mp3)$/i, '');
  const prefixMatch = sampleId.match(/^([a-z]+)\d*$/i);

  if (!prefixMatch) {
    continue;
  }

  const prefix = prefixMatch[1].toLowerCase();
  const category = PREFIX_TO_CATEGORY[prefix];

  if (!category) {
    continue;
  }

  sampleUrlById[sampleId] = sampleModules[path];
  sampleIdsByCategory[category].push(sampleId);
}

for (const category of Object.values(SoundCategory)) {
  sampleIdsByCategory[category].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/** All registered sample ids (flat). */
export const SampleId = Object.freeze(
  Object.fromEntries(
    Object.values(sampleIdsByCategory)
      .flat()
      .map((id) => [id, id]),
  ),
);

/**
 * @param {TrackId} trackId
 * @returns {SoundCategory}
 */
export function getCategoryForTrack(trackId) {
  return trackId;
}

/**
 * @param {TrackId} trackId
 * @returns {{ id: string, label: string }[]}
 */
export function getSamplesForTrack(trackId) {
  const category = getCategoryForTrack(trackId);
  return sampleIdsByCategory[category].map((id) => ({
    id,
    label: id.toUpperCase(),
  }));
}

/**
 * @param {string} sampleId
 * @returns {string | undefined}
 */
export function getSampleUrl(sampleId) {
  return sampleUrlById[sampleId];
}

/**
 * @param {TrackId} trackId
 * @returns {string | undefined}
 */
export function getDefaultSampleId(trackId) {
  return sampleIdsByCategory[getCategoryForTrack(trackId)][0];
}

/**
 * @param {TrackId} trackId
 * @param {{ mode: string, sampleId?: string }} voice
 * @returns {{ mode: string, sampleId: string }}
 */
export function normalizeVoice(trackId, voice) {
  const samples = getSamplesForTrack(trackId);
  const defaultSampleId = samples[0]?.id ?? '';

  if (voice.mode === VoiceMode.SAMPLE) {
    const sampleId = samples.some((s) => s.id === voice.sampleId)
      ? voice.sampleId
      : defaultSampleId;

    return { mode: VoiceMode.SAMPLE, sampleId };
  }

  return { mode: VoiceMode.SYNTH, sampleId: defaultSampleId };
}

/**
 * @param {TrackId} trackId
 * @returns {{ mode: typeof VoiceMode.SYNTH, sampleId: string }}
 */
export function createDefaultVoice(trackId) {
  return {
    mode: VoiceMode.SYNTH,
    sampleId: getDefaultSampleId(trackId) ?? '',
  };
}
