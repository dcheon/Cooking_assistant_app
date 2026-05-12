import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFavoriteIds } from '../services/auth';
import { getFavoriteRecipes } from '../services/recipeStore';
import RecipeCard from '../components/RecipeCard';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);

  const recipes = useMemo(() => {
    const ids = getFavoriteIds(user.id);
    return getFavoriteRecipes(ids);
  }, [user.id, tick]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">♥ 즐겨찾기</h1>
        <p className="text-gray-400 text-sm mt-0.5">자주 만드는 레시피를 모아보세요</p>
      </div>

      {recipes.length > 0 ? (
        <div className="grid gap-4">
          {recipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onFavoriteChange={() => setTick(t => t + 1)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">🤍</div>
          <p className="text-lg font-medium text-gray-500">즐겨찾기한 레시피가 없습니다</p>
          <p className="text-sm mt-1">레시피 카드의 ♡ 를 눌러 추가해보세요</p>
          <Link
            to="/"
            className="inline-block mt-4 bg-amber-500 hover:bg-amber-600 text-white
                       px-6 py-2.5 rounded-full transition text-sm font-semibold"
          >
            레시피 둘러보기
          </Link>
        </div>
      )}
    </div>
  );
}
