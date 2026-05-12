import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useRecipeStore from '../store/useRecipeStore';
import RecipeCard from '../components/RecipeCard';

export default function MyRecipesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const allRecipes   = useRecipeStore(s => s.recipes);
  const deleteRecipe = useRecipeStore(s => s.deleteRecipe);

  const recipes = allRecipes.filter(r => r.createdBy === user.id);

  function handleDelete(recipe) {
    if (confirm(`"${recipe.title}" 레시피를 삭제할까요?`)) {
      deleteRecipe(recipe.id);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">내 레시피</h1>
          <p className="text-gray-400 text-sm mt-0.5">내가 만든 레시피 목록</p>
        </div>
        <Link
          to="/create"
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold
                     px-4 py-2 rounded-full transition"
        >
          + 만들기
        </Link>
      </div>

      {recipes.length > 0 ? (
        <div className="grid gap-4">
          {recipes.map(recipe => (
            <div key={recipe.id} className="relative">
              <RecipeCard recipe={recipe} />
              <div className="flex gap-2 mt-2">
                <Link
                  to={`/create?edit=${recipe.id}`}
                  className="flex-1 py-2 text-center text-sm text-gray-500 border border-gray-200
                             hover:border-amber-300 hover:text-amber-600 rounded-xl transition font-medium"
                >
                  수정
                </Link>
                <button
                  onClick={() => handleDelete(recipe)}
                  className="flex-1 py-2 text-center text-sm text-gray-500 border border-gray-200
                             hover:border-red-300 hover:text-red-500 rounded-xl transition font-medium"
                >
                  삭제
                </button>
                <Link
                  to={`/cook/${recipe.id}`}
                  className="flex-1 py-2 text-center text-sm font-semibold text-white
                             bg-amber-500 hover:bg-amber-600 rounded-xl transition"
                >
                  🔥 시작
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-lg font-medium text-gray-500">아직 만든 레시피가 없어요</p>
          <p className="text-sm mt-1">나만의 레시피를 추가해보세요</p>
          <Link
            to="/create"
            className="inline-block mt-4 bg-amber-500 hover:bg-amber-600 text-white
                       px-6 py-2.5 rounded-full transition text-sm font-semibold"
          >
            + 첫 레시피 만들기
          </Link>
        </div>
      )}
    </div>
  );
}
