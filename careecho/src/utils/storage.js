const STORAGE_KEY = "careecho_question_memory";

export function loadMemory() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMemory(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
