import { extractPairsFromTranscriptChunk } from "@/lib/extraction/heuristic";
import { QaExtractorProvider } from "@/lib/extraction/providers/types";
import { ExtractionResult } from "@/types/memoraid";

export class MockQaExtractorProvider implements QaExtractorProvider {
  name = "mock-rule-based";

  async extract(transcriptChunk: string): Promise<ExtractionResult> {
    return extractPairsFromTranscriptChunk(transcriptChunk);
  }
}
