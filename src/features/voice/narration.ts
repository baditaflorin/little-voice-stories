import type { VoiceProfile } from './voiceAnalysis';

export type NarrationControls = {
  cancel: () => void;
};

export function canNarrate() {
  return (
    typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  );
}

export function chunkStoryForSpeech(text: string) {
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (`${current} ${sentence}`.trim().length > 420 && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = `${current} ${sentence}`.trim();
    }
  }
  if (current) {
    chunks.push(current);
  }
  return chunks;
}

export function speakStory(
  text: string,
  profile: VoiceProfile,
  onProgress: (spokenChunks: number, totalChunks: number) => void,
  onEnd: () => void,
  onError: (message: string) => void,
): NarrationControls {
  if (!canNarrate()) {
    onError('Narration is not supported in this browser.');
    return { cancel: () => undefined };
  }

  const chunks = chunkStoryForSpeech(text);
  const voices = window.speechSynthesis.getVoices();
  const voice = chooseVoice(voices);
  let index = 0;
  let cancelled = false;

  const speakNext = () => {
    if (cancelled) {
      return;
    }
    if (index >= chunks.length) {
      onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.pitch = profile.speechPitch;
    utterance.rate = profile.speechRate;
    utterance.volume = profile.speechVolume;
    if (voice) {
      utterance.voice = voice;
    }
    utterance.onend = () => {
      index += 1;
      onProgress(index, chunks.length);
      speakNext();
    };
    utterance.onerror = () => onError('Narration stopped before the story finished.');
    window.speechSynthesis.speak(utterance);
  };

  window.speechSynthesis.cancel();
  onProgress(0, chunks.length);
  speakNext();

  return {
    cancel: () => {
      cancelled = true;
      window.speechSynthesis.cancel();
    },
  };
}

function chooseVoice(voices: SpeechSynthesisVoice[]) {
  const preferred = voices.find((voice) => /parent|samantha|daniel|karen|google/i.test(voice.name));
  return preferred ?? voices.find((voice) => voice.lang.startsWith('en')) ?? voices[0];
}
