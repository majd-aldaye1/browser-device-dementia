import { QaExtractorProvider } from "@/lib/extraction/providers/types";
import { ExtractionResult } from "@/types/memoraid";

export class OpenAiQaExtractorProvider implements QaExtractorProvider {
  name = "openai-gpt-5-mini";

  async extract(transcriptChunk: string): Promise<ExtractionResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is missing.");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        input: [
          {
            role: "system",
            content:
              "Extract only clear patient question + caregiver answer pairs from transcript lines. Return strict JSON using schema: { pairs: [{question,answer,confidence,sourceTranscript}] }. If answer is missing, do not emit a pair. Never invent details.",
          },
          {
            role: "user",
            content: transcriptChunk,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "qa_pairs",
            schema: {
              type: "object",
              properties: {
                pairs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      answer: { type: "string" },
                      confidence: { type: "number" },
                      sourceTranscript: { type: "string" },
                    },
                    required: ["question", "answer", "confidence", "sourceTranscript"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["pairs"],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI extraction failed: ${response.status} ${text}`);
    }

    const payload = (await response.json()) as { output_text?: string };
    const raw = payload.output_text ?? "{\"pairs\":[]}";
    const parsed = JSON.parse(raw) as ExtractionResult;
    return { pairs: Array.isArray(parsed.pairs) ? parsed.pairs : [] };
  }
}

// TODO: add additional providers implementing QaExtractorProvider:
// - Ollama local model provider
// - Hugging Face inference provider
// - other hosted LLM providers
