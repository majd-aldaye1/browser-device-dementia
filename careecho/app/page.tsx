"use client";

import { useRef, useState } from "react";
import { Panel } from "@/components/Panel";
import { VoiceControls } from "@/components/VoiceControls";
import { useQaMemory } from "@/lib/memory/useQaMemory";
import { findBestRepeatedQuestionMatch } from "@/lib/repetition/similarity";
import { BrowserSpeechTranscriber } from "@/lib/transcription/browserSpeechRecognition";
import { buildTranscriptChunk } from "@/lib/transcription/chunking";
import { useComfortingTts } from "@/lib/tts/useComfortingTts";
import { RepetitionMatch, TranscriptSegment } from "@/types/memoraid";

const DEMO_HINT = "Tip: prefix text with 'patient:' or 'caregiver:' for better extraction.";

export default function HomePage() {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [manualLine, setManualLine] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Ready");
  const [providerLabel, setProviderLabel] = useState("auto (OpenAI if configured, otherwise mock)");
  const [deviceAnswer, setDeviceAnswer] = useState("No reliable saved answer found yet.");
  const [detection, setDetection] = useState<RepetitionMatch | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const { pairs, upsertPairs, deletePair, reset, count } = useQaMemory();
  const { voices, settings, setSettings, speak } = useComfortingTts();
  const transcriberRef = useRef<BrowserSpeechTranscriber | null>(null);

  const checkProviderStatus = async () => {
    setStatus("Checking provider configuration...");

    try {
      const response = await fetch("/api/provider-status", { method: "GET" });
      const payload = (await response.json()) as { provider?: string };
      const provider = payload.provider ?? "unknown";
      setProviderLabel(provider);
      setStatus(`Provider check complete: ${provider}`);
    } catch {
      setStatus("Provider check failed. Please retry.");
    }
  };

  const processTranscript = async (nextTranscript: TranscriptSegment[]) => {
    const chunk = buildTranscriptChunk(nextTranscript);
    if (!chunk.trim()) return;

    const extractResponse = await fetch("/api/extract-qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcriptChunk: chunk }),
    });

    const extraction = (await extractResponse.json()) as {
      pairs: Array<{ question: string; answer: string; confidence: number; sourceTranscript: string }>;
      provider?: string;
      warning?: string;
    };

    if (extraction.provider) {
      setProviderLabel(extraction.provider);
    }

    if (extraction.warning) {
      setStatus(extraction.warning);
    }

    if (extraction.pairs?.length) {
      upsertPairs(extraction.pairs);
    }

    for (const segment of nextTranscript.slice(-2)) {
      if (segment.speaker !== "patient" || !segment.text.includes("?")) continue;

      const match = findBestRepeatedQuestionMatch(segment.text, pairs);
      setDetection(match);

      if (match.matched && match.matchedPair) {
        setDeviceAnswer(match.matchedPair.answer);
        speak(match.matchedPair.answer);
      } else {
        setDeviceAnswer("No reliable saved answer found yet.");
      }
    }
  };

  const appendSegment = async (segment: TranscriptSegment) => {
    setTranscript((prev) => {
      const next = [...prev, segment];
      void processTranscript(next);
      return next;
    });
  };

  const ensureTranscriber = () => {
    if (!transcriberRef.current) {
      transcriberRef.current = new BrowserSpeechTranscriber(
        (segment) => {
          setStatus("Listening");
          void appendSegment(segment);
        },
        (message) => setStatus(message),
      );
    }
    return transcriberRef.current;
  };

  const startListening = () => {
    const transcriber = ensureTranscriber();
    transcriber.start();
    setIsListening(true);
  };

  const stopListening = () => {
    transcriberRef.current?.stop();
    setIsListening(false);
    setStatus("Stopped");
  };

  const submitManualLine = async () => {
    const text = manualLine.trim();
    if (!text) return;

    const prefixed = /^(patient|caregiver):/i.test(text) ? text : `patient: ${text}`;
    const speaker = prefixed.toLowerCase().startsWith("caregiver:") ? "caregiver" : "patient";

    await appendSegment({
      id: crypto.randomUUID(),
      speaker,
      text: prefixed.replace(/^(patient|caregiver):\s*/i, ""),
      timestamp: new Date().toISOString(),
    });
    setManualLine("");
  };

  const resetMemory = () => {
    const confirmed = window.confirm("Delete all saved Q/A memory?");
    if (!confirmed) return;
    reset();
    setDetection(null);
    setDeviceAnswer("No reliable saved answer found yet.");
  };

  return (
    <main className="page">
      <header>
        <h1>MemorAId (MVP)</h1>
        <p className="muted">Assistive prototype for replaying practical caregiver answers to repeated patient questions.</p>
      </header>

      {!consentAccepted ? (
        <section className="banner">
          <h2>Privacy & Consent</h2>
          <p>
            This prototype listens and transcribes conversation when enabled. Memory stays in local browser state only for this MVP.
            Browser speech recognition may use your browser provider. If OPENAI_API_KEY is configured, transcript chunks may be sent to OpenAI for Q/A extraction.
          </p>
          <p>MemorAId does not diagnose, treat, prevent, or cure any condition and does not provide medical advice.</p>
          <button onClick={() => setConsentAccepted(true)}>I Understand and Consent</button>
        </section>
      ) : null}

      <div className="actions">
        <button onClick={checkProviderStatus} disabled={!consentAccepted}>Check Provider</button>
        <button onClick={startListening} disabled={isListening || !consentAccepted}>Start Listening</button>
        <button onClick={stopListening} disabled={!isListening}>Stop Listening</button>
        <button className="danger" onClick={resetMemory} disabled={!count}>Reset Memory</button>
      </div>
      <p className="muted">Status: {status}. Extraction provider: {providerLabel}.</p>

      <Panel title="Manual Transcript Input / Demo Mode" subtitle={DEMO_HINT}>
        <div className="demo-row">
          <input
            value={manualLine}
            onChange={(event) => setManualLine(event.target.value)}
            placeholder="patient: When is dinner?"
          />
          <button onClick={submitManualLine}>Add Transcript Line</button>
        </div>
      </Panel>

      <div className="grid">
        <Panel title="Live Transcript">
          <ul className="list">
            {transcript.map((segment) => (
              <li key={segment.id}>
                <strong>{segment.speaker}</strong>: {segment.text}
                <span className="muted"> ({new Date(segment.timestamp).toLocaleTimeString()})</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Extracted Question/Answer Pairs" subtitle="Delete any incorrect, outdated, or sensitive pair.">
          <ul className="list">
            {pairs.map((pair) => (
              <li key={pair.id}>
                <p><strong>Q:</strong> {pair.question}</p>
                <p><strong>A:</strong> {pair.answer}</p>
                <p className="muted">Updated: {new Date(pair.updatedAt).toLocaleString()}</p>
                <button className="danger" onClick={() => deletePair(pair.id)}>Delete</button>
              </li>
            ))}
            {!pairs.length ? <li className="muted">No extracted Q/A pairs yet.</li> : null}
          </ul>
        </Panel>

        <Panel title="Repeated Question Detection">
          {detection ? (
            <div>
              <p><strong>Current:</strong> {detection.currentQuestion}</p>
              <p><strong>Score:</strong> {detection.score.toFixed(2)} (threshold {detection.threshold})</p>
              {detection.matchedPair ? <p><strong>Matched Question:</strong> {detection.matchedPair.question}</p> : null}
              {!detection.matched ? <p className="muted">{detection.reason}</p> : null}
            </div>
          ) : (
            <p className="muted">No repeated-question check yet.</p>
          )}
        </Panel>

        <Panel title="Device Answer Output" subtitle="Only repeats practical caregiver answers already captured.">
          <p>{deviceAnswer}</p>
          <VoiceControls voices={voices} settings={settings} onChange={setSettings} />
        </Panel>
      </div>

      <footer className="muted">
        Privacy by design: local in-memory storage only for MVP. TODO: add encrypted persistent storage and caregiver authentication in future versions.
      </footer>
    </main>
  );
}
