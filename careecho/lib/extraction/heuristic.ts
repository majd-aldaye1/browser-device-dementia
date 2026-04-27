import { looksLikeQuestion } from "@/lib/nlp/questionHeuristics";
import { ExtractionResult } from "@/types/memoraid";

type ParsedLine = {
  speaker: "patient" | "caregiver" | "unknown";
  text: string;
  raw: string;
};

const stripTrailingTimestamp = (value: string): string =>
  value
    .replace(/\(\d{1,2}:\d{2}(?::\d{2})?\s*[AP]M\)$/i, "")
    .replace(/\s+/g, " ")
    .trim();

const parseLine = (line: string): ParsedLine | null => {
  const match = line.match(/^(patient|caregiver|unknown|speaker):\s*(.*)$/i);
  if (!match) return null;

  const speaker = match[1].toLowerCase() as ParsedLine["speaker"];
  const normalizedSpeaker = speaker === "speaker" ? "unknown" : speaker;
  const text = stripTrailingTimestamp(match[2].trim());
  if (!text) return null;

  return { speaker: normalizedSpeaker, text, raw: `${normalizedSpeaker}: ${text}` };
};

export const extractPairsFromTranscriptChunk = (transcriptChunk: string): ExtractionResult => {
  const normalizedChunk = transcriptChunk.replace(/\\n/g, "\n");

  const lines = normalizedChunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseLine)
    .filter((line): line is ParsedLine => Boolean(line));

  const pairs: ExtractionResult["pairs"] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const current = lines[i];
    const next = lines[i + 1];
    if (!current || !next) continue;

    if (!looksLikeQuestion(current.text)) continue;
    if (looksLikeQuestion(next.text)) continue;
    if (current.speaker === "caregiver" && next.speaker === "patient") continue;

    const confidence =
      current.speaker === "patient" && next.speaker === "caregiver" ? 0.65 : 0.5;

    pairs.push({
      question: current.text,
      answer: next.text,
      confidence,
      sourceTranscript: `${current.raw}\n${next.raw}`,
    });
  }

  return { pairs };
};
