import { Speaker, TranscriptSegment } from "@/types/memoraid";

type SegmentHandler = (segment: TranscriptSegment) => void;
type ErrorHandler = (message: string) => void;

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: {
      new (): SpeechRecognitionLike;
    };
    SpeechRecognition?: {
      new (): SpeechRecognitionLike;
    };
  }
}

const detectSpeaker = (text: string): Speaker => {
  const normalized = text.toLowerCase();
  if (normalized.startsWith("patient:")) return "patient";
  if (normalized.startsWith("caregiver:")) return "caregiver";
  return "unknown";
};

const stripSpeakerPrefix = (text: string): string =>
  text.replace(/^(patient|caregiver)\s*:\s*/i, "").trim();

export class BrowserSpeechTranscriber {
  private recognition: SpeechRecognitionLike | null = null;
  private onSegment: SegmentHandler;
  private onError: ErrorHandler;
  private listening = false;

  constructor(onSegment: SegmentHandler, onError: ErrorHandler) {
    this.onSegment = onSegment;
    this.onError = onError;

    const Recognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;

    if (!Recognition) return;

    this.recognition = new Recognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result?.isFinal) continue;

        const text = result[0]?.transcript?.trim();
        if (!text) continue;

        const speaker = detectSpeaker(text);
        const segment: TranscriptSegment = {
          id: crypto.randomUUID(),
          speaker,
          text: stripSpeakerPrefix(text),
          timestamp: new Date().toISOString(),
        };
        this.onSegment(segment);
      }
    };

    this.recognition.onerror = (event) => {
      this.onError(event.error ?? "Speech recognition failed.");
    };

    this.recognition.onend = () => {
      if (this.listening) {
        // Keep listening in continuous mode unless explicitly stopped.
        this.recognition?.start();
      }
    };
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  start(): void {
    if (!this.recognition) {
      this.onError("Browser speech recognition is unavailable. Use Demo Input mode.");
      return;
    }
    this.listening = true;
    this.recognition.start();
  }

  stop(): void {
    this.listening = false;
    this.recognition?.stop();
  }
}

// TODO: Replace/augment BrowserSpeechTranscriber with a production STT adapter (Whisper or a hosted STT service)
// via a server route, while preserving this same start/stop/onSegment interface.
