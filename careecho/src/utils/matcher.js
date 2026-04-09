import { normalize, tokens } from "./normalize";

export function findQuestionMatch(question, entries, threshold = 0.72) {
  const normalizedQuestion = normalize(question);
  if (!normalizedQuestion) {
    return null;
  }

  let bestMatch = null;

  for (const entry of entries) {
    const stored = normalize(entry.question);
    if (!stored) {
      continue;
    }

    if (stored === normalizedQuestion) {
      return { entry, score: 1, strategy: "exact" };
    }

    const score = jaccardSimilarity(stored, normalizedQuestion);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { entry, score, strategy: "token-overlap" };
    }
  }

  if (bestMatch && bestMatch.score >= threshold) {
    return bestMatch;
  }

  return null;
}

function jaccardSimilarity(a, b) {
  const aTokens = tokens(a);
  const bTokens = tokens(b);

  const union = new Set([...aTokens, ...bTokens]);
  if (union.size === 0) {
    return 0;
  }

  const intersection = [...aTokens].filter((token) => bTokens.has(token));
  return intersection.length / union.size;
}
