import { MockQaExtractorProvider } from "@/lib/extraction/providers/mockProvider";
import { OpenAiQaExtractorProvider } from "@/lib/extraction/providers/openaiProvider";
import { QaExtractorProvider } from "@/lib/extraction/providers/types";

export const createQaExtractorProvider = (): QaExtractorProvider => {
  if (process.env.OPENAI_API_KEY) {
    return new OpenAiQaExtractorProvider();
  }

  return new MockQaExtractorProvider();
};
