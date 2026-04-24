# MemorAId MVP (Next.js + TypeScript)

MemorAId is a privacy-first **assistive prototype** for caregivers of people with memory challenges. It listens to conversation, transcribes short segments, extracts clear patient question + caregiver answer pairs, detects repeated questions, and repeats previously captured practical answers.

> Safety note: this is **not a medical device** and does **not** provide diagnosis, treatment, or medical advice.

## MVP Features

- Start/Stop listening controls (browser speech recognition).
- Check Provider button to confirm whether OpenAI or mock extraction is active before listening.
- Live transcript panel.
- Automatic Q/A extraction from natural conversation.
- Repeated question detection with similarity score.
- Device answer panel + browser text-to-speech (comfort-oriented default settings).
- Delete individual Q/A pairs.
- Reset all memory (with confirmation).
- Privacy/consent banner and privacy-by-design notes.
- Manual transcript demo mode for testing when speech recognition is unavailable.

## Tech Stack

- Next.js (App Router) + TypeScript
- Browser SpeechRecognition API (prototype STT)
- Browser SpeechSynthesis API (prototype TTS)
- Modular server-side Q/A extraction provider architecture

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. (Optional) Create `.env.local` for OpenAI extraction:

```bash
OPENAI_API_KEY=your_key_here
```

3. Run dev server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Testing MVP Without Live Speech Recognition

Use the **Manual Transcript Input / Demo Mode** panel and add lines like:

- `patient: When is dinner?`
- `caregiver: Dinner is at 6 PM.`
- `patient: What time do we eat?`

This allows extraction and repeated-question matching without microphone access.

## Q/A Extraction Provider Behavior

- If `OPENAI_API_KEY` is present, the API route uses **OpenAI GPT-5 mini** (`gpt-5-mini`) for structured JSON extraction.
- If `OPENAI_API_KEY` is missing, extraction falls back to a **mock/rule-based provider**.
- If OpenAI fails at runtime, the route also falls back to mock extraction.

The OpenAI key is never sent to client-side code and should **not** be set as `NEXT_PUBLIC_OPENAI_API_KEY`.

You can click **Check Provider** in the UI before listening to confirm the active provider.

## Deployment (Vercel)

1. Push this repository to GitHub.
2. Import project in Vercel.
3. Set optional `OPENAI_API_KEY` under **Project Settings → Environment Variables**.
4. Deploy.

The MVP runs without any database or paid add-on services.

## Optional Future Environment Variables (Not Required for MVP)

- `OLLAMA_BASE_URL` (future local LLM extraction provider)
- `HUGGINGFACE_API_KEY` (future inference provider)
- `EMBEDDINGS_PROVIDER_KEY` (future semantic repetition matching)
- `STT_PROVIDER_KEY` (future production speech-to-text)
- `TTS_PROVIDER_KEY` (future premium comforting voice)

## Privacy + Safety Limitations

- Transcript and Q/A memory are stored in local in-memory browser state for the MVP (no DB).
- Browser speech recognition behavior may depend on the browser vendor service.
- If OpenAI extraction is enabled, transcript chunks may be sent to OpenAI for extraction only.
- The app should only replay practical caregiver answers already observed.
- The app should not invent medical advice and is not intended for emergency use.

## Architecture Notes

Modules are split for easy replacement:

- `lib/transcription/*` for transcription + transcript chunking.
- `lib/extraction/*` for provider interface and provider implementations.
- `lib/repetition/*` for repeated-question matching.
- `lib/tts/*` for comforting TTS controls.
- `lib/memory/*` for local memory state.
- `app/api/extract-qa/route.ts` for server-side extraction orchestration.

TODO comments indicate integration points for production STT, alternate LLM providers, embedding-based similarity, persistent storage, and caregiver authentication.
