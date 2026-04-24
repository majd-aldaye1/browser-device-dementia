import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { findQuestionMatch } from "./utils/matcher";
import { shouldTreatAsQuestion } from "./utils/llm";
import { loadMemory, saveMemory } from "./utils/storage";
import "./index.css";

const QUESTION_HINTS = ["who", "what", "when", "where", "why", "how", "can", "could", "should", "are", "is", "do", "did", "will"];
const ANSWER_CAPTURE_WINDOW_MS = 45_000;

export default function App() {
  const [memory, setMemory] = useState(() => loadMemory());
  const [listening, setListening] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [events, setEvents] = useState([]);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [llmConfig, setLlmConfig] = useState({
    apiKey: "",
    model: "gpt-4o-mini",
    endpoint: "https://api.openai.com/v1/chat/completions",
  });

  const recognitionRef = useRef(null);
  const memoryRef = useRef(memory);
  const pendingQuestionRef = useRef(pendingQuestion);
  const llmConfigRef = useRef(llmConfig);
  const isSpeakingRef = useRef(false);
  const ignoreUtterancesUntilRef = useRef(0);

  useEffect(() => {
    saveMemory(memory);
    memoryRef.current = memory;
  }, [memory]);
  useEffect(() => {
    memoryRef.current = memory;
  }, [memory]);
  useEffect(() => {
    pendingQuestionRef.current = pendingQuestion;
  }, [pendingQuestion]);
  useEffect(() => {
    llmConfigRef.current = llmConfig;
  }, [llmConfig]);

  useEffect(() => {
    llmConfigRef.current = llmConfig;
  }, [llmConfig]);

  const supportsSpeechRecognition = useMemo(() => {
    return typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  function updatePendingQuestion(nextValue) {
    pendingQuestionRef.current = nextValue;
    setPendingQuestion(nextValue);
  }

  function pushEvent(type, message) {
    setEvents((prev) => [
      { id: crypto.randomUUID(), type, message, at: new Date().toLocaleTimeString() },
      ...prev,
    ].slice(0, 40));
  }

  function enqueueUtterance(rawTranscript) {
    const text = rawTranscript.trim();
    if (!text) {
      return;
    }

    const now = Date.now();
    const last = lastFinalTranscriptRef.current;
    if (last.text === text && now - last.at < 1500) {
      pushEvent("heard", `Skipped duplicate transcript: “${text}”`);
      return;
    }

    lastFinalTranscriptRef.current = { text, at: now };
    utteranceQueueRef.current.push(text);
    void drainUtteranceQueue();
  }

  async function drainUtteranceQueue() {
    if (processingQueueRef.current) {
      return;
    }
    processingQueueRef.current = true;

    try {
      while (utteranceQueueRef.current.length > 0) {
        const nextUtterance = utteranceQueueRef.current.shift();
        await processUtterance(nextUtterance);
      }
    } finally {
      processingQueueRef.current = false;
    }
  }

  function speak(text) {
    if (!window.speechSynthesis || !text) {
      return;
    }

    const now = Date.now();
    const ignoreMs = Math.min(6000, 1200 + text.length * 40);
    ignoreUtterancesUntilRef.current = now + ignoreMs;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => {
      isSpeakingRef.current = true;
    };
    utterance.onend = () => {
      isSpeakingRef.current = false;
      ignoreUtterancesUntilRef.current = Date.now() + 500;
    };
    window.speechSynthesis.speak(utterance);
  }

  async function decideIfQuestion(text) {
    const lowered = text.trim().toLowerCase();
    if (!lowered) {
      return false;
    }

    const localHeuristic = lowered.includes("?") || QUESTION_HINTS.some((hint) => lowered.startsWith(`${hint} `));
    const activeLlmConfig = llmConfigRef.current;
    if (!activeLlmConfig.apiKey) {
      return localHeuristic;
    }

    try {
      const result = await shouldTreatAsQuestion(text, activeLlmConfig);
      if (result.isQuestion === null) {
        return localHeuristic;
      }
      return result.isQuestion;
    } catch {
      pushEvent("warn", "LLM question check failed, falling back to local heuristic.");
      return localHeuristic;
    }
  }

  async function processUtterance(rawText) {
    const text = rawText.trim();
    if (!text) {
      return;
    }

    const activePendingQuestion = pendingQuestionRef.current;
    if (activePendingQuestion) {
      const entry = {
        id: crypto.randomUUID(),
        question: activePendingQuestion,
        answer: text,
        createdAt: new Date().toISOString(),
      };
      setMemory((prev) => [entry, ...prev]);
      pushEvent("saved", `Saved pair: “${activePendingQuestion}” -> “${text}”`);
      speak("Got it. I will remember that answer for next time.");
      return;
    }

    if (activePendingQuestion && questionAgeMs > ANSWER_CAPTURE_WINDOW_MS) {
      pushEvent("heard", `Pending question expired without a clear answer: “${activePendingQuestion}”`);
      updatePendingQuestion(null);
    } else {
      pushEvent("heard", `Ignored non-question utterance: “${text}”`);
    }

    const match = findQuestionMatch(text, memoryRef.current);
    if (match) {
      pushEvent("match", `Repeated question matched (${match.strategy}, ${match.score.toFixed(2)}): “${match.entry.question}”`);
      speak(match.entry.answer);
      return;
    }

    updatePendingQuestion(text);
    pushEvent("new", `New question captured: “${text}”. Waiting for caregiver answer...`);
    speak("I have not heard this question before. Caregiver, please answer now.");
  }

  function startListening() {
    if (recognitionRef.current) {
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      pushEvent("error", "Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setListening(true);
      pushEvent("status", "Listening started.");
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          if (isSpeakingRef.current || Date.now() < ignoreUtterancesUntilRef.current) {
            pushEvent("heard", `Ignored likely self-spoken audio: “${transcript.trim()}”`);
            continue;
          }
          void processUtterance(transcript);
        } else {
          interim += transcript;
        }
      }
      setPartialTranscript(interim);
    };

    recognition.onerror = (event) => {
      pushEvent("error", `Speech recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      setListening(false);
      setPartialTranscript("");
      if (recognitionRef.current) {
        pushEvent("status", "Recognition ended. Restarting to keep always-on listening.");
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const recognition = recognitionRef.current;
      recognitionRef.current = null;
      recognition.onend = null;
      recognition.stop();
    }

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isSpeakingRef.current = false;
    ignoreUtterancesUntilRef.current = 0;
    setListening(false);
    setPartialTranscript("");
    pushEvent("status", "Listening stopped.");
  }, []);

  useEffect(() => () => stopListening(), [stopListening]);

  return (
    <div className="app-shell">
      <header className="hero">
        <h1>CareEcho Live Prototype</h1>
        <p>Always-on browser listener for repeated dementia/Alzheimer questions.</p>
      </header>

      <main className="grid">
        <section className="card">
          <h2>Live Listener</h2>
          <p>
            State: <strong>{listening ? "Listening" : "Stopped"}</strong>
          </p>
          {!supportsSpeechRecognition && (
            <p className="error-text">Your browser does not support Web Speech API recognition.</p>
          )}
          <div className="button-row">
            <button onClick={startListening} disabled={listening || !supportsSpeechRecognition}>Start</button>
            <button onClick={stopListening} disabled={!listening}>Stop</button>
          </div>

          {pendingQuestion && (
            <p className="pending">Latest unresolved question from conversation: “{pendingQuestion}”</p>
          )}

          {partialTranscript && (
            <p className="muted">
              <strong>Listening now:</strong> {partialTranscript}
            </p>
          )}
        </section>

        <section className="card">
          <h2>Affordable LLM (Optional)</h2>
          <p className="muted">Used only to classify if an utterance is a question. Matching remains phrase-based for this prototype.</p>
          <label>
            API key
            <input
              type="password"
              value={llmConfig.apiKey}
              onChange={(e) => setLlmConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
              placeholder="sk-..."
            />
          </label>
          <label>
            Model
            <input
              value={llmConfig.model}
              onChange={(e) => setLlmConfig((prev) => ({ ...prev, model: e.target.value }))}
              placeholder="gpt-4o-mini"
            />
          </label>
          <label>
            Endpoint
            <input
              value={llmConfig.endpoint}
              onChange={(e) => setLlmConfig((prev) => ({ ...prev, endpoint: e.target.value }))}
            />
          </label>
        </section>

        <section className="card">
          <h2>Remembered Question/Answer Pairs</h2>
          {memory.length === 0 ? (
            <p>No saved pairs yet.</p>
          ) : (
            <div className="stack">
              {memory.map((entry) => (
                <article key={entry.id} className="cluster-item">
                  <p><strong>Q:</strong> {entry.question}</p>
                  <p><strong>A:</strong> {entry.answer}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <h2>Activity</h2>
          {events.length === 0 ? (
            <p>No activity yet.</p>
          ) : (
            <div className="stack">
              {events.map((event) => (
                <div key={event.id} className="result-box">
                  <p><strong>{event.at}</strong> [{event.type}]</p>
                  <p>{event.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
