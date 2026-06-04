import {
  createDefaultVoice,
  getSamplesForTrack,
  normalizeVoice,
  VoiceMode,
} from '../audio/soundRegistry';

function TrackVoiceControls({ track, voice, onPreview, onVoiceChange }) {
  const samples = getSamplesForTrack(track.id);
  const hasSamples = samples.length > 0;
  const isSampleMode = voice.mode === VoiceMode.SAMPLE;

  const handleModeChange = (event) => {
    const mode = event.target.value;
    onVoiceChange(
      track.id,
      normalizeVoice(track.id, {
        ...voice,
        mode,
        sampleId: voice.sampleId || samples[0]?.id,
      }),
    );
  };

  const handleSampleChange = (event) => {
    onVoiceChange(
      track.id,
      normalizeVoice(track.id, {
        mode: VoiceMode.SAMPLE,
        sampleId: event.target.value,
      }),
    );
  };

  return (
    <div className="track-label-cell">
      <button
        aria-label={`Preview ${track.name}`}
        className="track-label"
        onClick={() => onPreview(track.id)}
        title={track.name}
        type="button"
      >
        {track.label}
      </button>

      <select
        aria-label={`${track.name} voice type`}
        className="voice-select voice-select-mode"
        disabled={!hasSamples}
        onChange={handleModeChange}
        value={voice.mode}
      >
        <option value={VoiceMode.SYNTH}>Syn</option>
        {hasSamples && <option value={VoiceMode.SAMPLE}>Smp</option>}
      </select>

      {hasSamples && (
        <select
          aria-label={`${track.name} sample`}
          className="voice-select voice-select-sample"
          disabled={!isSampleMode}
          onChange={handleSampleChange}
          title={isSampleMode ? voice.sampleId : 'Select sample mode'}
          value={isSampleMode ? voice.sampleId : createDefaultVoice(track.id).sampleId}
        >
          {samples.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.id}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default TrackVoiceControls;
