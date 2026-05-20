import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTtsSettings, saveTtsSettings, speak, stop } from '../services/tts';

const SAMPLE_TEXT = '안녕하세요! 지금 설정한 음성으로 요리 안내를 드립니다.';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(getTtsSettings);
  const [koVoices, setKoVoices] = useState([]);

  useEffect(() => {
    function loadVoices() {
      const voices = speechSynthesis.getVoices().filter(v => v.lang.startsWith('ko'));
      setKoVoices(voices);
    }
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  function update(key, value) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveTtsSettings(next);
  }

  function handleTest() {
    stop();
    speak(SAMPLE_TEXT);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-400 hover:text-gray-700 transition">
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">⚙️ 설정</h1>
          <p className="text-gray-400 text-sm mt-0.5">TTS 음성 설정</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">

        {/* Rate */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-700">음성 속도</label>
            <span className="text-sm font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
              {settings.rate.toFixed(1)}×
            </span>
          </div>
          <input
            type="range"
            min="0.5" max="2.0" step="0.1"
            value={settings.rate}
            onChange={e => update('rate', Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>느리게 (0.5×)</span>
            <span>빠르게 (2.0×)</span>
          </div>
        </div>

        {/* Pitch */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-700">음성 높낮이</label>
            <span className="text-sm font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">
              {settings.pitch.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min="0.5" max="2.0" step="0.1"
            value={settings.pitch}
            onChange={e => update('pitch', Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>낮게 (0.5)</span>
            <span>높게 (2.0)</span>
          </div>
        </div>

        {/* Voice selector */}
        {koVoices.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">음성 선택</label>
            <select
              value={settings.voiceURI ?? ''}
              onChange={e => update('voiceURI', e.target.value || null)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-amber-300 transition bg-white"
            >
              <option value="">기본 음성</option>
              {koVoices.map(v => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Test button */}
        <button
          onClick={handleTest}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-95
                     text-white font-bold rounded-xl transition"
        >
          🔊 테스트 듣기
        </button>
      </div>

      {/* Reset */}
      <button
        onClick={() => {
          const defaults = { rate: 0.92, pitch: 1.0, voiceURI: null };
          setSettings(defaults);
          saveTtsSettings(defaults);
        }}
        className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition"
      >
        기본값으로 초기화
      </button>
    </div>
  );
}
