import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useRecipeStore from '../store/useRecipeStore';
import RecipeCard from '../components/RecipeCard';
import { TAGS } from '../constants/tags';

export default function HomePage() {
  const [search, setSearch]     = useState('');
  const [activeTag, setActiveTag] = useState(null);

  const allRecipes = useRecipeStore(s => s.recipes);

  const filtered = useMemo(() => {
    let list = allRecipes;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }
    if (activeTag) {
      list = list.filter(r => r.tags?.includes(activeTag));
    }
    return list;
  }, [allRecipes, search, activeTag]);

  const usedTags = useMemo(() => {
    const used = new Set(allRecipes.flatMap(r => r.tags ?? []));
    return TAGS.filter(t => used.has(t.value));
  }, [allRecipes]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">레시피</h1>
          <p className="text-gray-400 text-sm mt-0.5">요리를 선택하고 음성으로 시작하세요</p>
        </div>
        <Link
          to="/create"
          className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold
                     px-4 py-2 rounded-full transition hidden sm:block"
        >
          + 만들기
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="레시피 검색..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-gray-800
                     placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
        />
      </div>

      {/* Tag filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setActiveTag(null)}
          className={`flex-shrink-0 text-sm px-3.5 py-1.5 rounded-full border font-medium transition ${
            activeTag === null
              ? 'bg-amber-500 text-white border-amber-500'
              : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'
          }`}
        >
          전체
        </button>
        {usedTags.map(tag => (
          <button
            key={tag.value}
            onClick={() => setActiveTag(activeTag === tag.value ? null : tag.value)}
            className={`flex-shrink-0 text-sm px-3.5 py-1.5 rounded-full border font-medium transition ${
              activeTag === tag.value
                ? 'bg-amber-500 text-white border-amber-500'
                : `bg-white ${tag.color} hover:opacity-80`
            }`}
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Recipe list */}
      {filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🍽️</div>
          <p className="text-lg font-medium text-gray-500">레시피가 없습니다</p>
          <p className="text-sm mt-1">검색어나 태그를 바꿔보거나 새 레시피를 만들어보세요</p>
          <Link
            to="/create"
            className="inline-block mt-4 bg-amber-500 hover:bg-amber-600 text-white
                       px-6 py-2.5 rounded-full transition text-sm font-semibold"
          >
            + 레시피 만들기
          </Link>
        </div>
      )}
    </div>
  );
}
