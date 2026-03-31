import { useState } from "react";

export default function CaregiverForm({ onAddCluster }) {
  const [canonicalQuestion, setCanonicalQuestion] = useState("");
  const [samplePhrasings, setSamplePhrasings] = useState("");
  const [approvedAnswer, setApprovedAnswer] = useState("");
  const [toneTag, setToneTag] = useState("calm_reassurance");
  const [autoPlay, setAutoPlay] = useState(true);

  function handleSubmit(e) {
    e.preventDefault();

    const cluster = {
      id: crypto.randomUUID(),
      canonicalQuestion: canonicalQuestion.trim(),
      samplePhrasings: samplePhrasings
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean),
      approvedAnswer: approvedAnswer.trim(),
      toneTag,
      autoPlay
    };

    onAddCluster(cluster);

    setCanonicalQuestion("");
    setSamplePhrasings("");
    setApprovedAnswer("");
    setToneTag("calm_reassurance");
    setAutoPlay(true);
  }

  const disabled =
    !canonicalQuestion.trim() || !approvedAnswer.trim();

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Add Question Cluster</h2>

      <label>
        Canonical question
        <input
          value={canonicalQuestion}
          onChange={(e) => setCanonicalQuestion(e.target.value)}
          placeholder="When are we going home?"
        />
      </label>

      <label>
        Sample phrasings (separate with |)
        <input
          value={samplePhrasings}
          onChange={(e) => setSamplePhrasings(e.target.value)}
          placeholder="Are we leaving now? | Can we go home now?"
        />
      </label>

      <label>
        Approved answer
        <textarea
          value={approvedAnswer}
          onChange={(e) => setApprovedAnswer(e.target.value)}
          placeholder="We are already home. We’re safe here tonight."
          rows={4}
        />
      </label>

      <label>
        Tone tag
        <select value={toneTag} onChange={(e) => setToneTag(e.target.value)}>
          <option value="calm_reassurance">calm_reassurance</option>
          <option value="gentle_reassurance">gentle_reassurance</option>
          <option value="comforting">comforting</option>
          <option value="redirecting">redirecting</option>
        </select>
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={autoPlay}
          onChange={(e) => setAutoPlay(e.target.checked)}
        />
        Auto-play answer
      </label>

      <button type="submit" disabled={disabled}>
        Save Cluster
      </button>
    </form>
  );
}