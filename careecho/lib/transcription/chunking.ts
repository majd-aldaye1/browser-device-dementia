import { TranscriptSegment } from "@/types/memoraid";

export const buildTranscriptChunk = (
  segments: TranscriptSegment[],
  maxSegments = 6,
): string => {
  const windowed = segments.slice(-maxSegments);
  return windowed
    .map((segment) => {
      return `${segment.speaker}: ${segment.text}`;
    })
    .join("\n");
};

export const normalizeQuestion = (question: string): string =>
  question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
