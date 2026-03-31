export const seedClusters = [
  {
    id: crypto.randomUUID(),
    canonicalQuestion: "When are we going home?",
    samplePhrasings: [
      "Are we leaving now?",
      "Can we go home now?",
      "What time do we go home?"
    ],
    approvedAnswer: "We are already home. We’re safe here tonight.",
    toneTag: "calm_reassurance",
    autoPlay: true
  },
  {
    id: crypto.randomUUID(),
    canonicalQuestion: "What time is dinner?",
    samplePhrasings: [
      "When are we eating?",
      "Did we eat yet?",
      "Is dinner soon?"
    ],
    approvedAnswer: "Dinner will be later today. You are okay, and we will eat soon.",
    toneTag: "gentle_reassurance",
    autoPlay: true
  },
  {
    id: crypto.randomUUID(),
    canonicalQuestion: "Where is my daughter?",
    samplePhrasings: [
      "When will she come?",
      "Has my daughter been here?",
      "Is she coming today?"
    ],
    approvedAnswer: "She is okay. She loves you and we can talk about her together.",
    toneTag: "comforting",
    autoPlay: false
  }
];