"use client";

import { useMemo, useState } from "react";
import { ExtractedPair, MemoryPair } from "@/types/memoraid";

export const useQaMemory = () => {
  const [pairs, setPairs] = useState<MemoryPair[]>([]);

  const upsertPairs = (incoming: ExtractedPair[]) => {
    if (!incoming.length) return;

    setPairs((prev) => {
      const next = [...prev];

      for (const pair of incoming) {
        const existing = next.find(
          (item) => item.question.toLowerCase() === pair.question.toLowerCase(),
        );
        if (existing) {
          existing.answer = pair.answer;
          existing.confidence = pair.confidence;
          existing.sourceTranscript = pair.sourceTranscript;
          existing.updatedAt = new Date().toISOString();
        } else {
          const now = new Date().toISOString();
          next.push({
            ...pair,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      return next;
    });
  };

  const deletePair = (id: string) => {
    setPairs((prev) => prev.filter((pair) => pair.id !== id));
  };

  const reset = () => setPairs([]);

  const count = useMemo(() => pairs.length, [pairs]);

  return { pairs, upsertPairs, deletePair, reset, count };
};

// TODO: In production, replace with secure persistence (encrypted DB + caregiver auth).
