let recognition = null;
let shouldListen = false;

const COMMANDS = {
  next:   ['next', '다음', '넥스트'],
  repeat: ['repeat', '다시', '반복'],
  back:   ['back', '이전', '뒤로'],
  pause:  ['pause', '멈춤', '정지', '일시정지'],
  done:   ['done', '종료', '끝', '완료'],
};

function parseCommand(text) {
  const lower = text.toLowerCase().trim();
  for (const [cmd, aliases] of Object.entries(COMMANDS)) {
    if (aliases.some(a => lower.includes(a))) return cmd;
  }
  return null;
}

export function startListening(onCommand, onError) {
  if (!isSupported()) { onError?.('unsupported'); return false; }
  shouldListen = true;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'ko-KR';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = (e) => {
    const alts = Array.from(e.results[e.results.length - 1]);
    for (const alt of alts) {
      const cmd = parseCommand(alt.transcript);
      if (cmd) { onCommand(cmd, alt.transcript); return; }
    }
  };

  recognition.onerror = (e) => {
    if (e.error !== 'no-speech' && e.error !== 'aborted') onError?.(e.error);
  };

  recognition.onend = () => {
    if (shouldListen && !speechSynthesis.speaking) {
      try { recognition?.start(); } catch {}
    }
  };

  try { recognition.start(); } catch {}
  return true;
}

export function stopListening() {
  shouldListen = false;
  try { recognition?.stop(); } catch {}
  recognition = null;
}

export function isSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
