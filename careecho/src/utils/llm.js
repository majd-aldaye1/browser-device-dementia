const DEFAULT_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

export async function shouldTreatAsQuestion(text, config) {
  if (!config?.apiKey) {
    return { isQuestion: null, reason: "no_api_key" };
  }

  const payload = {
    model: config.model || DEFAULT_MODEL,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Return only JSON with keys is_question (boolean) and confidence (0-1). Judge if the utterance is a spoken question.",
      },
      {
        role: "user",
        content: text,
      },
    ],
    response_format: { type: "json_object" },
  };

  const response = await fetch(config.endpoint || DEFAULT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`LLM request failed (${response.status})`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(raw);
    return {
      isQuestion: Boolean(parsed.is_question),
      confidence: Number(parsed.confidence ?? 0),
      reason: "llm",
    };
  } catch {
    return { isQuestion: null, reason: "parse_error" };
  }
}
