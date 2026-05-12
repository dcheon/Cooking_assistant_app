import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecipe, genId, genStepId } from '../services/recipeStore';
import useRecipeStore from '../store/useRecipeStore';
import { TAGS } from '../constants/tags';

function formatTime(sec) {
  if (!sec) return '';
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}분 ${s}초` : `${m}분`;
  }
  return `${sec}초`;
}

export default function CreateRecipePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const saveRecipe = useRecipeStore(s => s.saveRecipe);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const existing = useMemo(() => (editId ? getRecipe(editId) : null), [editId]);

  const [title, setTitle]             = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [prepTime, setPrepTime]       = useState(existing?.prepTime ?? '');
  const [selectedTags, setSelectedTags] = useState(existing?.tags ?? []);
  const [ingredients, setIngredients] = useState(
    existing?.ingredients?.length ? existing.ingredients : ['']
  );
  // Steps are objects: { instruction, timerSeconds }
  const [steps, setSteps] = useState(() => {
    if (existing?.steps?.length) {
      return [...existing.steps]
        .sort((a, b) => a.order - b.order)
        .map(s => ({ instruction: s.instruction, timerSeconds: s.timerSeconds ?? '' }));
    }
    return [{ instruction: '', timerSeconds: '' }];
  });
  const [errors, setErrors] = useState({});

  function toggleTag(value) {
    setSelectedTags(prev =>
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    );
  }

  function updateIngredient(i, val) {
    setIngredients(prev => prev.map((v, idx) => (idx === i ? val : v)));
  }
  function addIngredient() { setIngredients(prev => [...prev, '']); }
  function removeIngredient(i) {
    setIngredients(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length ? next : [''];
    });
  }

  function updateStep(i, field, val) {
    setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  }
  function addStep() { setSteps(prev => [...prev, { instruction: '', timerSeconds: '' }]); }
  function removeStep(i) {
    setSteps(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length ? next : [{ instruction: '', timerSeconds: '' }];
    });
  }

  function validate() {
    const errs = {};
    if (!title.trim()) errs.title = '레시피 이름을 입력해 주세요.';
    if (!ingredients.some(s => s.trim())) errs.ingredients = '재료를 하나 이상 입력해 주세요.';
    if (!steps.some(s => s.instruction.trim())) errs.steps = '조리 단계를 하나 이상 입력해 주세요.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const recipe = {
      id: existing?.id ?? genId(),
      title: title.trim(),
      description: description.trim(),
      prepTime: prepTime ? Number(prepTime) : null,
      tags: selectedTags,
      ingredients: ingredients.filter(s => s.trim()),
      steps: steps
        .filter(s => s.instruction.trim())
        .map((s, i) => ({
          id: existing?.steps?.[i]?.id ?? genStepId(),
          order: i + 1,
          instruction: s.instruction,
          ...(s.timerSeconds ? { timerSeconds: Number(s.timerSeconds) } : {}),
        })),
      createdBy: existing?.createdBy ?? user.id,
      isPublic: false,
    };
    saveRecipe(recipe);
    navigate(`/recipe/${recipe.id}`);
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-400 hover:text-gray-700 transition">
          ←
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {existing ? '레시피 수정' : '새 레시피 만들기'}
        </h1>
      </div>

      {/* Basic info */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">레시피 이름 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="예: 김치볶음밥"
            className={`w-full border rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300
                        focus:outline-none focus:ring-2 focus:ring-amber-300 transition
                        ${errors.title ? 'border-red-300' : 'border-gray-200'}`}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">설명 (선택)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="이 레시피를 한 줄로 소개해 주세요"
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300
                       focus:outline-none focus:ring-2 focus:ring-amber-300 transition resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">조리 시간 (분, 선택)</label>
          <input
            type="number"
            value={prepTime}
            onChange={e => setPrepTime(e.target.value)}
            placeholder="예: 20"
            min={1}
            className="w-32 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-300
                       focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
          />
        </div>
      </section>

      {/* Tags */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-600 mb-3">🏷️ 태그 (선택)</label>
        <div className="flex flex-wrap gap-2">
          {TAGS.map(tag => (
            <button
              key={tag.value}
              type="button"
              onClick={() => toggleTag(tag.value)}
              className={`text-sm px-3 py-1.5 rounded-full border font-medium transition ${
                selectedTags.includes(tag.value)
                  ? 'bg-amber-500 text-white border-amber-500'
                  : `bg-white ${tag.color} hover:opacity-80`
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </section>

      {/* Ingredients */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-600">🥕 재료 *</label>
          <button type="button" onClick={addIngredient}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium">+ 추가</button>
        </div>
        {errors.ingredients && <p className="text-red-500 text-xs mb-2">{errors.ingredients}</p>}
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={ing}
                onChange={e => updateIngredient(i, e.target.value)}
                placeholder="예: 밥 1공기"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800
                           placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-200 transition"
              />
              <button type="button" onClick={() => removeIngredient(i)}
                className="text-gray-300 hover:text-red-400 transition text-lg px-1">✕</button>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-gray-600">📋 조리 순서 *</label>
          <button type="button" onClick={addStep}
            className="text-sm text-amber-600 hover:text-amber-700 font-medium">+ 추가</button>
        </div>
        {errors.steps && <p className="text-red-500 text-xs mb-2">{errors.steps}</p>}
        <p className="text-xs text-gray-400 mb-3">💡 단계를 짧고 명확하게 써야 TTS가 자연스럽습니다.</p>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center mt-2">
                {i + 1}
              </span>
              <div className="flex-1 space-y-1.5">
                <textarea
                  value={step.instruction}
                  onChange={e => updateStep(i, 'instruction', e.target.value)}
                  rows={2}
                  placeholder="예: 팬에 기름을 두르고 중불로 가열하세요."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800
                             placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-200 transition resize-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={step.timerSeconds}
                    onChange={e => updateStep(i, 'timerSeconds', e.target.value)}
                    placeholder="타이머 (초)"
                    min={1}
                    className="w-28 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-600
                               placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
                  />
                  <span className="text-xs text-gray-400">
                    초 타이머{step.timerSeconds ? ` (${formatTime(Number(step.timerSeconds))})` : ''}
                  </span>
                </div>
              </div>
              <button type="button" onClick={() => removeStep(i)}
                className="text-gray-300 hover:text-red-400 transition text-lg px-1 mt-2">✕</button>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <button
        onClick={handleSave}
        className="w-full py-4 bg-amber-500 hover:bg-amber-600 active:scale-95
                   text-white text-lg font-bold rounded-2xl shadow-md transition-all"
      >
        {existing ? '수정 완료' : '레시피 저장'}
      </button>
      <button
        onClick={() => navigate(-1)}
        className="w-full py-3 text-gray-400 hover:text-gray-600 text-sm font-medium transition"
      >
        취소
      </button>
    </div>
  );
}
