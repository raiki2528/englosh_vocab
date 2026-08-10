export type SpeechSupport = "supported" | "unsupported";

export function getSpeechSupport(): SpeechSupport {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return "unsupported";
  }
  return "supported";
}

function selectEnglishVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.toLowerCase().startsWith("en-us"));
}

export function speakEnglishWord(word: string): boolean {
  if (getSpeechSupport() === "unsupported" || !word.trim()) {
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word.trim());
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  utterance.pitch = 1;

  const voice = selectEnglishVoice();
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
  return true;
}
