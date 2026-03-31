import { useState } from "react";
import { matchQuestion } from "../utils/matcher";

export default function TestConsole({ clusters }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);

  function handleTest() {
    const match = matchQuestion(input, clusters);
    setResult(match);
  }

  return (
    <div className="card">
      <h2>Test Console</h2>

      <label>
        Patient question
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Can we go home now?"
          rows={3}
        />
      </label>

      <button onClick={handleTest} disabled={!input.trim()}>
        Test Match
      </button>

      {result && (
        <div className="result-box">
          {result.cluster ? (
            <>
              <p><strong>Matched cluster:</strong> {result.cluster.canonicalQuestion}</p>
              <p><strong>Confidence:</strong> {result.confidence.toFixed(2)}</p>
              <p><strong>Strategy:</strong> {result.strategy}</p>
              <p><strong>Answer:</strong> {result.cluster.approvedAnswer}</p>
            </>
          ) : (
            <p>No match found.</p>
          )}
        </div>
      )}
    </div>
  );
}