import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toggleFavorite, isFavorite, getUser } from '../services/auth';
import { useState } from 'react';
import TagBadge from './TagBadge';

export default function RecipeCard({ recipe, onFavoriteChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fav, setFav] = useState(() => isFavorite(user.id, recipe.id));

  function handleFav(e) {
    e.stopPropagation();
    const nowFav = toggleFavorite(user.id, recipe.id);
    setFav(nowFav);
    onFavoriteChange?.();
  }

  const timeLabel = recipe.prepTime ? `${recipe.prepTime}분` : null;
  const stepCount = recipe.steps?.length ?? 0;

  return (
    <div
      onClick={() => navigate(`/recipe/${recipe.id}`)}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer
                 hover:shadow-md hover:border-amber-200 transition-all active:scale-[0.98] group"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold text-gray-800 group-hover:text-amber-700 transition-colors flex-1">
          {recipe.title}
        </h2>
        <button
          onClick={handleFav}
          className={`text-xl flex-shrink-0 transition-transform active:scale-90 ${
            fav ? 'text-red-500' : 'text-gray-300 hover:text-red-400'
          }`}
          aria-label={fav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          {fav ? '♥' : '♡'}
        </button>
      </div>

      {recipe.description && (
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
      )}

      {recipe.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {recipe.tags.map(tag => <TagBadge key={tag} tag={tag} size="xs" />)}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
        <span>📋 {stepCount}단계</span>
        {timeLabel && <span>⏱ {timeLabel}</span>}
        {recipe.createdBy && (
          <span className="ml-auto bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-medium">
            내 레시피
          </span>
        )}
      </div>
    </div>
  );
}
