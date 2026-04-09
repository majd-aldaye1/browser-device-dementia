# browser-device-dementia

CareEcho is a browser-based prototype that continuously listens for repeated questions from a person with dementia/Alzheimer's.

## Prototype behavior

- Always-on listening with Web Speech API.
- First time a question is heard, the app stores that exact phrasing as a new question.
- The next spoken utterance is treated as the caregiver answer and saved.
- If the same (or very similar) question is heard again, the app speaks the saved answer.
- This first prototype intentionally treats different phrasings as separate entries unless they are almost identical.

## Optional low-cost LLM support

You can provide an API key + model (default `gpt-4o-mini`) to improve question detection.

- LLM is used only to decide if an utterance is a question.
- Retrieval is still phrase-based for safety and predictability in this prototype.

## Run locally

```bash
cd careecho
npm install
npm run dev
```

Then open the Vite URL in Chrome and allow microphone permissions.
