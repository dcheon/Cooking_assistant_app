import { KEYS } from '../constants/storageKeys';

const TTS_DEFAULTS = { rate: 0.92, pitch: 1.0, voiceURI: null };

export function getTtsSettings() {
  try {
    const raw = localStorage.getItem(KEYS.TTS_SETTINGS);
    return raw ? { ...TTS_DEFAULTS, ...JSON.parse(raw) } : { ...TTS_DEFAULTS };
  } catch {
    return { ...TTS_DEFAULTS };
  }
}

export function saveTtsSettings(settings) {
  localStorage.setItem(KEYS.TTS_SETTINGS, JSON.stringify(settings));
}

let lastText = '';

export function speak(text, onEnd) {
  stop();
  lastText = text;

  const settings = getTtsSettings();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;

  if (settings.voiceURI) {
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => v.voiceURI === settings.voiceURI);
    if (voice) utterance.voice = voice;
  }

  // Chrome bug: long utterances get silently cut off — keep synthesis alive
  const keepAlive = setInterval(() => {
    if (!speechSynthesis.speaking) clearInterval(keepAlive);
    else { speechSynthesis.pause(); speechSynthesis.resume(); }
  }, 10000);

  utterance.onend = () => { clearInterval(keepAlive); onEnd?.(); };
  utterance.onerror = () => { clearInterval(keepAlive); onEnd?.(); };

  speechSynthesis.speak(utterance);
}

export function stop() {
  speechSynthesis.cancel();
}

export function repeat(onEnd) {
  if (lastText) speak(lastText, onEnd);
}

export function isSupported() {
  return 'speechSynthesis' in window;
}
