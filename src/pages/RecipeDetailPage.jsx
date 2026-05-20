import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRecipe } from '../services/recipeStore';
import { useAuth } from '../context/AuthContext';
import useRecipeStore from '../store/useRecipeStore';
import TagBadge from '../components/TagBadge';

export default function RecipeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: recipe } = getRecipe(id);

  const favoriteIds    = useRecipeStore(s => s.favoriteIds);
  const toggleFavorite = useRecipeStore(s => s.toggleFavorite);
  const deleteRecipe   = useRecipeStore(s => s.deleteRecipe);
  const isFav = favoriteIds.includes(id);

  if (!recipe) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-3">😕</div>
        <p className="text-lg font-medium">레시피를 찾을 수 없습니다.</p>
        <Link to="/" className="inline-block mt-4 text-amber-500 hover:underline">← 홈으로</Link>
      </div>
    );
  }

  const steps = [...recipe.steps].sort((a, b) => a.order - b.order);
  const isOwner = recipe.createdBy === user.id;

  function handleDelete() {
    if (confirm(`"${recipe.title}" 레시피를 삭제할까요?`)) {
      deleteRecipe(recipe.id);
      navigate('/my-recipes');
    }
  }

  return (
    <div className="space-y-5">
      {/* Hero image */}
      {recipe.imageBase64 && (
        <img
          src={recipe.imageBase64}
          alt={recipe.title}
          className="w-full h-52 object-cover rounded-2xl shadow-sm"
        />
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="text-2xl text-gray-400 hover:text-gray-700 transition mt-0.5">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-800">{recipe.title}</h1>
          {recipe.description && (
            <p className="text-gray-500 text-sm mt-1">{recipe.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {recipe.tags?.map(tag => <TagBadge key={tag} tag={tag} />)}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => toggleFavorite(user.id, id)}
            className={`text-2xl transition-transform active:scale-90 ${
              isFav ? 'text-red-500' : 'text-gray-300 hover:text-red-400'
            }`}
          >
            {isFav ? '♥' : '♡'}
          </button>
          {isOwner && (
            <>
              <Link
                to={`/create?edit=${recipe.id}`}
                className="text-xs border border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 px-2.5 py-1.5 rounded-lg transition"
              >
                수정
              </Link>
              <button
                onClick={handleDelete}
                className="text-xs border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-500 px-2.5 py-1.5 rounded-lg transition"
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="flex gap-4 text-sm text-gray-400">
        {recipe.prepTime && <span>⏱ {recipe.prepTime}분</span>}
        <span>📋 {steps.length}단계</span>
        <span>🥕 재료 {recipe.ingredients?.length ?? 0}가지</span>
      </div>

      {/* Start button */}
      <Link
        to={`/cook/${recipe.id}`}
        className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600
                   active:scale-95 text-white text-xl font-bold py-5 rounded-2xl shadow-md transition-all"
      >
        🔥 요리 시작
      </Link>

      {/* Ingredients */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-700 mb-3">🥕 재료</h2>
        <ul className="space-y-2">
          {recipe.ingredients?.map((ing, i) => (
            <li key={i} className="flex items-center gap-2.5 text-gray-700">
              <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              {ing}
            </li>
          ))}
        </ul>
      </section>

      {/* Steps */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-base font-bold text-gray-700 mb-4">📋 조리 순서</h2>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={step.id} className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center">
                {i + 1}
              </span>
              <div className="pt-0.5">
                <p className="text-gray-700 leading-relaxed">{step.instruction}</p>
                {step.timerSeconds && (
                  <span className="inline-block mt-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                    ⏱ {step.timerSeconds >= 60
                      ? `${Math.floor(step.timerSeconds / 60)}분${step.timerSeconds % 60 ? ` ${step.timerSeconds % 60}초` : ''}`
                      : `${step.timerSeconds}초`} 타이머
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Bottom start button */}
      <Link
        to={`/cook/${recipe.id}`}
        className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600
                   active:scale-95 text-white text-lg font-bold py-4 rounded-2xl shadow-md transition-all"
      >
        🔥 요리 시작
      </Link>
    </div>
  );
}
