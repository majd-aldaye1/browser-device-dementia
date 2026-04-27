import { QaExtractorProvider } from "@/lib/extraction/providers/types";
import { ExtractionResult } from "@/types/memoraid";

const questionPattern = /\?$/;

export class MockQaExtractorProvider implements QaExtractorProvider {
  name = "mock-rule-based";

  async extract(transcriptChunk: string): Promise<ExtractionResult> {
    const lines = transcriptChunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const pairs: ExtractionResult["pairs"] = [];

    for (let i = 0; i < lines.length; i += 1) {
      const current = lines[i];
      const next = lines[i + 1];

      if (!current?.startsWith("patient:")) continue;
      if (!questionPattern.test(current)) continue;
      if (!next?.startsWith("caregiver:")) continue;

      const question = current.replace(/^patient:\s*/i, "").trim();
      const answer = next.replace(/^caregiver:\s*/i, "").trim();
      if (!question || !answer) continue;

      pairs.push({
        question,
        answer,
        confidence: 0.55,
        sourceTranscript: `${current}\n${next}`,
      });
    }

    return { pairs };
  }
}
