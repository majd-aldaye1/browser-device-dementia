import { MemoryPair, RepetitionMatch } from "@/types/memoraid";
import { normalizeQuestion } from "@/lib/transcription/chunking";

const tokenize = (value: string): Set<string> => {
  const normalized = normalizeQuestion(value);
  return new Set(normalized.split(" ").filter((token) => token.length > 1));
};

const jaccardSimilarity = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
};

export const findBestRepeatedQuestionMatch = (
  question: string,
  memoryPairs: MemoryPair[],
  threshold = 0.45,
): RepetitionMatch => {
  const currentTokens = tokenize(question);

  let bestPair: MemoryPair | undefined;
  let bestScore = 0;

  for (const pair of memoryPairs) {
    const score = jaccardSimilarity(currentTokens, tokenize(pair.question));
    if (score > bestScore) {
      bestPair = pair;
      bestScore = score;
    }
  }

  if (!bestPair || bestScore < threshold) {
    return {
      matched: false,
      score: bestScore,
      threshold,
      currentQuestion: question,
      reason: "No reliable saved answer found yet.",
    };
  }

  return {
    matched: true,
    score: bestScore,
    threshold,
    currentQuestion: question,
    matchedPair: bestPair,
  };
};

// TODO: Replace lexical Jaccard similarity with vector embeddings + cosine similarity
// (OpenAI embeddings, local embedding model, or Hugging Face inference) for better semantic matching.
