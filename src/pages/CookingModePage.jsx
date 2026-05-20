import { useEffect, useRef, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecipe } from '../services/recipeStore';
import { speak, stop as ttsStop } from '../services/tts';
import { startListening, stopListening, isSupported as speechIsSupported } from '../services/speech';
import TagBadge from '../components/TagBadge';
import { STATUS, useCookingReducer } from '../hooks/useCookingReducer';

const STATUS_UI = {
  idle:      { cls: 'bg-gray-100 text-gray-500',                  label: '아래 버튼을 눌러 시작하세요' },
  speaking:  { cls: 'bg-blue-100 text-blue-700',                  label: '🔊 읽는 중...' },
  listening: { cls: 'bg-green-100 text-green-700 pulse-ring',     label: '🎤 듣는 중...' },
  paused:    { cls: 'bg-yellow-100 text-yellow-700',              label: '⏸ 일시정지' },
  finished:  { cls: 'bg-purple-100 text-purple-700',              label: '✅ 요리 완료!' },
};

function formatTime(sec) {
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}분 ${s}초` : `${m}분`;
  }
  return `${sec}초`;
}

export default function CookingModePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = useMemo(() => getRecipe(id).data, [id]);
  const steps  = useMemo(
    () => recipe ? [...recipe.steps].sort((a, b) => a.order - b.order) : [],
    [recipe]
  );
  const hasSpeech = speechIsSupported();

  const [state, dispatch] = useCookingReducer();
  // Mirror state synchronously for async callbacks (avoids stale closure)
  const stateRef = useRef(state);
  stateRef.current = state;

  // Timer state
  const [timerRemaining, setTimerRemaining] = useState(null);
  const timerRef = useRef(null);

  // Stable command handler — re-assigned every render so it always closes over latest state
  const handleCommandRef = useRef(null);
  handleCommandRef.current = (cmd) => {
    const s = stateRef.current;
    switch (cmd) {
      case 'next':
        dispatch({ type: 'NEXT', totalSteps: steps.length });
        break;
      case 'back':
        dispatch({ type: 'BACK' });
        break;
      case 'repeat':
        dispatch({ type: 'REPEAT' });
        break;
      case 'pause':
        dispatch({ type: s.status === STATUS.PAUSED ? 'RESUME' : 'PAUSE' });
        break;
      case 'done':
        dispatch({ type: 'FINISH' });
        break;
      case 'timer': {
        const secs = steps[s.stepIdx]?.timerSeconds;
        if (secs) startTimer(secs);
        break;
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => () => {
    ttsStop();
    stopListening();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // Effect 1: fire TTS whenever speakKey increments (status will be 'speaking')
  useEffect(() => {
    if (state.status !== STATUS.SPEAKING) return;
    stopListening();
    speak(steps[state.stepIdx].instruction, () => {
      dispatch({ type: 'TTS_DONE' });
    });
    return () => ttsStop();
  }, [state.speakKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: start listening when status becomes 'listening'
  useEffect(() => {
    if (state.status !== STATUS.LISTENING) return;
    if (!hasSpeech) return;
    startListening(
      (cmd) => handleCommandRef.current(cmd),
      () => {}
    );
    return () => stopListening();
  }, [state.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 3: stop everything when paused
  useEffect(() => {
    if (state.status !== STATUS.PAUSED) return;
    ttsStop();
    stopListening();
  }, [state.status]);

  // Effect 4: announce and clean up when finished
  useEffect(() => {
    if (state.status !== STATUS.FINISHED) return;
    ttsStop();
    stopListening();
    speak('요리가 완료되었습니다! 맛있게 드세요.');
  }, [state.status]);

  // Timer helpers
  function startTimer(seconds) {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRemaining(seconds);
    speak(`타이머 ${formatTime(seconds)} 시작!`);
    timerRef.current = setInterval(() => {
      setTimerRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          speak('타이머가 종료되었습니다!');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setTimerRemaining(null);
  }

  if (!recipe) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-3">😕</div>
        <p>레시피를 찾을 수 없습니다.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-amber-500 hover:underline">← 뒤로</button>
      </div>
    );
  }

  const { status, stepIdx } = state;
  const isIdle     = status === STATUS.IDLE;
  const isFinished = status === STATUS.FINISHED;
  const isActive   = !isIdle && !isFinished;
  const isLast     = stepIdx === steps.length - 1;
  const { cls: badgeCls, label: badgeLabel } = STATUS_UI[status];
  const currentStep = steps[stepIdx];
  const hasTimer    = Boolean(currentStep?.timerSeconds);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => { ttsStop(); stopListening(); navigate(-1); }}
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
          {currentStep?.instruction ?? ''}
        </p>
      </div>

      {/* Timer display */}
      {timerRemaining !== null && (
        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3">
          <div>
            <p className="text-xs text-orange-500 font-semibold mb-0.5">⏱ 타이머</p>
            <p className="text-3xl font-bold text-orange-700 tabular-nums">{formatTime(timerRemaining)}</p>
          </div>
          <button
            onClick={stopTimer}
            className="text-sm text-orange-400 hover:text-orange-600 transition font-medium"
          >
            취소
          </button>
        </div>
      )}

      {/* Voice hint */}
      {status === STATUS.LISTENING && (
        <p className="text-center text-xs text-gray-400">
          🎤 말해보세요 &nbsp;|&nbsp;
          <b>next</b> · <b>back</b> · <b>repeat</b> · <b>pause</b> · <b>done</b>
          {hasTimer && <> · <b>타이머 시작</b></>}
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
          onClick={() => dispatch({ type: 'BACK' })}
          disabled={!isActive || stepIdx === 0}
          className="py-5 rounded-2xl bg-gray-100 text-gray-600 text-lg font-bold
                     hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-30"
        >
          ← 이전
        </button>
        <button
          onClick={() => dispatch({ type: isLast ? 'FINISH' : 'NEXT', totalSteps: steps.length })}
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
          onClick={() => dispatch({ type: 'REPEAT' })}
          disabled={!isActive}
          className="py-4 rounded-2xl bg-blue-50 text-blue-700 font-semibold
                     hover:bg-blue-100 active:scale-95 transition-all disabled:opacity-30"
        >
          🔁 다시 읽기
        </button>
        <button
          onClick={() => dispatch({ type: status === STATUS.PAUSED ? 'RESUME' : 'PAUSE' })}
          disabled={!isActive}
          className="py-4 rounded-2xl bg-yellow-50 text-yellow-700 font-semibold
                     hover:bg-yellow-100 active:scale-95 transition-all disabled:opacity-30"
        >
          {status === STATUS.PAUSED ? '▶ 계속' : '⏸ 멈춤'}
        </button>
      </div>

      {/* Timer button — shown when current step has a timer and it's not running */}
      {isActive && hasTimer && timerRemaining === null && (
        <button
          onClick={() => startTimer(currentStep.timerSeconds)}
          className="w-full py-4 rounded-2xl bg-orange-50 text-orange-700 font-semibold
                     hover:bg-orange-100 active:scale-95 transition-all border border-orange-200"
        >
          ⏱ 타이머 {formatTime(currentStep.timerSeconds)} 시작
        </button>
      )}

      {/* Start */}
      {isIdle && (
        <button
          onClick={() => dispatch({ type: 'START' })}
          className="w-full py-5 rounded-2xl bg-green-500 hover:bg-green-600 active:scale-95
                     text-white text-xl font-bold shadow-md transition-all"
        >
          🔥 요리 시작
        </button>
      )}

      {/* Finished */}
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
