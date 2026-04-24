"use client";

import { useEffect, useMemo, useState } from "react";
import { VoiceSettings } from "@/types/memoraid";

const defaultSettings: VoiceSettings = {
  voiceURI: "",
  rate: 0.9,
  pitch: 1,
  volume: 0.9,
};

export const useComfortingTts = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>(defaultSettings);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      if (!settings.voiceURI && available.length > 0) {
        setSettings((prev) => ({ ...prev, voiceURI: available[0].voiceURI }));
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [settings.voiceURI]);

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.voiceURI === settings.voiceURI),
    [voices, settings.voiceURI],
  );

  const speak = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice ?? null;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    window.speechSynthesis.speak(utterance);
  };

  return {
    voices,
    settings,
    setSettings,
    speak,
  };
};

// TODO: integrate a higher-quality comforting TTS provider via secure server-side API when needed.
