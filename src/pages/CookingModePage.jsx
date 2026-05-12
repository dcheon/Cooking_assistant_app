import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipe } from '../services/recipeStore';
import { speak, stop as ttsStop } from '../services/tts';
import { startListening, stopListening, isSupported as speechIsSupported } from '../services/speech';
import TagBadge from '../components/TagBadge';

const STATUS = {
  IDLE:      'idle',
  SPEAKING:  'speaking',
  LISTENING: 'listening',
  PAUSED:    'paused',
  FINISHED:  'finished',
};

const STATUS_UI = {
  idle:      { cls: 'bg-gray-100 text-gray-500',     label: '아래 버튼을 눌러 시작하세요' },
  speaking:  { cls: 'bg-blue-100 text-blue-700',     label: '🔊 읽는 중...' },
  listening: { cls: 'bg-green-100 text-green-700 pulse-ring', label: '🎤 듣는 중...' },
  paused:    { cls: 'bg-yellow-100 text-yellow-700', label: '⏸ 일시정지' },
  finished:  { cls: 'bg-purple-100 text-purple-700', label: '✅ 요리 완료!' },
};

export default function CookingModePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = useMemo(() => getRecipe(id), [id]);
  const steps  = useMemo(
    () => recipe ? [...recipe.steps].sort((a, b) => a.order - b.order) : [],
    [recipe]
  );
  const hasSpeech = speechIsSupported();

  const [stepIdx, setStepIdx] = useState(0);
  const [status, setStatus] = useState(STATUS.IDLE);

  // Refs so async callbacks always see latest values
  const statusRef  = useRef(STATUS.IDLE);
  const stepIdxRef = useRef(0);

  function syncStatus(s) { statusRef.current = s;  setStatus(s); }
  function syncStep(i)   { stepIdxRef.current = i; setStepIdx(i); }

  // Stable command handler ref — always points to latest closure
  const handleCommandRef = useRef(null);
  handleCommandRef.current = (cmd) => {
    switch (cmd) {
      case 'next':   goNext();       break;
      case 'back':   goBack();       break;
      case 'repeat': doRepeat();     break;
      case 'pause':  togglePause();  break;
      case 'done':   finish();       break;
    }
  };

  // Stop everything on unmount
  useEffect(() => () => { ttsStop(); stopListening(); }, []);

  if (!recipe) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-3">😕</div>
        <p>레시피를 찾을 수 없습니다.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-amber-500 hover:underline">← 뒤로</button>
      </div>
    );
  }

  function readStep(idx) {
    syncStatus(STATUS.SPEAKING);
    stopListening();
    speak(steps[idx].instruction, () => {
      if (statusRef.current === STATUS.SPEAKING) {
        syncStatus(STATUS.LISTENING);
        if (hasSpeech) {
          startListening(
            (cmd) => handleCommandRef.current(cmd),
            () => {}
          );
        }
      }
    });
  }

  function stopEverything() {
    ttsStop();
    stopListening();
  }

  function startCooking() {
    syncStep(0);
    readStep(0);
  }

  function goNext() {
    const cur = stepIdxRef.current;
    if (cur < steps.length - 1) {
      stopEverything();
      const next = cur + 1;
      syncStep(next);
      readStep(next);
    } else {
      finish();
    }
  }

  function goBack() {
    const cur = stepIdxRef.current;
    if (cur > 0) {
      stopEverything();
      const prev = cur - 1;
      syncStep(prev);
      readStep(prev);
    }
  }

  function doRepeat() {
    stopEverything();
    readStep(stepIdxRef.current);
  }

  function togglePause() {
    if (statusRef.current === STATUS.PAUSED) {
      readStep(stepIdxRef.current);
    } else {
      stopEverything();
      syncStatus(STATUS.PAUSED);
    }
  }

  function finish() {
    stopEverything();
    speak('요리가 완료되었습니다! 맛있게 드세요.');
    syncStatus(STATUS.FINISHED);
  }

  const isIdle     = status === STATUS.IDLE;
  const isFinished = status === STATUS.FINISHED;
  const isActive   = !isIdle && !isFinished;
  const isLast     = stepIdx === steps.length - 1;
  const { cls: badgeCls, label: badgeLabel } = STATUS_UI[status];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => { stopEverything(); navigate(-1); }}
          className="text-2xl text-gray-400 hover:text-gray-700 transition">←</button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-800 truncate">{recipe.title}</h1>
          <div className="flex flex-wrap gap-1 mt-1">
            {recipe.tags?.map(tag => <TagBadge key={tag} tag={tag} size="xs" />)}
          </div>
        </div>
        <div className="text-sm text-gray-400 flex-shrink-0">
          {stepIdx + 1} / {steps.length}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Status badge */}
      <div className="flex justify-center">
        <span className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${badgeCls}`}>
          {badgeLabel}
        </span>
      </div>

      {/* Step card */}
      <div className={`bg-white rounded-3xl shadow-sm border px-8 py-10 min-h-[180px]
                       flex flex-col items-center justify-center text-center transition-all ${
        status === STATUS.LISTENING ? 'border-green-300 shadow-green-100 shadow-md' :
        status === STATUS.SPEAKING  ? 'border-blue-200' :
        status === STATUS.FINISHED  ? 'border-purple-200' : 'border-amber-100'
      }`}>
        <p className="text-2xl font-semibold text-gray-800 leading-relaxed">
          {steps[stepIdx]?.instruction ?? ''}
        </p>
      </div>

      {/* Voice hint */}
      {status === STATUS.LISTENING && (
        <p className="text-center text-xs text-gray-400">
          🎤 말해보세요 &nbsp;|&nbsp;
          <b>next</b> · <b>back</b> · <b>repeat</b> · <b>pause</b> · <b>done</b>
        </p>
      )}

      {/* No speech warning */}
      {!hasSpeech && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700 text-center">
          ⚠️ 음성 인식 미지원 브라우저입니다. Chrome 또는 Edge를 사용해 주세요.
        </div>
      )}

      {/* Primary nav buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={goBack}
          disabled={!isActive || stepIdx === 0}
          className="py-5 rounded-2xl bg-gray-100 text-gray-600 text-lg font-bold
                     hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-30"
        >
          ← 이전
        </button>
        <button
          onClick={isLast && isActive ? finish : goNext}
          disabled={isIdle}
          className={`py-5 rounded-2xl text-white text-lg font-bold active:scale-95 transition-all
                      disabled:opacity-30 shadow-sm ${
            isLast && isActive
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-amber-500 hover:bg-amber-600'
          }`}
        >
          {isLast && isActive ? '완료 ✓' : '다음 →'}
        </button>
      </div>

      {/* Secondary controls */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={doRepeat}
          disabled={!isActive}
          className="py-4 rounded-2xl bg-blue-50 text-blue-700 font-semibold
                     hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-30"
        >
          🔁 다시 읽기
        </button>
        <button
          onClick={togglePause}
          disabled={!isActive}
          className="py-4 rounded-2xl bg-yellow-50 text-yellow-700 font-semibold
                     hover:bg-yellow-100 active:scale-95 transition-all disabled:opacity-30"
        >
          {status === STATUS.PAUSED ? '▶ 계속' : '⏸ 멈춤'}
        </button>
      </div>

      {/* Start / Finish */}
      {isIdle && (
        <button
          onClick={startCooking}
          className="w-full py-5 rounded-2xl bg-green-500 hover:bg-green-600 active:scale-95
                     text-white text-xl font-bold shadow-md transition-all"
        >
          🔥 요리 시작
        </button>
      )}
      {isFinished && (
        <button
          onClick={() => navigate(`/recipe/${id}`)}
          className="w-full py-5 rounded-2xl bg-purple-500 hover:bg-purple-600 active:scale-95
                     text-white text-xl font-bold shadow-md transition-all"
        >
          🎉 요리 완료! 돌아가기
        </button>
      )}
    </div>
  );
}
