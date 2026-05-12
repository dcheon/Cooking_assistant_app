let lastText = '';

export function speak(text, onEnd) {
  stop();
  lastText = text;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.92;
  utterance.pitch = 1;

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
