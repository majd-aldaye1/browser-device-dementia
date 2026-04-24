import { VoiceSettings } from "@/types/memoraid";

interface VoiceControlsProps {
  voices: SpeechSynthesisVoice[];
  settings: VoiceSettings;
  onChange: (settings: VoiceSettings) => void;
}

export function VoiceControls({ voices, settings, onChange }: VoiceControlsProps) {
  return (
    <div className="voice-grid">
      <label>
        Voice
        <select
          value={settings.voiceURI}
          onChange={(event) => onChange({ ...settings, voiceURI: event.target.value })}
        >
          {voices.map((voice) => (
            <option key={voice.voiceURI} value={voice.voiceURI}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </label>
      <label>
        Rate ({settings.rate.toFixed(2)})
        <input
          type="range"
          min="0.6"
          max="1.1"
          step="0.05"
          value={settings.rate}
          onChange={(event) => onChange({ ...settings, rate: Number(event.target.value) })}
        />
      </label>
      <label>
        Pitch ({settings.pitch.toFixed(2)})
        <input
          type="range"
          min="0.8"
          max="1.2"
          step="0.05"
          value={settings.pitch}
          onChange={(event) => onChange({ ...settings, pitch: Number(event.target.value) })}
        />
      </label>
      <label>
        Volume ({settings.volume.toFixed(2)})
        <input
          type="range"
          min="0.5"
          max="1"
          step="0.05"
          value={settings.volume}
          onChange={(event) => onChange({ ...settings, volume: Number(event.target.value) })}
        />
      </label>
    </div>
  );
}
