export type Speaker = "patient" | "caregiver" | "unknown";

export interface TranscriptSegment {
  id: string;
  text: string;
  speaker: Speaker;
  timestamp: string;
}

export interface ExtractedPair {
  question: string;
  answer: string;
  confidence: number;
  sourceTranscript: string;
}

export interface ExtractionResult {
  pairs: ExtractedPair[];
}

export interface MemoryPair extends ExtractedPair {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepetitionMatch {
  matched: boolean;
  score: number;
  threshold: number;
  currentQuestion: string;
  matchedPair?: MemoryPair;
  reason?: string;
}

export interface VoiceSettings {
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
}
