const QUESTION_STARTERS = [
  "who",
  "what",
  "when",
  "where",
  "why",
  "how",
  "can",
  "could",
  "do",
  "does",
  "did",
  "is",
  "are",
  "am",
  "will",
  "would",
  "should",
];

export const looksLikeQuestion = (text: string): boolean => {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes("?")) return true;
  return QUESTION_STARTERS.some((starter) => normalized.startsWith(`${starter} `));
};
