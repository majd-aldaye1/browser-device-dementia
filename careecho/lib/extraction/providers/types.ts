import { ExtractionResult } from "@/types/memoraid";

export interface QaExtractorProvider {
  name: string;
  extract(transcriptChunk: string): Promise<ExtractionResult>;
}
